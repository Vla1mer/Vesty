namespace internship.Models
{
    public class Message : BaseEntity
    {
        public int ChatId { get; set; }
        public int UserId { get; set; }
        public string Content { get; set; } = null!;

        public Chat Chat { get; set; } = null!;
        public User User { get; set; } = null!;
    }
}
