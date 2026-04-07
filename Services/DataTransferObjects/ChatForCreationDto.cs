namespace Services.DataTransferObjects
{
    public record ChatForCreationDto
    {
        public string Name { get; init; } = null!;
        public int? CreatorId { get; init; }
    }
}