namespace Shared.Exceptions
{
    public sealed class InvalidRoleAssignmentException : BadRequestException
    {
        public InvalidRoleAssignmentException(string reason)
            : base(reason)
        {
        }
    }
}