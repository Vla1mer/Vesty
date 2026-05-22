namespace Services.DataTransferObjects
{
    public record MessageDto
    {
        public int Id { get; init; }
        public int ChatId { get; init; }
        public int UserId { get; init; }
        public string? Content { get; init; }
        public DateTime CreatedAt { get; init; }
    }
}