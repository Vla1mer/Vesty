namespace Shared.Exceptions
{
    public sealed class MessageOwnershipException : ForbiddenException
    {
        public MessageOwnershipException(int messageId)
            : base($"You are not allowed to modify message with id: {messageId} because you are not its author.")
        {
        }
    }
}