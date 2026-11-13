using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using MentorAI.API.Data;
using MentorAI.API.Models;
using MentorAI.API.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;

namespace MentorAI.API.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class TrainingController : ControllerBase
{
    private readonly ApplicationDbContext _db;
    private readonly TrainingEvaluationService _evaluationService;
    private readonly UserManager<ApplicationUser> _userManager;
    public TrainingController(
    ApplicationDbContext db,
    TrainingEvaluationService evaluationService, UserManager<ApplicationUser> userManager)
    {
        _db = db;
        _evaluationService = evaluationService;
        _userManager = userManager;
    }

    [HttpGet("scenarios")]
    public async Task<IActionResult> GetScenarios()
    {
        var scenarios = await _db.TrainingScenarios.ToListAsync();

        return Ok(scenarios);
    }
    [HttpGet("scenarios/{scenarioId}/tasks")]
    public async Task<IActionResult> GetTasks(int scenarioId)
    {
        var tasks = await _db.TrainingTasks
        .Where(task => task.TrainingScenarioId == scenarioId)
        .OrderBy(task => task.Id)
        .ToListAsync();
        return Ok(tasks);
    }
    [HttpPost("answer")]
    public async Task<IActionResult> SubmitAnswer(TrainingAnswerRequest request)
    {
    var task = await _db.TrainingTasks
        .FindAsync(request.TrainingTaskId);

    if (task == null)
    {
        return NotFound(new ProblemDetails
        {
            Status = 404,
            Title = "Не найдено",
            Detail = "Задание не найдено"
        });
    }

    // защита от обхода атрибутов через прямой HTTP-запрос:
    // [Required] пропускает строку из одних пробелов
    if (string.IsNullOrWhiteSpace(request.Answer))
    {
        return BadRequest(new ProblemDetails
        {
            Status = 400,
            Title = "Некорректный запрос",
            Detail = "Ответ не может быть пустым"
        });
    }

    var feedback = _evaluationService.Evaluate(request.Answer);

    var user = await _userManager.GetUserAsync(User);

    if (user == null)
    {
        return Unauthorized();
    }

    var trainingAnswer = new TrainingAnswer
    {
        TrainingTaskId = request.TrainingTaskId,
        Answer = request.Answer,
        Score = feedback.Score,
        ApplicationUserId = user.Id,
    };
    
    _db.TrainingAnswers.Add(trainingAnswer);

    await _db.SaveChangesAsync();

    return Ok(new
    {
        message = "Ответ успешно сохранён",
        taskTitle = task.Title,
        answer = trainingAnswer.Answer,
        createdAt = trainingAnswer.CreatedAt,
        feedback = feedback
    });
    }
    [HttpGet("tasks/{taskId}/answers")]
    public async Task<IActionResult> GetAnswers(int taskId)
    {
        var user = await _userManager.GetUserAsync(User);

        if (user == null)
        {
            return Unauthorized();
        }

        var answers = await _db.TrainingAnswers
            .Where(answer => answer.TrainingTaskId == taskId && answer.ApplicationUserId == user.Id)
            .OrderByDescending(answer => answer.CreatedAt)
            .ToListAsync();

        return Ok(answers);
    }

    [HttpGet("activity")]
    public async Task<IActionResult> GetRecentActivity()
    {
        var user = await _userManager.GetUserAsync(User);

        if (user == null)
        {
            return Unauthorized();
        }

        var trainingActivities = await _db.TrainingAnswers
            .Where(answer => answer.ApplicationUserId == user.Id)
            .OrderByDescending(answer => answer.CreatedAt)
            .Take(5)
            .Join(
                _db.TrainingTasks,
                answer => answer.TrainingTaskId,
                task => task.Id,
                (answer, task) => new RecentActivityItem
                {
                    Type = "training",
                    Title = task.Title,
                    Status = answer.Score.HasValue ? $"Оценка {answer.Score.Value}%" : "Ответ сохранён",
                    Date = answer.CreatedAt
                })
            .ToListAsync();

        var chatActivities = await _db.ChatSessions
            .Where(session => session.ApplicationUserId == user.Id)
            .OrderByDescending(session => session.CreatedAt)
            .Take(5)
            .Select(session => new RecentActivityItem
            {
                Type = "chat",
                Title = session.Title,
                Status = "AI-наставник",
                Date = session.CreatedAt
            })
            .ToListAsync();

        var activity = trainingActivities
            .Concat(chatActivities)
            .OrderByDescending(item => item.Date)
            .Take(6)
            .ToList();

        return Ok(activity);
    }

    [HttpGet("results")]
    public async Task<IActionResult> GetResults()
    {
        var user = await _userManager.GetUserAsync(User);

        if (user == null)
        {
            return Unauthorized();
        }

        var answers = await _db.TrainingAnswers
            .Where(answer => answer.ApplicationUserId == user.Id && answer.Score.HasValue)
            .OrderBy(answer => answer.CreatedAt)
            .Select(answer => new
            {
                answer.CreatedAt,
                answer.Score
            })
            .ToListAsync();

        var results = answers.Select(answer => new
        {
            day = answer.CreatedAt.ToString("dd.MM"),
            score = answer.Score!.Value
        });

        return Ok(results);
    }

    [HttpGet("progress")]
    public async Task<IActionResult> GetProgress()
    {
        var user = await _userManager.GetUserAsync(User);

        if (user == null)
        {
            return Unauthorized();
        }

        var userAnswers = _db.TrainingAnswers.Where(answer => answer.ApplicationUserId == user.Id);

        var totalAnswers = await userAnswers.CountAsync();

        var completedTasks = await userAnswers.Select(answer => answer.TrainingTaskId)
            .Distinct()
            .CountAsync();

        var scoredAnswers = userAnswers.Where(answer => answer.Score.HasValue);

        var averageScore = await scoredAnswers.AnyAsync()
            ? await scoredAnswers.AverageAsync(answer => (double)answer.Score!.Value)
            : 0;

        var progress = new TrainingProgress
        {
            TotalAnswers = totalAnswers,
            CompletedTasks = completedTasks,
            AverageScore = averageScore
        };
        return Ok(progress);
    }

    [HttpGet("summary")]
    public async Task<IActionResult> GetSummary()
    {
        var user = await _userManager.GetUserAsync(User);

        if (user == null)
        {
            return Unauthorized();
        }

        var userAnswers = _db.TrainingAnswers.Where(answer => answer.ApplicationUserId == user.Id);

        var totalAnswers = await userAnswers.CountAsync();

        var completedTasks = await userAnswers.Select(answer => answer.TrainingTaskId)
            .Distinct()
            .CountAsync();

        var scoredAnswers = userAnswers.Where(answer => answer.Score.HasValue);

        var averageScore = await scoredAnswers.AnyAsync()
            ? await scoredAnswers.AverageAsync(answer => (double)answer.Score!.Value)
            : 0;

        var skillsCount = await scoredAnswers
            .Join(
                _db.TrainingTasks,
                answer => answer.TrainingTaskId,
                task => task.Id,
                (answer, task) => task.Skill)
            .Distinct()
            .CountAsync();

        var chatSessionsCount = await _db.ChatSessions
            .CountAsync(session => session.ApplicationUserId == user.Id);

        // дни активности: уникальные даты ответов и диалогов (в памяти — объём данных небольшой)
        var answerDates = await userAnswers.Select(answer => answer.CreatedAt).ToListAsync();
        var chatDates = await _db.ChatSessions
            .Where(session => session.ApplicationUserId == user.Id)
            .Select(session => session.CreatedAt)
            .ToListAsync();

        var activeDays = answerDates
            .Concat(chatDates)
            .Select(date => date.Date)
            .Distinct()
            .Count();

        return Ok(new
        {
            totalAnswers,
            completedTasks,
            averageScore,
            skillsCount,
            chatSessionsCount,
            activeDays
        });
    }

    [HttpGet("skills")]
    public async Task<IActionResult> GetSkillsProgress()
    {
        var user = await _userManager.GetUserAsync(User);

        if (user == null)
        {
            return Unauthorized();
        }

        var skills = await _db.TrainingAnswers.Where(answer =>
            answer.ApplicationUserId == user.Id &&
            answer.Score.HasValue)
            .Join(
                _db.TrainingTasks,
                answer => answer.TrainingTaskId,
                task => task.Id,
                (answer, task) => new
                {
                    task.Skill,
                    answer.Score
                })
            .GroupBy(item => item.Skill)
            .Select(group => new
            {
                name = group.Key,
                progress = group.Average(item => item.Score!.Value)
            })
            .ToListAsync();

            var result = skills.Select(skill => new
            {
                skill.name,
                skill.progress,
                recommendation = skill.name switch
                {
                    "JavaScript" =>
                        "Повтори замыкания, асинхронность и работу с Promise.",

                    "Коммуникация" =>
                        "Тренируйся рассказывать о себе, аргументировать решения и чётко выражать мысли.",

                    _ =>
                        "Практикуйся в выполнении заданий по этому навыку."
                }
            }).ToList();

        return Ok(result);
    }
}

public record RecentActivityItem
{
    public string Type { get; set; } = "training";
    public string Title { get; set; } = "";
    public string Status { get; set; } = "";
    public DateTime Date { get; set; }
}