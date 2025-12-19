using Microsoft.EntityFrameworkCore;
using BlogApi.Data;
using BlogApi.Models;
using BlogApi.DTOs;

namespace BlogApi.Services
{
    public class GalleryService
    {
        private readonly BlogDbContext _context;

        public GalleryService(BlogDbContext context)
        {
            _context = context;
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
                ImageUrl = dto.ImageUrl,
                SortOrder = dto.SortOrder > 0 ? dto.SortOrder : maxSortOrder + 1,
                IsActive = dto.IsActive,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };

            _context.Galleries.Add(gallery);
            await _context.SaveChangesAsync();
            return gallery;
        }

        public async Task<Gallery?> UpdateAsync(int id, UpdateGalleryDto dto)
        {
            var gallery = await _context.Galleries.FindAsync(id);
            if (gallery == null) return null;

            if (dto.ImageUrl != null) gallery.ImageUrl = dto.ImageUrl;
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

                var gallery = new Gallery
                {
                    ImageUrl = imageUrl.Trim(),
                    SortOrder = sortOrder++,
                    IsActive = dto.IsActive,
                    CreatedAt = DateTime.UtcNow,
                    UpdatedAt = DateTime.UtcNow
                };

                galleries.Add(gallery);
            }

            if (galleries.Any())
            {
                _context.Galleries.AddRange(galleries);
                await _context.SaveChangesAsync();
            }

            return galleries;
        }
    }
}
