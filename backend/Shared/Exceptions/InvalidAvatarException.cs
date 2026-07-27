namespace Shared.Exceptions
{
    public sealed class InvalidAvatarException : BadRequestException
    {
        public InvalidAvatarException(string reason)
            : base($"Invalid avatar: {reason}")
        {
        }
    }
}
