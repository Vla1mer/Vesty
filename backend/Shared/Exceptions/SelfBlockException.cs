namespace Shared.Exceptions
{
    public sealed class SelfBlockException : BadRequestException
    {
        public SelfBlockException()
            : base("Cannot block yourself.")
        {
        }
    }
}
