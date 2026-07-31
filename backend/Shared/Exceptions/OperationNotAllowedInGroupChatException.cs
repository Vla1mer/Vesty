namespace Shared.Exceptions
{
    public sealed class OperationNotAllowedInGroupChatException : BadRequestException
    {
        public OperationNotAllowedInGroupChatException(string action)
            : base($"Operation not allowed in a group chat: {action}.")
        {
        }
    }
}
