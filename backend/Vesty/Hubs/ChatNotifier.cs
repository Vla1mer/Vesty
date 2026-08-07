using Microsoft.AspNetCore.SignalR;
using Services.DataTransferObjects;
using Services.Interfaces;

namespace Vesty.Hubs
{
    public class ChatNotifier : IChatNotifier
    {
        public const string MessageReceived = "MessageReceived";
        public const string MessageUpdated = "MessageUpdated";
        public const string MessageDeleted = "MessageDeleted";
        public const string ChatCreated = "ChatCreated";
        public const string ChatDeleted = "ChatDeleted";
        public const string ChatRenamed = "ChatRenamed";
        public const string ChatUpdated = "ChatUpdated";
        public const string MessageReactionsUpdated = "MessageReactionsUpdated";
        public const string MessagePinned = "MessagePinned";
        public const string FriendRequestReceived = "FriendRequestReceived";
        public const string FriendshipAccepted = "FriendshipAccepted";
        public const string FriendshipRemoved = "FriendshipRemoved";
        public const string PresenceChanged = "PresenceChanged";

        private readonly IHubContext<ChatHub> _hubContext;

        public ChatNotifier(IHubContext<ChatHub> hubContext)
        {
            _hubContext = hubContext;
        }

        public Task FriendRequestReceivedAsync(IEnumerable<int> recipientUserIds, FriendDto request) =>
            SendToUsersAsync(recipientUserIds, FriendRequestReceived, request);

        public Task FriendshipAcceptedAsync(IEnumerable<int> recipientUserIds, FriendDto friend) =>
            SendToUsersAsync(recipientUserIds, FriendshipAccepted, friend);

        public Task FriendshipRemovedAsync(IEnumerable<int> recipientUserIds, int byUserId) =>
            SendToUsersAsync(recipientUserIds, FriendshipRemoved, byUserId);

        public Task PresenceChangedAsync(
            IEnumerable<int> recipientUserIds, UserPresenceDto presence) =>
            SendToUsersAsync(recipientUserIds, PresenceChanged, presence);

        public Task MessageReceivedAsync(IEnumerable<int> recipientUserIds, MessageDto message) =>
            SendToUsersAsync(recipientUserIds, MessageReceived, message);

        public Task MessageUpdatedAsync(IEnumerable<int> recipientUserIds, MessageDto message) =>
            SendToUsersAsync(recipientUserIds, MessageUpdated, message);

        public Task MessageDeletedAsync(IEnumerable<int> recipientUserIds, MessageDeletedSignalrDto deleted) =>
            SendToUsersAsync(recipientUserIds, MessageDeleted, deleted);

        public Task ChatCreatedAsync(IEnumerable<int> recipientUserIds, ChatDto chat) =>
            SendToUsersAsync(recipientUserIds, ChatCreated, chat);

        public Task ChatDeletedAsync(IEnumerable<int> recipientUserIds, ChatDeletedSignalrDto deleted) =>
            SendToUsersAsync(recipientUserIds, ChatDeleted, deleted);

        public Task ChatRenamedAsync(IEnumerable<int> recipientUserIds, ChatRenamedSignalrDto renamed) =>
            SendToUsersAsync(recipientUserIds, ChatRenamed, renamed);

        public Task ChatUpdatedAsync(IEnumerable<int> recipientUserIds, ChatUpdatedSignalrDto updated) =>
            SendToUsersAsync(recipientUserIds, ChatUpdated, updated);

        public Task MessageReactionsUpdatedAsync(IEnumerable<int> recipientUserIds, MessageReactionsSignalrDto reactions) =>
            SendToUsersAsync(recipientUserIds, MessageReactionsUpdated, reactions);

        public Task MessagePinnedAsync(IEnumerable<int> recipientUserIds, MessagePinnedSignalrDto pinned) =>
            SendToUsersAsync(recipientUserIds, MessagePinned, pinned);

        private Task SendToUsersAsync(IEnumerable<int> recipientUserIds, string eventName, object payload)
        {
            var groups = recipientUserIds.Select(ChatHub.UserGroup).ToList();
            return _hubContext.Clients.Groups(groups).SendAsync(eventName, payload);
        }
    }
}
