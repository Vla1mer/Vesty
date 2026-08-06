namespace Services.DataTransferObjects
{
    public record UserDto
    {
        public int Id { get; init; }
        public string? UserName { get; init; }
        public string? Name { get; init; }
        public string? Surname { get; init; }
        public string? Phone { get; init; }
        public DateTime? AvatarUpdatedAt { get; init; }
        public bool IsProfileHidden { get; init; }
    }
}