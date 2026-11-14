namespace MentorAI.API.Models;

/// <summary>
/// Жизненный цикл анонса (рассылки).
/// Draft      — черновик, рассылка ещё не запускалась;
/// Sending    — рассылка активна (есть lease и владелец SendClaimToken);
/// Sent       — завершена, повторный запуск запрещён;
/// Failed     — завершена с ошибками/неопределёнными результатами или прервана аварийно;
/// Cancelled  — остановлена администратором, оставшиеся получатели сохранены как Pending.
/// </summary>
public enum AnnouncementStatus
{
    Draft = 0,
    Sending = 1,
    Sent = 2,
    Failed = 3,
    Cancelled = 4
}

/// <summary>
/// Анонс (новость/объявление), который может быть разослан пользователям
/// по электронной почте. Хранит только текст и агрегированную статистику;
/// персональные адреса получателей здесь не сохраняются.
/// </summary>
public class Announcement
{
    public int Id { get; set; }

    public string Title { get; set; } = "";

    public string Body { get; set; } = "";

    /// <summary>Id администратора, создавшего анонс.</summary>
    public string? CreatedByUserId { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public AnnouncementStatus Status { get; set; } = AnnouncementStatus.Draft;

    public DateTime? SentAt { get; set; }

    /// <summary>Момент последней тестовой отправки (не влияет на массовую рассылку).</summary>
    public DateTime? LastTestSentAt { get; set; }

    // ----- агрегированная статистика (денормализация для быстрого чтения) -----

    public int TotalRecipients { get; set; }

    public int SentCount { get; set; }

    public int SkippedCount { get; set; }

    public int FailedCount { get; set; }

    /// <summary>Сколько получателей имеют неопределённый результат доставки (Undefined).</summary>
    public int UndefinedCount { get; set; }

    public int PendingCount { get; set; }

    // ----- координация рассылки (защита от повторного/параллельного запуска) -----

    /// <summary>Heartbeat: когда владелец рассылки последний раз обновлял владение.</summary>
    public DateTime? SendClaimedAt { get; set; }

    /// <summary>Токен владельца текущего запуска рассылки. Смена токена отбирает владение у старого воркера.</summary>
    public string? SendClaimToken { get; set; }

    /// <summary>Когда администратор запросил остановку.</summary>
    public DateTime? CancelRequestedAt { get; set; }
}
