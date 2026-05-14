using System.ComponentModel.DataAnnotations;

namespace Services.DataTransferObjects
{
    public record ChatMemberRoleForUpdateDto
    {
        [Required(ErrorMessage = "RoleId is a required field.")]
        public int RoleId { get; init; }
    }
}