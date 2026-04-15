namespace Entities.Exceptions
{
    public sealed class UserCollectionBadRequestException : BadRequestException
    {
        public UserCollectionBadRequestException()
            : base("User collection sent from a client is null.") { }
    }
}