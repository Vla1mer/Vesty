namespace Entities.Models
{
    public class UserBlock : BaseEntity
    {
        public int BlockerId { get; set; }
        public int BlockedId { get; set; }

        public User Blocker { get; set; } = null!;
        public User Blocked { get; set; } = null!;
    }
}
