namespace Services.DataTransferObjects
{
    public record ChatMemberWithRoleDto
    {
        public int UserId { get; init; }
        public string UserName { get; init; }
        public string? Name { get; init; }
        public string? Surname { get; init; }
        public int RoleId { get; init; }
    }
}
