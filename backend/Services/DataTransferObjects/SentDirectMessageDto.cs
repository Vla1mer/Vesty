namespace Services.DataTransferObjects
{
    public record SentDirectMessageDto
    {
        public int ChatId { get; init; }
        public MessageDto Message { get; init; } = null!;
    }
}
