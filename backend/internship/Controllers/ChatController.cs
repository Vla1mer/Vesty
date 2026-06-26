using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Services;
using Services.DataTransferObjects;
using Services.Interfaces;
using Shared.RequestFeatures;
using System.Text.Json;

namespace ChatApp.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class ChatController : ControllerBase
    {
        private readonly IServiceManager _service;

        public ChatController(IServiceManager service)
        {
            _service = service;
        }

        [HttpGet]
        [ProducesResponseType(typeof(IEnumerable<ChatDto>), StatusCodes.Status200OK)]
        public async Task<IActionResult> GetAllChats([FromQuery] ChatParameters chatParameters)
        {
            var pagedResult = await _service.Chat.GetAllAsync(chatParameters);
            Response.Headers.Add("X-Pagination", JsonSerializer.Serialize(pagedResult.metaData));
            return Ok(pagedResult.chats);
        }

        [HttpGet("{id:int}")]
        [ProducesResponseType(typeof(ChatDto), StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status403Forbidden)]
        [ProducesResponseType(StatusCodes.Status404NotFound)]
        public async Task<IActionResult> GetById(int id)
        {
            var chat = await _service.Chat.GetByIdAsync(id);
            return Ok(chat);
        }

        [HttpGet("{chatId:int}/messages", Name = "GetMessagesForChat")]
        [ProducesResponseType(typeof(IEnumerable<MessageDto>), StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status403Forbidden)]
        [ProducesResponseType(StatusCodes.Status404NotFound)]
        public async Task<IActionResult> GetMessagesForChat(int chatId)
        {
            var messages = await _service.Message.GetMessagesByChatAsync(chatId, trackChanges: false);
            return Ok(messages);
        }

        [HttpPost]
        [ProducesResponseType(typeof(ChatDto), StatusCodes.Status201Created)]
        [ProducesResponseType(StatusCodes.Status400BadRequest)]
        [ProducesResponseType(StatusCodes.Status422UnprocessableEntity)]
        public async Task<IActionResult> CreateChat([FromBody] ChatForCreationDto chat)
        {
            if (chat is null)
                return BadRequest("ChatForCreationDto object is null");
            if (!ModelState.IsValid)
                return UnprocessableEntity(ModelState);
            var created = await _service.Chat.CreateAsync(chat);
            return CreatedAtAction(nameof(GetById), new { id = created.Id }, created);
        }

        [HttpPost("direct/{otherUserId:int}")]
        [ProducesResponseType(typeof(DirectChatDto), StatusCodes.Status201Created)]
        [ProducesResponseType(StatusCodes.Status400BadRequest)]
        [ProducesResponseType(StatusCodes.Status404NotFound)]
        public async Task<IActionResult> CreateDirectChat(int otherUserId)
        {
            var created = await _service.Chat.CreateDirectChatAsync(otherUserId);
            return CreatedAtAction(nameof(GetById), new { id = created.Id }, created);
        }

        [HttpDelete("{id:int}")]
        [ProducesResponseType(StatusCodes.Status204NoContent)]
        [ProducesResponseType(StatusCodes.Status403Forbidden)]
        [ProducesResponseType(StatusCodes.Status404NotFound)]
        public async Task<IActionResult> DeleteChat(int id)
        {
            await _service.Chat.DeleteAsync(id);
            return NoContent();
        }

        [HttpGet("{chatId:int}/users")]
        [ProducesResponseType(typeof(IEnumerable<ChatMemberWithRoleDto>), StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status403Forbidden)]
        [ProducesResponseType(StatusCodes.Status404NotFound)]
        public async Task<IActionResult> GetUsersByChatId(int chatId)
        {
            var members = await _service.ChatMember.GetUsersByChatIdAsync(chatId);
            return Ok(members);
        }

        [HttpPost("{chatId:int}/users")]
        [ProducesResponseType(typeof(ChatMemberDto), StatusCodes.Status201Created)]
        [ProducesResponseType(StatusCodes.Status400BadRequest)]
        [ProducesResponseType(StatusCodes.Status403Forbidden)]
        [ProducesResponseType(StatusCodes.Status404NotFound)]
        public async Task<IActionResult> AddUserToChat(int chatId, [FromBody] ChatMemberForCreationDto member)
        {
            if (member is null)
                return BadRequest("ChatMemberForCreationDto object is null");
            var created = await _service.ChatMember.AddUserToChatAsync(chatId, member);
            return CreatedAtAction(nameof(GetUsersByChatId), new { chatId }, created);
        }

        [HttpDelete("{chatId:int}/users/{userId:int}")]
        [ProducesResponseType(StatusCodes.Status204NoContent)]
        [ProducesResponseType(StatusCodes.Status400BadRequest)]
        [ProducesResponseType(StatusCodes.Status403Forbidden)]
        [ProducesResponseType(StatusCodes.Status404NotFound)]
        public async Task<IActionResult> RemoveUserFromChat(int chatId, int userId)
        {
            await _service.ChatMember.RemoveUserFromChatAsync(chatId, userId);
            return NoContent();
        }

        [HttpPatch("{chatId:int}/users/{userId:int}/role")]
        [ProducesResponseType(StatusCodes.Status204NoContent)]
        [ProducesResponseType(StatusCodes.Status400BadRequest)]
        [ProducesResponseType(StatusCodes.Status403Forbidden)]
        [ProducesResponseType(StatusCodes.Status404NotFound)]
        public async Task<IActionResult> UpdateMemberRole(int chatId, int userId, [FromBody] ChatMemberRoleForUpdateDto roleDto)
        {
            if (roleDto is null)
                return BadRequest("ChatMemberRoleForUpdateDto object is null");
            if (!ModelState.IsValid)
                return UnprocessableEntity(ModelState);
            await _service.ChatMember.UpdateMemberRoleAsync(chatId, userId, roleDto);
            return NoContent();
        }

        [HttpPut("{id:int}")]
        [ProducesResponseType(StatusCodes.Status204NoContent)]
        [ProducesResponseType(StatusCodes.Status400BadRequest)]
        [ProducesResponseType(StatusCodes.Status403Forbidden)]
        [ProducesResponseType(StatusCodes.Status404NotFound)]
        [ProducesResponseType(StatusCodes.Status422UnprocessableEntity)]
        public async Task<IActionResult> RenameChat(int id, [FromBody] ChatForRenameDto chat)
        {
            if (chat is null)
                return BadRequest("ChatForRenameDto object is null");
            if (!ModelState.IsValid)
                return UnprocessableEntity(ModelState);
            await _service.Chat.RenameAsync(id, chat);
            return NoContent();
        }

        [HttpPost("{id:int}/read")]
        [ProducesResponseType(StatusCodes.Status204NoContent)]
        [ProducesResponseType(StatusCodes.Status403Forbidden)]
        [ProducesResponseType(StatusCodes.Status404NotFound)]
        public async Task<IActionResult> MarkRead(int id)
        {
            await _service.Chat.MarkReadAsync(id);
            return NoContent();
        }
    }
}
