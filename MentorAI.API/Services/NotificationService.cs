using MentorAI.API.Data;
using MentorAI.API.Models;
using Microsoft.EntityFrameworkCore;

namespace MentorAI.API.Services;

public enum NotificationKind
{
    Progress,
    Reminders,
    News
}

/// <summary>
/// Единая точка доставки уведомлений. Любая будущая отправка
/// (прогресс, напоминания, новости) должна идти через этот сервис:
/// он учитывает подтверждённость почты и предпочтения конкретного пользователя.
/// </summary>
public class NotificationService
{
    private readonly ApplicationDbContext _context;
    private readonly IEmailSender _emailSender;
    private readonly ILogger<NotificationService> _logger;

    public NotificationService(
        ApplicationDbContext context,
        IEmailSender emailSender,
        ILogger<NotificationService> logger)
    {
        _context = context;
        _emailSender = emailSender;
        _logger = logger;
    }

    /// <summary>
    /// Проверяет, разрешена ли почтовая доставка для пользователя:
    /// почта должна быть подтверждена и соответствующий тип уведомлений включён.
    /// </summary>
    public async Task<NotificationGate> CheckGateAsync(string userId, NotificationKind kind)
    {
        var user = await _context.Users.FirstOrDefaultAsync(u => u.Id == userId);

        if (user == null)
        {
            return NotificationGate.Block("Пользователь не найден");
        }

        if (!user.EmailConfirmed)
        {
            // неподтверждённой почте обычные уведомления не отправляются
            return NotificationGate.Block("Почта не подтверждена");
        }

        var prefs = await _context.NotificationPreferences
            .FirstOrDefaultAsync(p => p.ApplicationUserId == userId);

        // общий выключатель email-доставки
        if (prefs != null && !prefs.EmailNotifications)
        {
            return NotificationGate.Block("Email-уведомления отключены пользователем");
        }

        var typeEnabled = kind switch
        {
            NotificationKind.Progress => prefs == null || prefs.ProgressNotifications,
            NotificationKind.Reminders => prefs == null || prefs.LessonReminders,
            NotificationKind.News => prefs == null || prefs.NewsUpdates,
            _ => false
        };

        if (!typeEnabled)
        {
            return NotificationGate.Block($"Тип уведомлений {kind} отключён пользователем");
        }

        return NotificationGate.Allow();
    }

    /// <summary>
    /// Отправка почтового уведомления с учётом всех проверок.
    /// События-триггеры (достижения, напоминания) в проекте пока отсутствуют,
    /// поэтому метод предназначен для подключения будущих событий.
    /// </summary>
    public async Task<NotificationDeliveryResult> SendEmailNotificationAsync(
        string userId, NotificationKind kind, string subject, string htmlBody)
    {
        var gate = await CheckGateAsync(userId, kind);

        if (!gate.Allowed)
        {
            _logger.LogInformation("Доставка уведомления {Kind} пользователю {UserId} заблокирована: {Reason}",
                kind, userId, gate.Reason);

            return NotificationDeliveryResult.SkippedNow(gate.Reason!);
        }

        var user = await _context.Users.FirstAsync(u => u.Id == userId);

        try
        {
            var sent = await _emailSender.SendAsync(user.Email ?? "", subject, htmlBody);

            return sent
                ? NotificationDeliveryResult.Success()
                : NotificationDeliveryResult.SkippedNow("Почтовый сервис не настроен");
        }
        catch (EmailDeliveryException)
        {
            // ошибки SMTP логируются в SmtpEmailSender без деталей наружу
            return NotificationDeliveryResult.Failed("Ошибка почтового сервиса");
        }
    }
}

public class NotificationGate
{
    public bool Allowed { get; private set; }
    public string? Reason { get; private set; }

    public static NotificationGate Allow() => new() { Allowed = true };
    public static NotificationGate Block(string reason) => new() { Allowed = false, Reason = reason };
}

public class NotificationDeliveryResult
{
    public bool Delivered { get; private set; }
    public bool Skipped { get; private set; }
    public string? Reason { get; private set; }

    public static NotificationDeliveryResult Success() => new() { Delivered = true };
    public static NotificationDeliveryResult SkippedNow(string reason) => new() { Skipped = true, Reason = reason };
    public static NotificationDeliveryResult Failed(string reason) => new() { Skipped = true, Reason = reason };
}

