namespace Shared.Exceptions
{
    public sealed class IdParametersBadRequestException : BadRequestException
    {
        public IdParametersBadRequestException() : base("The ids must be a comma-separated list of numbers.") { }
    }
}