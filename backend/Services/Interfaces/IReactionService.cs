namespace Services.Interfaces
{
    public interface IReactionService
    {
        Task AddAsync(int messageId, string emoji);
        Task RemoveAsync(int messageId, string emoji);
    }
}
