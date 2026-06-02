using System.ComponentModel.DataAnnotations;

namespace Services.DataTransferObjects
{
    public record SendDirectMessageDto
    {
        [Required]
        public int OtherUserId { get; init; }

        [Required]
        public MessageForCreationDto Message { get; init; } = null!;
    }
}
