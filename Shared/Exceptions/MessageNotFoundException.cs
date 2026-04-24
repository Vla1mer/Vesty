namespace Shared.Exceptions
{
    public sealed class MessageNotFoundException : NotFoundException
    {
        public MessageNotFoundException(int id)
            : base($"The message with id: {id} doesn't exist in the database.")
        {
        }
    }
}