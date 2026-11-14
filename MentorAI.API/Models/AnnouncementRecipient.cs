namespace MentorAI.API.Models;

/// <summary>
/// Результат доставки анонса конкретному получателю.
/// Pending    — ещё не обрабатывался (в т.ч. остался после отмены);
/// Processing — начата попытка отправки, письмо «в полёте» (lease активен);
/// Delivered  — SMTP подтвердил приём письма;
/// Skipped    — отправка не выполнялась по правилам (почта не подтверждена,
///              тип/email-уведомления выключены, SMTP не настроен);
/// Failed     — достоверно известно, что письмо НЕ принято SMTP-сервером
///              (после исчерпания безопасных повторов или постоянная ошибка);
/// Undefined  — результат доставки неизвестен (аварийное завершение или
///              неоднозначная SMTP-ошибка). Автоматически не переотправляется.
/// </summary>
public enum RecipientStatus
{
    Pending = 0,
    Processing = 1,
    Delivered = 2,
    Skipped = 3,
    Failed = 4,
    Undefined = 5
}

/// <summary>
/// Индивидуальный результат рассылки анонса по каждому получателю.
/// Email здесь намеренно не хранится — только UserId; адрес берётся
/// из AspNetUsers в момент отправки и в логи/UI не попадает.
/// </summary>
public class AnnouncementRecipient
{
    public int Id { get; set; }

    public int AnnouncementId { get; set; }

    public Announcement? Announcement { get; set; }

    public string? UserId { get; set; }

    public RecipientStatus Status { get; set; } = RecipientStatus.Pending;

    /// <summary>Причина пропуска/ошибки/неопределённости — без email-адреса.</summary>
    public string? Reason { get; set; }

    public int AttemptCount { get; set; }

    public DateTime? AttemptStartedAt { get; set; }

    /// <summary>До какого момента эта попытка считается «живой». Истечение => Undefined.</summary>
    public DateTime? ProcessingLeaseUntil { get; set; }

    public DateTime? ProcessedAt { get; set; }
}
