using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Services.DataTransferObjects;
using Services.Interfaces;

namespace Vesty.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class BlockController : ControllerBase
    {
        private readonly IServiceManager _service;

        public BlockController(IServiceManager service)
        {
            _service = service;
        }

        [HttpGet]
        [ProducesResponseType(typeof(IEnumerable<BlockedUserDto>), StatusCodes.Status200OK)]
        public async Task<IActionResult> GetBlocked() =>
            Ok(await _service.Block.GetBlockedAsync());

        [HttpPost("{userId:int}")]
        [ProducesResponseType(typeof(BlockedUserDto), StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status400BadRequest)]
        [ProducesResponseType(StatusCodes.Status404NotFound)]
        public async Task<IActionResult> Block(int userId) =>
            Ok(await _service.Block.BlockAsync(userId));

        [HttpDelete("{userId:int}")]
        [ProducesResponseType(StatusCodes.Status204NoContent)]
        [ProducesResponseType(StatusCodes.Status404NotFound)]
        public async Task<IActionResult> Unblock(int userId)
        {
            await _service.Block.UnblockAsync(userId);
            return NoContent();
        }
    }
}
