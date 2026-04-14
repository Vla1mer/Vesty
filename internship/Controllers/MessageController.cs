using Microsoft.AspNetCore.Mvc;
using Services;
using Services.DataTransferObjects;
using Services.Interfaces;

namespace ChatApp.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class MessageController : ControllerBase
    {
        private readonly IServiceManager _service;

        public MessageController(IServiceManager service)
        {
            _service = service;
        }

        [HttpGet]
        [ProducesResponseType(typeof(IEnumerable<MessageDto>), StatusCodes.Status200OK)]
        public IActionResult GetAllMessages()
        {
            return Ok(_service.Message.GetAll());
        }

        [HttpGet("{id:int}")]
        [ProducesResponseType(typeof(MessageDto), StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status404NotFound)]
        public IActionResult GetById(int id)
        {
            var message = _service.Message.GetById(id);
            return Ok(message);
        }

        [HttpDelete("{id:int}")]
        [ProducesResponseType(StatusCodes.Status204NoContent)]
        [ProducesResponseType(StatusCodes.Status404NotFound)]
        public IActionResult DeleteMessage(int id)
        {
            _service.Message.Delete(id);
            return NoContent();
        }

        [HttpPut("{chatId:int}/messages/{id:int}")]
        [ProducesResponseType(StatusCodes.Status204NoContent)]
        [ProducesResponseType(StatusCodes.Status400BadRequest)]
        [ProducesResponseType(StatusCodes.Status404NotFound)]
        [ProducesResponseType(StatusCodes.Status422UnprocessableEntity)]
        public IActionResult UpdateMessageForChat(int chatId, int id, [FromBody] MessageForUpdateDto message)
        {
            if (message is null)
                return BadRequest("MessageForUpdateDto object is null");

            if (!ModelState.IsValid)
                return UnprocessableEntity(ModelState);

            _service.Message.UpdateMessageForChat(chatId, id, message);
            return NoContent();
        }
    }
}