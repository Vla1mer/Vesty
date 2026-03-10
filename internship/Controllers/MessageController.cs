using internship.Models;
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
        public async Task<IActionResult> GetAll()
        {
            return Ok(await _messageService.GetAllAsync());
        }

        [HttpGet("{id}")]
        public async Task<IActionResult> GetById(int id)
        {
            var message = await _messageService.GetByIdAsync(id);
            if (message == null) return NotFound();
            return Ok(message);
        }

        [HttpPost]
        public async Task<IActionResult> Create(Message message)
        {
            var created = await _messageService.CreateAsync(message);
            return CreatedAtAction(nameof(GetById), new { id = created.Id }, created);
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> Delete(int id)
        {
            var result = await _messageService.DeleteAsync(id);
            if (!result) return NotFound();
            return NoContent();
        }
    }
}