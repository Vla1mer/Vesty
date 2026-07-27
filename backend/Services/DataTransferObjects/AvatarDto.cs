namespace Services.DataTransferObjects
{
    public record AvatarDto
    {
        public byte[] Data { get; init; } = [];
        public string ContentType { get; init; } = string.Empty;
        public DateTime UpdatedAt { get; init; }
    }
}
