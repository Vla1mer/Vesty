using System.ComponentModel.DataAnnotations;

namespace Services.DataTransferObjects
{
    public record ChatForRenameDto
    {
        [Required(ErrorMessage = "Chat name is a required field.")]
        [MaxLength(100, ErrorMessage = "Maximum length for Name is 100 characters.")]
        public string Name { get; init; }

        [MaxLength(255, ErrorMessage = "Maximum length for Description is 255 characters.")]
        public string? Description { get; init; }
    }
}
