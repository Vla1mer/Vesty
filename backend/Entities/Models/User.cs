using Microsoft.AspNetCore.Identity;

namespace Entities.Models
{
    public class User : IdentityUser<int>
    {
        public string? Name { get; set; }
        public string? Surname { get; set; }
        public string? Phone { get; set; }
        public DateOnly? Birthday { get; set; }
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public string? RefreshToken { get; set; }
        public DateTime RefreshTokenExpiryTime { get; set; }
        public DateTime? AvatarUpdatedAt { get; set; }
        public int WhoCanMessage { get; set; } = PrivacyLevel.Everyone;
        public int WhoCanInvite { get; set; } = PrivacyLevel.Everyone;

        public UserAvatar? Avatar { get; set; }
        public ICollection<Chat> CreatedChats { get; set; } = [];
        public ICollection<ChatMember> ChatMembers { get; set; } = [];
        public ICollection<Message> Messages { get; set; } = [];
    }
}
