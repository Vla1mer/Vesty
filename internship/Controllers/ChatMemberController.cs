using internship.Models;
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
        public async Task<IActionResult> GetAll()
        {
            return Ok(await _chatMemberService.GetAllAsync());
        }

        [HttpGet("{chatId}/{userId}")]
        public async Task<IActionResult> GetById(int chatId, int userId)
        {
            var member = await _chatMemberService.GetByIdAsync(chatId, userId);
            if (member == null) return NotFound();
            return Ok(member);
        }

        [HttpPost]
        public async Task<IActionResult> Create(ChatMember member)
        {
            var created = await _chatMemberService.CreateAsync(member);
            return Ok(created);
        }

        [HttpDelete("{chatId}/{userId}")]
        public async Task<IActionResult> Delete(int chatId, int userId)
        {
            var result = await _chatMemberService.DeleteAsync(chatId, userId);
            if (!result) return NotFound();
            return NoContent();
        }
    }
}