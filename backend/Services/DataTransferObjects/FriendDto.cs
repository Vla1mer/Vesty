namespace Services.DataTransferObjects
{
    public record FriendDto
    {
        public int UserId { get; init; }
        public string UserName { get; init; } = null!;
        public string? Name { get; init; }
        public string? Surname { get; init; }
        public DateTime? AvatarUpdatedAt { get; init; }
        public int Status { get; init; }
        public bool IsIncoming { get; init; }
        public DateTime CreatedAt { get; init; }
    }
}
