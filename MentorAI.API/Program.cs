using Microsoft.EntityFrameworkCore;
using MentorAI.API.Data;
using MentorAI.API.Models;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;
using MentorAI.API.Services;
using System.Net.NetworkInformation;
using System.Threading.RateLimiting;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddScoped<ChatService>();
builder.Services.AddScoped<EmailVerificationService>();
builder.Services.AddScoped<NotificationService>();
builder.Services.Configure<SmtpOptions>(builder.Configuration.GetSection("Smtp"));
builder.Services.AddScoped<IEmailSender, SmtpEmailSender>();

builder.Services.AddDbContext<ApplicationDbContext>(options =>
{
    options.UseSqlite("Data Source=mentorai.db");
});

builder.Services
    .AddIdentityApiEndpoints<ApplicationUser>(options =>
    {
        // политика надёжных паролей — единая для регистрации и смены пароля
        options.Password.RequiredLength = 8;
        options.Password.RequireDigit = true;
        options.Password.RequireUppercase = true;
        options.Password.RequireLowercase = true;
        options.Password.RequireNonAlphanumeric = true;
        options.Password.RequiredUniqueChars = 4;
    })
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

// единый формат ошибок API — ProblemDetails (RFC 9457)
builder.Services.AddProblemDetails(options =>
{
    options.CustomizeProblemDetails = context =>
    {
        // не раскрываем внутренности сервера: без stack trace, путей и секретов
        if (context.ProblemDetails.Status == 500)
        {
            context.ProblemDetails.Title = "Внутренняя ошибка сервера";
            context.ProblemDetails.Detail = "Что-то пошло не так. Попробуй позже.";
        }
    };
});

// HSTS (SEC-01): явные значения — 365 дней, без includeSubDomains и preload.
// Сам middleware подключается только в Production (см. ниже, UseHsts).
builder.Services.AddHsts(options =>
{
    options.MaxAge = TimeSpan.FromDays(365);
    options.IncludeSubDomains = false;
    options.Preload = false;
});

// защита от чрезмерно длинных запросов
builder.WebHost.ConfigureKestrel(options =>
{
    options.Limits.MaxRequestBodySize = 1 * 1024 * 1024; // 1 МБ
});

// ограничение частоты запросов (SEC-02): единый global limiter,
// выбирающий политику по точному совпадению (метод, маршрут).
builder.Services.AddRateLimiter(options =>
{
    options.RejectionStatusCode = StatusCodes.Status429TooManyRequests;

    // без накопления очереди: при исчерпании лимита запрос сразу отклоняется
    options.GlobalLimiter = PartitionedRateLimiter.Create<HttpContext, string>(httpContext =>
    {
        var policy = RateLimitPolicies.Resolve(httpContext);

        if (policy is null)
        {
            // запрос не расходует лимит, но должен обслуживаться:
            // NoopLimiter всегда пропускает (в т.ч. OPTIONS и /api/health)
            return RateLimitPartition.GetNoLimiter("unlimited");
        }

        var partitionKey = RateLimitPartitionKey.Build(httpContext, policy.Name);

        return RateLimitPartition.GetFixedWindowLimiter(
            partitionKey,
            _ => new FixedWindowRateLimiterOptions
            {
                AutoReplenishment = true,
                PermitLimit = policy.PermitLimit,
                Window = policy.Window,
                QueueLimit = 0,
                QueueProcessingOrder = QueueProcessingOrder.OldestFirst
            });
    });

    options.OnRejected = (context, cancellationToken) =>
        new ValueTask(RateLimitRejectionWriter.WriteAsync(context, cancellationToken));
});

var app = builder.Build();

// отключаем страницу разработчика со stack trace — ошибки всегда в ProblemDetails
((IApplicationBuilder)app).Properties["UseDeveloperExceptionPage"] = false;

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

app.UseSecurityHeaders();

app.UseCors("ReactFrontend");

// необработанные исключения -> ProblemDetails без stack trace;
// ошибки клиента (например, невалидный JSON) -> 400, а не 500
app.UseExceptionHandler(errorApp =>
{
    errorApp.Run(async context =>
    {
        var feature = context.Features.Get<Microsoft.AspNetCore.Diagnostics.IExceptionHandlerFeature>();
        var exception = feature?.Error;

        var status = 500;
        var title = "Внутренняя ошибка сервера";
        var detail = "Что-то пошло не так. Попробуй позже.";

        if (exception is Microsoft.AspNetCore.Http.BadHttpRequestException ||
            exception is System.Text.Json.JsonException)
        {
            status = 400;
            title = "Некорректный запрос";
            detail = "Тело запроса содержит невалидный JSON или имеет неверный формат";
        }

        context.Response.StatusCode = status;
        context.Response.ContentType = "application/problem+json";

        await context.Response.WriteAsJsonAsync(new ProblemDetails
        {
            Status = status,
            Title = title,
            Detail = detail
        });
    });
});

// HSTS только для Production (в Development middleware не подключается).
// Значения заданы явно: 365 дней без includeSubDomains и preload.
// HstsMiddleware добавляет заголовок только на HTTPS-запросах и только
// для хостов вне ExcludedHosts (localhost/127.0.0.1/[::1] уже исключены
// по умолчанию), поэтому dev и HTTP не затрагиваются.
if (!app.Environment.IsDevelopment())
{
    app.UseHsts();
}

app.UseHttpsRedirection();

app.UseAuthentication();
app.UseRateLimiter();

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
    // минимальные API не запускают DataAnnotations-валидацию автоматически — проверяем вручную
    if (string.IsNullOrWhiteSpace(request.Message))
    {
        return Results.Problem(
            statusCode: 400,
            title: "Некорректный запрос",
            detail: "Сообщение не может быть пустым");
    }

    if (request.Message.Length > 4000)
    {
        return Results.Problem(
            statusCode: 400,
            title: "Некорректный запрос",
            detail: "Сообщение не может быть длиннее 4000 символов");
    }

    var currentUser = await userManager.GetUserAsync(user);

    if (currentUser == null)
    {
        return Results.Unauthorized();
    }

    var result = await chatService.SendMessageAsync(
        request,
        currentUser.Id
    );

    if (result == null)
    {
        return Results.Problem(
            statusCode: 404,
            title: "Не найдено",
            detail: "Диалог не найден");
    }

    return Results.Ok(new
    {
        reply = result.Reply,
        title = result.Title
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
        return Results.Problem(
            statusCode: 404,
            title: "Не найдено",
            detail: "Диалог не найден");
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
        Title = ChatTitleGenerator.DefaultTitle,
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

app.MapDelete("/api/chat/sessions/{sessionId}", async (
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

    // чат ищется строго среди чатов текущего пользователя
    var session = await db.ChatSessions
        .FirstOrDefaultAsync(s =>
            s.Id == sessionId &&
            s.ApplicationUserId == currentUser.Id);

    if (session == null)
    {
        return Results.Problem(
            statusCode: 404,
            title: "Не найдено",
            detail: "Диалог не найден");
    }

    // удаляем сообщения чата, затем сам чат (не затрагивая другие чаты)
    await db.ChatMessages
        .Where(m => m.ChatSessionId == session.Id)
        .ExecuteDeleteAsync();

    db.ChatSessions.Remove(session);

    await db.SaveChangesAsync();

    return Results.Ok(new { deleted = true });
})
.RequireAuthorization();

app.Run();
