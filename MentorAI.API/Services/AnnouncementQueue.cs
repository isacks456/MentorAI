using System.Threading.Channels;

namespace MentorAI.API.Services;

/// <summary>
/// Внутрипроцессная очередь анонсов, ожидающих рассылки.
/// Контроллер кладёт id после захвата рассылки; AnnouncementDispatcher читает.
/// </summary>
public class AnnouncementQueue
{
    private readonly Channel<int> _channel = Channel.CreateUnbounded<int>();

    public void Enqueue(int announcementId) => _channel.Writer.TryWrite(announcementId);

    internal IAsyncEnumerable<int> ReadAllAsync(CancellationToken cancellationToken) =>
        _channel.Reader.ReadAllAsync(cancellationToken);
}
