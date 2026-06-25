using System.Text.Json.Serialization;

namespace Services.DataTransferObjects
{
    [JsonDerivedType(typeof(DirectChatDto))]
    public record ChatDto
    {
        public int Id { get; init; }
        public string? Name { get; init; }
        public int? CreatorId { get; init; }
        public bool IsPrivate { get; init; }
        public DateTime CreatedAt { get; init; }
        public string? LastMessageContent { get; init; }
        public string? LastMessageSenderName { get; init; }
        public int? LastMessageSenderId { get; init; }
        public DateTime? LastMessageAt { get; init; }
    }
}
