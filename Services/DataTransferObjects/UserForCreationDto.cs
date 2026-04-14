using System.ComponentModel.DataAnnotations;

namespace Services.DataTransferObjects
{
    public record UserForCreationDto
    {
        [Required(ErrorMessage = "Login is a required field.")]
        [MaxLength(50, ErrorMessage = "Maximum length for Login is 50 characters.")]
        public string? Login { get; init; }

        [Required(ErrorMessage = "Password is a required field.")]
        [MaxLength(255, ErrorMessage = "Maximum length for Password is 255 characters.")]
        public string? Password { get; init; }

        [MaxLength(100, ErrorMessage = "Maximum length for Name is 100 characters.")]
        public string? Name { get; init; }

        [MaxLength(100, ErrorMessage = "Maximum length for Surname is 100 characters.")]
        public string? Surname { get; init; }

        [MaxLength(20, ErrorMessage = "Maximum length for Phone is 20 characters.")]
        public string? Phone { get; init; }

        public DateOnly? Birthday { get; init; }
    }
}