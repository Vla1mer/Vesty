namespace Services.DataTransferObjects
{
    public record ChatForCreationDto : ChatForManipulationDto
    {
        public IEnumerable<ChatMemberForCreationDto> Members { get; init; } = [];
    }
}