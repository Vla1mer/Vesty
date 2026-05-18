namespace Entities.Models
{
    public class ChatMember : BaseEntity
    {
        public int ChatId { get; set; }
        public int UserId { get; set; }
        public int RoleId { get; set; } = UserRole.User;

        public Chat Chat { get; set; } = null!;
        public User User { get; set; } = null!;
        public UserRole Role { get; set; } = null!;
    }
}
