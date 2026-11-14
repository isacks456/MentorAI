namespace MentorAI.API.Models;

/// <summary>
/// Предпочтения уведомлений пользователя.
/// Хранит только включённость категорий — фактическая доставка
/// уведомлений в системе пока не реализована.
/// </summary>
public class NotificationPreference
{
    public int Id { get; set; }

    public string? ApplicationUserId { get; set; }

    public ApplicationUser? ApplicationUser { get; set; }

    public bool ProgressNotifications { get; set; } = true;

    public bool LessonReminders { get; set; } = true;

    public bool NewsUpdates { get; set; } = true;

    public bool EmailNotifications { get; set; } = true;
}
