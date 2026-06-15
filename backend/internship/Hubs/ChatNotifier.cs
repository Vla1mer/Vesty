using Microsoft.AspNetCore.SignalR;
using Services.DataTransferObjects;
using Services.Interfaces;

namespace ChatApp.Hubs
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

        public Task MessageDeletedAsync(IEnumerable<int> recipientUserIds, int chatId, int messageId) =>
            SendToUsersAsync(recipientUserIds, MessageDeleted, chatId, messageId);

        public Task ChatCreatedAsync(IEnumerable<int> recipientUserIds, ChatDto chat) =>
            SendToUsersAsync(recipientUserIds, ChatCreated, chat);

        public Task ChatDeletedAsync(IEnumerable<int> recipientUserIds, int chatId) =>
            SendToUsersAsync(recipientUserIds, ChatDeleted, chatId);

        public Task ChatRenamedAsync(IEnumerable<int> recipientUserIds, int chatId, string name) =>
            SendToUsersAsync(recipientUserIds, ChatRenamed, chatId, name);

        private Task SendToUsersAsync(IEnumerable<int> recipientUserIds, string eventName, params object[] args)
        {
            var groups = recipientUserIds.Select(ChatHub.UserGroup).ToList();
            return _hubContext.Clients.Groups(groups).SendCoreAsync(eventName, args);
        }
    }
}
