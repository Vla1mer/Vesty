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
        private readonly IServiceManager _service;

        public ChatController(IServiceManager service)
        {
            _service = service;
        }

        [HttpGet]
        [ProducesResponseType(typeof(IEnumerable<ChatDto>), StatusCodes.Status200OK)]
        public IActionResult GetAllChats()
        {
            return Ok(_service.Chat.GetAll());
        }

        [HttpGet("{id:int}")]
        [ProducesResponseType(typeof(ChatDto), StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status404NotFound)]   
        public IActionResult GetById(int id)
        {
            var chat = _service.Chat.GetById(id);
            return Ok(chat);
        }

        [HttpGet("{chatId:int}/messages", Name = "GetMessagesForChat")]
        [ProducesResponseType(typeof(IEnumerable<MessageDto>), StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status404NotFound)]
        public IActionResult GetMessagesForChat(int chatId)
        {
            var messages = _service.Message.GetMessagesByChat(chatId, trackChanges: false);
            return Ok(messages);
        }

        [HttpPost]
        [ProducesResponseType(typeof(ChatDto), StatusCodes.Status201Created)]
        [ProducesResponseType(StatusCodes.Status400BadRequest)]
        [ProducesResponseType(StatusCodes.Status422UnprocessableEntity)]
        public IActionResult CreateChat([FromBody] ChatForCreationDto chat)
        {
            if (chat is null)
                return BadRequest("ChatForCreationDto object is null");

            if (!ModelState.IsValid)
                return UnprocessableEntity(ModelState);

            var created = _service.Chat.Create(chat);
            return CreatedAtAction(nameof(GetById), new { id = created.Id }, created);
        }

        [HttpDelete("{id:int}")]
        [ProducesResponseType(StatusCodes.Status204NoContent)]
        [ProducesResponseType(StatusCodes.Status404NotFound)]
        public IActionResult DeleteChat(int id)
        {
            _service.Chat.Delete(id);
            return NoContent();
        }

        [HttpGet("{chatId:int}/users")]
        [ProducesResponseType(typeof(IEnumerable<UserDto>), StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status404NotFound)]
        public IActionResult GetUsersByChatId(int chatId)
        {
            var users = _service.ChatMember.GetUsersByChatId(chatId);
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

            var created = _service.ChatMember.AddUserToChat(chatId, member);
            return CreatedAtAction(nameof(GetUsersByChatId), new { chatId }, created);
        }

        [HttpDelete("{chatId:int}/users/{userId:int}")]
        [ProducesResponseType(StatusCodes.Status204NoContent)]
        [ProducesResponseType(StatusCodes.Status404NotFound)]
        public IActionResult RemoveUserFromChat(int chatId, int userId)
        {
            _service.ChatMember.RemoveUserFromChat(chatId, userId);
            return NoContent();
        }

        [HttpPut("{id:int}")]
        [ProducesResponseType(StatusCodes.Status204NoContent)]
        [ProducesResponseType(StatusCodes.Status400BadRequest)]
        [ProducesResponseType(StatusCodes.Status404NotFound)]
        [ProducesResponseType(StatusCodes.Status422UnprocessableEntity)]
        public IActionResult UpdateChat(int id, [FromBody] ChatForUpdateDto chat)
        {
            if (chat is null)
                return BadRequest("ChatForUpdateDto object is null");

            if (!ModelState.IsValid)
                return UnprocessableEntity(ModelState);

            _service.Chat.Update(id, chat);
            return NoContent();
        }
    }
}