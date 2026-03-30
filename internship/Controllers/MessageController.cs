using Entities.Models;
using internship.Services;
using Microsoft.AspNetCore.Mvc;

namespace internship.Controllers
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
        public IActionResult GetAll()
        {
            return Ok(_messageService.GetAll());
        }

        [HttpGet("{id}")]
        public IActionResult GetById(int id)
        {
            var message = _messageService.GetById(id);
            if (message == null) return NotFound();
            return Ok(message);
        }

        [HttpPost]
        public IActionResult Create(Message message)
        {
            var created = _messageService.Create(message);
            return CreatedAtAction(nameof(GetById), new { id = created.Id }, created);
        }

        [HttpDelete("{id}")]
        public IActionResult Delete(int id)
        {
            var result = _messageService.Delete(id);
            if (!result) return NotFound();
            return NoContent();
        }
    }
}