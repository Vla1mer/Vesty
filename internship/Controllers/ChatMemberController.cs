using Services;
using Services.DataTransferObjects;
using Microsoft.AspNetCore.Mvc;

namespace ChatApp.Controllers
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
        [ProducesResponseType(typeof(IEnumerable<ChatMemberDto>), StatusCodes.Status200OK)]
        public IActionResult GetAllChats()
        {
            return Ok(_chatMemberService.GetAll());
        }
    }
}