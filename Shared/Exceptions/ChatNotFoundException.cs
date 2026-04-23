namespace Shared.Exceptions
{
    public sealed class ChatNotFoundException : NotFoundException
    {
        public ChatNotFoundException(int id)
            : base($"The chat with id: {id} doesn't exist in the database.")
        {
        }
    }
}