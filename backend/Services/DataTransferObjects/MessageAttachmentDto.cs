namespace Services.DataTransferObjects
{
    public record MessageAttachmentDto
    {
        public int Id { get; init; }
        public string FileName { get; init; } = string.Empty;
        public string ContentType { get; init; } = string.Empty;
        public long SizeInBytes { get; init; }
    }
}
