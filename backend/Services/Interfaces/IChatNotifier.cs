using Services.DataTransferObjects;

namespace Services.Interfaces
{
    public interface IChatNotifier
    {
        Task MessageReceivedAsync(IEnumerable<int> recipientUserIds, MessageDto message);
        Task MessageUpdatedAsync(IEnumerable<int> recipientUserIds, MessageDto message);
        Task MessageDeletedAsync(IEnumerable<int> recipientUserIds, MessageDeletedSignalrDto deleted);
        Task ChatCreatedAsync(IEnumerable<int> recipientUserIds, ChatDto chat);
        Task ChatDeletedAsync(IEnumerable<int> recipientUserIds, ChatDeletedSignalrDto deleted);
        Task ChatRenamedAsync(IEnumerable<int> recipientUserIds, ChatRenamedSignalrDto renamed);
        Task ChatUpdatedAsync(IEnumerable<int> recipientUserIds, ChatUpdatedSignalrDto updated);
        Task MessageReactionsUpdatedAsync(IEnumerable<int> recipientUserIds, MessageReactionsSignalrDto reactions);
        Task MessagePinnedAsync(IEnumerable<int> recipientUserIds, MessagePinnedSignalrDto pinned);
        Task FriendRequestReceivedAsync(IEnumerable<int> recipientUserIds, FriendDto request);
        Task FriendshipAcceptedAsync(IEnumerable<int> recipientUserIds, FriendDto friend);
        Task FriendshipRemovedAsync(IEnumerable<int> recipientUserIds, int byUserId);
        Task PresenceChangedAsync(IEnumerable<int> recipientUserIds, UserPresenceDto presence);
    }
}
