namespace Entities.Exceptions
{
    public sealed class MaxCreatedAtRangeBadRequestException : BadRequestException
    {
        public MaxCreatedAtRangeBadRequestException()
            : base("MaxCreatedAt cannot be less than MinCreatedAt.")
        {
        }
    }
}