using Services.DataTransferObjects;

namespace Services.Interfaces
{
    public interface IChatInviteService
    {
        Task<ChatInviteDto?> GetActiveAsync(int chatId);
        Task<ChatInviteDto> CreateAsync(int chatId, ChatInviteForCreationDto dto);
        Task RevokeAsync(int chatId);
        Task<ChatInvitePreviewDto> PreviewAsync(string code);
        Task<int> JoinAsync(string code);
    }
}
