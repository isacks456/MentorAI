using System.Text.Json.Serialization;

namespace MentorAI.API.Models;

/// <summary>
/// Код подтверждения электронной почты (6 цифр).
/// В базе хранится только SHA-256 хеш кода с per-user pepper —
/// открытый код нигде не сохраняется.
/// </summary>
public class EmailConfirmationCode
{
    public int Id { get; set; }

    public string ApplicationUserId { get; set; } = "";

    // Навигация только для EF; в JSON не сериализуется.
    [JsonIgnore]
    public ApplicationUser? ApplicationUser { get; set; }

    public string CodeHash { get; set; } = "";

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    /// <summary>Срок действия — 10 минут от момента создания.</summary>
    public DateTime ExpiresAt { get; set; }

    /// <summary>Сколько раз проверялся код; после 5 неудачных код блокируется.</summary>
    public int AttemptCount { get; set; }

    /// <summary>true — код использован, заблокирован или аннулирован повторной отправкой.</summary>
    public bool Consumed { get; set; }
}
