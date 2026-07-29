namespace Entities.Models
{
    public class Message : BaseEntity
    {
        public int ChatId { get; set; }
        public int UserId { get; set; }
        public string Content { get; set; } = null!;
        public bool IsEdited { get; set; }
        public int? ReplyToMessageId { get; set; }
        public DateTime? PinnedAt { get; set; }

        public Chat Chat { get; set; } = null!;
        public User User { get; set; } = null!;
        public Message? ReplyToMessage { get; set; }
        public ICollection<MessageReaction> Reactions { get; set; } = [];
        public ICollection<MessageAttachment> Attachments { get; set; } = [];
    }
}
