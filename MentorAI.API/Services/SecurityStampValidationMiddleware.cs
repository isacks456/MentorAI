using System.Security.Claims;
using System.Security.Cryptography;
using System.Text;
using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.Extensions.Options;
using MentorAI.API.Models;

namespace MentorAI.API.Services;

/// <summary>
/// Проверка Security Stamp для аутентифицированных Bearer-запросов (SEC-03/SEC-05).
///
/// Access-токен Identity — это opaque-тикет под Data Protection, который при
/// проверке (BearerTokenHandler) валидируется только по сроку действия и НЕ
/// сверяется с текущим Security Stamp в БД. Поэтому после смены пароля или
/// серверного logout старый access-токен продолжал бы работать до истечения.
///
/// Этот middleware закрывает разрыв: для успешно аутентифицированного Bearer
/// сравнивает stamp из токена с актуальным значением в БД и отклоняет запрос
/// с 401 при расхождении. Cookie-путь не затрагивается вовсе.
/// </summary>
public sealed class SecurityStampValidationMiddleware
{
    private readonly RequestDelegate _next;

    public SecurityStampValidationMiddleware(RequestDelegate next)
    {
        _next = next;
    }

    public async Task InvokeAsync(HttpContext context)
    {
        var endpoint = context.GetEndpoint();

        // анонимные endpoint'ы (login/register/refresh/health/...) не проверяем
        if (endpoint is not null && endpoint.Metadata.GetMetadata<IAllowAnonymous>() is not null)
        {
            await _next(context);
            return;
        }

        // Определяем именно Bearer-аутентификацию. AuthenticationType у Bearer и
        // Cookie одинаковый ("Identity.Application"), поэтому по нему схему
        // различать нельзя — используем прямое обращение к схеме Bearer.
        var bearer = await context.AuthenticateAsync(IdentityConstants.BearerScheme);

        // Bearer отсутствует или не прошёл — не вмешиваемся: решение остаётся
        // за cookie-схемой или анонимным путём. Отказ Bearer НЕ приводит к
        // переключению на cookie (см. CompositeIdentityHandler: bearer-first).
        if (bearer is null || !bearer.Succeeded || bearer.Principal is null)
        {
            await _next(context);
            return;
        }

        var principal = bearer.Principal;
        var identityOptions = context.RequestServices
            .GetRequiredService<IOptions<IdentityOptions>>()
            .Value;

        var expectedStamp = principal.FindFirstValue(
            identityOptions.ClaimsIdentity.SecurityStampClaimType);
        var userId = principal.FindFirstValue(
            identityOptions.ClaimsIdentity.UserIdClaimType);

        // Отсутствующий/пустой claim НЕ считается допустимым.
        if (string.IsNullOrEmpty(expectedStamp) || string.IsNullOrEmpty(userId))
        {
            await RejectAsync(context);
            return;
        }

        var userManager = context.RequestServices
            .GetRequiredService<UserManager<ApplicationUser>>();

        // Пользователь мог быть удалён — тогда токен недействителен.
        var user = await userManager.FindByIdAsync(userId);
        if (user is null)
        {
            await RejectAsync(context);
            return;
        }

        // Актуальный stamp берём из БД (без кэша).
        var actualStamp = await userManager.GetSecurityStampAsync(user);

        if (string.IsNullOrEmpty(actualStamp) || !FixedTimeEquals(expectedStamp, actualStamp))
        {
            await RejectAsync(context);
            return;
        }

        await _next(context);
    }

    /// <summary>Сравнение stamp за постоянное время (устойчиво к тайминг-атакам).</summary>
    private static bool FixedTimeEquals(string a, string b)
    {
        var aBytes = Encoding.UTF8.GetBytes(a);
        var bBytes = Encoding.UTF8.GetBytes(b);

        return aBytes.Length == bBytes.Length &&
               CryptographicOperations.FixedTimeEquals(aBytes, bBytes);
    }

    /// <summary>
    /// Отказ: корректный Bearer Challenge (401 + WWW-Authenticate: Bearer).
    /// Гарантированно не передаёт управление дальше по конвейеру, поэтому
    /// невалидный Bearer не может «упасть» на валидную cookie.
    /// </summary>
    private static async Task RejectAsync(HttpContext context)
    {
        if (context.Response.HasStarted)
        {
            return;
        }

        context.Response.StatusCode = StatusCodes.Status401Unauthorized;
        await context.ChallengeAsync(IdentityConstants.BearerScheme);
    }
}

public static class SecurityStampValidationMiddlewareExtensions
{
    /// <summary>
    /// Подключает проверку Security Stamp. Размещать после
    /// <c>UseAuthentication()</c>/<c>UseRateLimiter()</c> и до <c>UseAuthorization()</c>.
    /// </summary>
    public static IApplicationBuilder UseSecurityStampValidation(this IApplicationBuilder app)
    {
        return app.UseMiddleware<SecurityStampValidationMiddleware>();
    }
}
