using Entities.Models;
using internship.Services;
using Microsoft.AspNetCore.Mvc;

namespace internship.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class ChatController : ControllerBase
    {
        private readonly ChatService _chatService;

        public ChatController(ChatService chatService)
        {
            _chatService = chatService;
        }

        [HttpGet]
        public IActionResult GetAll()
        {
            return Ok(_chatService.GetAll());
        }

        [HttpGet("{id}")]
        public IActionResult GetById(int id)
        {
            var chat = _chatService.GetById(id);
            if (chat == null) return NotFound();
            return Ok(chat);
        }

        [HttpPost]
        public IActionResult Create(Chat chat)
        {
            var created = _chatService.Create(chat);
            return CreatedAtAction(nameof(GetById), new { id = created.Id }, created);
        }

        [HttpPut("{id}")]
        public IActionResult Update(int id, Chat updated)
        {
            var chat = _chatService.Update(id, updated);
            if (chat == null) return NotFound();
            return Ok(chat);
        }

        [HttpDelete("{id}")]
        public IActionResult Delete(int id)
        {
            var result = _chatService.Delete(id);
            if (!result) return NotFound();
            return NoContent();
        }
    }
}