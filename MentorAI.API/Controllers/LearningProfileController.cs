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
            return NotFound("Информация об обучении не найдена");
        }

        return Ok(profile);
    }

    [HttpPut]
    public async Task<IActionResult> SaveLearningProfile(LearningProfile updatedProfile)
    {
        var user = await _userManager.GetUserAsync(User);

        if(user == null)
        {
            return Unauthorized();
        }

        var profile = await _context.LearningProfiles.FirstOrDefaultAsync(p => p.ApplicationUserId == user.Id);

        if (profile == null)
        {
            profile = updatedProfile;
            profile.ApplicationUserId = user.Id;
            _context.LearningProfiles.Add(profile);
        }
        else
        {
            profile.Goal = updatedProfile.Goal;
            profile.Direction = updatedProfile.Direction;
            profile.Position = updatedProfile.Position;
            profile.Description = updatedProfile.Description;
			profile.DirectionDescription = updatedProfile.DirectionDescription;
			profile.PositionDescription = updatedProfile.PositionDescription;
        }

        await _context.SaveChangesAsync();

        return Ok(profile);
    }
}