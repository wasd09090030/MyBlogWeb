using Microsoft.EntityFrameworkCore;
using BlogApi.Data;
using BlogApi.Models;
using BlogApi.DTOs;

namespace BlogApi.Services
{
    public class ArticleService
    {
        private readonly BlogDbContext _context;

        public ArticleService(BlogDbContext context)
        {
            _context = context;
        }

        public async Task<Article> CreateAsync(CreateArticleDto dto)
        {
            var article = new Article
            {
                Title = dto.Title,
                Content = dto.Content,
                ContentMarkdown = dto.ContentMarkdown,
                CoverImage = dto.CoverImage,
                Category = dto.Category,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };

            _context.Articles.Add(article);
            await _context.SaveChangesAsync();
            return article;
        }

        public async Task<List<Article>> GetAllAsync()
        {
            return await _context.Articles
                .Include(a => a.Comments)
                .OrderByDescending(a => a.CreatedAt)
                .ToListAsync();
        }

        public async Task<List<ArticleSummaryDto>> GetAllSummaryAsync(ArticleCategory? category = null, int? page = null, int? limit = null)
        {
            var query = _context.Articles.AsQueryable();

            if (category.HasValue)
            {
                query = query.Where(a => a.Category == category.Value);
            }

            if (page.HasValue && limit.HasValue)
            {
                query = query.Skip((page.Value - 1) * limit.Value).Take(limit.Value);
            }

            return await query
                .OrderByDescending(a => a.CreatedAt)
                .Select(a => new ArticleSummaryDto
                {
                    Id = a.Id,
                    Title = a.Title,
                    CoverImage = a.CoverImage,
                    Category = a.Category,
                    CreatedAt = a.CreatedAt,
                    UpdatedAt = a.UpdatedAt,
                    Content = a.Content.Length > 240 ? a.Content.Substring(0, 240) : a.Content,  // 只返回前 240 字符
                    ContentMarkdown = a.ContentMarkdown != null && a.ContentMarkdown.Length > 240
                        ? a.ContentMarkdown.Substring(0, 200) 
                        : a.ContentMarkdown
                })
                .ToListAsync();
        }

        public async Task<object> GetWithPaginationAsync(ArticleCategory? category = null, int? page = null, int? limit = null)
        {
            var query = _context.Articles.AsQueryable();

            if (category.HasValue)
            {
                query = query.Where(a => a.Category == category.Value);
            }

            var total = await query.CountAsync();
            var currentPage = page ?? 1;
            var pageSize = limit ?? 10;

            var articles = await query
                .OrderByDescending(a => a.CreatedAt)
                .Skip((currentPage - 1) * pageSize)
                .Take(pageSize)
                .Include(a => a.Comments)
                .ToListAsync();

            return new
            {
                data = articles,
                total,
                page = currentPage,
                pageSize,
                totalPages = (int)Math.Ceiling((double)total / pageSize)
            };
        }

        public async Task<List<Article>> GetByCategoryAsync(ArticleCategory category)
        {
            return await _context.Articles
                .Where(a => a.Category == category)
                .Include(a => a.Comments)
                .OrderByDescending(a => a.CreatedAt)
                .ToListAsync();
        }

        public async Task<List<Article>> GetFeaturedAsync(int limit = 5)
        {
            return await _context.Articles
                .OrderByDescending(a => a.CreatedAt)
                .Take(limit)
                .Include(a => a.Comments)
                .ToListAsync();
        }

        public async Task<Article?> GetByIdAsync(int id)
        {
            return await _context.Articles
                .Include(a => a.Comments)
                .FirstOrDefaultAsync(a => a.Id == id);
        }

        public async Task<Article?> UpdateAsync(int id, UpdateArticleDto dto)
        {
            var article = await _context.Articles.FindAsync(id);
            if (article == null) return null;

            if (dto.Title != null) article.Title = dto.Title;
            if (dto.Content != null) article.Content = dto.Content;
            if (dto.ContentMarkdown != null) article.ContentMarkdown = dto.ContentMarkdown;
            if (dto.CoverImage != null) article.CoverImage = dto.CoverImage;
            if (dto.Category.HasValue) article.Category = dto.Category.Value;

            article.UpdatedAt = DateTime.UtcNow;

            await _context.SaveChangesAsync();
            return article;
        }

        public async Task<bool> DeleteAsync(int id)
        {
            var article = await _context.Articles.FindAsync(id);
            if (article == null) return false;

            _context.Articles.Remove(article);
            await _context.SaveChangesAsync();
            return true;
        }
    }
}
