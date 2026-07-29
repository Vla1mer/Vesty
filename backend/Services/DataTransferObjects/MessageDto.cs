namespace Services.DataTransferObjects
{
    public record MessageDto
    {
        public int Id { get; init; }
        public int ChatId { get; init; }
        public int UserId { get; init; }
        public string? UserName { get; init; }
        public string? Content { get; init; }
        public DateTime CreatedAt { get; init; }
        public bool IsEdited { get; init; }
        public MessageReplyDto? ReplyTo { get; init; }
        public DateTime? PinnedAt { get; init; }
        public IEnumerable<MessageReactionDto> Reactions { get; init; } = [];
        public IEnumerable<MessageAttachmentDto> Attachments { get; init; } = [];
    }
}