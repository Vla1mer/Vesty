namespace Services.DataTransferObjects
{
    public record ChatPermissionsDto
    {
        public int WhoCanInvite { get; init; }
        public int WhoCanEdit { get; init; }
        public int WhoCanPost { get; init; }
    }
}
