using Services.DataTransferObjects;

namespace Services.Interfaces
{
    public interface IAvatarService
    {
        Task<AvatarDto?> GetAsync(int userId);
        Task SetAsync(int userId, Stream content, string? contentType, long length);
        Task DeleteAsync(int userId);
    }
}
