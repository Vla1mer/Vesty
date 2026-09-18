namespace Shared.Exceptions
{
    public sealed class AccountLockedException : Exception
    {
        public AccountLockedException()
            : base("Too many failed attempts. Try again in a few minutes.")
        {
        }
    }
}
