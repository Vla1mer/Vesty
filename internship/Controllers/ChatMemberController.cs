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

    }
}