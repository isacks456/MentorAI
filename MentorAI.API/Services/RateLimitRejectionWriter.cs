using System.Globalization;
using System.Threading.RateLimiting;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;

namespace MentorAI.API.Services;

/// <summary>
/// Формирование корректного ответа при превышении лимита (SEC-02).
///
/// Тело ответа не раскрывает IP, идентификатор пользователя, имена политик
/// и иные внутренние сведения. Если штатный <see cref="IProblemDetailsService"/>
/// по какой-то причине не смог записать ответ, используется резервный путь.
/// Повторная запись в <see cref="HttpResponse"/> исключена проверкой HasStarted.
/// </summary>
internal static class RateLimitRejectionWriter
{
    private const string ProblemJsonContentType = "application/problem+json";

    public static async Task WriteAsync(OnRejectedContext context, CancellationToken cancellationToken)
    {
        var httpContext = context.HttpContext;
        var response = httpContext.Response;

        // статус и Retry-After выставляем всегда — это идемпотентно
        response.StatusCode = StatusCodes.Status429TooManyRequests;

        if (context.Lease.TryGetMetadata(MetadataName.RetryAfter, out var retryAfterValue) &&
            retryAfterValue is TimeSpan retryAfter &&
            retryAfter > TimeSpan.Zero)
        {
            var seconds = (int)Math.Ceiling(retryAfter.TotalSeconds);
            response.Headers.RetryAfter = seconds.ToString(CultureInfo.InvariantCulture);
        }

        // если ответ уже начал отправляться — писать тело нельзя
        if (response.HasStarted)
        {
            return;
        }

        var problem = new ProblemDetails
        {
            Status = StatusCodes.Status429TooManyRequests,
            Title = "Слишком много запросов",
            Detail = "Повторите попытку позже."
        };

        var problemDetailsService = httpContext.RequestServices.GetService<IProblemDetailsService>();
        if (problemDetailsService is not null)
        {
            try
            {
                var written = await problemDetailsService.TryWriteAsync(new ProblemDetailsContext
                {
                    HttpContext = httpContext,
                    ProblemDetails = problem
                });

                if (written)
                {
                    return;
                }
            }
            catch
            {
                // провал штатного сервиса не должен оставить пустой ответ — уходим в резерв
            }
        }

        // ещё раз проверим: штатный путь мог частично начать запись
        if (response.HasStarted)
        {
            return;
        }

        response.ContentType = ProblemJsonContentType;

        await response.WriteAsJsonAsync(
            problem,
            options: null,
            contentType: ProblemJsonContentType,
            cancellationToken: cancellationToken);
    }
}
