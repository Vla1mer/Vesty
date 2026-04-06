using Services;
using Services.DataTransferObjects;
using Services.Interfaces;
using Microsoft.AspNetCore.Mvc;

namespace Chat.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class UserController : ControllerBase
    {
        private readonly UserService _userService;
        private readonly ILoggerManager _logger;

        public UserController(UserService userService, ILoggerManager logger)
        {
            _userService = userService;
            _logger = logger;
        }

        [HttpGet]
        [ProducesResponseType(typeof(IEnumerable<UserDto>), StatusCodes.Status200OK)]
        public IActionResult GetAllUsers()
        {
            _logger.LogInfo("Fetching all users");
            return Ok(_userService.GetAll());
        }

        [HttpGet("{id:int}")]
        [ProducesResponseType(typeof(UserDto), StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status404NotFound)]
        public IActionResult GetById(int id)
        {
            var user = _userService.GetById(id);
            return Ok(user);
        }
    }
}