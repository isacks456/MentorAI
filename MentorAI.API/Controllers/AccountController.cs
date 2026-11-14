using MentorAI.API.Data;
using MentorAI.API.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.ComponentModel.DataAnnotations;

namespace MentorAI.API.Controllers;

/// <summary>
/// Операции над самим аккаунтом: смена пароля и удаление аккаунта.
/// Все операции выполняются строго от имени текущего авторизованного пользователя.
/// </summary>
[ApiController]
[Route("api/[controller]")]
[Authorize]
public class AccountController : ControllerBase
{
    private readonly ApplicationDbContext _context;
    private readonly UserManager<ApplicationUser> _userManager;
    private readonly ILogger<AccountController> _logger;

    public AccountController(
        ApplicationDbContext context,
        UserManager<ApplicationUser> userManager,
        ILogger<AccountController> logger)
    {
        _context = context;
        _userManager = userManager;
        _logger = logger;
    }

    /// <summary>
    /// Смена пароля через ASP.NET Identity: сервер сам проверяет
    /// текущий пароль и требования к новому (хеширование — Identity).
    /// </summary>
    [HttpPost("change-password")]
    public async Task<IActionResult> ChangePassword([FromBody] ChangePasswordRequest request)
    {
        var user = await _userManager.GetUserAsync(User);

        if (user == null)
        {
            return Unauthorized();
        }

        if (request.NewPassword != request.ConfirmNewPassword)
        {
            return BadRequest(new ProblemDetails
            {
                Status = 400,
                Title = "Пароли не совпадают",
                Detail = "Новый пароль и его подтверждение должны совпадать"
            });
        }

        var result = await _userManager.ChangePasswordAsync(user, request.CurrentPassword, request.NewPassword);

        if (!result.Succeeded)
        {
            // неверный текущий пароль или нарушение политики пароля
            var errors = result.Errors.Select(e => e.Description);

            return BadRequest(new ProblemDetails
            {
                Status = 400,
                Title = "Не удалось сменить пароль",
                Detail = string.Join("\n", errors)
            });
        }

        // В .NET 10 ChangePasswordAsync при успешной смене пароля сам ротирует
        // Security Stamp (UserManager.UpdatePasswordHash -> UpdateSecurityStampInternal),
        // поэтому повторный вызов UpdateSecurityStampAsync избыточен.
        // После ротации stamp старый access-токен немедленно отклоняется
        // middleware проверки Security Stamp (401), а старый refresh-токен —
        // существующей проверкой в /api/auth/refresh.

        return Ok(new { message = "Пароль успешно изменён" });
    }

    /// <summary>
    /// Полное удаление аккаунта текущего пользователя вместе со связанными
    /// данными (профиль, learning-профиль, настройки уведомлений, чаты,
    /// сообщения, ответы на тренажёре) и самой учётной записи Identity.
    /// </summary>
    [HttpDelete("delete")]
    public async Task<IActionResult> DeleteAccount()
    {
        var user = await _userManager.GetUserAsync(User);

        if (user == null)
        {
            return Unauthorized();
        }

        var userId = user.Id;

        await using var transaction = await _context.Database.BeginTransactionAsync();

        try
        {
            var chatSessions = await _context.ChatSessions
                .Where(s => s.ApplicationUserId == userId)
                .ToListAsync();

            var sessionIds = chatSessions.Select(s => s.Id).ToList();

            await _context.ChatMessages
                .Where(m => m.ChatSessionId != null && sessionIds.Contains(m.ChatSessionId.Value))
                .ExecuteDeleteAsync();

            _context.ChatSessions.RemoveRange(chatSessions);

            await _context.TrainingAnswers
                .Where(a => a.ApplicationUserId == userId)
                .ExecuteDeleteAsync();

            await _context.UserProfiles
                .Where(p => p.ApplicationUserId == userId)
                .ExecuteDeleteAsync();

            await _context.LearningProfiles
                .Where(p => p.ApplicationUserId == userId)
                .ExecuteDeleteAsync();

            await _context.NotificationPreferences
                .Where(p => p.ApplicationUserId == userId)
                .ExecuteDeleteAsync();

            await _context.EmailConfirmationCodes
                .Where(c => c.ApplicationUserId == userId)
                .ExecuteDeleteAsync();

            await _context.SaveChangesAsync();

            var result = await _userManager.DeleteAsync(user);

            if (!result.Succeeded)
            {
                await transaction.RollbackAsync();

                return StatusCode(500, new ProblemDetails
                {
                    Status = 500,
                    Title = "Внутренняя ошибка сервера",
                    Detail = "Что-то пошло не так. Попробуй позже."
                });
            }

            await transaction.CommitAsync();

            _logger.LogInformation("Аккаунт пользователя {UserId} удалён вместе с данными", userId);

            return Ok(new { message = "Аккаунт удалён" });
        }
        catch
        {
            await transaction.RollbackAsync();
            throw;
        }
    }
}

public record ChangePasswordRequest
{
    [Required(ErrorMessage = "Введите текущий пароль")]
    public string CurrentPassword { get; set; } = "";

    [Required(ErrorMessage = "Введите новый пароль")]
    public string NewPassword { get; set; } = "";

    [Required(ErrorMessage = "Подтвердите новый пароль")]
    public string ConfirmNewPassword { get; set; } = "";
}
