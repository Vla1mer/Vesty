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

        private readonly IHubContext<ChatHub> _hubContext;

        public ChatNotifier(IHubContext<ChatHub> hubContext)
        {
            _hubContext = hubContext;
        }

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

        private Task SendToUsersAsync(IEnumerable<int> recipientUserIds, string eventName, object payload)
        {
            var groups = recipientUserIds.Select(ChatHub.UserGroup).ToList();
            return _hubContext.Clients.Groups(groups).SendAsync(eventName, payload);
        }
    }
}
