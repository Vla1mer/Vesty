namespace Entities.Models
{
    public class ChatAvatar
    {
        public int ChatId { get; set; }
        public byte[] Data { get; set; } = [];
        public string ContentType { get; set; } = string.Empty;

        public Chat? Chat { get; set; }
    }
}
