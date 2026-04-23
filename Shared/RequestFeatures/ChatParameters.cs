namespace Shared.RequestFeatures
{
    public class ChatParameters : RequestParameters 
    {
        public int? CreatorId { get; set; }
        public string? SearchTerm { get; set; }
    }
}