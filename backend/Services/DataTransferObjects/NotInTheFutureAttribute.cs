using System.ComponentModel.DataAnnotations;

namespace Services.DataTransferObjects
{
    public sealed class NotInTheFutureAttribute : ValidationAttribute
    {
        private static readonly TimeSpan TimeZoneAllowance = TimeSpan.FromDays(1);

        public override bool IsValid(object? value) =>
            value is not DateOnly date || date <= DateOnly.FromDateTime(DateTime.UtcNow + TimeZoneAllowance);
    }
}
