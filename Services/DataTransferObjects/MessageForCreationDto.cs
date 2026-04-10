namespace Services.DataTransferObjects
{
    public record MessageForCreationDto : MessageForManipulationDto
    {
        public int UserId { get; init; }
    }
}