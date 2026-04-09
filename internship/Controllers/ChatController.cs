using Microsoft.AspNetCore.Mvc;
using Services;
using Services.DataTransferObjects;
using Services.Interfaces;

namespace ChatApp.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class ChatController : ControllerBase
    {
        private readonly ChatService _chatService;
        private readonly MessageService _messageService;
        private readonly ChatMemberService _chatMemberService;

        public ChatController(ChatService chatService, MessageService messageService, ChatMemberService chatMemberService)
        {
            _chatService = chatService;
            _messageService = messageService;
            _chatService = chatService;
            _messageService = messageService;
            _chatMemberService = chatMemberService;
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

        [HttpGet("{chatId:int}/messages", Name = "GetMessagesForChat")]
        [ProducesResponseType(typeof(IEnumerable<MessageDto>), StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status404NotFound)]
        public IActionResult GetMessagesForChat(int chatId)
        {
            var messages = _messageService.GetMessagesByChat(chatId, trackChanges: false);
            return Ok(messages);
        }

        [HttpPost]
        [ProducesResponseType(typeof(ChatDto), StatusCodes.Status201Created)]
        [ProducesResponseType(StatusCodes.Status400BadRequest)]
        public IActionResult CreateChat([FromBody] ChatForCreationDto chat)
        {
            if (chat is null)
                return BadRequest("ChatForCreationDto object is null");

            var created = _chatService.Create(chat);
            return CreatedAtAction(nameof(GetById), new { id = created.Id }, created);
        }

        [HttpPost("{chatId:int}/messages")]
        [ProducesResponseType(typeof(MessageDto), StatusCodes.Status201Created)]
        [ProducesResponseType(StatusCodes.Status400BadRequest)]
        [ProducesResponseType(StatusCodes.Status404NotFound)]
        public IActionResult CreateMessageForChat(int chatId, [FromBody] MessageForCreationDto message)
        {
            if (message is null)
                return BadRequest("MessageForCreationDto object is null");

            var created = _messageService.CreateMessageForChat(chatId, message);
            return CreatedAtRoute("GetMessagesForChat", new { chatId }, created);
        }

        [HttpDelete("{id:int}")]
        [ProducesResponseType(StatusCodes.Status204NoContent)]
        [ProducesResponseType(StatusCodes.Status404NotFound)]
        public IActionResult DeleteChat(int id)
        {
            _chatService.Delete(id);
            return NoContent();
        }

        [HttpGet("{chatId:int}/users")]
        [ProducesResponseType(typeof(IEnumerable<UserDto>), StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status404NotFound)]
        public IActionResult GetUsersByChatId(int chatId)
        {
            var users = _chatMemberService.GetUsersByChatId(chatId);
            return Ok(users);
        }

        [HttpPost("{chatId:int}/users")]
        [ProducesResponseType(typeof(ChatMemberDto), StatusCodes.Status201Created)]
        [ProducesResponseType(StatusCodes.Status400BadRequest)]
        [ProducesResponseType(StatusCodes.Status404NotFound)]
        public IActionResult AddUserToChat(int chatId, [FromBody] ChatMemberForCreationDto member)
        {
            if (member is null)
                return BadRequest("ChatMemberForCreationDto object is null");

            var created = _chatMemberService.AddUserToChat(chatId, member);
            return CreatedAtAction(nameof(GetUsersByChatId), new { chatId }, created);
        }

        [HttpDelete("{chatId:int}/users/{userId:int}")]
        [ProducesResponseType(StatusCodes.Status204NoContent)]
        [ProducesResponseType(StatusCodes.Status404NotFound)]
        public IActionResult RemoveUserFromChat(int chatId, int userId)
        {
            _chatMemberService.RemoveUserFromChat(chatId, userId);
            return NoContent();
        }

        [HttpPut("{id:int}")]
        [ProducesResponseType(StatusCodes.Status204NoContent)]
        [ProducesResponseType(StatusCodes.Status400BadRequest)]
        [ProducesResponseType(StatusCodes.Status404NotFound)]
        public IActionResult UpdateChat(int id, [FromBody] ChatForUpdateDto chat)
        {
            if (chat is null)
                return BadRequest("ChatForUpdateDto object is null");

            _chatService.Update(id, chat);
            return NoContent();
        }
    }
}