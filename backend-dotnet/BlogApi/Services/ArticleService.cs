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

        public async Task<object> GetAllSummaryAsync(ArticleCategory? category = null, int? page = null, int? limit = null)
        {
            var query = _context.Articles.AsQueryable();

            if (category.HasValue)
            {
                query = query.Where(a => a.Category == category.Value);
            }

            // 先统计总数
            var total = await query.CountAsync();
            
            // 排序后再分页
            query = query.OrderByDescending(a => a.CreatedAt);

            if (page.HasValue && limit.HasValue)
            {
                query = query.Skip((page.Value - 1) * limit.Value).Take(limit.Value);
            }

            var data = await query
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

            // 返回分页结构，与 GetWithPaginationAsync 保持一致
            var currentPage = page ?? 1;
            var pageSize = limit ?? data.Count;

            return new
            {
                data,
                total,
                page = currentPage,
                pageSize,
                totalPages = pageSize > 0 ? (int)Math.Ceiling((double)total / pageSize) : 1
            };
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
            // 获取所有文章的ID
            var allIds = await _context.Articles
                .Select(a => a.Id)
                .ToListAsync();

            if (allIds.Count == 0)
                return new List<Article>();

            // 随机选择ID
            var random = new Random();
            var selectedIds = allIds
                .OrderBy(x => random.Next())
                .Take(Math.Min(limit, allIds.Count))
                .ToList();

            // 获取选中的文章
            return await _context.Articles
                .Where(a => selectedIds.Contains(a.Id))
                .Include(a => a.Comments)
                .ToListAsync();
        }

        public async Task<List<ArticleSummaryDto>> SearchAsync(string keyword)
        {
            var query = _context.Articles.AsQueryable();

            // 在标题和内容中搜索关键词（不区分大小写）
            query = query.Where(a => 
                EF.Functions.Like(a.Title, $"%{keyword}%") || 
                EF.Functions.Like(a.Content, $"%{keyword}%") ||
                (a.ContentMarkdown != null && EF.Functions.Like(a.ContentMarkdown, $"%{keyword}%"))
            );

            return await query
                .OrderByDescending(a => a.CreatedAt)
                .Take(50) // 限制最多返回50条结果
                .Select(a => new ArticleSummaryDto
                {
                    Id = a.Id,
                    Title = a.Title,
                    CoverImage = a.CoverImage,
                    Category = a.Category,
                    CreatedAt = a.CreatedAt,
                    UpdatedAt = a.UpdatedAt,
                    Content = a.Content.Length > 240 ? a.Content.Substring(0, 240) : a.Content,
                    ContentMarkdown = a.ContentMarkdown != null && a.ContentMarkdown.Length > 240
                        ? a.ContentMarkdown.Substring(0, 200) 
                        : a.ContentMarkdown
                })
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
