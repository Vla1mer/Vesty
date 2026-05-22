namespace Shared.Exceptions
{
    public sealed class ChatAccessDeniedException : ForbiddenException
    {
        public ChatAccessDeniedException(int chatId, int userId)
            : base($"User with id: {userId} is not a member of chat with id: {chatId}.")
        {
        }
    }
}