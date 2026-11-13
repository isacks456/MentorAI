using MentorAI.API.Data;
using MentorAI.API.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.ComponentModel.DataAnnotations;

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

		// [Required] пропускает строки из одних пробелов — проверяем вручную
		if (string.IsNullOrWhiteSpace(request.Name) || string.IsNullOrWhiteSpace(request.Email))
		{
			return BadRequest(new ProblemDetails
			{
				Status = 400,
				Title = "Некорректный запрос",
				Detail = "Имя и email не могут быть пустыми"
			});
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
	[Required(ErrorMessage = "Имя не может быть пустым")]
	[MaxLength(100, ErrorMessage = "Имя не может быть длиннее 100 символов")]
	public string Name { get; set; } = "";

	[Required(ErrorMessage = "Email не может быть пустым")]
	[EmailAddress(ErrorMessage = "Введите корректный адрес электронной почты")]
	[MaxLength(100, ErrorMessage = "Email не может быть длиннее 100 символов")]
	public string Email { get; set; } = "";

	// 0 означает "возраст не указан" (совместимость с существующим профилем)
	[Range(0, 120, ErrorMessage = "Возраст должен быть от 1 до 120 или не указан")]
	public int Age { get; set; }

	[MaxLength(100, ErrorMessage = "Курс не может быть длиннее 100 символов")]
	public string Course { get; set; } = "";

	[MaxLength(100, ErrorMessage = "Учебное заведение не может быть длиннее 100 символов")]
	public string Institution { get; set; } = "";
}
