namespace Entities.RequestFeatures
{
    public class UserParameters : RequestParameters
    {
        public DateOnly MinBirthday { get; set; } = DateOnly.MinValue;
        public DateOnly MaxBirthday { get; set; } = DateOnly.MaxValue;
        public bool ValidBirthdayRange => MaxBirthday > MinBirthday;
        public string? SearchTerm { get; set; }
    }
}