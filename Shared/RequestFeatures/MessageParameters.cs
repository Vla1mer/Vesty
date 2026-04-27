namespace Shared.RequestFeatures
{
    public class MessageParameters : RequestParameters
    {
        public MessageParameters() => OrderBy = "createdAt";

        public DateTime MinCreatedAt { get; set; } = DateTime.MinValue;
        public DateTime MaxCreatedAt { get; set; } = DateTime.MaxValue;
        public bool ValidCreatedAtRange => MaxCreatedAt > MinCreatedAt;
        public int? ChatId { get; set; }
        public int? UserId { get; set; }
        public string? SearchTerm { get; set; }
    }

}