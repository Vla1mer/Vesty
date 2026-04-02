using Microsoft.AspNetCore.Mvc;
using Services;

namespace Chat.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class ChatController : ControllerBase
    {
        private readonly ChatService _chatService;
        private readonly MessageService _messageService;

        public ChatController(ChatService chatService, MessageService messageService)
        {
            _chatService = chatService;
            _messageService = messageService;
        }

        [HttpGet]
        public IActionResult GetAll()
        {
            return Ok(_chatService.GetAll());
        }

        [HttpGet("{id:int}")]
        public IActionResult GetById(int id)
        {
            var chat = _chatService.GetById(id);
            return Ok(chat);
        }

        [HttpGet("{chatId:int}/messages")]
        public IActionResult GetMessagesForChat(int chatId)
        {
            var messages = _messageService.GetMessagesByChat(chatId, trackChanges: false);
            return Ok(messages);
        }
    }
}