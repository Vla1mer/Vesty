namespace Shared.Exceptions
{
    public sealed class FriendshipNotFoundException : NotFoundException
    {
        public FriendshipNotFoundException(int userId)
            : base($"No friendship or request with user {userId}.")
        {
        }
    }
}
