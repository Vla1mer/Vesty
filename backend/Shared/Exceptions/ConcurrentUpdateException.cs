namespace Shared.Exceptions
{
    public sealed class ConcurrentUpdateException : Exception
    {
        public ConcurrentUpdateException()
            : base("The request could not be completed due to a concurrent update. Please retry.")
        {
        }
    }
}
