namespace Shared.Exceptions
{
    public sealed class ProfileUpdateBadRequestException : BadRequestException
    {
        public ProfileUpdateBadRequestException(string reason) : base(reason) { }
    }
}
