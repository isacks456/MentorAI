using MentorAI.API.Data;
using MentorAI.API.Models;
using Microsoft.EntityFrameworkCore;

namespace MentorAI.API.Services;

public class ChatService
{
	private readonly ApplicationDbContext _db;

	public ChatService(ApplicationDbContext db)
	{
		_db = db;
	}

	/// <summary>
	/// Сохраняет сообщение пользователя и ответ наставника.
	/// Если это первое сообщение в чате — формирует название чата по нему
	/// (только один раз, последующие сообщения название не меняют).
	/// Возвращает null, если чат не найден или не принадлежит пользователю.
	/// </summary>
	public async Task<ChatSendResult?> SendMessageAsync(ChatRequest request, string userId)
	{
		var session = await _db.ChatSessions
			.FirstOrDefaultAsync(s =>
        		s.Id == request.ChatSessionId &&
        		s.ApplicationUserId == userId);

			if(session == null)
			{
				return null;
			}

			// есть ли в чате сообщения до этого? если нет — сообщение первое
			var hasMessages = await _db.ChatMessages
				.AnyAsync(m => m.ChatSessionId == session.Id);

			var userMessage = new ChatMessage
			{
				Role = "user",
				Text = request.Message,
				ChatSessionId = session.Id
			};

			_db.ChatMessages.Add(userMessage);

			var aiMessage = new ChatMessage
			{
				Role = "ai",
				Text = "Я получил твое сообщение! Скоро здесь будет настоящий AI-наставник.",
				ChatSessionId = session.Id
			};

			_db.ChatMessages.Add(aiMessage);

			// автоматическое название: только по первому сообщению пользователя
			if (!hasMessages)
			{
				session.Title = ChatTitleGenerator.Generate(request.Message);
			}

			await _db.SaveChangesAsync();

			return new ChatSendResult
			{
				Reply = aiMessage.Text,
				Title = session.Title
			};
	}
}

/// <summary>Результат отправки сообщения: текст ответа и актуальное название чата.</summary>
public class ChatSendResult
{
	public string Reply { get; set; } = string.Empty;

	public string Title { get; set; } = ChatTitleGenerator.DefaultTitle;
}
