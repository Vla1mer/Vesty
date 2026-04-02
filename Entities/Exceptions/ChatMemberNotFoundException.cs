namespace Entities.Exceptions
{
    public sealed class ChatMemberNotFoundException : NotFoundException
    {
        public ChatMemberNotFoundException(int chatId, int userId)
            : base($"The chat member with chatId: {chatId} and userId: {userId} doesn't exist in the database.")
        {
        }
    }
}