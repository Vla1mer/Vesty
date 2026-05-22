using System.ComponentModel.DataAnnotations;

namespace Services.DataTransferObjects
{
    public record UserForAuthenticationDto
    {
        [Required(ErrorMessage = "UserName is a required field.")]
        public string UserName { get; init; }

        [Required(ErrorMessage = "Password is a required field.")]
        public string Password { get; init; }
    }
}
