using MentorAI.API.Models;
using MentorAI.API.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using System.ComponentModel.DataAnnotations;

namespace MentorAI.API.Controllers;

/// <summary>
/// Управление анонсами и email-рассылкой. Доступ — только администраторам
/// (список email в конфигурации Admin:Emails). Проверка прав выполняется
/// на каждом запросе на стороне сервера, а не только скрытием кнопок в UI.
/// </summary>
[ApiController]
[Route("api/[controller]")]
[Authorize]
public class AnnouncementsController : ControllerBase
{
    private readonly AnnouncementsService _service;
    private readonly IAdminAccessService _adminAccess;
    private readonly AnnouncementQueue _queue;
    private readonly UserManager<ApplicationUser> _userManager;

    public AnnouncementsController(
        AnnouncementsService service,
        IAdminAccessService adminAccess,
        AnnouncementQueue queue,
        UserManager<ApplicationUser> userManager)
    {
        _service = service;
        _adminAccess = adminAccess;
        _queue = queue;
        _userManager = userManager;
    }

    /// <summary>Возвращает true, если текущий пользователь — администратор; иначе 403.</summary>
    private async Task<(bool Ok, ApplicationUser? User)> EnsureAdminAsync()
    {
        var user = await _userManager.GetUserAsync(User);

        if (user == null)
        {
            return (false, null);
        }

        if (!_adminAccess.IsAdmin(user.Email))
        {
            return (false, user);
        }

        return (true, user);
    }

    /// <summary>Лёгкий флаг для UI: является ли текущий пользователь администратором.</summary>
    [HttpGet("access")]
    public async Task<IActionResult> GetAccess()
    {
        var user = await _userManager.GetUserAsync(User);

        if (user == null)
        {
            return Unauthorized();
        }

        return Ok(new { isAdmin = _adminAccess.IsAdmin(user.Email) });
    }

    /// <summary>Список анонсов (без email-ов получателей).</summary>
    [HttpGet]
    public async Task<IActionResult> List()
    {
        var (ok, _) = await EnsureAdminAsync();

        if (!ok)
        {
            return Forbid();
        }

        var items = await _service.ListAsync();

        return Ok(items.Select(ToListItem));
    }

    /// <summary>Детали анонса и статистика.</summary>
    [HttpGet("{id:int}")]
    public async Task<IActionResult> Get(int id)
    {
        var (ok, _) = await EnsureAdminAsync();

        if (!ok)
        {
            return Forbid();
        }

        var announcement = await _service.GetAsync(id);

        if (announcement == null)
        {
            return NotFound(new ProblemDetails { Status = 404, Title = "Не найдено", Detail = "Анонс не найден" });
        }

        return Ok(ToDetail(announcement));
    }

    /// <summary>Создание черновика анонса.</summary>
    [HttpPost]
    public async Task<IActionResult> Create([FromBody] AnnouncementRequest request)
    {
        var (ok, user) = await EnsureAdminAsync();

        if (!ok)
        {
            return Forbid();
        }

        if (string.IsNullOrWhiteSpace(request.Title))
        {
            return BadRequest(new ProblemDetails { Status = 400, Title = "Некорректный запрос", Detail = "Заголовок не может быть пустым" });
        }

        if (string.IsNullOrWhiteSpace(request.Body))
        {
            return BadRequest(new ProblemDetails { Status = 400, Title = "Некорректный запрос", Detail = "Текст анонса не может быть пустым" });
        }

        var announcement = await _service.CreateAsync(request.Title.Trim(), request.Body.Trim(), user!.Id);

        return StatusCode(201, ToDetail(announcement));
    }

    /// <summary>Обновление черновика (разрешено только в статусе Draft).</summary>
    [HttpPut("{id:int}")]
    public async Task<IActionResult> Update(int id, [FromBody] AnnouncementRequest request)
    {
        var (ok, _) = await EnsureAdminAsync();

        if (!ok)
        {
            return Forbid();
        }

        if (string.IsNullOrWhiteSpace(request.Title) || string.IsNullOrWhiteSpace(request.Body))
        {
            return BadRequest(new ProblemDetails { Status = 400, Title = "Некорректный запрос", Detail = "Заголовок и текст обязательны" });
        }

        var updated = await _service.UpdateDraftAsync(id, request.Title.Trim(), request.Body.Trim());

        if (updated == null)
        {
            return Conflict(new ProblemDetails { Status = 409, Title = "Конфликт", Detail = "Редактировать можно только черновик" });
        }

        return Ok(ToDetail(updated));
    }

    /// <summary>Серверный HTML-предпросмотр письма (тот же шаблон, что при отправке).</summary>
    [HttpPost("preview")]
    public async Task<IActionResult> Preview([FromBody] AnnouncementRequest request)
    {
        var (ok, _) = await EnsureAdminAsync();

        if (!ok)
        {
            return Forbid();
        }

        var html = AnnouncementsService.BuildPreviewHtml(request.Title ?? "", request.Body ?? "");

        await Task.CompletedTask;

        return Ok(new { html });
    }

    /// <summary>Тестовая отправка строго на список Announcement:TestRecipients.</summary>
    [HttpPost("{id:int}/test")]
    public async Task<IActionResult> Test(int id)
    {
        var (ok, _) = await EnsureAdminAsync();

        if (!ok)
        {
            return Forbid();
        }

        var announcement = await _service.GetAsync(id);

        if (announcement == null)
        {
            return NotFound(new ProblemDetails { Status = 404, Title = "Не найдено", Detail = "Анонс не найден" });
        }

        var report = await _service.SendTestAsync(announcement);

        if (!report.Allowed)
        {
            return Conflict(new ProblemDetails { Status = 409, Title = "Тест недоступен", Detail = report.Reason ?? "Тестовая отправка запрещена" });
        }

        return Ok(new
        {
            allowed = true,
            items = report.Items.Select(i => new { email = i.MaskedEmail, delivered = i.Delivered, reason = i.Reason })
        });
    }

    /// <summary>Запуск массовой рассылки (коротко: захват + очередь, тяжёлое — в фоне).</summary>
    [HttpPost("{id:int}/send")]
    public async Task<IActionResult> Send(int id)
    {
        var (ok, _) = await EnsureAdminAsync();

        if (!ok)
        {
            return Forbid();
        }

        var (result, token) = await _service.StartSendAsync(id);

        if (result == ClaimResult.NotFound)
        {
            return NotFound(new ProblemDetails { Status = 404, Title = "Не найдено", Detail = "Анонс не найден" });
        }

        if (result == ClaimResult.AlreadyClaimed)
        {
            return Conflict(new ProblemDetails { Status = 409, Title = "Конфликт", Detail = "Рассылка уже запущена или завершена" });
        }

        _queue.Enqueue(id);

        var announcement = await _service.GetAsync(id);

        return Accepted(ToDetail(announcement!));
    }

    /// <summary>Остановка рассылки. Обработанные результаты сохраняются, остальные остаются Pending.</summary>
    [HttpPost("{id:int}/cancel")]
    public async Task<IActionResult> Cancel(int id)
    {
        var (ok, _) = await EnsureAdminAsync();

        if (!ok)
        {
            return Forbid();
        }

        var announcement = await _service.RequestCancelAsync(id);

        if (announcement == null)
        {
            return Conflict(new ProblemDetails { Status = 409, Title = "Конфликт", Detail = "Остановить можно только черновик или активную рассылку" });
        }

        return Ok(ToDetail(announcement));
    }

    /// <summary>Возобновление рассылки (только явно). Обрабатываются только Pending.</summary>
    [HttpPost("{id:int}/resume")]
    public async Task<IActionResult> Resume(int id, [FromBody] ResumeRequest? request)
    {
        var (ok, _) = await EnsureAdminAsync();

        if (!ok)
        {
            return Forbid();
        }

        var requeueFailed = request?.RequeueFailed ?? false;
        var requeueUndefined = request?.RequeueUndefined ?? false;

        var (result, token) = await _service.ResumeAsync(id, requeueFailed, requeueUndefined);

        if (result == ClaimResult.NotFound)
        {
            return NotFound(new ProblemDetails { Status = 404, Title = "Не найдено", Detail = "Анонс не найден" });
        }

        if (result == ClaimResult.WrongState)
        {
            return Conflict(new ProblemDetails { Status = 409, Title = "Конфликт", Detail = "Возобновление невозможно: нет ожидающих получателей или неверный статус" });
        }

        if (result == ClaimResult.AlreadyClaimed)
        {
            return Conflict(new ProblemDetails { Status = 409, Title = "Конфликт", Detail = "Рассылка уже выполняется — дождитесь завершения текущей попытки" });
        }

        _queue.Enqueue(id);

        var announcement = await _service.GetAsync(id);

        return Accepted(ToDetail(announcement!));
    }

    private static object ToListItem(Announcement a) => new
    {
        id = a.Id,
        title = a.Title,
        status = a.Status.ToString(),
        createdAt = a.CreatedAt,
        sentAt = a.SentAt,
        lastTestSentAt = a.LastTestSentAt,
        total = a.TotalRecipients,
        sent = a.SentCount,
        skipped = a.SkippedCount,
        failed = a.FailedCount,
        undefined = a.UndefinedCount,
        pending = a.PendingCount
    };

    private static object ToDetail(Announcement a) => new
    {
        id = a.Id,
        title = a.Title,
        body = a.Body,
        status = a.Status.ToString(),
        createdAt = a.CreatedAt,
        sentAt = a.SentAt,
        lastTestSentAt = a.LastTestSentAt,
        stats = new
        {
            total = a.TotalRecipients,
            sent = a.SentCount,
            skipped = a.SkippedCount,
            failed = a.FailedCount,
            undefined = a.UndefinedCount,
            pending = a.PendingCount
        }
    };
}

public record AnnouncementRequest
{
    [Required(ErrorMessage = "Введите заголовок")]
    [MaxLength(200, ErrorMessage = "Заголовок не может быть длиннее 200 символов")]
    public string Title { get; set; } = "";

    [Required(ErrorMessage = "Введите текст анонса")]
    [MaxLength(8000, ErrorMessage = "Текст не может быть длиннее 8000 символов")]
    public string Body { get; set; } = "";
}

public record ResumeRequest
{
    /// <summary>Переотправить получателям со статусом Failed (достоверно не доставлено).</summary>
    public bool RequeueFailed { get; set; }

    /// <summary>Переотправить получателям с Undefined (осознанный риск дубля).</summary>
    public bool RequeueUndefined { get; set; }
}
