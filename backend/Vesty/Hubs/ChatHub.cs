using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.SignalR;
using Services.DataTransferObjects;
using Services.Interfaces;

namespace Vesty.Hubs
{
    [Authorize]
    public class ChatHub : Hub
    {
        public const string UserTyping = "UserTyping";

        private readonly IServiceManager _service;
        private readonly IPresenceTracker _presence;

        public ChatHub(IServiceManager service, IPresenceTracker presence)
        {
            _service = service;
            _presence = presence;
        }

        public static string UserGroup(int userId) => $"user-{userId}";

        public override async Task OnConnectedAsync()
        {
            await Groups.AddToGroupAsync(Context.ConnectionId, CurrentUserGroup());
            if (_presence.Connect(CurrentUserId()))
                await _service.Presence.AnnouncePresenceAsync(CurrentUserId(), isOnline: true);
            await base.OnConnectedAsync();
        }

        public override async Task OnDisconnectedAsync(Exception? exception)
        {
            var userId = CurrentUserId();
            await Groups.RemoveFromGroupAsync(Context.ConnectionId, CurrentUserGroup());

            if (_presence.Disconnect(userId))
            {
                await _service.Presence.RecordLastSeenAsync(userId);

                if (!_presence.IsOnline(userId))
                    await _service.Presence.AnnouncePresenceAsync(userId, isOnline: false);
            }

            await base.OnDisconnectedAsync(exception);
        }

        public async Task Typing(int chatId)
        {
            var userId = CurrentUserId();
            var recipients = (await _service.ChatMember.GetTypingRecipientsAsync(chatId, userId)).ToList();
            if (recipients.Count == 0)
                return;

            var payload = new UserTypingSignalrDto
            {
                ChatId = chatId,
                UserId = userId,
                UserName = Context.User!.FindFirst(ClaimTypes.Name)?.Value ?? string.Empty
            };
            await Clients.Groups(recipients.Select(UserGroup).ToList()).SendAsync(UserTyping, payload);
        }

        private int CurrentUserId() =>
            int.Parse(Context.User!.FindFirst(ClaimTypes.NameIdentifier)!.Value);

        private string CurrentUserGroup() => UserGroup(CurrentUserId());
    }
}
