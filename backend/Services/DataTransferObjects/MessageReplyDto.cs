namespace Services.DataTransferObjects
{
    public record MessageReplyDto
    {
        public int Id { get; init; }
        public int UserId { get; init; }
        public string? UserName { get; init; }
        public string? Content { get; init; }
    }
}
