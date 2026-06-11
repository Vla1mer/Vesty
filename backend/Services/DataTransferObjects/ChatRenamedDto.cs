namespace Services.DataTransferObjects
{
    public record ChatRenamedDto
    {
        public int ChatId { get; init; }
        public string Name { get; init; }
    }
}
