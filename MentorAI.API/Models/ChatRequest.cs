namespace MentorAI.API.Models;

public class ChatRequest
{
	public string Message { get; set; } = string.Empty;

	public int ChatSessionId{ get; set; }
}