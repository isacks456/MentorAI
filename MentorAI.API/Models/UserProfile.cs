using System.Text.Json.Serialization;

namespace MentorAI.API.Models;

public class UserProfile
{
    public int Id { get; set; }

    public string? ApplicationUserId { get; set; }

    // Навигация только для EF; в JSON не сериализуется, иначе наружу
    // попадали бы passwordHash, securityStamp и другие поля пользователя.
    [JsonIgnore]
    public ApplicationUser? ApplicationUser { get; set; }

    public string Name { get; set; } = "";

    public string Email { get; set; } = "";

    public int Age { get; set; }

    public string Course { get; set; } = "";

    public string Institution { get; set; } = "";
}
