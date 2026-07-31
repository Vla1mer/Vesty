namespace Entities.Models
{
    public class Friendship : BaseEntity
    {
        public const int Pending = 1;
        public const int Accepted = 2;

        public int RequesterId { get; set; }
        public int AddresseeId { get; set; }
        public int Status { get; set; } = Pending;
        public DateTime? RespondedAt { get; set; }

        public User Requester { get; set; } = null!;
        public User Addressee { get; set; } = null!;
    }
}
