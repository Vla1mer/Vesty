using Services.DataTransferObjects;

namespace Services.Interfaces
{
    public interface IBlockService
    {
        Task<IEnumerable<BlockedUserDto>> GetBlockedAsync();
        Task<BlockedUserDto> BlockAsync(int targetUserId);
        Task UnblockAsync(int targetUserId);
    }
}
