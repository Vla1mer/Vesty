namespace Shared.Exceptions
{
    public sealed class DuplicateResourceException : ConflictException
    {
        public DuplicateResourceException()
            : base("The resource was already created by another request. Please retry.")
        {
        }
    }
}
