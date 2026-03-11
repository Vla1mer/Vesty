using System;

namespace internship.Models
{
    public class User : BaseEntity
    {
        public string Login { get; set; } = null!;
        public string Password { get; set; } = null!;
        public string? Name { get; set; }
        public string? Surname { get; set; }
        public string? Phone { get; set; }
        public DateOnly? Birthday { get; set; }

        public ICollection<Chat> CreatedChats { get; set; } = [];
        public ICollection<ChatMember> ChatMembers { get; set; } = [];
        public ICollection<Message> Messages { get; set; } = [];
    }
}
