namespace Shared.Exceptions
{
    public sealed class FriendshipWithSelfException : BadRequestException
    {
        public FriendshipWithSelfException()
            : base("Cannot send a friend request to yourself.")
        {
        }
    }
}
