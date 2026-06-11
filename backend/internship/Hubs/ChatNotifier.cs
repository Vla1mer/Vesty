using Microsoft.AspNetCore.SignalR;
using Services.DataTransferObjects;
using Services.Interfaces;

namespace ChatApp.Hubs
{
    public class ChatNotifier : IChatNotifier
    {
        public const string MessageReceived = "MessageReceived";

        private readonly IHubContext<ChatHub> _hubContext;

        public ChatNotifier(IHubContext<ChatHub> hubContext)
        {
            _hubContext = hubContext;
        }

        public async Task MessageReceivedAsync(IEnumerable<int> recipientUserIds, MessageDto message)
        {
            var groups = recipientUserIds.Select(ChatHub.UserGroup).ToList();
            await _hubContext.Clients.Groups(groups).SendAsync(MessageReceived, message);
        }
    }
}
