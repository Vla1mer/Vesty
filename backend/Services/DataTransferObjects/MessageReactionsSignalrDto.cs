namespace Services.DataTransferObjects
{
    public record MessageReactionsSignalrDto
    {
        public int ChatId { get; init; }
        public int MessageId { get; init; }
        public IEnumerable<MessageReactionDto> Reactions { get; init; } = [];
    }
}
