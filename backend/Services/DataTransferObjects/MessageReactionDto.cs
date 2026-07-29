namespace Services.DataTransferObjects
{
    public record MessageReactionDto
    {
        public string Emoji { get; init; } = string.Empty;
        public IEnumerable<int> UserIds { get; init; } = [];
    }
}
