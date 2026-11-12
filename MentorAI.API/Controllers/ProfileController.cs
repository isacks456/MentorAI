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
public class ProfileController : ControllerBase
{
    private readonly ApplicationDbContext _context;
	private readonly UserManager<ApplicationUser> _userManager;

    public ProfileController(ApplicationDbContext context, UserManager<ApplicationUser> userManager)
    {
        _context = context;
		_userManager = userManager;
    }

	[HttpGet]
	public async Task<IActionResult> GetProfile()
	{
		var user = await _userManager.GetUserAsync(User);

		if(user == null)
		{
			return Unauthorized();
		}

		var profile = await _context.UserProfiles.FirstOrDefaultAsync(p => p.ApplicationUserId == user.Id);

		if (profile == null)
		{
			return NotFound("Профиль не найден");
		}

		return Ok(profile);
	}

	[HttpPut]
	public async Task<IActionResult> SaveProfile(UserProfile updatedProfile)
	{

		var user = await _userManager.GetUserAsync(User);

		if(user == null)
		{
			return Unauthorized();
		}

		var profile = await _context.UserProfiles.FirstOrDefaultAsync(p => p.ApplicationUserId == user.Id);

		if (profile == null)
		{
			profile = updatedProfile;
			profile.ApplicationUserId = user.Id;
			_context.UserProfiles.Add(profile);
		}
		else
		{
			profile.Name = updatedProfile.Name;
			profile.Email = updatedProfile.Email;
			profile.Age = updatedProfile.Age;
			profile.Course = updatedProfile.Course;
			profile.Institution = updatedProfile.Institution;
		}

		await _context.SaveChangesAsync();

		return Ok(profile);
	}	
}
