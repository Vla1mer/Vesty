namespace Shared.Exceptions
{
    public sealed class DirectChatWithSelfException : BadRequestException
    {
        public DirectChatWithSelfException()
            : base("Cannot open a direct chat with yourself.")
        {
        }
    }
}