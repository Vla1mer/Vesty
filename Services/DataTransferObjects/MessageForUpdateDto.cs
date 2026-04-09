namespace Services.DataTransferObjects
{
    public record MessageForUpdateDto
    {
        public string Content { get; init; } = null!;
    }
}