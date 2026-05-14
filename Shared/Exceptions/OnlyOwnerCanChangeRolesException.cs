namespace Shared.Exceptions
{
    public sealed class OnlyOwnerCanChangeRolesException : ForbiddenException
    {
        public OnlyOwnerCanChangeRolesException(int chatId)
            : base($"Only the owner of chat with id: {chatId} can change member roles.")
        {
        }
    }
}