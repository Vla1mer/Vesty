using Entities.Models;
using internship.Services;
using Microsoft.AspNetCore.Mvc;

namespace internship.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class ChatMemberController : ControllerBase
    {
        private readonly ChatMemberService _chatMemberService;

        public ChatMemberController(ChatMemberService chatMemberService)
        {
            _chatMemberService = chatMemberService;
        }

        [HttpGet]
        public IActionResult GetAll()
        {
            return Ok(_chatMemberService.GetAll());
        }

        [HttpGet("{chatId}/{userId}")]
        public IActionResult GetById(int chatId, int userId)
        {
            var member = _chatMemberService.GetById(chatId, userId);
            if (member == null) return NotFound();
            return Ok(member);
        }

        [HttpPost]
        public IActionResult Create(ChatMember member)
        {
            var created = _chatMemberService.Create(member);
            return Ok(created);
        }

        [HttpDelete("{chatId}/{userId}")]
        public IActionResult Delete(int chatId, int userId)
        {
            var result = _chatMemberService.Delete(chatId, userId);
            if (!result) return NotFound();
            return NoContent();
        }
    }
}