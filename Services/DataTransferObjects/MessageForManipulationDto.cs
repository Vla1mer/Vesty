using System.ComponentModel.DataAnnotations;

namespace Services.DataTransferObjects
{
    public abstract record MessageForManipulationDto
    {
        [Required(ErrorMessage = "Content is a required field.")]
        public string? Content { get; init; }
    }
}