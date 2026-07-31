namespace Shared.Exceptions
{
    public sealed class BlockedUserException : ForbiddenException
    {
        public BlockedUserException()
            : base("You cannot interact with this user.")
        {
        }
    }
}
