namespace Shared.Exceptions
{
    public sealed class InvalidInviteExpiryException : BadRequestException
    {
        public InvalidInviteExpiryException(int days)
            : base($"Invite lifetime must be between 1 and 365 days, got {days}.")
        {
        }
    }
}
