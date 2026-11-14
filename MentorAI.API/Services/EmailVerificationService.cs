using System.Collections.Concurrent;
using System.Security.Cryptography;
using System.Text;
using MentorAI.API.Data;
using MentorAI.API.Models;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;

namespace MentorAI.API.Services;

/// <summary>
/// Подтверждение электронной почты шестизначным кодом.
/// Код хранится только в виде SHA-256 хеша с per-user pepper
/// (pepper — из User Secrets / переменных окружения, не в БД).
/// </summary>
public class EmailVerificationService
{
    private const int CodeLifetimeMinutes = 10;
    private const int MaxAttempts = 5;
    private const int ResendCooldownSeconds = 60;
    private const int MaxCodesPerHour = 10;

    private readonly ApplicationDbContext _context;
    private readonly IEmailSender _emailSender;
    private readonly IHostEnvironment _environment;
    private readonly ILogger<EmailVerificationService> _logger;
    private readonly string _pepper;

    // Сериализация операций по одному пользователю: проверка лимитов и вставка кода
    // должны выполняться атомарно, иначе конкурентные запросы обходят кулдаун.
    // Ключ — id пользователя. (Для многоинстансового развёртывания понадобится
    // блокировка на уровне БД; для текущего однопроцессного варианта достаточно этого.)
    private static readonly ConcurrentDictionary<string, SemaphoreSlim> UserLocks = new();

    private static SemaphoreSlim GetUserLock(string userId) =>
        UserLocks.GetOrAdd(userId, _ => new SemaphoreSlim(1, 1));

    public EmailVerificationService(
        ApplicationDbContext context,
        IEmailSender emailSender,
        IHostEnvironment environment,
        IConfiguration configuration,
        ILogger<EmailVerificationService> logger)
    {
        _context = context;
        _emailSender = emailSender;
        _environment = environment;
        _logger = logger;

        var pepper = configuration["EmailVerification:Pepper"];

        if (string.IsNullOrWhiteSpace(pepper))
        {
            if (environment.IsDevelopment())
            {
                pepper = "dev-pepper-do-not-use-in-production";
                logger.LogWarning(
                    "EmailVerification:Pepper не задан — используется временный dev-задел. " +
                    "Задай реальный pepper через User Secrets или переменные окружения.");
            }
            else
            {
                throw new InvalidOperationException(
                    "EmailVerification:Pepper не задан. Укажи его в User Secrets или переменных окружения.");
            }
        }

        _pepper = pepper;
    }

    private string HashCode(string code, string userId)
    {
        var material = $"{userId}:{code}:{_pepper}";
        var bytes = SHA256.HashData(Encoding.UTF8.GetBytes(material));

        return Convert.ToHexString(bytes);
    }

    private static string GenerateCode()
    {
        // криптографически безопасный генератор
        return RandomNumberGenerator.GetInt32(0, 1_000_000).ToString("D6");
    }

    private static DateTime UtcNow => DateTime.UtcNow;

    /// <summary>Активный код: не использован и не истёк.</summary>
    private async Task<EmailConfirmationCode?> GetActiveCodeAsync(string userId)
    {
        return await _context.EmailConfirmationCodes
            .Where(c => c.ApplicationUserId == userId && !c.Consumed && c.ExpiresAt > UtcNow)
            .OrderByDescending(c => c.CreatedAt)
            .FirstOrDefaultAsync();
    }

    /// <summary>
    /// Запрос или повторная отправка кода. Возвращает момент, когда снова
    /// разрешена отправка (null — отправка сразу разрешена после отправки этого кода).
    /// </summary>
    public async Task<EmailCodeSendResult> SendCodeAsync(ApplicationUser user)
    {
        var gate = GetUserLock(user.Id);

        await gate.WaitAsync();

        try
        {
            return await SendCodeCoreAsync(user);
        }
        finally
        {
            gate.Release();
        }
    }

    private async Task<EmailCodeSendResult> SendCodeCoreAsync(ApplicationUser user)
    {
        var now = UtcNow;

        // аннулируем все предыдущие активные коды
        var active = await _context.EmailConfirmationCodes
            .Where(c => c.ApplicationUserId == user.Id && !c.Consumed)
            .ToListAsync();

        foreach (var oldCode in active)
        {
            oldCode.Consumed = true;
        }

        // ограничение частоты: не чаще одного кода в ResendCooldownSeconds
        var lastSent = active.Count > 0 ? active.Max(c => c.CreatedAt) : (DateTime?)null;

        if (lastSent.HasValue && (now - lastSent.Value).TotalSeconds < ResendCooldownSeconds)
        {
            var wait = ResendCooldownSeconds - (int)(now - lastSent.Value).TotalSeconds;

            return new EmailCodeSendResult
            {
                Sent = false,
                RetryAfterSeconds = Math.Max(1, wait)
            };
        }

        // ограничение количества кодов в час (защита от частых запросов)
        var hourAgo = now.AddHours(-1);
        var recentCount = await _context.EmailConfirmationCodes
            .CountAsync(c => c.ApplicationUserId == user.Id && c.CreatedAt > hourAgo);

        if (recentCount >= MaxCodesPerHour)
        {
            return new EmailCodeSendResult
            {
                Sent = false,
                RetryAfterSeconds = ResendCooldownSeconds,
                TooManyRequests = true
            };
        }

        var code = GenerateCode();

        var entity = new EmailConfirmationCode
        {
            ApplicationUserId = user.Id,
            CodeHash = HashCode(code, user.Id),
            CreatedAt = now,
            ExpiresAt = now.AddMinutes(CodeLifetimeMinutes)
        };

        _context.EmailConfirmationCodes.Add(entity);

        await _context.SaveChangesAsync();

        bool sent;

        try
        {
            sent = await _emailSender.SendAsync(
                user.Email ?? "",
                "Код подтверждения MentorAI",
                BuildVerificationEmailHtml(code, CodeLifetimeMinutes));
        }
        catch (EmailDeliveryException)
        {
            // SMTP настроен, но доставка не удалась: аннулируем код,
            // чтобы он не «висел» активным и не блокировал повторную отправку
            entity.Consumed = true;

            await _context.SaveChangesAsync();

            return new EmailCodeSendResult
            {
                Sent = false,
                DeliveryFailed = true
            };
        }

        if (!sent)
        {
            // SMTP не настроен: в Development это может быть легитимный dev-режим,
            // поэтому сигнал отличается от ошибки доставки
            return new EmailCodeSendResult
            {
                Sent = false,
                SmtpNotConfigured = true,
                CreatedAt = entity.CreatedAt,
                ExpiresAt = entity.ExpiresAt
            };
        }

        return new EmailCodeSendResult
        {
            Sent = true,
            CreatedAt = entity.CreatedAt,
            ExpiresAt = entity.ExpiresAt
        };
    }

    /// <summary>Проверка кода. При успехе устанавливает EmailConfirmed.</summary>
    public async Task<EmailCodeVerifyResult> VerifyCodeAsync(ApplicationUser user, string code)
    {
        var gate = GetUserLock(user.Id);

        await gate.WaitAsync();

        try
        {
            return await VerifyCodeCoreAsync(user, code);
        }
        finally
        {
            gate.Release();
        }
    }

    private async Task<EmailCodeVerifyResult> VerifyCodeCoreAsync(ApplicationUser user, string code)
    {
        var now = UtcNow;

        var active = await GetActiveCodeAsync(user.Id);

        if (active == null)
        {
            return new EmailCodeVerifyResult { Success = false, Error = "Код не найден или истёк. Запросите новый код" };
        }

        if (active.AttemptCount >= MaxAttempts)
        {
            active.Consumed = true;
            await _context.SaveChangesAsync();

            return new EmailCodeVerifyResult
            {
                Success = false,
                Blocked = true,
                Error = "Слишком много неверных попыток. Запросите новый код"
            };
        }

        var matches = CryptographicOperations.FixedTimeEquals(
            Encoding.UTF8.GetBytes(active.CodeHash),
            Encoding.UTF8.GetBytes(HashCode(code, user.Id)));

        if (!matches)
        {
            active.AttemptCount++;

            if (active.AttemptCount >= MaxAttempts)
            {
                // код заблокирован после исчерпания попыток
                active.Consumed = true;
            }

            await _context.SaveChangesAsync();

            var left = MaxAttempts - active.AttemptCount;

            return new EmailCodeVerifyResult
            {
                Success = false,
                Error = active.AttemptCount >= MaxAttempts
                    ? "Слишком много неверных попыток. Запросите новый код"
                    : $"Неверный код. Осталось попыток: {left}",
                Blocked = active.AttemptCount >= MaxAttempts
            };
        }

        // успех: код одноразовый, все остальные коды пользователя тоже аннулируем
        active.Consumed = true;

        var others = await _context.EmailConfirmationCodes
            .Where(c => c.ApplicationUserId == user.Id && c.Id != active.Id && !c.Consumed)
            .ToListAsync();

        foreach (var other in others)
        {
            other.Consumed = true;
        }

        user.EmailConfirmed = true;

        await _context.SaveChangesAsync();

        _logger.LogInformation("Почта подтверждена для пользователя {UserId}", user.Id);

        return new EmailCodeVerifyResult { Success = true };
    }

    /// <summary>
    /// Данные статуса для фронтенда: серверные метки времени,
    /// по которым таймер восстанавливается после перезагрузки страницы.
    /// </summary>
    public async Task<EmailCodeStatus> GetStatusAsync(ApplicationUser user)
    {
        var active = await GetActiveCodeAsync(user.Id);
        var now = UtcNow;

        DateTime? resendAvailableAt = null;

        if (active != null)
        {
            var elapsed = (now - active.CreatedAt).TotalSeconds;

            if (elapsed < ResendCooldownSeconds)
            {
                resendAvailableAt = DateTime.SpecifyKind(active.CreatedAt.AddSeconds(ResendCooldownSeconds), DateTimeKind.Utc);
            }
        }

        return new EmailCodeStatus
        {
            Email = user.Email ?? "",
            EmailConfirmed = user.EmailConfirmed,
            ExpiresAt = active != null ? DateTime.SpecifyKind(active.ExpiresAt, DateTimeKind.Utc) : null,
            ResendAvailableAt = resendAvailableAt,
            ServerNow = now
        };
    }

    private static string BuildVerificationEmailHtml(string code, int lifetimeMinutes)
    {
        var codeCells = string.Join("", code.Select(d =>
            $"<td style=\"padding:0 4px;\"><div style=\"width:48px;height:56px;line-height:56px;font-size:26px;font-weight:700;color:#0f1419;background:#eff3f4;border-radius:10px;text-align:center;font-family:Arial,sans-serif;\">{d}</div></td>"));

        return $@"<!DOCTYPE html>
<html>
<head><meta charset=""utf-8""><meta name=""viewport"" content=""width=device-width""></head>
<body style=""margin:0;padding:0;background-color:#f5f5f7;font-family:Arial,Helvetica,sans-serif;"">
  <table role=""presentation"" width=""100%"" cellpadding=""0"" cellspacing=""0"" style=""background-color:#f5f5f7;padding:32px 12px;"">
    <tr><td align=""center"">
      <table role=""presentation"" width=""100%"" cellpadding=""0"" cellspacing=""0"" style=""max-width:480px;background-color:#ffffff;border-radius:16px;overflow:hidden;"">
        <tr><td style=""padding:28px 32px 8px;background-color:#0b0b0c;text-align:center;"">
          <span style=""font-size:20px;font-weight:700;color:#ffffff;font-family:Arial,sans-serif;"">Mentor<span style=""color:#1d9bf0;"">AI</span></span>
        </td></tr>
        <tr><td style=""padding:28px 32px 4px;"">
          <h1 style=""margin:0 0 12px;font-size:20px;color:#0f1419;font-family:Arial,sans-serif;"">Подтвердите электронную почту</h1>
          <p style=""margin:0 0 20px;font-size:14px;line-height:1.6;color:#536471;font-family:Arial,sans-serif;"">
            Введите этот код на странице подтверждения, чтобы завершить настройку аккаунта.
          </p>
          <table role=""presentation"" cellpadding=""0"" cellspacing=""0"" align=""center"" style=""margin:0 0 20px;"">
            <tr>{codeCells}</tr>
          </table>
          <p style=""margin:0 0 24px;font-size:13px;color:#536471;font-family:Arial,sans-serif;"">
            Код действует <b>{lifetimeMinutes} минут</b>. Если вы не запрашивали код — просто проигнорируйте это письмо.
          </p>
          <hr style=""border:none;border-top:1px solid #eff3f4;margin:0 0 16px;"">
          <p style=""margin:0;font-size:12px;color:#8b98a5;font-family:Arial,sans-serif;"">
            Это письмо отправлено сервисом MentorAI. Отвечать на него не нужно.
          </p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>";
    }
}

public class EmailCodeSendResult
{
    public bool Sent { get; set; }
    public bool SmtpNotConfigured { get; set; }
    public bool TooManyRequests { get; set; }

    /// <summary>SMTP настроен, но письмо не доставлено; созданный код аннулирован.</summary>
    public bool DeliveryFailed { get; set; }

    public int? RetryAfterSeconds { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime ExpiresAt { get; set; }
}

public class EmailCodeVerifyResult
{
    public bool Success { get; set; }
    public bool Blocked { get; set; }
    public string? Error { get; set; }
}

public class EmailCodeStatus
{
    public string Email { get; set; } = "";
    public bool EmailConfirmed { get; set; }
    public DateTime? ExpiresAt { get; set; }
    public DateTime? ResendAvailableAt { get; set; }

    /// <summary>Текущее серверное время — для корректного расчёта таймеров на клиенте.</summary>
    public DateTime ServerNow { get; set; }
}
