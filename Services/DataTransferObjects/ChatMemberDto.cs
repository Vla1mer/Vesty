namespace Services.DataTransferObjects
{
    public record ChatMemberDto
    {
        public int ChatId { get; init; }
        public int UserId { get; init; }
        public DateTime CreatedAt { get; init; }
    }
}