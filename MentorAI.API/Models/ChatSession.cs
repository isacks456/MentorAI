using System.Text.Json.Serialization;

namespace MentorAI.API.Models;

public class ChatSession
{
	public int Id { get; set; }

	public string Title { get; set; } = "Новый диалог";

	public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

	public string? ApplicationUserId { get; set; }

	// Навигация только для EF; в JSON не сериализуется, иначе наружу
	// попадали бы passwordHash, securityStamp и другие поля пользователя.
	[JsonIgnore]
	public ApplicationUser? ApplicationUser { get; set; }
	public List<ChatMessage> Messages { get; set; } = new();
}