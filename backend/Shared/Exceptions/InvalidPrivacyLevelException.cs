namespace Shared.Exceptions
{
    public sealed class InvalidPrivacyLevelException : BadRequestException
    {
        public InvalidPrivacyLevelException()
            : base("Privacy level must be 1 (everyone), 2 (friends only) or 3 (nobody).")
        {
        }
    }
}
