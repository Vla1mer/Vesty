using Services.DataTransferObjects;

namespace Services.Interfaces
{
    public interface IChatNotifier
    {
        Task MessageReceivedAsync(IEnumerable<int> recipientUserIds, MessageDto message);
        Task MessageUpdatedAsync(IEnumerable<int> recipientUserIds, MessageDto message);
        Task MessageDeletedAsync(IEnumerable<int> recipientUserIds, int chatId, int messageId);
        Task ChatCreatedAsync(IEnumerable<int> recipientUserIds, ChatDto chat);
        Task ChatDeletedAsync(IEnumerable<int> recipientUserIds, int chatId);
        Task ChatRenamedAsync(IEnumerable<int> recipientUserIds, int chatId, string name);
    }
}
