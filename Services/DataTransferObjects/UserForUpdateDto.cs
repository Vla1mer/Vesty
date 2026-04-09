namespace Services.DataTransferObjects
{
    public record UserForUpdateDto
    {
        public string Login { get; init; } = null!;
        public string Password { get; init; } = null!;
        public string? Name { get; init; }
        public string? Surname { get; init; }
        public string? Phone { get; init; }
        public DateOnly? Birthday { get; init; }
    }
}