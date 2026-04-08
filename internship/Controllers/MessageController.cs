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
        private readonly MessageService _messageService;

        public MessageController(MessageService messageService)
        {
            _messageService = messageService;
        }

        [HttpGet]
        [ProducesResponseType(typeof(IEnumerable<MessageDto>), StatusCodes.Status200OK)]
        public IActionResult GetAllMessages()
        {
            return Ok(_messageService.GetAll());
        }

        [HttpGet("{id:int}")]
        [ProducesResponseType(typeof(MessageDto), StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status404NotFound)]
        public IActionResult GetById(int id)
        {
            var message = _messageService.GetById(id);
            return Ok(message);
        }

        [HttpPost]
        [ProducesResponseType(typeof(MessageDto), StatusCodes.Status201Created)]
        [ProducesResponseType(StatusCodes.Status400BadRequest)]
        public IActionResult CreateMessage([FromBody] MessageForCreationDto message)
        {
            if (message is null)
                return BadRequest("MessageForCreationDto object is null");

            var created = _messageService.Create(message);
            return CreatedAtAction(nameof(GetById), new { id = created.Id }, created);
        }

        [HttpDelete("{id:int}")]
        [ProducesResponseType(StatusCodes.Status204NoContent)]
        [ProducesResponseType(StatusCodes.Status404NotFound)]
        public IActionResult DeleteMessage(int id)
        {
            _messageService.Delete(id);
            return NoContent();
        }
    }
}