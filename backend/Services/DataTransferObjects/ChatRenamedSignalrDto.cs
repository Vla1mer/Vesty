namespace Services.DataTransferObjects
{
    public record ChatRenamedSignalrDto
    {
        public int ChatId { get; init; }
        public string Name { get; init; }
    }
}
