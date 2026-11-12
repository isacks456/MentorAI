using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using MentorAI.API.Data;
using MentorAI.API.Models;
using MentorAI.API.Services;

namespace MentorAI.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class TrainingController : ControllerBase
{
    private readonly ApplicationDbContext _db;
    private readonly TrainingEvaluationService _evaluationService;

    public TrainingController(
    ApplicationDbContext db,
    TrainingEvaluationService evaluationService)
    {
        _db = db;
        _evaluationService = evaluationService;
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
        return NotFound("Задание не найдено");
    }

    var feedback = _evaluationService.Evaluate(request.Answer);
    var trainingAnswer = new TrainingAnswer
    {
    TrainingTaskId = request.TrainingTaskId,
    Answer = request.Answer,
    Score = feedback.Score
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
        var answers = await _db.TrainingAnswers
            .Where(answer => answer.TrainingTaskId == taskId)
            .OrderByDescending(answer => answer.CreatedAt)
            .ToListAsync();

        return Ok(answers);
    }

    [HttpGet("results")]
    public async Task<IActionResult> GetResults()
    {
        var answers = await _db.TrainingAnswers
            .Where(answer => answer.Score.HasValue)
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
        var totalAnswers = await _db.TrainingAnswers.CountAsync();

        var completedTasks = await _db.TrainingAnswers
            .Select(answer => answer.TrainingTaskId)
            .Distinct()
            .CountAsync();

        var scoredAnswers = _db.TrainingAnswers
            .Where(answer => answer.Score.HasValue);

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

    [HttpGet("skills")]
    public async Task<IActionResult> GetSkillsProgress()
    {
        var skills = await _db.TrainingAnswers
            .Where(answer => answer.Score.HasValue)
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