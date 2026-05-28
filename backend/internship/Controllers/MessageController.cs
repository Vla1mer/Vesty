using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Services;
using Services.DataTransferObjects;
using Services.Interfaces;
using Shared.RequestFeatures;
using System.Text.Json;

namespace ChatApp.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class MessageController : ControllerBase
    {
        private readonly IServiceManager _service;

        public MessageController(IServiceManager service)
        {
            _service = service;
        }

        [HttpGet]
        [ProducesResponseType(typeof(IEnumerable<MessageDto>), StatusCodes.Status200OK)]
        public async Task<IActionResult> GetAllMessages([FromQuery] MessageParameters messageParameters)
        {
            var pagedResult = await _service.Message.GetAllAsync(messageParameters);
            Response.Headers.Add("X-Pagination", JsonSerializer.Serialize(pagedResult.metaData));
            return Ok(pagedResult.messages);
        }

        [HttpPost("{chatId:int}/messages")]
        [ProducesResponseType(typeof(MessageDto), StatusCodes.Status201Created)]
        [ProducesResponseType(StatusCodes.Status400BadRequest)]
        [ProducesResponseType(StatusCodes.Status403Forbidden)]
        [ProducesResponseType(StatusCodes.Status404NotFound)]
        public async Task<IActionResult> CreateMessageForChat(int chatId, [FromBody] MessageForCreationDto message)
        {
            if (message is null)
                return BadRequest("MessageForCreationDto object is null");
            var created = await _service.Message.CreateMessageForChatAsync(chatId, message);
            return CreatedAtRoute("GetMessagesForChat", new { chatId }, created);
        }

        [HttpPost("direct/{otherUserId:int}")]
        [ProducesResponseType(typeof(DirectMessageResultDto), StatusCodes.Status201Created)]
        [ProducesResponseType(StatusCodes.Status400BadRequest)]
        [ProducesResponseType(StatusCodes.Status404NotFound)]
        public async Task<IActionResult> SendDirectMessage(int otherUserId, [FromBody] MessageForCreationDto message)
        {
            if (message is null)
                return BadRequest("MessageForCreationDto object is null");
            var result = await _service.Message.SendDirectMessageAsync(otherUserId, message);
            return Created($"/api/Chat/{result.Chat.Id}", result);
        }

        [HttpGet("{id:int}")]
        [ProducesResponseType(typeof(MessageDto), StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status403Forbidden)]
        [ProducesResponseType(StatusCodes.Status404NotFound)]
        public async Task<IActionResult> GetById(int id)
        {
            var message = await _service.Message.GetByIdAsync(id);
            return Ok(message);
        }

        [HttpDelete("{id:int}")]
        [ProducesResponseType(StatusCodes.Status204NoContent)]
        [ProducesResponseType(StatusCodes.Status403Forbidden)]
        [ProducesResponseType(StatusCodes.Status404NotFound)]
        public async Task<IActionResult> DeleteMessage(int id)
        {
            await _service.Message.DeleteAsync(id);
            return NoContent();
        }

        [HttpPut("{chatId:int}/messages/{id:int}")]
        [ProducesResponseType(StatusCodes.Status204NoContent)]
        [ProducesResponseType(StatusCodes.Status400BadRequest)]
        [ProducesResponseType(StatusCodes.Status403Forbidden)]
        [ProducesResponseType(StatusCodes.Status404NotFound)]
        [ProducesResponseType(StatusCodes.Status422UnprocessableEntity)]
        public async Task<IActionResult> UpdateMessageForChat(int chatId, int id, [FromBody] MessageForUpdateDto message)
        {
            if (message is null)
                return BadRequest("MessageForUpdateDto object is null");
            if (!ModelState.IsValid)
                return UnprocessableEntity(ModelState);
            await _service.Message.UpdateMessageForChatAsync(chatId, id, message);
            return NoContent();
        }
    }
}
