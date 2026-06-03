using System.ComponentModel.DataAnnotations;

namespace Services.DataTransferObjects
{
    public record ChatForRenameDto
    {
        [Required(ErrorMessage = "Chat name is a required field.")]
        [MaxLength(200, ErrorMessage = "Maximum length for Name is 200 characters.")]
        public string Name { get; init; } = null!;
    }
}
