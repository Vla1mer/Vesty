namespace Services.DataTransferObjects
{
    public record ChatInviteDto
    {
        public string Code { get; init; } = null!;
        public DateTime? ExpiresAt { get; init; }
        public DateTime CreatedAt { get; init; }
    }

    public record ChatInviteForCreationDto
    {
        public int? ExpiresInDays { get; init; }
    }

    public record ChatInvitePreviewDto
    {
        public int ChatId { get; init; }
        public string? Name { get; init; }
        public string? Description { get; init; }
        public int MemberCount { get; init; }
        public DateTime? AvatarUpdatedAt { get; init; }
        public bool AlreadyMember { get; init; }
    }
}
