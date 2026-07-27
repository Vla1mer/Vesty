namespace Shared.RequestFeatures
{
    public record DirectChatPartner
    {
        public int UserId { get; init; }
        public string? UserName { get; init; }
        public DateTime? AvatarUpdatedAt { get; init; }
    }
}
