using System.Text.Json.Serialization;

namespace MentorAI.API.Models;

public class TrainingAnswer
{
    public int Id { get; set; }

    public string? ApplicationUserId { get; set; }

    // Навигация только для EF; в JSON не сериализуется, иначе наружу
    // попадали бы passwordHash, securityStamp и другие поля пользователя.
    [JsonIgnore]
    public ApplicationUser? ApplicationUser { get; set; }
    public int TrainingTaskId { get; set; }
    public TrainingTask? TrainingTask { get; set; }

    public string Answer { get; set; } = string.Empty;

    public int? Score { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}