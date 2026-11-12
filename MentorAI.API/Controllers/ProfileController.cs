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

	// Сериализует создание профилей: два одновременных GET (например,
	// при двойном монтировании компонента в React StrictMode) не должны
	// создать два профиля одного и того же пользователя.
	private static readonly SemaphoreSlim _profileCreationLock = new(1, 1);

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
			await _profileCreationLock.WaitAsync();

			try
			{
				// Повторная проверка внутри блокировки
				profile = await _context.UserProfiles.FirstOrDefaultAsync(p => p.ApplicationUserId == user.Id);

				if (profile == null)
				{
					profile = new UserProfile
					{
						ApplicationUserId = user.Id,
						Name = "",
						Email = user.Email ?? "",
						Age = 0,
						Course = "",
						Institution = ""
					};

					_context.UserProfiles.Add(profile);

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
	public async Task<IActionResult> SaveProfile([FromBody] UserProfileUpdateRequest request)
	{

		var user = await _userManager.GetUserAsync(User);

		if(user == null)
		{
			return Unauthorized();
		}

		var profile = await _context.UserProfiles.FirstOrDefaultAsync(p => p.ApplicationUserId == user.Id);

		if (profile == null)
		{
			profile = new UserProfile
			{
				ApplicationUserId = user.Id
			};
			_context.UserProfiles.Add(profile);
		}

		profile.Name = request.Name;
		profile.Email = request.Email;
		profile.Age = request.Age;
		profile.Course = request.Course;
		profile.Institution = request.Institution;

		await _context.SaveChangesAsync();

		return Ok(profile);
	}
}

public record UserProfileUpdateRequest
{
	public string Name { get; set; } = "";
	public string Email { get; set; } = "";
	public int Age { get; set; }
	public string Course { get; set; } = "";
	public string Institution { get; set; } = "";
}
