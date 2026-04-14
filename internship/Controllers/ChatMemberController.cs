using Microsoft.AspNetCore.Mvc;
using Services;
using Services.DataTransferObjects;
using Services.Interfaces;

namespace ChatApp.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class ChatMemberController : ControllerBase
    {
        private readonly IServiceManager _service;

        public ChatMemberController(IServiceManager service)
        {
            _service = service;
        }

        [HttpGet]
        [ProducesResponseType(typeof(IEnumerable<ChatMemberDto>), StatusCodes.Status200OK)]
        public IActionResult GetAllChats()
        {
            return Ok(_service.ChatMember.GetAll());
        }
    }
}