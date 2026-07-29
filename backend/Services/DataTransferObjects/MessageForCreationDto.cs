using System.ComponentModel.DataAnnotations;

namespace Services.DataTransferObjects
{
    public record MessageForCreationDto
    {
        [MaxLength(2000, ErrorMessage = "Maximum length for Content is 2000 characters.")]
        public string? Content { get; init; }

        public int? ReplyToMessageId { get; init; }

        public IEnumerable<int>? AttachmentIds { get; init; }
    }
}
