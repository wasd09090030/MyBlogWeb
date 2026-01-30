using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using BlogApi.Services;
using BlogApi.DTOs;

namespace BlogApi.Controllers
{
    [ApiController]
    [Route("api/cf-image-config")]
    [Authorize]
    public class CfImageConfigController : ControllerBase
    {
        private readonly CfImageConfigService _cfImageConfigService;

        public CfImageConfigController(CfImageConfigService cfImageConfigService)
        {
            _cfImageConfigService = cfImageConfigService;
        }

        /// <summary>
        /// 获取 Cloudflare 图片转换配置
        /// </summary>
        [HttpGet]
        public async Task<ActionResult<CfImageConfigDto>> GetConfig()
        {
            var config = await _cfImageConfigService.GetConfigAsync();
            if (config == null)
            {
                return Ok(new CfImageConfigDto());
            }

            return Ok(new CfImageConfigDto
            {
                IsEnabled = config.IsEnabled,
                ZoneDomain = config.ZoneDomain,
                UseHttps = config.UseHttps,
                Fit = config.Fit,
                Width = config.Width,
                Quality = config.Quality,
                Format = config.Format,
                SignatureParam = config.SignatureParam,
                SignatureToken = config.SignatureToken,
                SignatureSecret = config.SignatureSecret
            });
        }

        /// <summary>
        /// 保存 Cloudflare 图片转换配置
        /// </summary>
        [HttpPost]
        public async Task<ActionResult<CfImageConfigDto>> SaveConfig([FromBody] CfImageConfigDto dto)
        {
            if (dto.Width < 0)
            {
                return BadRequest(new { error = "宽度不能小于 0" });
            }

            if (dto.Quality is < 0 or > 100)
            {
                return BadRequest(new { error = "质量范围应为 0-100，0 表示使用默认值" });
            }

            var config = await _cfImageConfigService.SaveConfigAsync(dto);

            return Ok(new CfImageConfigDto
            {
                IsEnabled = config.IsEnabled,
                ZoneDomain = config.ZoneDomain,
                UseHttps = config.UseHttps,
                Fit = config.Fit,
                Width = config.Width,
                Quality = config.Quality,
                Format = config.Format,
                SignatureParam = config.SignatureParam,
                SignatureToken = config.SignatureToken,
                SignatureSecret = config.SignatureSecret
            });
        }
    }
}
