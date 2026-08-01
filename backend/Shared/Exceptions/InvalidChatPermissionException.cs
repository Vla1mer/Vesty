namespace Shared.Exceptions
{
    public sealed class InvalidChatPermissionException : BadRequestException
    {
        public InvalidChatPermissionException(int value)
            : base($"Unknown chat permission level: {value}.")
        {
        }
    }
}
