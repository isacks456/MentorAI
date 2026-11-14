using Microsoft.AspNetCore.Http;

namespace MentorAI.API.Services;

/// <summary>
/// Защитные HTTP-заголовки backend API (SEC-01).
///
/// Заголовки применяются через <see cref="HttpResponse.OnStarting"/>, а не
/// напрямую, потому что <c>UseExceptionHandler</c> при обработке исключения
/// вызывает <c>HttpResponse.Clear()</c>, которая сбрасывает уже установленные
/// заголовки. Колбэки OnStarting при этом сохраняются и выполняются перед
/// отправкой ответа — поэтому заголовки попадают и в ответы ExceptionHandler
/// (ProblemDetails 400/500), и в ответы Rate Limiting (429), и в обычные ответы.
/// </summary>
public static class SecurityHeaders
{
    public const string ContentSecurityPolicy =
        "default-src 'none'; frame-ancestors 'none'; base-uri 'none'";

    public const string PermissionsPolicy =
        "camera=(), microphone=(), geolocation=()";

    /// <summary>Устанавливает все защитные заголовки (идемпотентно, без дублей).</summary>
    public static void Apply(IHeaderDictionary headers)
    {
        headers["X-Content-Type-Options"] = "nosniff";
        headers["Referrer-Policy"] = "no-referrer";
        headers["X-Frame-Options"] = "DENY";
        headers["Content-Security-Policy"] = ContentSecurityPolicy;
        headers["Permissions-Policy"] = PermissionsPolicy;
    }

    /// <summary>
    /// Подключает middleware защитных заголовков. Располагается в самом начале
    /// конвейера, чтобы заголовки добавлялись ко всем ответам, включая
    /// короткозамкнутые (CORS preflight) и сформированные ниже по стеку.
    /// </summary>
    public static IApplicationBuilder UseSecurityHeaders(this IApplicationBuilder app)
    {
        return app.Use(async (context, next) =>
        {
            // регистрируем до вызова next: колбэк переживёт Response.Clear()
            // и выполнится непосредственно перед отправкой заголовков клиенту
            context.Response.OnStarting(static state =>
            {
                Apply(((HttpContext)state).Response.Headers);
                return Task.CompletedTask;
            }, context);

            await next(context);
        });
    }
}
