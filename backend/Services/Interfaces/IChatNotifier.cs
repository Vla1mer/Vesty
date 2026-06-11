using Services.DataTransferObjects;

namespace Services.Interfaces
{
    public interface IChatNotifier
    {
        Task MessageReceivedAsync(IEnumerable<int> recipientUserIds, MessageDto message);
        Task MessageUpdatedAsync(IEnumerable<int> recipientUserIds, MessageDto message);
        Task MessageDeletedAsync(IEnumerable<int> recipientUserIds, MessageDeletedDto deleted);
        Task ChatCreatedAsync(IEnumerable<int> recipientUserIds, ChatDto chat);
        Task ChatDeletedAsync(IEnumerable<int> recipientUserIds, ChatDeletedDto deleted);
        Task ChatRenamedAsync(IEnumerable<int> recipientUserIds, ChatRenamedDto renamed);
    }
}
