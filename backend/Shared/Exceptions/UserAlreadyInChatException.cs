namespace Shared.Exceptions
{
    public sealed class UserAlreadyInChatException : BadRequestException
    {
        public UserAlreadyInChatException(int chatId, int userId)
            : base($"User with id: {userId} is already a member of chat with id: {chatId}.")
        {
        }
    }
}