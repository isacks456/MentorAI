using MailKit.Net.Smtp;
using MailKit.Security;
using System.Net.Sockets;

namespace MentorAI.API.Services;

/// <summary>
/// Итог классификации SMTP-ошибки для одного получателя.
/// </summary>
public enum SmtpFailureKind
{
    /// <summary>Достоверно известно, что SMTP-сервер письмо НЕ принял (отказ на
    /// конверте/команде до/на передаче тела, транзитный 4xx-отказ). Повтор безопасен.</summary>
    DefinitelyNotDelivered,

    /// <summary>Постоянный отказ SMTP (5xx, неверный адрес, отказ авторизации).
    /// Повторять бессмысленно — письмо не уйдёт.</summary>
    PermanentFailure,

    /// <summary>Результат неизвестен: обрыв соединения/таймаут/протокольная ошибка
    /// без чистого ответа. Возможно, письмо принято. Автоматически НЕ повторяем.</summary>
    Undefined
}

/// <summary>
/// Классифицирует EmailDeliveryException на «достоверно не доставлено»,
/// «постоянный отказ» и «неопределённый результат» — по InnerException, которое
/// SmtpEmailSender прокидывает из MailKit. Сам SmtpEmailSender не изменяется.
///
/// Важно: EmailDeliveryException сам по себе НЕ доказывает недоставку — сервер
/// мог принять письмо и оборвать соединение до подтверждения. Повтор разрешён
/// только для явных досендовых отказов SMTP.
///
/// Примечание: enum MailKit.Net.Smtp.SmtpErrorCode содержит 4 члена —
/// MessageNotAccepted, SenderNotAccepted, RecipientNotAccepted, UnexpectedStatusCode.
/// </summary>
public static class SmtpFailureClassifier
{
    public static SmtpFailureKind Classify(EmailDeliveryException exception)
    {
        var inner = exception.InnerException;

        // нет внутренней причины — доказать недоставку нельзя
        if (inner == null)
        {
            return SmtpFailureKind.Undefined;
        }

        return inner switch
        {
            // Явный ответ SMTP-сервера на команду.
            SmtpCommandException command => ClassifyCommand(command),

            // Ошибка аутентификации: до отправки, письмо точно не ушло,
            // но это проблема конфигурации — повтор бессмысленен.
            AuthenticationException => SmtpFailureKind.PermanentFailure,

            // Протокольная ошибка: чистого ответа нет — результат неопределён.
            SmtpProtocolException => SmtpFailureKind.Undefined,

            // Обрыв соединения / таймаут: фаза неизвестна — результат неопределён.
            SocketException => SmtpFailureKind.Undefined,
            IOException => SmtpFailureKind.Undefined,
            TimeoutException => SmtpFailureKind.Undefined,
            OperationCanceledException => SmtpFailureKind.Undefined,

            // всё прочее доказать нельзя
            _ => SmtpFailureKind.Undefined
        };
    }

    private static SmtpFailureKind ClassifyCommand(SmtpCommandException command)
    {
        // Отказ на этапе конверта (MAIL FROM / RCPT TO) — тело ещё не передавалось,
        // письмо достоверно не принято.
        if (command.ErrorCode is SmtpErrorCode.SenderNotAccepted
            or SmtpErrorCode.RecipientNotAccepted)
        {
            return SmtpFailureKind.DefinitelyNotDelivered;
        }

        // Сервер не принял сообщение после передачи тела (например, нет места).
        // Письмо не принято — можно повторить.
        if (command.ErrorCode is SmtpErrorCode.MessageNotAccepted)
        {
            return SmtpFailureKind.DefinitelyNotDelivered;
        }

        // Прочие явные ответы различаем по коду: 4xx — транзитный (не принято,
        // можно повторить), 5xx — постоянный (повтор бессмысленен).
        var status = (int)command.StatusCode;

        if (status >= 500)
        {
            return SmtpFailureKind.PermanentFailure;
        }

        if (status >= 400)
        {
            return SmtpFailureKind.DefinitelyNotDelivered;
        }

        // Неожиданный/нетипичный код без ясного класса — не рискуем, считаем неопределённым.
        return SmtpFailureKind.Undefined;
    }
}
