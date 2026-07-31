namespace Services.DataTransferObjects
{
    public record BlockedUserDto
    {
        public int UserId { get; init; }
        public string UserName { get; init; } = null!;
        public string? Name { get; init; }
        public string? Surname { get; init; }
        public DateTime? AvatarUpdatedAt { get; init; }
        public DateTime CreatedAt { get; init; }
    }
}
