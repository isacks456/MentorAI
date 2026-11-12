namespace MentorAI.API.Models;

public class ChatMessage
{
	public int Id { get; set; }

	public string Role { get; set; } = string.Empty;

	public string Text { get; set; } = string.Empty;

	public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

	public int? ChatSessionId { get; set; }

	public ChatSession? ChatSession { get; set; }
}