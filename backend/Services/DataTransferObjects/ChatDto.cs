namespace Services.DataTransferObjects
{
    public record ChatDto
    {
        public int Id { get; init; }
        public string? Name { get; init; }
        public int? CreatorId { get; init; }
        public bool IsPrivate { get; init; }
        public DateTime CreatedAt { get; init; }
        public string? PartnerUserName { get; init; }
    }
}
