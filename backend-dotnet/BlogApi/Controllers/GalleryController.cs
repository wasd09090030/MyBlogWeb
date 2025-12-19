using Microsoft.AspNetCore.Mvc;
using BlogApi.Services;
using BlogApi.DTOs;
using BlogApi.Models;

namespace BlogApi.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class GalleryController : ControllerBase
    {
        private readonly GalleryService _galleryService;

        public GalleryController(GalleryService galleryService)
        {
            _galleryService = galleryService;
        }

        // 公开接口：获取所有激活的画廊图片
        [HttpGet]
        public async Task<ActionResult<List<Gallery>>> GetAllActive()
        {
            var galleries = await _galleryService.GetAllActiveAsync();
            return Ok(galleries);
        }

        // 管理员接口：获取所有画廊图片
        [HttpGet("admin")]
        public async Task<ActionResult<List<Gallery>>> GetAll()
        {
            var galleries = await _galleryService.GetAllAsync();
            return Ok(galleries);
        }

        // 管理员接口：获取单个画廊图片
        [HttpGet("{id}")]
        public async Task<ActionResult<Gallery>> GetById(int id)
        {
            var gallery = await _galleryService.GetByIdAsync(id);
            if (gallery == null)
                return NotFound();

            return Ok(gallery);
        }

        // 管理员接口：创建画廊图片
        [HttpPost]
        public async Task<ActionResult<Gallery>> Create([FromBody] CreateGalleryDto dto)
        {
            var gallery = await _galleryService.CreateAsync(dto);
            return CreatedAtAction(nameof(GetById), new { id = gallery.Id }, gallery);
        }

        // 管理员接口：更新画廊图片
        [HttpPatch("{id}")]
        public async Task<ActionResult<Gallery>> Update(int id, [FromBody] UpdateGalleryDto dto)
        {
            var gallery = await _galleryService.UpdateAsync(id, dto);
            if (gallery == null)
                return NotFound();

            return Ok(gallery);
        }

        // 管理员接口：删除画廊图片
        [HttpDelete("{id}")]
        public async Task<IActionResult> Delete(int id)
        {
            var result = await _galleryService.DeleteAsync(id);
            if (!result)
                return NotFound();

            return NoContent();
        }

        // 管理员接口：批量更新排序
        [HttpPatch("batch/sort-order")]
        public async Task<IActionResult> UpdateSortOrder([FromBody] List<UpdateSortOrderDto> updates)
        {
            await _galleryService.UpdateSortOrderAsync(updates);
            return Ok(new { message = "排序更新成功" });
        }

        // 管理员接口：切换激活状态
        [HttpPatch("{id}/toggle-active")]
        public async Task<ActionResult<Gallery>> ToggleActive(int id)
        {
            var gallery = await _galleryService.ToggleActiveAsync(id);
            if (gallery == null)
                return NotFound();

            return Ok(gallery);
        }

        // 管理员接口：批量导入图片
        [HttpPost("batch/import")]
        public async Task<ActionResult<List<Gallery>>> BatchImport([FromBody] BatchImportGalleryDto dto)
        {
            if (dto.ImageUrls == null || !dto.ImageUrls.Any())
                return BadRequest(new { message = "请提供至少一个图片URL" });

            var galleries = await _galleryService.BatchImportAsync(dto);
            return Ok(new { 
                message = $"成功导入 {galleries.Count} 张图片",
                data = galleries 
            });
        }
    }
}
