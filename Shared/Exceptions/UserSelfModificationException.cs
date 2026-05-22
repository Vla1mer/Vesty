namespace Shared.Exceptions
{
    public sealed class UserSelfModificationException : ForbiddenException
    {
        public UserSelfModificationException()
            : base("You can only modify your own account.")
        {
        }
    }
}
