namespace Shared.Exceptions
{
    public sealed class InvalidReactionException : BadRequestException
    {
        public InvalidReactionException(string reason)
            : base($"Invalid reaction: {reason}")
        {
        }
    }
}
