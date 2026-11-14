namespace MentorAI.API.Services;

/// <summary>
/// Настройки системы анонсов и рассылки. Значения читаются из конфигурации
/// (User Secrets / переменные окружения, секция Announcement). В публичный
/// appsettings.json ключи не добавляются.
/// </summary>
public class AnnouncementOptions
{
    /// <summary>Сколько получателей берётся за один батч.</summary>
    public int BatchSize { get; set; } = 25;

    /// <summary>Пауза между письмами (мс) — ограничение скорости рассылки.</summary>
    public int SendDelayMilliseconds { get; set; } = 300;

    /// <summary>Максимум одновременных отправок. По умолчанию 1 (безопасно для SQLite).</summary>
    public int MaxConcurrency { get; set; } = 1;

    /// <summary>Максимум попыток отправки для «достоверно не доставленных» писем.</summary>
    public int MaxAttempts { get; set; } = 3;

    /// <summary>Базовая пауза экспоненциального backoff между повторами (сек).</summary>
    public int RetryBackoffSeconds { get; set; } = 5;

    /// <summary>На сколько минут «живёт» попытка получателя (Processing), прежде чем стать Undefined.</summary>
    public int ProcessingLeaseMinutes { get; set; } = 5;

    /// <summary>На сколько минут «живёт» владение рассылкой (heartbeat).</summary>
    public int ClaimLeaseMinutes { get; set; } = 10;

    /// <summary>Автоматически продолжать незавершённые рассылки при старте приложения.</summary>
    public bool AutoResumeOnStartup { get; set; } = false;

    /// <summary>Список тестовых получателей. Пустой список запрещает тестовую отправку.</summary>
    public string[] TestRecipients { get; set; } = Array.Empty<string>();

    /// <summary>Жёсткий предел на количество тестовых адресов (чтобы тест не стал рассылкой).</summary>
    public int MaxTestRecipients { get; set; } = 5;
}
