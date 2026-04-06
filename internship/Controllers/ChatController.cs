using Microsoft.AspNetCore.Mvc;
using Services;
using Services.DataTransferObjects;

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
        [ProducesResponseType(typeof(IEnumerable<ChatDto>), StatusCodes.Status200OK)]
        public IActionResult GetAllChats()
        {
            return Ok(_chatService.GetAll());
        }

        [HttpGet("{id:int}")]
        [ProducesResponseType(typeof(ChatDto), StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status404NotFound)]
        public IActionResult GetById(int id)
        {
            var chat = _chatService.GetById(id);
            return Ok(chat);
        }

        [HttpGet("{chatId:int}/messages")]
        [ProducesResponseType(typeof(IEnumerable<MessageDto>), StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status404NotFound)]
        public IActionResult GetMessagesForChat(int chatId)
        {
            var messages = _messageService.GetMessagesByChat(chatId, trackChanges: false);
            return Ok(messages);
        }
    }
}