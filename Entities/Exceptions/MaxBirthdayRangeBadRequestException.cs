namespace Entities.Exceptions
{
    public sealed class MaxBirthdayRangeBadRequestException : BadRequestException
    {
        public MaxBirthdayRangeBadRequestException()
            : base("MaxBirthday cannot be less than MinBirthday.")
        {
        }
    }
}