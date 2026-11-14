using Microsoft.Extensions.Configuration;

namespace MentorAI.API.Services;

/// <summary>
/// Проверка административных прав по списку email из конфигурации.
/// Список задаётся в User Secrets / переменных окружения (ключ Admin:Emails),
/// в публичный appsettings.json не попадает.
/// </summary>
public interface IAdminAccessService
{
    /// <summary>true, если email входит в список администраторов (без учёта регистра).</summary>
    bool IsAdmin(string? email);
}

public class AdminAccessService : IAdminAccessService
{
    private readonly HashSet<string> _adminEmails;

    public AdminAccessService(IConfiguration configuration)
    {
        // поддерживаем и массив (Admin:Emails:0, :1, ...), и одиночное значение
        var emails = new List<string>();

        var array = configuration.GetSection("Admin:Emails").Get<string[]>();

        if (array != null)
        {
            emails.AddRange(array);
        }

        var single = configuration["Admin:Emails"];

        if (!string.IsNullOrWhiteSpace(single))
        {
            emails.Add(single);
        }

        _adminEmails = emails
            .Where(e => !string.IsNullOrWhiteSpace(e))
            .Select(e => e.Trim())
            .ToHashSet(StringComparer.OrdinalIgnoreCase);
    }

    public bool IsAdmin(string? email)
    {
        if (string.IsNullOrWhiteSpace(email))
        {
            return false;
        }

        // пустой список администраторов => администраторов нет (закрыто по умолчанию)
        return _adminEmails.Contains(email.Trim());
    }
}
