using ChatApp.ModelBinders;
using Microsoft.AspNetCore.JsonPatch;
using Microsoft.AspNetCore.Mvc;
using Services;
using Services.DataTransferObjects;
using Services.Interfaces;

namespace ChatApp.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class UserController : ControllerBase
    {
        private readonly IServiceManager _service;
        private readonly ILoggerManager _logger;

        public UserController(IServiceManager service, ILoggerManager logger)
        {
            _service = service;
            _logger = logger;
        }

        [HttpGet]
        [ProducesResponseType(typeof(IEnumerable<UserDto>), StatusCodes.Status200OK)]
        public IActionResult GetAllUsers()
        {
            _logger.LogInfo("Fetching all users");
            return Ok(_service.User.GetAll());
        }

        [HttpGet("{id:int}")]
        [ProducesResponseType(typeof(UserDto), StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status404NotFound)]
        public IActionResult GetById(int id)
        {
            var user = _service.User.GetById(id);
            return Ok(user);
        }

        [HttpPost]
        [ProducesResponseType(typeof(UserDto), StatusCodes.Status201Created)]
        [ProducesResponseType(StatusCodes.Status400BadRequest)]
        public IActionResult CreateUser([FromBody] UserForCreationDto user)
        {
            if (user is null)
                return BadRequest("UserForCreationDto object is null");

            if (!ModelState.IsValid)
                return UnprocessableEntity(ModelState);

            var created = _service.User.Create(user);
            return CreatedAtAction(nameof(GetById), new { id = created.Id }, created);
        }

        [HttpGet("collection/({ids})", Name = "UserCollection")]
        [ProducesResponseType(typeof(IEnumerable<UserDto>), StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status400BadRequest)]
        public IActionResult GetUserCollection(
        [ModelBinder(BinderType = typeof(ArrayModelBinder))] IEnumerable<int> ids)
        {
            var users = _service.User.GetByIds(ids);
            return Ok(users);
        }

        [HttpPost("collection")]
        [ProducesResponseType(typeof(IEnumerable<UserDto>), StatusCodes.Status201Created)]
        [ProducesResponseType(StatusCodes.Status400BadRequest)]
        public IActionResult CreateUserCollection([FromBody] IEnumerable<UserForCreationDto> userCollection)
        {
            var result = _service.User.CreateUserCollection(userCollection);
            return CreatedAtRoute("UserCollection", new { result.ids }, result.users);
        }

        [HttpDelete("{id:int}")]
        [ProducesResponseType(StatusCodes.Status204NoContent)]
        [ProducesResponseType(StatusCodes.Status404NotFound)]
        public IActionResult DeleteUser(int id)
        {
            _service.User.Delete(id);
            return NoContent();
        }

        [HttpPut("{id:int}")]
        [ProducesResponseType(StatusCodes.Status204NoContent)]
        [ProducesResponseType(StatusCodes.Status400BadRequest)]
        [ProducesResponseType(StatusCodes.Status404NotFound)]
        public IActionResult UpdateUser(int id, [FromBody] UserForUpdateDto user)
        {
            if (user is null)
                return BadRequest("UserForUpdateDto object is null");

            if (!ModelState.IsValid)
                return UnprocessableEntity(ModelState);

            _service.User.Update(id, user);
            return NoContent();
        }

        [HttpPatch("{id:int}")]
        [ProducesResponseType(StatusCodes.Status204NoContent)]
        [ProducesResponseType(StatusCodes.Status400BadRequest)]
        [ProducesResponseType(StatusCodes.Status404NotFound)]
        [ProducesResponseType(StatusCodes.Status422UnprocessableEntity)]
        public IActionResult PartiallyUpdateUser(int id, [FromBody] JsonPatchDocument<UserForUpdateDto> patchDoc)
        {
            if (patchDoc is null)
                return BadRequest("patchDoc object is null");

            var (userToPatch, userEntity) = _service.User.GetUserForPatch(id, trackChanges: true);

            patchDoc.ApplyTo(userToPatch, ModelState);

            if (!ModelState.IsValid)
                return UnprocessableEntity(ModelState);

            _service.User.SaveChangesForPatch(userToPatch, userEntity);

            return NoContent();
        }
    }
}