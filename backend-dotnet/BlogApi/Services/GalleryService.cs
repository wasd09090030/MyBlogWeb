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
            var galleries = await _context.Galleries
                .Where(g => g.IsActive)
                .OrderBy(g => g.SortOrder)
                .ToListAsync();

            await ApplyThumbnailUrlsAsync(galleries);
            return galleries;
        }

        public async Task<List<Gallery>> GetAllAsync()
        {
            var galleries = await _context.Galleries
                .OrderBy(g => g.SortOrder)
                .ToListAsync();

            await ApplyThumbnailUrlsAsync(galleries);
            return galleries;
        }

        public async Task<Gallery?> GetByIdAsync(int id)
        {
            var gallery = await _context.Galleries.FindAsync(id);
            if (gallery != null)
            {
                await ApplyThumbnailUrlAsync(gallery);
            }
            return gallery;
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
            await ApplyThumbnailUrlAsync(gallery);
            return gallery;
        }

        private async Task ApplyThumbnailUrlsAsync(List<Gallery> galleries)
        {
            if (galleries.Count == 0) return;
            var config = await _context.CfImageConfigs.AsNoTracking().FirstOrDefaultAsync();
            foreach (var gallery in galleries)
            {
                gallery.ThumbnailUrl = BuildThumbnailUrl(gallery.ImageUrl, config);
            }
        }

        private async Task ApplyThumbnailUrlAsync(Gallery gallery)
        {
            var config = await _context.CfImageConfigs.AsNoTracking().FirstOrDefaultAsync();
            gallery.ThumbnailUrl = BuildThumbnailUrl(gallery.ImageUrl, config);
        }

        private string? BuildThumbnailUrl(string imageUrl, CfImageConfig? config)
        {
            if (string.IsNullOrWhiteSpace(imageUrl)) return null;
            if (config == null || !config.IsEnabled) return imageUrl;
            if (!Uri.TryCreate(imageUrl, UriKind.Absolute, out var sourceUri)) return imageUrl;

            if (config.UseWorker)
            {
                var workerUrl = BuildWorkerThumbnailUrl(sourceUri, config);
                return string.IsNullOrWhiteSpace(workerUrl) ? imageUrl : workerUrl;
            }

            return BuildCdnThumbnailUrl(sourceUri, imageUrl, config);
        }

        private string? BuildCdnThumbnailUrl(Uri sourceUri, string imageUrl, CfImageConfig config)
        {
            string? baseHost = null;
            string? zoneScheme = null;
            if (!string.IsNullOrWhiteSpace(config.ZoneDomain))
            {
                var trimmedZone = config.ZoneDomain.Trim();
                if (Uri.TryCreate(trimmedZone, UriKind.Absolute, out var zoneUri))
                {
                    baseHost = zoneUri.Host;
                    zoneScheme = zoneUri.Scheme;
                }
                else
                {
                    baseHost = trimmedZone;
                }
            }

            baseHost ??= sourceUri.Host;

            var scheme = config.UseHttps
                ? "https"
                : (string.IsNullOrWhiteSpace(zoneScheme) ? sourceUri.Scheme : zoneScheme);

            var options = new List<string>();
            if (!string.IsNullOrWhiteSpace(config.Fit)) options.Add($"fit={config.Fit}");
            if (config.Width > 0) options.Add($"width={config.Width}");
            if (config.Quality > 0) options.Add($"quality={config.Quality}");
            if (!string.IsNullOrWhiteSpace(config.Format)) options.Add($"format={config.Format}");

            var optionString = options.Count > 0 ? string.Join(',', options) : "";

            var baseUrl = $"{scheme}://{baseHost}/cdn-cgi/image/{optionString}/{imageUrl}";
            var signature = BuildSignature(optionString, imageUrl, config);
            if (!string.IsNullOrWhiteSpace(signature))
            {
                baseUrl = baseUrl.Contains('?') ? $"{baseUrl}&{signature}" : $"{baseUrl}?{signature}";
            }

            return baseUrl;
        }

        private string? BuildWorkerThumbnailUrl(Uri sourceUri, CfImageConfig config)
        {
            if (string.IsNullOrWhiteSpace(config.WorkerBaseUrl)) return null;
            if (string.IsNullOrWhiteSpace(config.SignatureSecret)) return null;

            var baseUrl = config.WorkerBaseUrl.Trim().TrimEnd('/');

            var path = sourceUri.AbsolutePath;
            if (path.StartsWith("/file/", StringComparison.OrdinalIgnoreCase))
            {
                path = path.Substring("/file/".Length);
            }
            else
            {
                path = path.TrimStart('/');
            }

            if (string.IsNullOrWhiteSpace(path)) return null;

            var width = config.Width > 0 ? config.Width : 300;
            var quality = config.Quality > 0 ? config.Quality : 50;
            var format = string.IsNullOrWhiteSpace(config.Format) ? "webp" : config.Format;
            var fit = string.IsNullOrWhiteSpace(config.Fit) ? "scale-down" : config.Fit;
            var ttl = config.TokenTtlSeconds > 0 ? config.TokenTtlSeconds : 3600;
            var exp = DateTimeOffset.UtcNow.ToUnixTimeSeconds() + ttl;

            var data = $"{path}|{width}|{quality}|{format}|{fit}|{exp}";
            var sig = BuildHmacSignature(data, config.SignatureSecret);
            if (string.IsNullOrWhiteSpace(sig)) return null;

            var param = string.IsNullOrWhiteSpace(config.SignatureParam) ? "sig" : config.SignatureParam.Trim();

            return $"{baseUrl}/thumb/{path}?w={width}&q={quality}&fmt={format}&fit={fit}&exp={exp}&{param}={sig}";
        }

        private string? BuildSignature(string optionString, string imageUrl, CfImageConfig config)
        {
            if (!string.IsNullOrWhiteSpace(config.SignatureSecret))
            {
                var param = string.IsNullOrWhiteSpace(config.SignatureParam) ? "sig" : config.SignatureParam.Trim();
                var data = $"{optionString}|{imageUrl}";
                var sig = BuildHmacSignature(data, config.SignatureSecret);
                return $"{param}={sig}";
            }

            if (!string.IsNullOrWhiteSpace(config.SignatureToken))
            {
                var param = string.IsNullOrWhiteSpace(config.SignatureParam) ? "sig" : config.SignatureParam.Trim();
                return $"{param}={config.SignatureToken}";
            }

            return null;
        }

        private string? BuildHmacSignature(string data, string secret)
        {
            using var hmac = new System.Security.Cryptography.HMACSHA256(System.Text.Encoding.UTF8.GetBytes(secret));
            var hash = hmac.ComputeHash(System.Text.Encoding.UTF8.GetBytes(data));
            return Convert.ToHexString(hash).ToLowerInvariant();
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
            await ApplyThumbnailUrlAsync(gallery);
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

            await ApplyThumbnailUrlsAsync(galleries);
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
