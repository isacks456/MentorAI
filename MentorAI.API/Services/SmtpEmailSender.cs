using System.Security;
using MailKit.Net.Smtp;
using MailKit.Security;
using Microsoft.Extensions.Options;
using MimeKit;

namespace MentorAI.API.Services;

public interface IEmailSender
{
    /// <summary>
    /// true — письмо отправлено (или выведено в консоль в Development-режиме).
    /// false — SMTP не настроен, письмо не отправлялось.
    /// </summary>
    /// <exception cref="EmailDeliveryException">SMTP настроен, но отправка завершилась ошибкой.</exception>
    Task<bool> SendAsync(string to, string subject, string htmlBody);
}

public class EmailDeliveryException : Exception
{
    public EmailDeliveryException(string message, Exception? inner = null) : base(message, inner) { }
}

public class SmtpOptions
{
    public string Host { get; set; } = "";
    public int Port { get; set; } = 587;
    public string User { get; set; } = "";
    public string Password { get; set; } = "";
    public string From { get; set; } = "";
    public bool UseSsl { get; set; } = true;

    /// <summary>
    /// Только для Development: если SMTP не настроен, выводить код в консоль.
    /// В Production этот флаг игнорируется и код нигде не печатается.
    /// </summary>
    public bool DevEcho { get; set; }
}

public class SmtpEmailSender : IEmailSender
{
    private readonly SmtpOptions _options;
    private readonly ILogger<SmtpEmailSender> _logger;
    private readonly IHostEnvironment _environment;

    public SmtpEmailSender(IOptions<SmtpOptions> options, ILogger<SmtpEmailSender> logger, IHostEnvironment environment)
    {
        _options = options.Value;
        _logger = logger;
        _environment = environment;
    }

    public bool IsConfigured => !string.IsNullOrWhiteSpace(_options.Host);

    public async Task<bool> SendAsync(string to, string subject, string htmlBody)
    {
        // Development без настроенного SMTP: безопасный вывод в консоль,
        // чтобы можно было тестировать подтверждение. В Production отключено.
        if (!IsConfigured)
        {
            if (_options.DevEcho && _environment.IsDevelopment())
            {
                _logger.LogWarning(
                    "[DEV ONLY] SMTP не настроен — содержимое письма для {To} выведено в консоль:\nSubject: {Subject}\n{Body}",
                    to, subject, htmlBody);

                return true;
            }

            return false;
        }

        try
        {
            var message = new MimeMessage();

            message.From.Add(MailboxAddress.Parse(_options.From));
            message.To.Add(MailboxAddress.Parse(to));
            message.Subject = subject;
            message.Body = new BodyBuilder { HtmlBody = htmlBody }.ToMessageBody();

            using var client = new SmtpClient();

            await client.ConnectAsync(_options.Host, _options.Port, SecureSocketOptions.StartTlsWhenAvailable);
            await client.AuthenticateAsync(_options.User, _options.Password);
            await client.SendAsync(new SmtpSendRequest(message));
            await client.DisconnectAsync(true);

            return true;
        }
        catch (Exception ex) when (ex is not EmailDeliveryException)
        {
            // не раскрываем детали SMTP-сервера наружу
            _logger.LogError(ex, "Ошибка отправки письма на {To}", to);
            throw new EmailDeliveryException("Не удалось отправить письмо", ex);
        }
    }
}
