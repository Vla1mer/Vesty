namespace Services.DataTransferObjects
{
    public record PrivacySettingsDto
    {
        public int WhoCanMessage { get; init; }
        public int WhoCanInvite { get; init; }
        public int WhoCanSeeProfile { get; init; }
        public int WhoCanSeeOnline { get; init; }
    }
}
