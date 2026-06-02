namespace Services.DataTransferObjects
{
    public record DirectChatDto : ChatDto
    {
        public string? PartnerUserName { get; init; }
    }
}
