using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.SignalR;

namespace ChatApp.Hubs
{
    [Authorize]
    public class ChatHub : Hub
    {
        public static string UserGroup(int userId) => $"user-{userId}";

        public override async Task OnConnectedAsync()
        {
            await Groups.AddToGroupAsync(Context.ConnectionId, CurrentUserGroup());
            await base.OnConnectedAsync();
        }

        public override async Task OnDisconnectedAsync(Exception? exception)
        {
            await Groups.RemoveFromGroupAsync(Context.ConnectionId, CurrentUserGroup());
            await base.OnDisconnectedAsync(exception);
        }

        private string CurrentUserGroup()
        {
            var userId = int.Parse(Context.User!.FindFirst(ClaimTypes.NameIdentifier)!.Value);
            return UserGroup(userId);
        }
    }
}
