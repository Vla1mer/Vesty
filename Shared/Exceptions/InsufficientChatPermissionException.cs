namespace Shared.Exceptions
{
    public sealed class InsufficientChatPermissionException : ForbiddenException
    {
        public InsufficientChatPermissionException(string action, int chatId)
            : base($"You do not have permission to {action} in chat with id: {chatId}.")
        {
        }
    }
}