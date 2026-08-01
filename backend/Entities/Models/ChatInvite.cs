namespace Entities.Models
{
    public class ChatInvite : BaseEntity
    {
        public int ChatId { get; set; }
        public string Code { get; set; } = null!;
        public int? CreatedById { get; set; }
        public DateTime? ExpiresAt { get; set; }
        public DateTime? RevokedAt { get; set; }

        public Chat Chat { get; set; } = null!;
        public User? CreatedBy { get; set; }

        public bool IsActive(DateTime now) =>
            RevokedAt is null && (ExpiresAt is null || ExpiresAt > now);
    }
}
