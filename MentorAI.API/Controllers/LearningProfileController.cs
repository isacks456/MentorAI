using MentorAI.API.Data;
using MentorAI.API.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Authorization;

namespace MentorAI.API.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class LearningProfileController : ControllerBase
{
    private readonly ApplicationDbContext _context;
    private readonly UserManager<ApplicationUser> _userManager;

    // Сериализует создание learning-профилей (защита от гонки
    // при одновременных запросах из React StrictMode).
    private static readonly SemaphoreSlim _profileCreationLock = new(1, 1);

    public LearningProfileController(ApplicationDbContext context, UserManager<ApplicationUser> userManager)
    {
        _context = context;
        _userManager = userManager;
    }

    [HttpGet]
    public async Task<IActionResult> GetLearningProfile()
    {
        var user = await _userManager.GetUserAsync(User);

        if(user == null)
        {
            return Unauthorized();
        }

        var profile = await _context.LearningProfiles.FirstOrDefaultAsync(p => p.ApplicationUserId == user.Id);

        if (profile == null)
        {
            await _profileCreationLock.WaitAsync();

            try
            {
                // Повторная проверка внутри блокировки
                profile = await _context.LearningProfiles.FirstOrDefaultAsync(p => p.ApplicationUserId == user.Id);

                if (profile == null)
                {
                    profile = new LearningProfile
                    {
                        ApplicationUserId = user.Id
                    };

                    _context.LearningProfiles.Add(profile);

                    await _context.SaveChangesAsync();
                }
            }
            finally
            {
                _profileCreationLock.Release();
            }
        }

        return Ok(profile);
    }

    [HttpPut]
    public async Task<IActionResult> SaveLearningProfile([FromBody] LearningProfileUpdateRequest request)
    {
        var user = await _userManager.GetUserAsync(User);

        if(user == null)
        {
            return Unauthorized();
        }

        var profile = await _context.LearningProfiles.FirstOrDefaultAsync(p => p.ApplicationUserId == user.Id);

        if (profile == null)
        {
            profile = new LearningProfile
            {
                ApplicationUserId = user.Id
            };
            _context.LearningProfiles.Add(profile);
        }

        profile.Goal = request.Goal;
        profile.Direction = request.Direction;
        profile.Position = request.Position;
        profile.Description = request.Description;
        profile.DirectionDescription = request.DirectionDescription;
        profile.PositionDescription = request.PositionDescription;

        await _context.SaveChangesAsync();

        return Ok(profile);
    }
}

public record LearningProfileUpdateRequest
{
    public string Goal { get; set; } = "";
    public string Direction { get; set; } = "";
    public string Position { get; set; } = "";
    public string Description { get; set; } = "";
    public string DirectionDescription { get; set; } = "";
    public string PositionDescription { get; set; } = "";
}