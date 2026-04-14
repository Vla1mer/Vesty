using System.ComponentModel.DataAnnotations;

namespace Services.DataTransferObjects
{
    public record MessageForCreationDto
    {
        public int UserId { get; init; }

        [Required(ErrorMessage = "Content is a required field.")]
        [MaxLength(2000, ErrorMessage = "Maximum length for Content is 2000 characters.")]
        public string? Content { get; init; }
    }
}