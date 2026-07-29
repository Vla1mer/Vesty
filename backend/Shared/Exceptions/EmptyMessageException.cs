namespace Shared.Exceptions
{
    public sealed class EmptyMessageException : BadRequestException
    {
        public EmptyMessageException()
            : base("A message must contain text or at least one attachment.")
        {
        }
    }
}
