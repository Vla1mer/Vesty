namespace Shared.Exceptions
{
    public sealed class FriendshipAlreadyExistsException : ConflictException
    {
        public FriendshipAlreadyExistsException()
            : base("A friend request already exists or you are already friends.")
        {
        }
    }
}
