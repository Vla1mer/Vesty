using Microsoft.AspNetCore.Authorization;
using Entities.Models;
using Microsoft.AspNetCore.Mvc;
using Services.DataTransferObjects;
using Services.Interfaces;

namespace Vesty.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class FriendController : ControllerBase
    {
        private readonly IServiceManager _service;

        public FriendController(IServiceManager service)
        {
            _service = service;
        }

        [HttpGet]
        [ProducesResponseType(typeof(IEnumerable<FriendDto>), StatusCodes.Status200OK)]
        public async Task<IActionResult> GetFriends() =>
            Ok(await _service.Friend.GetFriendsAsync());

        [HttpGet("requests")]
        [ProducesResponseType(typeof(IEnumerable<FriendDto>), StatusCodes.Status200OK)]
        public async Task<IActionResult> GetPendingRequests() =>
            Ok(await _service.Friend.GetPendingAsync());

        [HttpPost("{userId:int}")]
        [ProducesResponseType(typeof(FriendDto), StatusCodes.Status201Created)]
        [ProducesResponseType(typeof(FriendDto), StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status400BadRequest)]
        [ProducesResponseType(StatusCodes.Status404NotFound)]
        [ProducesResponseType(StatusCodes.Status409Conflict)]
        public async Task<IActionResult> SendRequest(int userId)
        {
            var result = await _service.Friend.SendRequestAsync(userId);

            // встречная заявка подтверждает дружбу — ничего не создано
            return result.Status == Friendship.Accepted
                ? Ok(result)
                : CreatedAtAction(nameof(GetFriends), result);
        }

        [HttpPost("{userId:int}/accept")]
        [ProducesResponseType(typeof(FriendDto), StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status404NotFound)]
        public async Task<IActionResult> Accept(int userId) =>
            Ok(await _service.Friend.AcceptAsync(userId));

        [HttpDelete("{userId:int}")]
        [ProducesResponseType(StatusCodes.Status204NoContent)]
        [ProducesResponseType(StatusCodes.Status404NotFound)]
        public async Task<IActionResult> Remove(int userId)
        {
            await _service.Friend.RemoveAsync(userId);
            return NoContent();
        }
    }
}
