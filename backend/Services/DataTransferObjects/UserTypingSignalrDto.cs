namespace Services.DataTransferObjects
{
    public record UserTypingSignalrDto
    {
        public int ChatId { get; init; }
        public int UserId { get; init; }
        public string UserName { get; init; }
    }
}
