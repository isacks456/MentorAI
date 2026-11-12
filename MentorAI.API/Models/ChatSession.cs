namespace MentorAI.API.Models;

public class ChatSession
{
	public int Id { get; set; }

	public string Title { get; set; } = "Новый диалог";

	public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

	public string? ApplicationUserId { get; set; }
	public ApplicationUser? ApplicationUser { get; set; }
	public List<ChatMessage> Messages { get; set; } = new();
}