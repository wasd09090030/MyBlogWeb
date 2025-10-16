using Microsoft.AspNetCore.Mvc;
using BlogApi.Services;
using BlogApi.DTOs;

namespace BlogApi.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class AuthController : ControllerBase
    {
        private readonly AuthService _authService;

        public AuthController(AuthService authService)
        {
            _authService = authService;
        }

        [HttpPost("login")]
        public ActionResult<AuthResponse> Login([FromBody] LoginDto dto)
        {
            try
            {
                var result = _authService.ValidateAdmin(dto.Username, dto.Password);

                if (!result.Success)
                {
                    return Unauthorized(result);
                }

                return Ok(result);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new AuthResponse
                {
                    Success = false,
                    Message = $"服务器内部错误: {ex.Message}"
                });
            }
        }

        [HttpPost("change-password")]
        public ActionResult<AuthResponse> ChangePassword([FromBody] ChangePasswordDto dto)
        {
            try
            {
                var result = _authService.ChangePassword(dto.CurrentPassword, dto.NewPassword);

                if (!result.Success)
                {
                    return BadRequest(result);
                }

                return Ok(result);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new AuthResponse
                {
                    Success = false,
                    Message = $"服务器内部错误: {ex.Message}"
                });
            }
        }
    }
}
