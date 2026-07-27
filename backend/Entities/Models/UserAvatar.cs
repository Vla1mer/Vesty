namespace Entities.Models
{
    public class UserAvatar
    {
        public int UserId { get; set; }
        public byte[] Data { get; set; } = [];
        public string ContentType { get; set; } = string.Empty;

        public User? User { get; set; }
    }
}
