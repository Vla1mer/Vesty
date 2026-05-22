namespace Shared.Exceptions
{
    public sealed class UserNotFoundException : NotFoundException
    {
        public UserNotFoundException(int id)
            : base($"The user with id: {id} doesn't exist in the database.")
        {
        }
    }
}