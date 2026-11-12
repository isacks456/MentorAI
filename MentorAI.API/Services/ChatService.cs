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

	public async Task<string?> SendMessageAsync(ChatRequest request, string userId)
	{
		var session = await _db.ChatSessions
			.FirstOrDefaultAsync(s =>
        		s.Id == request.ChatSessionId &&
        		s.ApplicationUserId == userId);

			if(session == null)
			{
				return null;
			}
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

			await _db.SaveChangesAsync();

			return aiMessage.Text;
	}
}

