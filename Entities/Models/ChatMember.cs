namespace Entities.Models
{
    public class ChatMember : BaseEntity
    {
        public int ChatId { get; set; }
        public int UserId { get; set; }
        public int RoleId { get; set; } = ChatRoleIds.User;

        public Chat Chat { get; set; } = null!;
        public User User { get; set; } = null!;
        public ChatRole Role { get; set; } = null!;
    }
}
