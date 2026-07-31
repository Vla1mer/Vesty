namespace Services.DataTransferObjects
{
    public record PrivacySettingsDto
    {
        public int WhoCanMessage { get; init; }
        public int WhoCanInvite { get; init; }
    }
}
