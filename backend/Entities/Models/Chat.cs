namespace Entities.Models
{
    public class Chat : BaseEntity
    {
        public string? Name { get; set; }
        public string? Description { get; set; }
        public int? CreatorId { get; set; }
        public bool IsPrivate { get; set; }
        public DateTime? AvatarUpdatedAt { get; set; }

        public int WhoCanInvite { get; set; } = ChatPermission.Admins;
        public int WhoCanEdit { get; set; } = ChatPermission.Admins;
        public int WhoCanPost { get; set; } = ChatPermission.Members;

        public ChatAvatar? Avatar { get; set; }
        public User? Creator { get; set; } = null!;
        public ICollection<ChatMember> ChatMembers { get; set; } = [];
        public ICollection<Message> Messages { get; set; } = [];
    }
}
