namespace Services.DataTransferObjects
{
    public record DirectChatDto : ChatDto
    {
        public string? PartnerUserName { get; init; }
        public int? PartnerUserId { get; init; }
        public DateTime? PartnerAvatarUpdatedAt { get; init; }
    }
}
