using MentorAI.API.Data;
using MentorAI.API.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.ComponentModel.DataAnnotations;

namespace MentorAI.API.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class NotificationPreferencesController : ControllerBase
{
    private readonly ApplicationDbContext _context;
    private readonly UserManager<ApplicationUser> _userManager;

    public NotificationPreferencesController(
        ApplicationDbContext context,
        UserManager<ApplicationUser> userManager)
    {
        _context = context;
        _userManager = userManager;
    }

    [HttpGet]
    public async Task<IActionResult> Get()
    {
        var user = await _userManager.GetUserAsync(User);

        if (user == null)
        {
            return Unauthorized();
        }

        var prefs = await _context.NotificationPreferences
            .FirstOrDefaultAsync(p => p.ApplicationUserId == user.Id);

        if (prefs == null)
        {
            // первая настройка — создаём строку со значениями по умолчанию
            prefs = new NotificationPreference
            {
                ApplicationUserId = user.Id
            };

            _context.NotificationPreferences.Add(prefs);

            await _context.SaveChangesAsync();
        }

        return Ok(prefs);
    }

    [HttpPut]
    public async Task<IActionResult> Save([FromBody] NotificationPreferenceUpdateRequest request)
    {
        var user = await _userManager.GetUserAsync(User);

        if (user == null)
        {
            return Unauthorized();
        }

        var prefs = await _context.NotificationPreferences
            .FirstOrDefaultAsync(p => p.ApplicationUserId == user.Id);

        if (prefs == null)
        {
            prefs = new NotificationPreference
            {
                ApplicationUserId = user.Id
            };

            _context.NotificationPreferences.Add(prefs);
        }

        prefs.ProgressNotifications = request.ProgressNotifications;
        prefs.LessonReminders = request.LessonReminders;
        prefs.NewsUpdates = request.NewsUpdates;

        // email-уведомления нельзя включить без подтверждённой почты.
        // UI блокирует переключатель, но API обязан обеспечивать это и самостоятельно.
        prefs.EmailNotifications = request.EmailNotifications && user.EmailConfirmed;

        await _context.SaveChangesAsync();

        return Ok(prefs);
    }
}

public record NotificationPreferenceUpdateRequest
{
    public bool ProgressNotifications { get; set; }

    public bool LessonReminders { get; set; }

    public bool NewsUpdates { get; set; }

    public bool EmailNotifications { get; set; }
}
