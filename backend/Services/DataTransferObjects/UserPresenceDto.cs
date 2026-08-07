namespace Services.DataTransferObjects
{
    public record UserPresenceDto
    {
        public int UserId { get; init; }
        public bool IsOnline { get; init; }
        public DateTime? LastSeenAt { get; init; }
    }
}
