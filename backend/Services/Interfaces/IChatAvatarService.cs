using Services.DataTransferObjects;

namespace Services.Interfaces
{
    public interface IChatAvatarService
    {
        Task<AvatarDto?> GetAsync(int chatId);
        Task SetAsync(int chatId, Stream content, string? contentType, long length);
        Task DeleteAsync(int chatId);
    }
}
