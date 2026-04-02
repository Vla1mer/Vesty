using Services;
using Microsoft.AspNetCore.Mvc;

namespace Chat.Controllers
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

        [HttpGet("{id:int}")]
        public IActionResult GetById(int id)
        {
            var message = _messageService.GetById(id);
            return Ok(message);
        }
    }
}