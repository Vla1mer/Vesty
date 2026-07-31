namespace Shared.Exceptions
{
    public sealed class BlockNotFoundException : NotFoundException
    {
        public BlockNotFoundException(int userId)
            : base($"User {userId} is not blocked.")
        {
        }
    }
}
