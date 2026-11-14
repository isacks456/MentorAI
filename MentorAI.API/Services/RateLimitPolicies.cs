using System.Security.Claims;

namespace MentorAI.API.Services;

/// <summary>
/// Описание одной политики ограничения частоты запросов:
/// имя, число разрешённых запросов и окно.
/// </summary>
public sealed record RateLimitPolicy(string Name, int PermitLimit, TimeSpan Window);

/// <summary>
/// Каталог политик Rate Limiting (SEC-02) и сопоставление запроса с политикой
/// по точному совпадению HTTP-метода и маршрута.
///
/// Намеренно не содержит «общих» эвристик: совпадение либо точное, либо
/// запрос попадает в общий лимит <see cref="GeneralAuth"/>, либо не лимитируется.
/// </summary>
public static class RateLimitPolicies
{
    public const string Register = "register";
    public const string Login = "login";
    public const string Refresh = "refresh";
    public const string ForgotPassword = "forgot-password";
    public const string ResetPassword = "reset-password";
    public const string ResendConfirm = "resend-confirm";
    public const string ConfirmEmail = "confirm-email";
    public const string AuthManage = "auth-manage";
    public const string EmailCode = "email-code";
    public const string EmailVerify = "email-verify";
    public const string ChatSend = "chat-send";
    public const string ChatCreate = "chat-create";
    public const string GeneralAuth = "general-auth";

    private static readonly RateLimitPolicy RegisterPolicy = new(Register, 5, TimeSpan.FromMinutes(15));
    private static readonly RateLimitPolicy LoginPolicy = new(Login, 20, TimeSpan.FromMinutes(5));
    private static readonly RateLimitPolicy RefreshPolicy = new(Refresh, 30, TimeSpan.FromMinutes(5));
    private static readonly RateLimitPolicy ForgotPasswordPolicy = new(ForgotPassword, 5, TimeSpan.FromMinutes(15));
    private static readonly RateLimitPolicy ResetPasswordPolicy = new(ResetPassword, 10, TimeSpan.FromMinutes(15));
    private static readonly RateLimitPolicy ResendConfirmPolicy = new(ResendConfirm, 5, TimeSpan.FromMinutes(15));
    private static readonly RateLimitPolicy ConfirmEmailPolicy = new(ConfirmEmail, 20, TimeSpan.FromMinutes(15));
    private static readonly RateLimitPolicy AuthManagePolicy = new(AuthManage, 30, TimeSpan.FromMinutes(5));
    private static readonly RateLimitPolicy EmailCodePolicy = new(EmailCode, 5, TimeSpan.FromMinutes(5));
    private static readonly RateLimitPolicy EmailVerifyPolicy = new(EmailVerify, 10, TimeSpan.FromMinutes(5));
    private static readonly RateLimitPolicy ChatSendPolicy = new(ChatSend, 20, TimeSpan.FromMinutes(1));
    private static readonly RateLimitPolicy ChatCreatePolicy = new(ChatCreate, 10, TimeSpan.FromMinutes(5));
    private static readonly RateLimitPolicy GeneralAuthPolicy = new(GeneralAuth, 300, TimeSpan.FromMinutes(1));

    /// <summary>
    /// Определяет политику для запроса. Возвращает <c>null</c>, если запрос
    /// не должен расходовать лимит (CORS-preflight OPTIONS, /api/health,
    /// маршруты вне /api).
    /// </summary>
    public static RateLimitPolicy? Resolve(HttpContext context)
    {
        var request = context.Request;

        // CORS preflight и любой OPTIONS не расходуют лимит
        if (HttpMethods.IsOptions(request.Method))
        {
            return null;
        }

        var path = NormalizePath(request.Path.Value);

        // listen-проверка хостинга — без лимита
        if (path.Equals("/api/health", StringComparison.OrdinalIgnoreCase))
        {
            return null;
        }

        var isPost = HttpMethods.IsPost(request.Method);
        var isGet = HttpMethods.IsGet(request.Method);

        // --- Identity API (/api/auth) ---
        if (isPost && path.Equals("/api/auth/register", StringComparison.OrdinalIgnoreCase))
            return RegisterPolicy;
        if (isPost && path.Equals("/api/auth/login", StringComparison.OrdinalIgnoreCase))
            return LoginPolicy;
        if (isPost && path.Equals("/api/auth/refresh", StringComparison.OrdinalIgnoreCase))
            return RefreshPolicy;
        if (isPost && path.Equals("/api/auth/forgotPassword", StringComparison.OrdinalIgnoreCase))
            return ForgotPasswordPolicy;
        if (isPost && path.Equals("/api/auth/resetPassword", StringComparison.OrdinalIgnoreCase))
            return ResetPasswordPolicy;
        if (isPost && path.Equals("/api/auth/resendConfirmationEmail", StringComparison.OrdinalIgnoreCase))
            return ResendConfirmPolicy;
        if (isGet && path.Equals("/api/auth/confirmEmail", StringComparison.OrdinalIgnoreCase))
            return ConfirmEmailPolicy;

        // --- Identity API: управление аккаунтом ---
        if ((isGet || isPost) && path.Equals("/api/auth/manage/info", StringComparison.OrdinalIgnoreCase))
            return AuthManagePolicy;
        if (isPost && path.Equals("/api/auth/manage/2fa", StringComparison.OrdinalIgnoreCase))
            return AuthManagePolicy;

        // --- подтверждение почты (пользовательский контроллер) ---
        if (isPost && path.Equals("/api/EmailVerification/verification-code", StringComparison.OrdinalIgnoreCase))
            return EmailCodePolicy;
        if (isPost && path.Equals("/api/EmailVerification/verify", StringComparison.OrdinalIgnoreCase))
            return EmailVerifyPolicy;

        // --- чаты ---
        if (isPost && path.Equals("/api/chat", StringComparison.OrdinalIgnoreCase))
            return ChatSendPolicy;
        if (isPost && path.Equals("/api/chat/sessions", StringComparison.OrdinalIgnoreCase))
            return ChatCreatePolicy;

        // --- общий лимит для всех остальных запросов API ---
        if (path.StartsWith("/api/", StringComparison.OrdinalIgnoreCase) ||
            path.Equals("/api", StringComparison.OrdinalIgnoreCase))
            return GeneralAuthPolicy;

        return null;
    }

    private static string NormalizePath(string? rawPath)
    {
        if (string.IsNullOrEmpty(rawPath))
        {
            return "/";
        }

        // убираем хвостовой слэш, чтобы /api/auth/login и /api/auth/login/ совпадали
        if (rawPath.Length > 1)
        {
            return rawPath.TrimEnd('/');
        }

        return rawPath;
    }
}

/// <summary>
/// Формирование ключа партиции лимитера.
///
/// Ключ всегда включает имя политики, поэтому счётчики разных политик
/// независимы. Для авторизованных запросов используется идентификатор
/// пользователя, для анонимных — <see cref="HttpContext.Connection"/>.RemoteIpAddress.
/// X-Forwarded-For намеренно не читается.
/// </summary>
public static class RateLimitPartitionKey
{
    public static string Build(HttpContext context, string policyName)
    {
        var userId = GetAuthenticatedUserId(context);

        var subject = userId
            ?? context.Connection.RemoteIpAddress?.ToString()
            ?? "anonymous";

        return policyName + "|" + subject;
    }

    private static string? GetAuthenticatedUserId(HttpContext context)
    {
        var user = context.User;

        if (user?.Identity?.IsAuthenticated != true)
        {
            return null;
        }

        // Identity Bearer использует стандартный NameIdentifier; на случай
        // отличий токена поддерживаем и "sub".
        return user.FindFirst(ClaimTypes.NameIdentifier)?.Value
            ?? user.FindFirst("sub")?.Value;
    }
}
