namespace Entities.Models
{
    public class ChatRole
    {
        public int Id { get; set; }
        public string Name { get; set; } = null!;

        public ICollection<ChatMember> ChatMembers { get; set; } = [];
    }
}
