namespace internship.Models
{
    public class ChatMember : BaseEntity
    {
        public int ChatId { get; set; }
        public int UserId { get; set; }

        public Chat Chat { get; set; } = null!;
        public User User { get; set; } = null!;
    }
}
