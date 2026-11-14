using System.Text.Json.Serialization;

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

    // Навигация только для EF; в JSON не сериализуется, иначе наружу
    // попадали бы passwordHash, securityStamp и другие поля пользователя.
    [JsonIgnore]
    public ApplicationUser? ApplicationUser { get; set; }

    public bool ProgressNotifications { get; set; } = true;

    public bool LessonReminders { get; set; } = true;

    public bool NewsUpdates { get; set; } = true;

    public bool EmailNotifications { get; set; } = true;
}
