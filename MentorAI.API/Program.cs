using Microsoft.EntityFrameworkCore;
using MentorAI.API.Data;
using MentorAI.API.Models;
using Microsoft.AspNetCore.Identity;
using MentorAI.API.Services;
using System.Net.NetworkInformation;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddScoped<ChatService>();

builder.Services.AddDbContext<ApplicationDbContext>(options =>
{
    options.UseSqlite("Data Source=mentorai.db");
});

builder.Services
    .AddIdentityApiEndpoints<ApplicationUser>()
    .AddEntityFrameworkStores<ApplicationDbContext>();

builder.Services.AddCors(options =>
{
    options.AddPolicy("ReactFrontend", policy =>
    {
        policy.WithOrigins("http://localhost:5173")
            .AllowAnyHeader()
            .AllowAnyMethod();
    });
});

// Add services to the container.
// Learn more about configuring OpenAPI at https://aka.ms/aspnet/openapi
builder.Services.AddOpenApi();
builder.Services.AddControllers();
builder.Services.AddScoped<TrainingEvaluationService>();

var app = builder.Build();

using (var scope = app.Services.CreateScope())
{
    var db = scope.ServiceProvider
        .GetRequiredService<ApplicationDbContext>();

    if (!db.TrainingScenarios.Any())
    {
        db.TrainingScenarios.AddRange(
            new TrainingScenario
            {
                Title = "Подготовка к поступлению",
                Description = "Подготовься к собеседованию при поступлении в учебное заведение.",
                Category = "Admission",
                Difficulty = "Beginner"
            },
            new TrainingScenario
            {
                Title = "Первое собеседование",
                Description = "Научись отвечать на вопросы работодателя и рассказывать о своих навыках.",
                Category = "FirstJob",
                Difficulty = "Intermediate"
            },
            new TrainingScenario
            {
                Title = "Адаптация в команде",
                Description = "Научись взаимодействовать с коллегами и решать рабочие ситуации.",
                Category = "Adaptation",
                Difficulty = "Advanced"
            }
        );

        db.SaveChanges();
    }
    if (!db.TrainingTasks.Any())
    {
    db.TrainingTasks.AddRange(
        new TrainingTask
        {
            Title = "Расскажи о себе",
            Description = "Представь, что ты пришёл на собеседование при поступлении.",
            Question = "Расскажи о себе, своих интересах и причинах выбора специальности.",
            TrainingScenarioId = 1,
            Skill = "Коммуникация"
        },
        new TrainingTask
        {
            Title = "Первое техническое собеседование",
            Description = "Ты проходишь собеседование на позицию Junior Frontend Developer.",
            Question = "Что такое замыкание (Closure) в JavaScript? Объясни принцип его работы и приведи пример.",
            TrainingScenarioId = 2,
            Skill = "JavaScript"
        },
        new TrainingTask
        {
            Title = "Первый день в команде",
            Description = "Ты пришёл на стажировку и знакомишься с новой командой.",
            Question = "Как ты поступишь, если не понимаешь поставленную задачу и боишься показаться неопытным?",
            TrainingScenarioId = 3,
            Skill = "Коммуникация"
        }
    );

    db.SaveChanges();
    }

    var tasks = db.TrainingTasks.ToList();

    foreach (var task in tasks)
    {
        if (task.Title == "Расскажи о себе")
            task.Skill = "Коммуникация";

        if (task.Title == "Первое техническое собеседование")
            task.Skill = "JavaScript";

        if (task.Title == "Первый день в команде")
            task.Skill = "Коммуникация";
    }

    db.SaveChanges();
    }

app.UseCors("ReactFrontend");

app.UseHttpsRedirection();

app.UseAuthentication();
app.UseAuthorization();

app.MapControllers();

app.MapGroup("/api/auth")
    .MapIdentityApi<ApplicationUser>();

// Configure the HTTP request pipeline.
if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();
}

app.MapGet("/api/health", () =>
{
    return Results.Ok(new
    {
        status = "ok",
        application = "MentorAI",
        message = "Backend работает"
    });
});

app.MapPost("/api/chat", async (
    ChatRequest request,
    ChatService chatService,
    UserManager<ApplicationUser> userManager,
    System.Security.Claims.ClaimsPrincipal user) =>
{
    if (string.IsNullOrWhiteSpace(request.Message))
    {
        return Results.BadRequest(new
        {
            error = "Сообщение не может быть пустым"
        });
    }

    var currentUser = await userManager.GetUserAsync(user);

    if (currentUser == null)
    {
        return Results.Unauthorized();
    }

    var reply = await chatService.SendMessageAsync(
        request,
        currentUser.Id
    );

    if (reply == null)
    {
        return Results.NotFound(new
        {
            error = "Диалог не найден"
        });
    }

    return Results.Ok(new
    {
        reply = reply
    });
})
.RequireAuthorization();

app.MapGet("/api/chat/sessions/{sessionId}/messages", async (
    int sessionId,
    ApplicationDbContext db,
    UserManager<ApplicationUser> userManager,
    System.Security.Claims.ClaimsPrincipal user) =>
{
    var currentUser = await userManager.GetUserAsync(user);

    if (currentUser == null)
    {
        return Results.Unauthorized();
    }

    var sessionExists = await db.ChatSessions.AnyAsync(session =>
        session.Id == sessionId &&
        session.ApplicationUserId == currentUser.Id);

    if (!sessionExists)
    {
        return Results.NotFound(new
        {
            error = "Диалог не найден"
        });
    }

    var messages = await db.ChatMessages
        .Where(message => message.ChatSessionId == sessionId)
        .OrderBy(message => message.Id)
        .Select(message => new
        {
            role = message.Role,
            text = message.Text
        })
        .ToListAsync();

    return Results.Ok(messages);
})
.RequireAuthorization();

app.MapPost("/api/chat/sessions", async (
    ApplicationDbContext db,
    UserManager<ApplicationUser> userManager,
    System.Security.Claims.ClaimsPrincipal user) =>
{
    var currentUser = await userManager.GetUserAsync(user);

    if (currentUser == null)
    {
        return Results.Unauthorized();
    }

    var session = new ChatSession
    {
        Title = "Новый диалог",
        ApplicationUserId = currentUser.Id
    };

    db.ChatSessions.Add(session);

    await db.SaveChangesAsync();

    return Results.Ok(new
    {
        id = session.Id,
        title = session.Title,
        createdAt = session.CreatedAt
    });
})
.RequireAuthorization();

app.MapGet("/api/chat/sessions", async (
    ApplicationDbContext db,
    UserManager<ApplicationUser> userManager,
    System.Security.Claims.ClaimsPrincipal user) =>
{
    var currentUser = await userManager.GetUserAsync(user);

    if (currentUser == null)
    {
        return Results.Unauthorized();
    }

    var sessions = await db.ChatSessions
        .Where(session => session.ApplicationUserId == currentUser.Id)
        .OrderByDescending(session => session.CreatedAt)
        .Select(session => new
        {
            id = session.Id,
            title = session.Title,
            createdAt = session.CreatedAt
        })
        .ToListAsync();

    return Results.Ok(sessions);
})
.RequireAuthorization();

app.Run();
