using MentorAI.API.Data;
using MentorAI.API.Models;
using Microsoft.EntityFrameworkCore;

namespace MentorAI.API.Services;

/// <summary>Результат попытки захватить рассылку.</summary>
public enum ClaimResult
{
    Claimed,
    AlreadyClaimed,
    NotFound,
    WrongState
}

/// <summary>
/// Бизнес-логика анонсов: черновики, получатели, захват рассылки (claim/lease),
/// серверный предпросмотр, тестовая отправка, отмена, возобновление и
/// восстановление зависших попыток. Тяжёлая отправка выполняется в
/// AnnouncementDispatcher, чтобы HTTP-запрос оставался коротким.
/// </summary>
public class AnnouncementsService
{
    private readonly ApplicationDbContext _context;
    private readonly NotificationService _notificationService;
    private readonly IEmailSender _emailSender;
    private readonly AnnouncementOptions _options;
    private readonly ILogger<AnnouncementsService> _logger;

    public AnnouncementsService(
        ApplicationDbContext context,
        NotificationService notificationService,
        IEmailSender emailSender,
        Microsoft.Extensions.Options.IOptions<AnnouncementOptions> options,
        ILogger<AnnouncementsService> logger)
    {
        _context = context;
        _notificationService = notificationService;
        _emailSender = emailSender;
        _options = options.Value;
        _logger = logger;
    }

    public Task<List<Announcement>> ListAsync()
    {
        return _context.Announcements
            .OrderByDescending(a => a.CreatedAt)
            .ToListAsync();
    }

    public Task<Announcement?> GetAsync(int id)
    {
        return _context.Announcements.FirstOrDefaultAsync(a => a.Id == id);
    }

    public async Task<Announcement> CreateAsync(string title, string body, string adminUserId)
    {
        var announcement = new Announcement
        {
            Title = title,
            Body = body,
            CreatedByUserId = adminUserId,
            Status = AnnouncementStatus.Draft,
            CreatedAt = DateTime.UtcNow
        };

        _context.Announcements.Add(announcement);

        await _context.SaveChangesAsync();

        return announcement;
    }

    /// <summary>Обновление черновика (разрешено только в статусе Draft).</summary>
    public async Task<Announcement?> UpdateDraftAsync(int id, string title, string body)
    {
        var affected = await _context.Announcements
            .Where(a => a.Id == id && a.Status == AnnouncementStatus.Draft)
            .ExecuteUpdateAsync(s => s
                .SetProperty(a => a.Title, title)
                .SetProperty(a => a.Body, body));

        if (affected == 0)
        {
            return null;
        }

        return await GetAsync(id);
    }

    public static string BuildPreviewHtml(string title, string body)
    {
        return AnnouncementEmailTemplate.BuildHtml(title, body);
    }

    /// <summary>
    /// Тестовая отправка строго по списку Announcement:TestRecipients.
    /// Пустой список запрещает тест. Пользователи из основной БД НЕ используются.
    /// Массовые статусы/счётчики анонса не изменяются (только LastTestSentAt).
    /// </summary>
    public async Task<TestSendReport> SendTestAsync(Announcement announcement)
    {
        var recipients = (_options.TestRecipients ?? Array.Empty<string>())
            .Where(e => !string.IsNullOrWhiteSpace(e))
            .Select(e => e.Trim())
            .Distinct(StringComparer.OrdinalIgnoreCase)
            .Take(_options.MaxTestRecipients)
            .ToList();

        if (recipients.Count == 0)
        {
            return new TestSendReport { Allowed = false, Reason = "Тестовая отправка запрещена: список тестовых получателей пуст" };
        }

        var subject = announcement.Title;
        var html = AnnouncementEmailTemplate.BuildHtml(announcement.Title, announcement.Body);

        var results = new List<TestSendItem>();

        foreach (var address in recipients)
        {
            try
            {
                var sent = await _emailSender.SendAsync(address, subject, html);

                results.Add(new TestSendItem
                {
                    MaskedEmail = MaskEmail(address),
                    Delivered = sent,
                    Reason = sent ? null : "Почтовый сервис не настроен"
                });
            }
            catch (EmailDeliveryException)
            {
                // детали SMTP не раскрываем; адрес — только в маскированном виде
                results.Add(new TestSendItem
                {
                    MaskedEmail = MaskEmail(address),
                    Delivered = false,
                    Reason = "Ошибка почтового сервиса"
                });
            }
        }

        announcement.LastTestSentAt = DateTime.UtcNow;
        await _context.SaveChangesAsync();

        _logger.LogInformation("Тестовая отправка анонса {Id}: адресов {Count}", announcement.Id, results.Count);

        return new TestSendReport { Allowed = true, Items = results };
    }

    /// <summary>Маскирование адреса для отображения/логов (без раскрытия полного email).</summary>
    public static string MaskEmail(string? email)
    {
        if (string.IsNullOrWhiteSpace(email))
        {
            return "(пустой адрес)";
        }

        var at = email.IndexOf('@');

        if (at <= 0)
        {
            return "***";
        }

        var name = email[..at];
        var domain = email[at..];
        var visible = name.Length <= 2 ? name[..1] : name[..2];

        return $"{visible}***{domain}";
    }

    /// <summary>
    /// Захват рассылки: атомарный переход Draft -> Sending с новым токеном владельца.
    /// Создаёт недостающие строки получателей (Pending). Возвращает исход захвата.
    /// </summary>
    public async Task<(ClaimResult Result, string? Token)> StartSendAsync(int id)
    {
        var token = Guid.NewGuid().ToString("N");
        var now = DateTime.UtcNow;

        var affected = await _context.Announcements
            .Where(a => a.Id == id && a.Status == AnnouncementStatus.Draft)
            .ExecuteUpdateAsync(s => s
                .SetProperty(a => a.Status, AnnouncementStatus.Sending)
                .SetProperty(a => a.SendClaimToken, token)
                .SetProperty(a => a.SendClaimedAt, now)
                .SetProperty(a => a.CancelRequestedAt, (DateTime?)null));

        if (affected == 0)
        {
            var exists = await _context.Announcements.AnyAsync(a => a.Id == id);

            return (exists ? ClaimResult.AlreadyClaimed : ClaimResult.NotFound, null);
        }

        await PopulateRecipientsAsync(id);
        await RecalculateAggregatesAsync(id);

        return (ClaimResult.Claimed, token);
    }

    /// <summary>Добавляет недостающие строки получателей (Pending) для всех пользователей.</summary>
    public async Task PopulateRecipientsAsync(int announcementId)
    {
        var existingUserIds = await _context.AnnouncementRecipients
            .Where(r => r.AnnouncementId == announcementId)
            .Select(r => r.UserId)
            .ToListAsync();

        var existing = existingUserIds.Where(u => u != null).ToHashSet(StringComparer.Ordinal);

        var userIds = await _context.Users
            .Select(u => u.Id)
            .ToListAsync();

        var toAdd = userIds
            .Where(uid => !existing.Contains(uid))
            .Select(uid => new AnnouncementRecipient
            {
                AnnouncementId = announcementId,
                UserId = uid,
                Status = RecipientStatus.Pending
            })
            .ToList();

        if (toAdd.Count > 0)
        {
            _context.AnnouncementRecipients.AddRange(toAdd);
            await _context.SaveChangesAsync();
        }
    }

    /// <summary>Пересчёт агрегатов анонса по фактическим строкам получателей.</summary>
    public async Task RecalculateAggregatesAsync(int announcementId)
    {
        var counts = await _context.AnnouncementRecipients
            .Where(r => r.AnnouncementId == announcementId)
            .GroupBy(r => r.Status)
            .Select(g => new { Status = g.Key, Count = g.Count() })
            .ToListAsync();

        int Get(RecipientStatus s) => counts.FirstOrDefault(c => c.Status == s)?.Count ?? 0;

        var ann = await _context.Announcements.FirstAsync(a => a.Id == announcementId);

        ann.SentCount = Get(RecipientStatus.Delivered);
        ann.SkippedCount = Get(RecipientStatus.Skipped);
        ann.FailedCount = Get(RecipientStatus.Failed);
        ann.UndefinedCount = Get(RecipientStatus.Undefined);
        ann.PendingCount = Get(RecipientStatus.Pending) + Get(RecipientStatus.Processing);
        ann.TotalRecipients = counts.Sum(c => c.Count);

        await _context.SaveChangesAsync();
    }

    /// <summary>Перевести анонс в терминальный статус по результатам (нет Pending/Processing).</summary>
    public async Task FinalizeAsync(int announcementId)
    {
        var pending = await _context.AnnouncementRecipients
            .CountAsync(r => r.AnnouncementId == announcementId
                && (r.Status == RecipientStatus.Pending || r.Status == RecipientStatus.Processing));

        if (pending > 0)
        {
            return;
        }

        var ann = await _context.Announcements.FirstAsync(a => a.Id == announcementId);

        var problematic = ann.FailedCount + ann.UndefinedCount;

        ann.Status = problematic > 0 ? AnnouncementStatus.Failed : AnnouncementStatus.Sent;
        ann.SentAt = DateTime.UtcNow;
        ann.SendClaimToken = null;
        ann.SendClaimedAt = null;

        await _context.SaveChangesAsync();
    }

    /// <summary>Запросить остановку рассылки. Разрешено из Draft/Sending.</summary>
    public async Task<Announcement?> RequestCancelAsync(int id)
    {
        var now = DateTime.UtcNow;

        var affected = await _context.Announcements
            .Where(a => a.Id == id
                && (a.Status == AnnouncementStatus.Draft || a.Status == AnnouncementStatus.Sending))
            .ExecuteUpdateAsync(s => s
                .SetProperty(a => a.Status, AnnouncementStatus.Cancelled)
                .SetProperty(a => a.CancelRequestedAt, now)
                .SetProperty(a => a.SendClaimToken, (string?)null)
                .SetProperty(a => a.SendClaimedAt, (DateTime?)null));

        return affected == 0 ? null : await GetAsync(id);
    }

    /// <summary>
    /// Освободить владение рассылкой при завершении обработки воркером
    /// (без смены статуса — статус выставляет воркер через Finalize/отмену).
    /// </summary>
    public async Task ReleaseClaimAsync(int announcementId, string token)
    {
        await _context.Announcements
            .Where(a => a.Id == announcementId && a.SendClaimToken == token)
            .ExecuteUpdateAsync(s => s
                .SetProperty(a => a.SendClaimedAt, (DateTime?)null));
    }

    /// <summary>Проверка актуальности владения рассылкой для воркера.</summary>
    public async Task<bool> StillOwnsAsync(int announcementId, string token)
    {
        var current = await _context.Announcements
            .Where(a => a.Id == announcementId)
            .Select(a => a.SendClaimToken)
            .FirstOrDefaultAsync();

        return current == token;
    }

    /// <summary>Запрошена ли остановка рассылки администратором.</summary>
    public async Task<bool> IsCancelRequestedAsync(int announcementId)
    {
        var cancelRequestedAt = await _context.Announcements
            .Where(a => a.Id == announcementId)
            .Select(a => a.CancelRequestedAt)
            .FirstOrDefaultAsync();

        return cancelRequestedAt != null;
    }

    /// <summary>
    /// Возобновление рассылки (только явно администратором).
    /// Разрешено из Cancelled/Failed при наличии Pending. По умолчанию
    /// Failed/Undefined НЕ переотправляются (только по явному флагу).
    /// </summary>
    public async Task<(ClaimResult Result, string? Token)> ResumeAsync(
        int id, bool requeueFailed, bool requeueUndefined)
    {
        // AsNoTracking: этот экземпляр нужен только для проверки статуса.
        // Если его отслеживать, то последующий ExecuteUpdateAsync (который
        // меняет строку в БД в обход change tracker) не обновит отслеживаемую
        // сущность, и GetAsync в рамках того же DbContext вернёт устаревший
        // статус (Cancelled вместо Sending). Без отслеживания GetAsync читает
        // актуальное состояние из БД.
        var ann = await _context.Announcements
            .AsNoTracking()
            .FirstOrDefaultAsync(a => a.Id == id);

        if (ann == null)
        {
            return (ClaimResult.NotFound, null);
        }

        if (ann.Status != AnnouncementStatus.Cancelled && ann.Status != AnnouncementStatus.Failed)
        {
            return (ClaimResult.WrongState, null);
        }

        // Нельзя возобновлять, пока воркер ещё держит живую попытку:
        // есть Processing с неистёкшим lease => возможна параллельная обработка.
        var now0 = DateTime.UtcNow;

        var liveProcessing = await _context.AnnouncementRecipients
            .AnyAsync(r => r.AnnouncementId == id
                && r.Status == RecipientStatus.Processing
                && r.ProcessingLeaseUntil != null
                && r.ProcessingLeaseUntil > now0);

        if (liveProcessing)
        {
            return (ClaimResult.AlreadyClaimed, null);
        }

        // сметаем оставшиеся зависшие попытки (lease истёк) в Undefined
        await SweepStaleProcessingAsync(id);

        // Возобновлять можно только рассылку, которая уже запускалась.
        // Если получателей нет вовсе (например, отменённый черновик) —
        // «продолжать» нечего.
        var hadRecipients = await _context.AnnouncementRecipients
            .AnyAsync(r => r.AnnouncementId == id);

        if (!hadRecipients)
        {
            return (ClaimResult.WrongState, null);
        }

        // возможный переотбор ранее не доставленных/неизвестных (по явному решению)
        if (requeueFailed)
        {
            await _context.AnnouncementRecipients
                .Where(r => r.AnnouncementId == id && r.Status == RecipientStatus.Failed)
                .ExecuteUpdateAsync(s => s
                    .SetProperty(r => r.Status, RecipientStatus.Pending)
                    .SetProperty(r => r.Reason, (string?)null));
        }

        if (requeueUndefined)
        {
            // ОСОЗНАННЫЙ риск дубля: результат был неизвестен, письмо могло уйти.
            await _context.AnnouncementRecipients
                .Where(r => r.AnnouncementId == id && r.Status == RecipientStatus.Undefined)
                .ExecuteUpdateAsync(s => s
                    .SetProperty(r => r.Status, RecipientStatus.Pending)
                    .SetProperty(r => r.Reason, (string?)null));
        }

        await PopulateRecipientsAsync(id);

        var hasPending = await _context.AnnouncementRecipients
            .AnyAsync(r => r.AnnouncementId == id && r.Status == RecipientStatus.Pending);

        if (!hasPending)
        {
            return (ClaimResult.WrongState, null);
        }

        var token = Guid.NewGuid().ToString("N");
        var now = DateTime.UtcNow;

        var affected = await _context.Announcements
            .Where(a => a.Id == id
                && (a.Status == AnnouncementStatus.Cancelled || a.Status == AnnouncementStatus.Failed))
            .ExecuteUpdateAsync(s => s
                .SetProperty(a => a.Status, AnnouncementStatus.Sending)
                .SetProperty(a => a.SendClaimToken, token)
                .SetProperty(a => a.SendClaimedAt, now)
                .SetProperty(a => a.CancelRequestedAt, (DateTime?)null));

        if (affected == 0)
        {
            return (ClaimResult.AlreadyClaimed, null);
        }

        await RecalculateAggregatesAsync(id);

        return (ClaimResult.Claimed, token);
    }

    /// <summary>
    /// Сметание зависших попыток (Processing с истёкшим lease) в Undefined
    /// по указанному анонсу. Возвращает число переведённых.
    /// </summary>
    public async Task<int> SweepStaleProcessingAsync(int announcementId)
    {
        var now = DateTime.UtcNow;

        return await _context.AnnouncementRecipients
            .Where(r => r.AnnouncementId == announcementId
                && r.Status == RecipientStatus.Processing
                && r.ProcessingLeaseUntil != null
                && r.ProcessingLeaseUntil < now)
            .ExecuteUpdateAsync(s => s
                .SetProperty(r => r.Status, RecipientStatus.Undefined)
                .SetProperty(r => r.Reason, "Результат доставки неизвестен (аварийное завершение)")
                .SetProperty(r => r.ProcessedAt, now));
    }

    /// <summary>Список анонсов, требующих восстановления (Sending с потенциально мёртвым владельцем).</summary>
    public async Task<List<int>> GetStaleSendingIdsAsync()
    {
        var threshold = DateTime.UtcNow.AddMinutes(-_options.ClaimLeaseMinutes);

        return await _context.Announcements
            .Where(a => a.Status == AnnouncementStatus.Sending
                && (a.SendClaimedAt == null || a.SendClaimedAt < threshold))
            .Select(a => a.Id)
            .ToListAsync();
    }
}

public class TestSendItem
{
    public string MaskedEmail { get; set; } = "";
    public bool Delivered { get; set; }
    public string? Reason { get; set; }
}

public class TestSendReport
{
    public bool Allowed { get; set; }
    public string? Reason { get; set; }
    public List<TestSendItem> Items { get; set; } = new();
}
