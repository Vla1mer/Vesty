namespace Services.DataTransferObjects
{
    public record MessageDeletedSignalrDto
    {
        public int ChatId { get; init; }
        public int MessageId { get; init; }
    }
}
