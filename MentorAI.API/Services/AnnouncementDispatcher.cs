using MentorAI.API.Data;
using MentorAI.API.Models;
using Microsoft.EntityFrameworkCore;

namespace MentorAI.API.Services;

/// <summary>
/// Фоновый воркер рассылки. Забирает анонсы из очереди и обрабатывает их
/// батчами, чтобы HTTP-запросы оставались короткими, а рассылка переживала
/// перезапуск приложения.
///
/// Защита от дублей и гонок:
///  • владение рассылкой подтверждается через SendClaimToken перед каждой
///    SMTP-отправкой и перед сохранением результата; потеря владения
///    немедленно останавливает обработку;
///  • получатель атомарно переводится Pending -> Processing с lease;
///  • результат сохраняется сразу после ответа SMTP (отдельная транзакция);
///  • зависшие Processing с истёкшим lease переводятся в Undefined без повтора.
/// </summary>
public class AnnouncementDispatcher : BackgroundService
{
    private readonly IServiceScopeFactory _scopeFactory;
    private readonly AnnouncementQueue _queue;
    private readonly AnnouncementOptions _options;
    private readonly ILogger<AnnouncementDispatcher> _logger;

    // Один анонс не может обрабатываться двумя воркерами внутри процесса.
    private static readonly System.Collections.Concurrent.ConcurrentDictionary<int, SemaphoreSlim> AnnouncementLocks = new();

    // Глобальный предел одновременных SMTP-отправок.
    private readonly SemaphoreSlim _sendConcurrency;

    public AnnouncementDispatcher(
        IServiceScopeFactory scopeFactory,
        AnnouncementQueue queue,
        Microsoft.Extensions.Options.IOptions<AnnouncementOptions> options,
        ILogger<AnnouncementDispatcher> logger)
    {
        _scopeFactory = scopeFactory;
        _queue = queue;
        _options = options.Value;
        _logger = logger;
        _sendConcurrency = new SemaphoreSlim(Math.Max(1, _options.MaxConcurrency));
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        // При старте — при необходимости подхватываем незавершённые рассылки.
        if (_options.AutoResumeOnStartup)
        {
            await ResumeStaleOnStartupAsync(stoppingToken);
        }

        await foreach (var announcementId in _queue.ReadAllAsync(stoppingToken))
        {
            try
            {
                await ProcessAnnouncementAsync(announcementId, stoppingToken);
            }
            catch (OperationCanceledException) when (stoppingToken.IsCancellationRequested)
            {
                break;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Ошибка обработки рассылки анонса {Id}", announcementId);
            }
        }
    }

    private async Task ResumeStaleOnStartupAsync(CancellationToken cancellationToken)
    {
        try
        {
            using var scope = _scopeFactory.CreateScope();
            var service = scope.ServiceProvider.GetRequiredService<AnnouncementsService>();

            var staleIds = await service.GetStaleSendingIdsAsync();

            foreach (var id in staleIds)
            {
                _logger.LogInformation("Автовозобновление незавершённой рассылки анонса {Id}", id);
                _queue.Enqueue(id);
            }

            await Task.CompletedTask;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Не удалось выполнить автовозобновление рассылок при старте");
        }
    }

    private async Task ProcessAnnouncementAsync(int announcementId, CancellationToken cancellationToken)
    {
        var gate = AnnouncementLocks.GetOrAdd(announcementId, _ => new SemaphoreSlim(1, 1));

        if (!await gate.WaitAsync(0, cancellationToken))
        {
            // уже обрабатывается другим проходом — не дублируем
            return;
        }

        try
        {
            await ProcessCoreAsync(announcementId, cancellationToken);
        }
        finally
        {
            gate.Release();
        }
    }

    private async Task ProcessCoreAsync(int announcementId, CancellationToken cancellationToken)
    {
        using var scope = _scopeFactory.CreateScope();

        var db = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
        var service = scope.ServiceProvider.GetRequiredService<AnnouncementsService>();
        var notificationService = scope.ServiceProvider.GetRequiredService<NotificationService>();

        var announcement = await db.Announcements.FirstOrDefaultAsync(a => a.Id == announcementId, cancellationToken);

        if (announcement == null || announcement.Status != AnnouncementStatus.Sending)
        {
            return;
        }

        var token = announcement.SendClaimToken;

        if (string.IsNullOrEmpty(token))
        {
            return;
        }

        // сметаем «зависшие» попытки прошлых запусков
        var swept = await service.SweepStaleProcessingAsync(announcementId);

        if (swept > 0)
        {
            _logger.LogWarning("Анонс {Id}: {Count} зависших попыток помечены как Undefined", announcementId, swept);
        }

        // тема и HTML готовятся один раз на анонс
        var subject = announcement.Title;
        var html = AnnouncementEmailTemplate.BuildHtml(announcement.Title, announcement.Body);

        var stopped = false;

        while (!stopped && !cancellationToken.IsCancellationRequested)
        {
            // владение подтверждено?
            if (!await service.StillOwnsAsync(announcementId, token))
            {
                _logger.LogInformation("Анонс {Id}: владение потеряно, остановка обработки", announcementId);
                break;
            }

            // запрошена ли остановка (в т.ч. из другого запроса)
            var cancelRequested = await db.Announcements
                .Where(a => a.Id == announcementId)
                .Select(a => a.CancelRequestedAt)
                .FirstOrDefaultAsync(cancellationToken);

            if (cancelRequested != null)
            {
                _logger.LogInformation("Анонс {Id}: получена команда остановки", announcementId);
                break;
            }

            var batch = await db.AnnouncementRecipients
                .Where(r => r.AnnouncementId == announcementId && r.Status == RecipientStatus.Pending)
                .OrderBy(r => r.Id)
                .Take(_options.BatchSize)
                .Select(r => r.Id)
                .ToListAsync(cancellationToken);

            if (batch.Count == 0)
            {
                break;
            }

            foreach (var recipientId in batch)
            {
                if (cancellationToken.IsCancellationRequested)
                {
                    stopped = true;
                    break;
                }

                if (!await service.StillOwnsAsync(announcementId, token))
                {
                    stopped = true;
                    break;
                }

                await ProcessRecipientAsync(db, notificationService, service, announcementId, recipientId, token, subject, html, cancellationToken);

                if (_options.SendDelayMilliseconds > 0)
                {
                    await Task.Delay(_options.SendDelayMilliseconds, cancellationToken);
                }
            }

            // heartbeat: продлеваем владение
            if (await service.StillOwnsAsync(announcementId, token))
            {
                await db.Announcements
                    .Where(a => a.Id == announcementId && a.SendClaimToken == token)
                    .ExecuteUpdateAsync(s => s.SetProperty(a => a.SendClaimedAt, DateTime.UtcNow), cancellationToken);
            }

            // обновляем агрегаты, чтобы прогресс был виден в UI во время рассылки
            await service.RecalculateAggregatesAsync(announcementId);
        }

        // пересчёт агрегатов и финализация (если всё обработано)
        await service.RecalculateAggregatesAsync(announcementId);

        var finalStatus = await db.Announcements
            .Where(a => a.Id == announcementId)
            .Select(a => a.Status)
            .FirstOrDefaultAsync(cancellationToken);

        if (finalStatus == AnnouncementStatus.Sending)
        {
            // если это была отмена — статус уже Cancelled, финализацию не трогаем
            await service.FinalizeAsync(announcementId);
        }
    }

    private async Task ProcessRecipientAsync(
        ApplicationDbContext db,
        NotificationService notificationService,
        AnnouncementsService service,
        int announcementId,
        int recipientId,
        string token,
        string subject,
        string html,
        CancellationToken cancellationToken)
    {
        var leaseUntil = DateTime.UtcNow.AddMinutes(_options.ProcessingLeaseMinutes);

        // атомарный захват получателя: Pending -> Processing (только если ещё Pending)
        var claimed = await db.AnnouncementRecipients
            .Where(r => r.Id == recipientId && r.Status == RecipientStatus.Pending)
            .ExecuteUpdateAsync(s => s
                .SetProperty(r => r.Status, RecipientStatus.Processing)
                .SetProperty(r => r.AttemptStartedAt, DateTime.UtcNow)
                .SetProperty(r => r.ProcessingLeaseUntil, leaseUntil)
                .SetProperty(r => r.AttemptCount, r => r.AttemptCount + 1), cancellationToken);

        if (claimed == 0)
        {
            return; // уже обработан кем-то другим
        }

        var recipient = await db.AnnouncementRecipients.FirstAsync(r => r.Id == recipientId, cancellationToken);

        // владение могло быть потеряно между claim и отправкой — тогда возвращаем в Pending
        if (!await service.StillOwnsAsync(announcementId, token))
        {
            await RevertToPendingAsync(db, recipientId, cancellationToken);
            return;
        }

        // получатель мог быть удалён (UserId = null из-за SetNull) или без email
        var user = recipient.UserId == null
            ? null
            : await db.Users.FirstOrDefaultAsync(u => u.Id == recipient.UserId, cancellationToken);

        if (user == null || string.IsNullOrWhiteSpace(user.Email))
        {
            await SetResultAsync(db, recipientId, RecipientStatus.Skipped, "Получатель недоступен", cancellationToken);
            return;
        }

        NotificationOutcome outcome;

        await _sendConcurrency.WaitAsync(cancellationToken);

        try
        {
            outcome = await notificationService.SendEmailNotificationDetailedAsync(
                user.Id,
                NotificationKind.News,
                subject,
                html);
        }
        catch (Exception ex)
        {
            // страховка: неожиданная ошибка одного получателя не должна ронять рассылку
            _logger.LogError(ex, "Анонс {Id}: непредвиденная ошибка при отправке", announcementId);

            await SetResultAsync(db, recipientId, RecipientStatus.Undefined,
                "Результат доставки неизвестен (внутренняя ошибка)", cancellationToken);
            return;
        }
        finally
        {
            _sendConcurrency.Release();
        }

        switch (outcome.Kind)
        {
            case NotificationOutcomeKind.Delivered:
                await PersistIfStillOwnerAsync(db, service, announcementId, token, recipientId,
                    RecipientStatus.Delivered, null, cancellationToken);
                break;

            case NotificationOutcomeKind.Skipped:
                await PersistIfStillOwnerAsync(db, service, announcementId, token, recipientId,
                    RecipientStatus.Skipped, outcome.Reason, cancellationToken);
                break;

            case NotificationOutcomeKind.Failed:
                await HandleFailureAsync(db, service, announcementId, token, recipientId, outcome, cancellationToken);
                break;
        }
    }

    /// <summary>
    /// Перед сохранением результата повторно проверяет владение рассылкой.
    /// Если владение потеряно (перехват другим воркером), результат НЕ
    /// записывается как доставленный: письмо могло уйти, поэтому помечаем
    /// Undefined — это предотвращает повторную отправку (приоритет «без дублей»).
    /// При штатной ОТМЕНЕ фактический результат уже летящего письма всё равно
    /// сохраняется (требование «обработанные результаты сохраняются»).
    /// </summary>
    private static async Task PersistIfStillOwnerAsync(
        ApplicationDbContext db,
        AnnouncementsService service,
        int announcementId,
        string token,
        int recipientId,
        RecipientStatus intendedStatus,
        string? reason,
        CancellationToken ct)
    {
        if (await service.StillOwnsAsync(announcementId, token))
        {
            await SetResultAsync(db, recipientId, intendedStatus, reason, ct);
            return;
        }

        // владение потеряно; различаем отмену (сохраняем реальный результат)
        // и перехват другим воркером (результат неопределён)
        if (await service.IsCancelRequestedAsync(announcementId))
        {
            await SetResultAsync(db, recipientId, intendedStatus, reason, ct);
            return;
        }

        await SetResultAsync(db, recipientId, RecipientStatus.Undefined,
            "Результат доставки неизвестен (владение рассылкой потеряно)", ct);
    }

    private async Task HandleFailureAsync(
        ApplicationDbContext db,
        AnnouncementsService service,
        int announcementId,
        string token,
        int recipientId,
        NotificationOutcome outcome,
        CancellationToken cancellationToken)
    {
        // владение потеряно (не отмена) — не продолжаем, фиксируем неопределённость
        if (!await service.StillOwnsAsync(announcementId, token)
            && !await service.IsCancelRequestedAsync(announcementId))
        {
            await SetResultAsync(db, recipientId, RecipientStatus.Undefined,
                "Результат доставки неизвестен (владение рассылкой потеряно)", cancellationToken);
            return;
        }

        switch (outcome.FailureKind)
        {
            case SmtpFailureKind.Undefined:
                // результат неизвестен — письмо могло уйти. Автоматически НЕ повторяем.
                await SetResultAsync(db, recipientId, RecipientStatus.Undefined, outcome.Reason, cancellationToken);
                break;

            case SmtpFailureKind.PermanentFailure:
                // постоянный отказ — повтор бессмыслен
                await SetResultAsync(db, recipientId, RecipientStatus.Failed, outcome.Reason, cancellationToken);
                break;

            case SmtpFailureKind.DefinitelyNotDelivered:
                // достоверно не принято — повторяем, пока не исчерпаем попытки
                var recipient = await db.AnnouncementRecipients.FirstAsync(r => r.Id == recipientId, cancellationToken);

                if (recipient.AttemptCount >= _options.MaxAttempts)
                {
                    await SetResultAsync(db, recipientId, RecipientStatus.Failed, outcome.Reason, cancellationToken);
                }
                else
                {
                    // возвращаем в Pending — повторится в следующем батче
                    await db.AnnouncementRecipients
                        .Where(r => r.Id == recipientId && r.Status == RecipientStatus.Processing)
                        .ExecuteUpdateAsync(s => s
                            .SetProperty(r => r.Status, RecipientStatus.Pending)
                            .SetProperty(r => r.ProcessingLeaseUntil, (DateTime?)null), cancellationToken);
                }
                break;
        }
    }

    private static async Task RevertToPendingAsync(ApplicationDbContext db, int recipientId, CancellationToken ct)
    {
        await db.AnnouncementRecipients
            .Where(r => r.Id == recipientId && r.Status == RecipientStatus.Processing)
            .ExecuteUpdateAsync(s => s
                .SetProperty(r => r.Status, RecipientStatus.Pending)
                .SetProperty(r => r.ProcessingLeaseUntil, (DateTime?)null), ct);
    }

    private static async Task SetResultAsync(
        ApplicationDbContext db, int recipientId, RecipientStatus status, string? reason, CancellationToken ct)
    {
        await db.AnnouncementRecipients
            .Where(r => r.Id == recipientId)
            .ExecuteUpdateAsync(s => s
                .SetProperty(r => r.Status, status)
                .SetProperty(r => r.Reason, reason)
                .SetProperty(r => r.ProcessedAt, DateTime.UtcNow)
                .SetProperty(r => r.ProcessingLeaseUntil, (DateTime?)null), ct);
    }
}
