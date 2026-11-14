using MentorAI.API.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Options;
using MentorAI.API.Services;

namespace MentorAI.API.Controllers;

/// <summary>
/// Подтверждение электронной почты. Все операции выполняются строго
/// от имени текущего авторизованного пользователя; код никогда
/// не возвращается в ответах API.
/// </summary>
[ApiController]
[Route("api/[controller]")]
[Authorize]
public class EmailVerificationController : ControllerBase
{
    private readonly UserManager<ApplicationUser> _userManager;
    private readonly EmailVerificationService _verificationService;
    private readonly IEmailSender _emailSender;
    private readonly IHostEnvironment _environment;
    private readonly SmtpOptions _smtpOptions;

    public EmailVerificationController(
        UserManager<ApplicationUser> userManager,
        EmailVerificationService verificationService,
        IEmailSender emailSender,
        IHostEnvironment environment,
        IOptions<SmtpOptions> smtpOptions)
    {
        _userManager = userManager;
        _verificationService = verificationService;
        _emailSender = emailSender;
        _environment = environment;
        _smtpOptions = smtpOptions.Value;
    }

    /// <summary>Статус почты: подтверждена ли, когда истекает активный код, когда разрешена повторная отправка.</summary>
    [HttpGet("status")]
    public async Task<IActionResult> GetStatus()
    {
        var user = await _userManager.GetUserAsync(User);

        if (user == null)
        {
            return Unauthorized();
        }

        var status = await _verificationService.GetStatusAsync(user);

        return Ok(status);
    }

    /// <summary>Отправка кода на почту текущего пользователя (первая отправка или повторная).</summary>
    [HttpPost("verification-code")]
    public async Task<IActionResult> SendCode()
    {
        var user = await _userManager.GetUserAsync(User);

        if (user == null)
        {
            return Unauthorized();
        }

        if (user.EmailConfirmed)
        {
            return Ok(new { emailConfirmed = true, message = "Почта уже подтверждена" });
        }

        var result = await _verificationService.SendCodeAsync(user);

        if (result.TooManyRequests)
        {
            return StatusCode(429, new ProblemDetails
            {
                Status = 429,
                Title = "Слишком много запросов",
                Detail = "Превышен лимит отправки кодов. Попробуйте позже"
            });
        }

        if (result.Sent)
        {
            return Ok(new
            {
                sent = true,
                expiresAt = result.ExpiresAt,
                message = "Код отправлен на вашу почту"
            });
        }

        if (result.DeliveryFailed)
        {
            // созданный код аннулирован, кулдаун не блокирует повторную попытку
            return StatusCode(503, new ProblemDetails
            {
                Status = 503,
                Title = "Почтовый сервис недоступен",
                Detail = "Не удалось отправить письмо. Попробуйте ещё раз позже"
            });
        }

        if (result.SmtpNotConfigured)
        {
            // код создан и действителен, но письмо не отправлено: SMTP не настроен.
            // API не раскрывает код; в Development код мог быть выведен в консоль сервера
            var devNote = _environment.IsDevelopment() && _smtpOptions.DevEcho
                ? "SMTP не настроен: код выведен в консоль сервера (только Development)"
                : null;

            return Ok(new
            {
                sent = false,
                smtpNotConfigured = true,
                expiresAt = result.ExpiresAt,
                message = "Почтовый сервис не настроен, отправка письма не выполнена",
                devNote
            });
        }

        // кулдаун повторной отправки
        return StatusCode(429, new ProblemDetails
        {
            Status = 429,
            Title = "Повторная отправка пока недоступна",
            Detail = $"Повторная отправка будет доступна через {result.RetryAfterSeconds} с"
        });
    }

    /// <summary>Проверка кода. При успехе — EmailConfirmed = true, код аннулируется.</summary>
    [HttpPost("verify")]
    public async Task<IActionResult> Verify([FromBody] VerifyEmailRequest request)
    {
        var user = await _userManager.GetUserAsync(User);

        if (user == null)
        {
            return Unauthorized();
        }

        if (user.EmailConfirmed)
        {
            return Ok(new { emailConfirmed = true, message = "Почта уже подтверждена" });
        }

        var code = request.Code?.Trim() ?? "";

        if (code.Length != 6 || !code.All(char.IsDigit))
        {
            return BadRequest(new ProblemDetails
            {
                Status = 400,
                Title = "Некорректный код",
                Detail = "Код должен состоять ровно из 6 цифр"
            });
        }

        var result = await _verificationService.VerifyCodeAsync(user, code);

        if (!result.Success)
        {
            return BadRequest(new ProblemDetails
            {
                Status = 400,
                Title = "Подтверждение не выполнено",
                Detail = result.Error ?? "Не удалось подтвердить код"
            });
        }

        return Ok(new { emailConfirmed = true, message = "Почта успешно подтверждена" });
    }
}

public record VerifyEmailRequest
{
    public string Code { get; set; } = "";
}
