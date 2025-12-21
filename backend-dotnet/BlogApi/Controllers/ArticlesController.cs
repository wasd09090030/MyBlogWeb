using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using BlogApi.Services;
using BlogApi.DTOs;
using BlogApi.Models;

namespace BlogApi.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class ArticlesController : ControllerBase
    {
        private readonly ArticleService _articleService;

        public ArticlesController(ArticleService articleService)//依赖注入
        {
            _articleService = articleService;
        }

        [Authorize]  // 需要登录才能创建文章
        [HttpPost]
        public async Task<ActionResult<Article>> Create([FromBody] CreateArticleDto dto)
        {
            var article = await _articleService.CreateAsync(dto);
            return CreatedAtAction(nameof(GetById), new { id = article.Id }, article);
        }

        [HttpGet]
        public async Task<ActionResult<object>> GetAll(
            [FromQuery] ArticleCategory? category = null,
            [FromQuery] int? page = null,
            [FromQuery] int? limit = null,
            [FromQuery] bool summary = false)
        {
            if (summary)
            {
                var summaries = await _articleService.GetAllSummaryAsync(category, page, limit);
                return Ok(summaries);
            }

            if (page.HasValue || limit.HasValue)
            {
                var paginated = await _articleService.GetWithPaginationAsync(category, page, limit);
                return Ok(paginated);
            }

            if (category.HasValue)
            {
                var articles = await _articleService.GetByCategoryAsync(category.Value);
                return Ok(articles);
            }

            var allArticles = await _articleService.GetAllAsync();
            return Ok(allArticles);
        }

        [HttpGet("featured")]
        public async Task<ActionResult<List<Article>>> GetFeatured([FromQuery] int limit = 5)
        {
            var articles = await _articleService.GetFeaturedAsync(limit);
            return Ok(articles);
        }

        [HttpGet("search")]
        public async Task<ActionResult<List<ArticleSummaryDto>>> Search(
            [FromQuery] string keyword)
        {
            if (string.IsNullOrWhiteSpace(keyword))
                return BadRequest("搜索关键词不能为空");

            var results = await _articleService.SearchAsync(keyword);
            return Ok(results);
        }

        [HttpGet("category/{category}")]
        public async Task<ActionResult<List<Article>>> GetByCategory(ArticleCategory category)
        {
            var articles = await _articleService.GetByCategoryAsync(category);
            return Ok(articles);
        }

        [HttpGet("{id}")]
        public async Task<ActionResult<Article>> GetById(int id)
        {
            var article = await _articleService.GetByIdAsync(id);
            if (article == null)
                return NotFound();

            return Ok(article);
        }

        [Authorize]  // 需要登录才能更新文章
        [HttpPut("{id}")]
        public async Task<ActionResult<Article>> Update(int id, [FromBody] UpdateArticleDto dto)
        {
            var article = await _articleService.UpdateAsync(id, dto);
            if (article == null)
                return NotFound();

            return Ok(article);
        }

        [Authorize]  // 需要登录才能删除文章
        [HttpDelete("{id}")]
        public async Task<IActionResult> Delete(int id)
        {
            var result = await _articleService.DeleteAsync(id);
            if (!result)
                return NotFound();

            return NoContent();
        }
    }
}
