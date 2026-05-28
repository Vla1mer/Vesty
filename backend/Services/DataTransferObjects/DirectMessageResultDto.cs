namespace Services.DataTransferObjects
{
    public record DirectMessageResultDto
    {
        public ChatDto Chat { get; init; } = null!;
        public MessageDto Message { get; init; } = null!;
    }
}
