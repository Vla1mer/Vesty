namespace Entities.Models
{
    public class UserRole
    {
        public const int Owner = 1;
        public const int Admin = 2;
        public const int User = 3;

        public int Id { get; set; }
        public string Name { get; set; } = null!;

        public ICollection<ChatMember> ChatMembers { get; set; } = [];
    }
}
