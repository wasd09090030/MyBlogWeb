using Microsoft.AspNetCore.Mvc;
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

        public ArticlesController(ArticleService articleService)
        {
            _articleService = articleService;
        }

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

        [HttpPut("{id}")]
        public async Task<ActionResult<Article>> Update(int id, [FromBody] UpdateArticleDto dto)
        {
            var article = await _articleService.UpdateAsync(id, dto);
            if (article == null)
                return NotFound();

            return Ok(article);
        }

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
