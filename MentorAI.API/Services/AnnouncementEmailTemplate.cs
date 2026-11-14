using System.Net;

namespace MentorAI.API.Services;

/// <summary>
/// Единый HTML-шаблон письма-анонса. Используется и для серверного
/// предпросмотра, и для реальной отправки — чтобы предпросмотр в точности
/// совпадал с тем, что уйдёт получателям.
///
/// Безопасность: заголовок и текст анонса экранируются (WebUtility.HtmlEncode),
/// переносы строк заменяются на &lt;br&gt; уже ПОСЛЕ экранирования. Это исключает
/// XSS/HTML-инъекции в теле письма.
///
/// Ограничение Message-Id: интерфейс IEmailSender.SendAsync(to, subject, htmlBody)
/// не позволяет передать собственный заголовок Message-Id без изменения
/// SmtpEmailSender. EmailDeliveryException/SMTP-провайдер также не дают
/// идемпотентности, поэтому Message-Id здесь не формируется (см. документацию).
/// </summary>
public static class AnnouncementEmailTemplate
{
    public static string BuildHtml(string title, string body)
    {
        var safeTitle = WebUtility.HtmlEncode(title ?? "");

        // экранируем, затем переводим переносы строк в <br> — порядок важен
        var safeBody = WebUtility.HtmlEncode(body ?? "")
            .Replace("\r\n", "\n")
            .Replace("\n", "<br>");

        return $@"<!DOCTYPE html>
<html>
<head><meta charset=""utf-8""><meta name=""viewport"" content=""width=device-width""></head>
<body style=""margin:0;padding:0;background-color:#f5f5f7;font-family:Arial,Helvetica,sans-serif;"">
  <table role=""presentation"" width=""100%"" cellpadding=""0"" cellspacing=""0"" style=""background-color:#f5f5f7;padding:32px 12px;"">
    <tr><td align=""center"">
      <table role=""presentation"" width=""100%"" cellpadding=""0"" cellspacing=""0"" style=""max-width:520px;background-color:#ffffff;border-radius:16px;overflow:hidden;"">
        <tr><td style=""padding:28px 32px 8px;background-color:#0b0b0c;text-align:center;"">
          <span style=""font-size:20px;font-weight:700;color:#ffffff;font-family:Arial,sans-serif;"">Mentor<span style=""color:#1d9bf0;"">AI</span></span>
        </td></tr>
        <tr><td style=""padding:28px 32px 4px;"">
          <h1 style=""margin:0 0 16px;font-size:20px;color:#0f1419;font-family:Arial,sans-serif;"">{safeTitle}</h1>
          <p style=""margin:0 0 24px;font-size:14px;line-height:1.6;color:#536471;font-family:Arial,sans-serif;"">{safeBody}</p>
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
