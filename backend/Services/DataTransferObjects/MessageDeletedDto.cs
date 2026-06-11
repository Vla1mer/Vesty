namespace Services.DataTransferObjects
{
    public record MessageDeletedDto
    {
        public int ChatId { get; init; }
        public int MessageId { get; init; }
    }
}
