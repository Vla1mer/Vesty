namespace Entities.Models
{
    public class Chat : BaseEntity
    {
        public string? Name { get; set; }
        public int? CreatorId { get; set; }
        public bool IsPrivate { get; set; }

        public User? Creator { get; set; } = null!;
        public ICollection<ChatMember> ChatMembers { get; set; } = [];
        public ICollection<Message> Messages { get; set; } = [];
    }
}
