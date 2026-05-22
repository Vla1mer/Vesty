namespace Shared.Exceptions
{
    public sealed class OperationNotAllowedInPrivateChatException : BadRequestException
    {
        public OperationNotAllowedInPrivateChatException(string action)
            : base($"Operation not allowed in a private (direct) chat: {action}.")
        {
        }
    }
}