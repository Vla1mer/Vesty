namespace Services.DataTransferObjects
{
    public record MessagePinnedSignalrDto
    {
        public int ChatId { get; init; }
        public int MessageId { get; init; }
        public DateTime? PinnedAt { get; init; }
    }
}
