namespace Shared.Exceptions
{
    public sealed class PrivacyRestrictedException : ForbiddenException
    {
        public PrivacyRestrictedException(string action)
            : base($"This user does not allow {action}.")
        {
        }
    }
}
