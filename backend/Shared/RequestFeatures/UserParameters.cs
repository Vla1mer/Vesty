namespace Shared.RequestFeatures
{
    public class UserParameters : RequestParameters
    {
        public UserParameters() => OrderBy = "UserName";

        public DateOnly MinBirthday { get; set; } = DateOnly.MinValue;
        public DateOnly MaxBirthday { get; set; } = DateOnly.MaxValue;
        public bool ValidBirthdayRange => MaxBirthday > MinBirthday;
        public bool? HasPhone { get; set; }
        public string? SearchTerm { get; set; }
        public IReadOnlyCollection<int> ExcludedUserIds { get; set; } = [];
    }
}