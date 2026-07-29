namespace Shared.Exceptions
{
    public sealed class InvalidAttachmentException : BadRequestException
    {
        public InvalidAttachmentException(string reason)
            : base($"Invalid attachment: {reason}")
        {
        }
    }
}
