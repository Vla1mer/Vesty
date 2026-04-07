namespace Services.DataTransferObjects
{
    public record MessageForCreationDto
    {
        public int UserId { get; init; }
        public string Content { get; init; } = null!;
    }
}