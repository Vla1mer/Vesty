using Entities.Models;
using Services;
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
        public IActionResult GetAll()
        {
            _logger.LogInfo("Fetching all users");
            return Ok(_userService.GetAll());
        }

    }
}