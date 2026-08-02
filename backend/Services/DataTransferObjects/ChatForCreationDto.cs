using System.ComponentModel.DataAnnotations;

namespace Services.DataTransferObjects
{
    public record ChatForCreationDto
    {
        [Required(ErrorMessage = "Chat name is a required field.")]
        [MaxLength(100, ErrorMessage = "Maximum length for Name is 100 characters.")]
        public string Name { get; init; }

        public IEnumerable<ChatMemberForCreationDto> Members { get; init; } = [];
    }
}
