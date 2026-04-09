namespace Services.DataTransferObjects
{
    public record ChatForUpdateDto
    {
        public string Name { get; init; } = null!;
        public int? CreatorId { get; init; }
    }
}