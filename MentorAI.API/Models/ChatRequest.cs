using System.ComponentModel.DataAnnotations;

namespace MentorAI.API.Models;

public class ChatRequest
{
	[Range(1, int.MaxValue, ErrorMessage = "Некорректный идентификатор диалога")]
	public int ChatSessionId { get; set; }

	[Required(ErrorMessage = "Сообщение не может быть пустым")]
	[MaxLength(4000, ErrorMessage = "Сообщение не может быть длиннее 4000 символов")]
	public string Message { get; set; } = string.Empty;
}
