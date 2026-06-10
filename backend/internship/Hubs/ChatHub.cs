using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.SignalR;

namespace ChatApp.Hubs
{
    [Authorize]
    public class ChatHub : Hub
    {
        public override async Task OnConnectedAsync()
        {
            await Groups.AddToGroupAsync(Context.ConnectionId, GetUserGroup());
            await base.OnConnectedAsync();
        }

        public override async Task OnDisconnectedAsync(Exception? exception)
        {
            await Groups.RemoveFromGroupAsync(Context.ConnectionId, GetUserGroup());
            await base.OnDisconnectedAsync(exception);
        }

        private string GetUserGroup()
        {
            var userId = Context.User!.FindFirst(ClaimTypes.NameIdentifier)!.Value;
            return $"user-{userId}";
        }
    }
}
