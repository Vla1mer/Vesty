namespace Shared.Exceptions
{
    public sealed class InviteNotFoundException : NotFoundException
    {
        public InviteNotFoundException()
            : base("This invite link is no longer valid.")
        {
        }
    }
}
