namespace Entities.Models
{
    public class MessageAttachment : BaseEntity
    {
        public int? MessageId { get; set; }
        public int UserId { get; set; }
        public string StorageKey { get; set; } = string.Empty;
        public string FileName { get; set; } = string.Empty;
        public string ContentType { get; set; } = string.Empty;
        public long SizeInBytes { get; set; }

        public Message? Message { get; set; }
        public User User { get; set; } = null!;
    }
}
