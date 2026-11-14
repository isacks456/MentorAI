using System.Text;
using System.Text.RegularExpressions;

namespace MentorAI.API.Services;

/// <summary>
/// Локальная генерация названия чата по первому сообщению пользователя.
/// Без внешних AI-сервисов: короткая эвристика на русском и английском,
/// которая приводит вводную фразу к естественной форме существительного
/// («помоги подготовиться к собеседованию» → «Подготовка к собеседованию»).
/// </summary>
public static class ChatTitleGenerator
{
    /// <summary>Временное название чата до появления первого сообщения.</summary>
    public const string DefaultTitle = "Новый чат";

    /// <summary>Старое временное название (до этой доработки) — тоже считается плейсхолдером.</summary>
    public const string LegacyDefaultTitle = "Новый диалог";

    private const int MaxTotalWords = 5;

    // Вводные/вежливые слова в начале сообщения, не несущие темы (RU + EN).
    private static readonly HashSet<string> LeadingFillers = new(StringComparer.OrdinalIgnoreCase)
    {
        // RU
        "расскажи", "расскажите", "скажи", "скажите", "подскажи", "подскажите",
        "помоги", "помогите", "объясни", "объясните", "разъясни", "разъясните",
        "напиши", "напишите", "покажи", "покажите", "хочу", "хотел", "хотела", "хотелось",
        "можно", "нужно", "давай", "пожалуйста", "как", "почему", "зачем",
        "какой", "какая", "какие", "чем", "мне", "меня",
        // EN
        "tell", "show", "explain", "help", "please", "can", "could", "would", "you", "me",
        "how", "why", "about", "the", "a", "an", "i", "want", "to", "do", "does",
        "give", "some", "let", "lets"
    };

    // Служебные слова, не несущие смысла (убираются в любом месте).
    private static readonly HashSet<string> StopWords = new(StringComparer.OrdinalIgnoreCase)
    {
        "и", "не", "ни", "ли", "же", "бы", "а", "но", "или", "это", "мой", "моя", "мои",
        "мы", "вы", "он", "она", "они",
        // глаголы-связки, не несущие темы
        "работает", "работают", "работать", "работало",
        // EN
        "of", "the", "a", "an", "and", "or", "is", "are", "was", "were", "be", "works", "work"
    };

    // Связки/предлоги: сохраняются только после смыслового префикса,
    // чтобы не терять падежную связь («Подготовка к собеседованию»).
    private static readonly HashSet<string> Connectives = new(StringComparer.OrdinalIgnoreCase)
    {
        "к", "ко", "для", "по", "о", "об", "обо", "на", "в", "во", "с", "со", "из", "от", "до", "за", "про",
        "for", "of", "to", "in", "on", "with", "about", "from"
    };

    // Инфинитивы/действия → естественный существительный префикс (RU + EN).
    private static readonly Dictionary<string, string> IntentNouns = new(StringComparer.OrdinalIgnoreCase)
    {
        // RU
        ["подготовиться"] = "Подготовка",
        ["подготовить"] = "Подготовка",
        ["подготовлюсь"] = "Подготовка",
        ["готовиться"] = "Подготовка",
        ["изучить"] = "Изучение",
        ["изучать"] = "Изучение",
        ["изучаю"] = "Изучение",
        ["учить"] = "Изучение",
        ["выучить"] = "Изучение",
        ["освоить"] = "Изучение",
        ["разобраться"] = "Разбор",
        ["понять"] = "Разбор",
        ["составить"] = "Создание",
        ["создать"] = "Создание",
        ["сделать"] = "Создание",
        ["сформировать"] = "Создание",
        ["написать"] = "Написание",
        ["настроить"] = "Настройка",
        ["настраивать"] = "Настройка",
        ["установить"] = "Установка",
        ["объяснить"] = "Объяснение",
        ["найти"] = "Поиск",
        ["проверить"] = "Проверка",
        // EN
        ["learn"] = "Learning",
        ["study"] = "Learning",
        ["understand"] = "Learning",
        ["create"] = "Creating",
        ["make"] = "Creating",
        ["build"] = "Creating",
        ["write"] = "Writing",
        ["prepare"] = "Preparing",
        ["setup"] = "Setting up",
        ["configure"] = "Setting up"
    };

    /// <summary>Проверяет, является ли название временным (плейсхолдером).</summary>
    public static bool IsPlaceholderTitle(string? title) =>
        string.IsNullOrWhiteSpace(title)
        || title.Equals(DefaultTitle, StringComparison.OrdinalIgnoreCase)
        || title.Equals(LegacyDefaultTitle, StringComparison.OrdinalIgnoreCase);

    /// <summary>
    /// Проверяет, выглядит ли название осмысленным
    /// (отсекает одиночные символы и «АААААА»-подобный мусор).
    /// </summary>
    public static bool IsMeaningfulTitle(string? title)
    {
        if (string.IsNullOrWhiteSpace(title))
        {
            return false;
        }

        var letters = title.Where(char.IsLetter).ToArray();

        if (letters.Length < 2)
        {
            return false;
        }

        var distinct = letters
            .Select(char.ToLowerInvariant)
            .Distinct()
            .Count();

        return distinct >= 2;
    }

    /// <summary>
    /// Формирует название чата по первому сообщению пользователя.
    /// Возвращает <see cref="DefaultTitle"/>, если текст пустой или не содержит значащих слов.
    /// </summary>
    public static string Generate(string? message)
    {
        if (string.IsNullOrWhiteSpace(message))
        {
            return DefaultTitle;
        }

        var text = Regex.Replace(message.Trim(), @"\s+", " ");
        text = text.Trim(' ', '.', ',', '!', '?', ';', ':', '"', '\'', '«', '»', '(', ')', '[', ']', '…', '-', '—', '/', '\\');

        if (string.IsNullOrWhiteSpace(text))
        {
            return DefaultTitle;
        }

        var words = text
            .Split(' ', StringSplitOptions.RemoveEmptyEntries)
            .Select(StripPunctuation)
            .Where(word => word.Length > 0)
            .ToArray();

        if (words.Length == 0)
        {
            return DefaultTitle;
        }

        // 1. снимаем вводные слова, не задевая начало фразы «что такое» / «what is»
        var i = 0;
        while (i < words.Length
            && LeadingFillers.Contains(words[i])
            && !StartsPhrase(words, i))
        {
            i++;
        }

        // 2. определяем смысловой префикс
        string? prefix = null;
        var j = i;

        if (StartsPhrase(words, j))
        {
            prefix = words[j].Equals("what", StringComparison.OrdinalIgnoreCase) ? "Learning" : "Изучение";
            j += 2;
        }
        else if (j < words.Length && IntentNouns.TryGetValue(words[j], out var noun))
        {
            prefix = noun;
            j += 1;
        }

        // 3. собираем тему
        var topic = new List<string>();
        var total = prefix != null ? 1 : 0;

        for (var k = j; k < words.Length && total < MaxTotalWords; k++)
        {
            var word = words[k];

            if (!word.Any(char.IsLetterOrDigit))
            {
                continue;
            }

            if (Connectives.Contains(word))
            {
                // предлог оставляем только внутри связки с префиксом
                if (prefix != null && (topic.Count == 0 || !Connectives.Contains(topic[^1])))
                {
                    topic.Add(word);
                    total++;
                }

                continue;
            }

            if (StopWords.Contains(word))
            {
                continue;
            }

            topic.Add(word);
            total++;
        }

        // 4. убираем висящие предлоги/служебные слова в конце
        while (topic.Count > 0 && (Connectives.Contains(topic[^1]) || StopWords.Contains(topic[^1])))
        {
            topic.RemoveAt(topic.Count - 1);
        }

        // 5. если темы нет — берём первые значащие слова исходного сообщения
        if (topic.Count == 0)
        {
            prefix = null;

            foreach (var word in words)
            {
                if (!word.Any(char.IsLetterOrDigit)
                    || LeadingFillers.Contains(word)
                    || StopWords.Contains(word)
                    || Connectives.Contains(word))
                {
                    continue;
                }

                topic.Add(word);

                if (topic.Count >= MaxTotalWords)
                {
                    break;
                }
            }
        }

        if (prefix == null && topic.Count == 0)
        {
            return DefaultTitle;
        }

        var parts = new List<string>();

        if (prefix != null)
        {
            parts.Add(prefix);
        }

        parts.AddRange(topic);

        if (parts.Count == 0)
        {
            return DefaultTitle;
        }

        var title = Capitalize(string.Join(' ', parts));

        // отсекаем бессмысленный результат («ААААА», «B») — оставляем временное название
        return IsMeaningfulTitle(title) ? title : DefaultTitle;
    }

    private static bool StartsPhrase(string[] words, int index)
    {
        if (index + 1 >= words.Length)
        {
            return false;
        }

        var first = words[index];
        var second = words[index + 1];

        var ru = first.Equals("что", StringComparison.OrdinalIgnoreCase)
            && second.Equals("такое", StringComparison.OrdinalIgnoreCase);

        var en = first.Equals("what", StringComparison.OrdinalIgnoreCase)
            && second.Equals("is", StringComparison.OrdinalIgnoreCase);

        return ru || en;
    }

    private static string StripPunctuation(string word) =>
        word.Trim('.', ',', '!', '?', ';', ':', '"', '\'', '«', '»', '(', ')', '[', ']', '…');

    private static string Capitalize(string value)
    {
        if (string.IsNullOrEmpty(value))
        {
            return value;
        }

        var first = char.ToUpperInvariant(value[0]);
        var sb = new StringBuilder(value.Length);
        sb.Append(first);
        sb.Append(value, 1, value.Length - 1);

        return sb.ToString();
    }
}
