namespace Shared.RequestFeatures
{
    public class ChatParameters : RequestParameters
    {
        public ChatParameters() => OrderBy = "name";

        public int? CreatorId { get; set; }
        public string? SearchTerm { get; set; }
    }
}