using Microsoft.EntityFrameworkCore;
using BlogApi.Data;
using BlogApi.Models;
using BlogApi.DTOs;
using SixLabors.ImageSharp;

namespace BlogApi.Services
{
    public class GalleryService
    {
        private readonly BlogDbContext _context;
        private readonly HttpClient _httpClient;
        private readonly ILogger<GalleryService> _logger;

        public GalleryService(BlogDbContext context, IHttpClientFactory httpClientFactory, ILogger<GalleryService> logger)
        {
            _context = context;
            _httpClient = httpClientFactory.CreateClient();
            _httpClient.Timeout = TimeSpan.FromSeconds(10);
            _logger = logger;
        }

        public async Task<List<Gallery>> GetAllActiveAsync()
        {
            return await _context.Galleries
                .Where(g => g.IsActive)
                .OrderBy(g => g.SortOrder)
                .ToListAsync();
        }

        public async Task<List<Gallery>> GetAllAsync()
        {
            return await _context.Galleries
                .OrderBy(g => g.SortOrder)
                .ToListAsync();
        }

        public async Task<Gallery?> GetByIdAsync(int id)
        {
            return await _context.Galleries.FindAsync(id);
        }

        public async Task<Gallery> CreateAsync(CreateGalleryDto dto)
        {
            // 如果未指定排序，自动分配到最后
            var maxSortOrder = await _context.Galleries.AnyAsync() 
                ? await _context.Galleries.MaxAsync(g => g.SortOrder) 
                : -1;
            
            var gallery = new Gallery
            {
                ImageUrl = dto.ImageUrl.Trim(),
                SortOrder = dto.SortOrder > 0 ? dto.SortOrder : maxSortOrder + 1,
                IsActive = dto.IsActive,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };

            var (width, height) = await TryFetchImageSizeAsync(gallery.ImageUrl);
            gallery.ImageWidth = width;
            gallery.ImageHeight = height;

            _context.Galleries.Add(gallery);
            await _context.SaveChangesAsync();
            return gallery;
        }

        public async Task<Gallery?> UpdateAsync(int id, UpdateGalleryDto dto)
        {
            var gallery = await _context.Galleries.FindAsync(id);
            if (gallery == null) return null;

            if (dto.ImageUrl != null)
            {
                gallery.ImageUrl = dto.ImageUrl.Trim();
                var (width, height) = await TryFetchImageSizeAsync(gallery.ImageUrl);
                gallery.ImageWidth = width;
                gallery.ImageHeight = height;
            }
            if (dto.SortOrder.HasValue) gallery.SortOrder = dto.SortOrder.Value;
            if (dto.IsActive.HasValue) gallery.IsActive = dto.IsActive.Value;

            gallery.UpdatedAt = DateTime.UtcNow;

            await _context.SaveChangesAsync();
            return gallery;
        }

        public async Task<bool> DeleteAsync(int id)
        {
            var gallery = await _context.Galleries.FindAsync(id);
            if (gallery == null) return false;

            _context.Galleries.Remove(gallery);
            await _context.SaveChangesAsync();
            return true;
        }

        public async Task<bool> UpdateSortOrderAsync(List<UpdateSortOrderDto> updates)
        {
            foreach (var update in updates)
            {
                var gallery = await _context.Galleries.FindAsync(update.Id);
                if (gallery != null)
                {
                    gallery.SortOrder = update.SortOrder;
                    gallery.UpdatedAt = DateTime.UtcNow;
                }
            }

            await _context.SaveChangesAsync();
            return true;
        }

        public async Task<Gallery?> ToggleActiveAsync(int id)
        {
            var gallery = await _context.Galleries.FindAsync(id);
            if (gallery == null) return null;

            gallery.IsActive = !gallery.IsActive;
            gallery.UpdatedAt = DateTime.UtcNow;

            await _context.SaveChangesAsync();
            return gallery;
        }

        public async Task<List<Gallery>> BatchImportAsync(BatchImportGalleryDto dto)
        {
            var maxSortOrder = await _context.Galleries.AnyAsync() 
                ? await _context.Galleries.MaxAsync(g => g.SortOrder) 
                : -1;

            var galleries = new List<Gallery>();
            var sortOrder = maxSortOrder + 1;

            foreach (var imageUrl in dto.ImageUrls)
            {
                if (string.IsNullOrWhiteSpace(imageUrl)) continue;

                var trimmedUrl = imageUrl.Trim();
                var gallery = new Gallery
                {
                    ImageUrl = trimmedUrl,
                    SortOrder = sortOrder++,
                    IsActive = dto.IsActive,
                    CreatedAt = DateTime.UtcNow,
                    UpdatedAt = DateTime.UtcNow
                };

                var (width, height) = await TryFetchImageSizeAsync(trimmedUrl);
                gallery.ImageWidth = width;
                gallery.ImageHeight = height;

                galleries.Add(gallery);
            }

            if (galleries.Any())
            {
                _context.Galleries.AddRange(galleries);
                await _context.SaveChangesAsync();
            }

            return galleries;
        }

        public async Task<GalleryRefreshResultDto> RefreshAllDimensionsAsync()
        {
            var galleries = await _context.Galleries
                .OrderBy(g => g.Id)
                .ToListAsync();

            var updated = 0;
            var failed = 0;

            foreach (var gallery in galleries)
            {
                var (width, height) = await TryFetchImageSizeAsync(gallery.ImageUrl);
                if (width.HasValue && height.HasValue)
                {
                    gallery.ImageWidth = width;
                    gallery.ImageHeight = height;
                    gallery.UpdatedAt = DateTime.UtcNow;
                    updated++;
                }
                else
                {
                    failed++;
                }
            }

            if (updated > 0)
            {
                await _context.SaveChangesAsync();
            }

            return new GalleryRefreshResultDto
            {
                Total = galleries.Count,
                Updated = updated,
                Failed = failed
            };
        }

        private async Task<(int? Width, int? Height)> TryFetchImageSizeAsync(string imageUrl)
        {
            if (string.IsNullOrWhiteSpace(imageUrl)) return (null, null);
            if (!Uri.TryCreate(imageUrl, UriKind.Absolute, out var uri)) return (null, null);

            try
            {
                using var response = await _httpClient.GetAsync(uri, HttpCompletionOption.ResponseHeadersRead);
                if (!response.IsSuccessStatusCode)
                {
                    _logger.LogWarning("获取图片失败: {StatusCode} {Url}", response.StatusCode, imageUrl);
                    return (null, null);
                }

                var mediaType = response.Content.Headers.ContentType?.MediaType;
                if (mediaType != null && !mediaType.StartsWith("image/", StringComparison.OrdinalIgnoreCase))
                {
                    _logger.LogWarning("URL 返回内容非图片类型: {MediaType} {Url}", mediaType, imageUrl);
                    return (null, null);
                }

                var contentLength = response.Content.Headers.ContentLength;
                if (contentLength.HasValue && contentLength.Value > 20 * 1024 * 1024)
                {
                    _logger.LogWarning("图片过大，跳过解析: {ContentLength} {Url}", contentLength.Value, imageUrl);
                    return (null, null);
                }

                await using var stream = await response.Content.ReadAsStreamAsync();
                var info = await Image.IdentifyAsync(stream);
                if (info == null)
                {
                    _logger.LogWarning("无法识别图片信息: {Url}", imageUrl);
                    return (null, null);
                }

                return (info.Width, info.Height);
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "解析图片尺寸失败: {Url}", imageUrl);
                return (null, null);
            }
        }
    }
}
