using Vesty.ModelBinders;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.JsonPatch;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Net.Http.Headers;
using Services.DataTransferObjects;
using Services.Interfaces;
using Shared.RequestFeatures;
using System.Text.Json;

namespace Vesty.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class UserController : ControllerBase
    {
        private readonly IServiceManager _service;
        private readonly ILoggerManager _logger;

        public UserController(IServiceManager service, ILoggerManager logger)
        {
            _service = service;
            _logger = logger;
        }

        [HttpPost("register")]
        [AllowAnonymous]
        [ProducesResponseType(StatusCodes.Status201Created)]
        [ProducesResponseType(StatusCodes.Status400BadRequest)]
        public async Task<IActionResult> RegisterUser([FromBody] UserForRegistrationDto userForRegistration)
        {
            var result = await _service.User.RegisterUser(userForRegistration);
            if (!result.Succeeded)
            {
                foreach (var error in result.Errors)
                {
                    ModelState.TryAddModelError(error.Code, error.Description);
                }
                return BadRequest(ModelState);
            }
            return StatusCode(201);
        }

        [HttpPost("login")]
        [AllowAnonymous]
        [ProducesResponseType(StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status401Unauthorized)]
        public async Task<IActionResult> Authenticate([FromBody] UserForAuthenticationDto user)
        {
            if (!await _service.User.ValidateUser(user))
                return Unauthorized();

            var tokenDto = await _service.User.CreateToken(populateExp: true);
            return Ok(tokenDto);
        }

        [HttpPost("refresh")]
        [AllowAnonymous]
        [ProducesResponseType(StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status400BadRequest)]
        public async Task<IActionResult> Refresh([FromBody] TokenDto tokenDto)
        {
            var tokenDtoToReturn = await _service.User.RefreshToken(tokenDto);
            return Ok(tokenDtoToReturn);
        }

        [HttpGet]
        [ProducesResponseType(typeof(IEnumerable<UserDto>), StatusCodes.Status200OK)]
        public async Task<IActionResult> GetAllUsers([FromQuery] UserParameters userParameters)
        {
            _logger.LogInfo("Fetching all users");
            var pagedResult = await _service.User.GetAllAsync(userParameters);
            Response.Headers.Add("X-Pagination", JsonSerializer.Serialize(pagedResult.metaData));
            return Ok(pagedResult.users);
        }

        [HttpGet("privacy")]
        [Authorize]
        [ProducesResponseType(typeof(PrivacySettingsDto), StatusCodes.Status200OK)]
        public async Task<IActionResult> GetPrivacy() =>
            Ok(await _service.User.GetPrivacyAsync());

        [HttpPut("privacy")]
        [Authorize]
        [ProducesResponseType(typeof(PrivacySettingsDto), StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status400BadRequest)]
        public async Task<IActionResult> UpdatePrivacy([FromBody] PrivacySettingsDto settings)
        {
            if (settings is null)
                return BadRequest("PrivacySettingsDto object is null");

            return Ok(await _service.User.UpdatePrivacyAsync(settings));
        }

        [HttpGet("{id:int}")]
        [ProducesResponseType(typeof(UserDto), StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status404NotFound)]
        public async Task<IActionResult> GetById(int id)
        {
            var user = await _service.User.GetByIdAsync(id);
            return Ok(user);
        }

        [HttpGet("collection/({ids})", Name = "UserCollection")]
        [ProducesResponseType(typeof(IEnumerable<UserDto>), StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status400BadRequest)]
        public async Task<IActionResult> GetUserCollection(
        [ModelBinder(BinderType = typeof(ArrayModelBinder))] IEnumerable<int> ids)
        {
            var users = await _service.User.GetByIdsAsync(ids);
            return Ok(users);
        }

        [HttpGet("presence/({ids})", Name = "UserPresence")]
        [ProducesResponseType(typeof(IEnumerable<UserPresenceDto>), StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status400BadRequest)]
        public async Task<IActionResult> GetPresence(
        [ModelBinder(BinderType = typeof(ArrayModelBinder))] IEnumerable<int> ids)
        {
            var presence = await _service.Presence.GetPresenceAsync(ids);
            return Ok(presence);
        }

        [HttpPost("register/collection")]
        [AllowAnonymous]
        [ProducesResponseType(typeof(IEnumerable<UserDto>), StatusCodes.Status201Created)]
        [ProducesResponseType(StatusCodes.Status400BadRequest)]
        public async Task<IActionResult> RegisterUserCollection([FromBody] IEnumerable<UserForRegistrationDto> userCollection)
        {
            var result = await _service.User.RegisterUserCollectionAsync(userCollection);
            return CreatedAtRoute("UserCollection", new { result.ids }, result.users);
        }

        [HttpDelete("{id:int}")]
        [ProducesResponseType(StatusCodes.Status204NoContent)]
        [ProducesResponseType(StatusCodes.Status403Forbidden)]
        [ProducesResponseType(StatusCodes.Status404NotFound)]
        public async Task<IActionResult> DeleteUser(int id)
        {
            await _service.User.DeleteAsync(id);
            return NoContent();
        }

        [HttpPut("{id:int}")]
        [ProducesResponseType(StatusCodes.Status204NoContent)]
        [ProducesResponseType(StatusCodes.Status400BadRequest)]
        [ProducesResponseType(StatusCodes.Status403Forbidden)]
        [ProducesResponseType(StatusCodes.Status404NotFound)]
        public async Task<IActionResult> UpdateUser(int id, [FromBody] UserForUpdateDto user)
        {
            if (user is null)
                return BadRequest("UserForUpdateDto object is null");
            if (!ModelState.IsValid)
                return UnprocessableEntity(ModelState);
            await _service.User.UpdateAsync(id, user);
            return NoContent();
        }

        [HttpPatch("{id:int}")]
        [ProducesResponseType(StatusCodes.Status204NoContent)]
        [ProducesResponseType(StatusCodes.Status400BadRequest)]
        [ProducesResponseType(StatusCodes.Status403Forbidden)]
        [ProducesResponseType(StatusCodes.Status404NotFound)]
        [ProducesResponseType(StatusCodes.Status422UnprocessableEntity)]
        public async Task<IActionResult> PartiallyUpdateUser(int id, [FromBody] JsonPatchDocument<UserForUpdateDto> patchDoc)
        {
            if (patchDoc is null)
                return BadRequest("patchDoc object is null");
            var (userToPatch, userEntity) = await _service.User.GetUserForPatchAsync(id, trackChanges: true);
            patchDoc.ApplyTo(userToPatch, ModelState);
            if (!ModelState.IsValid)
                return UnprocessableEntity(ModelState);
            await _service.User.SaveChangesForPatchAsync(userToPatch, userEntity);
            return NoContent();
        }

        [HttpGet("{id:int}/avatar")]
        [AllowAnonymous]
        [ProducesResponseType(StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status404NotFound)]
        public async Task<IActionResult> GetAvatar(int id)
        {
            var avatar = await _service.Avatar.GetAsync(id);
            if (avatar is null)
                return NotFound();

            var entityTag = new EntityTagHeaderValue($"\"{avatar.UpdatedAt.Ticks}\"");
            Response.Headers.CacheControl = "private, max-age=86400";
            return File(avatar.Data, avatar.ContentType, avatar.UpdatedAt, entityTag);
        }

        [HttpPost("{id:int}/avatar")]
        [ProducesResponseType(StatusCodes.Status204NoContent)]
        [ProducesResponseType(StatusCodes.Status400BadRequest)]
        [ProducesResponseType(StatusCodes.Status403Forbidden)]
        [ProducesResponseType(StatusCodes.Status404NotFound)]
        public async Task<IActionResult> UploadAvatar(int id, IFormFile file)
        {
            if (file is null)
                return BadRequest("Avatar file is required.");

            await using var content = file.OpenReadStream();
            await _service.Avatar.SetAsync(id, content, file.ContentType, file.Length);
            return NoContent();
        }

        [HttpDelete("{id:int}/avatar")]
        [ProducesResponseType(StatusCodes.Status204NoContent)]
        [ProducesResponseType(StatusCodes.Status403Forbidden)]
        [ProducesResponseType(StatusCodes.Status404NotFound)]
        public async Task<IActionResult> DeleteAvatar(int id)
        {
            await _service.Avatar.DeleteAsync(id);
            return NoContent();
        }
    }
}
