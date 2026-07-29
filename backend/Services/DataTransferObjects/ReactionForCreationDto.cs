using System.ComponentModel.DataAnnotations;

namespace Services.DataTransferObjects
{
    public record ReactionForCreationDto
    {
        [Required(ErrorMessage = "Emoji is a required field.")]
        [MaxLength(16, ErrorMessage = "Maximum length for Emoji is 16 characters.")]
        public string Emoji { get; init; } = string.Empty;
    }
}
