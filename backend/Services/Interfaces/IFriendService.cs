using Services.DataTransferObjects;

namespace Services.Interfaces
{
    public interface IFriendService
    {
        Task<IEnumerable<FriendDto>> GetFriendsAsync();
        Task<IEnumerable<FriendDto>> GetPendingAsync();
        Task<FriendDto> SendRequestAsync(int targetUserId);
        Task<FriendDto> AcceptAsync(int requesterUserId);
        Task RemoveAsync(int otherUserId);
        Task<bool> AreFriendsAsync(int otherUserId);
    }
}
