using Microsoft.EntityFrameworkCore;
using BlogApi.Models;

namespace BlogApi.Data
{
    public class BlogDbContext : DbContext
    {
        public BlogDbContext(DbContextOptions<BlogDbContext> options) : base(options)
        {
        }

        public DbSet<Article> Articles { get; set; }
        public DbSet<Comment> Comments { get; set; }
        public DbSet<Like> Likes { get; set; }
        public DbSet<Gallery> Galleries { get; set; }

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);

            // Article configuration
            modelBuilder.Entity<Article>(entity =>
            {
                entity.ToTable("articles");
                entity.HasKey(e => e.Id);
                entity.Property(e => e.Id).HasColumnName("id");
                entity.Property(e => e.Title).HasColumnName("title").IsRequired();
                entity.Property(e => e.Content).HasColumnName("content").IsRequired();
                entity.Property(e => e.ContentMarkdown).HasColumnName("contentMarkdown");
                entity.Property(e => e.CoverImage).HasColumnName("coverImage");
                entity.Property(e => e.Category)
                    .HasColumnName("category")
                    .HasConversion(
                        v => v.ToString().ToLower(),  // 存储时转为小写
                        v => string.IsNullOrEmpty(v) ? ArticleCategory.Other : 
                             Enum.Parse<ArticleCategory>(char.ToUpper(v[0]) + (v.Length > 1 ? v.Substring(1).ToLower() : ""), true) // 读取时首字母大写
                    )
                    .HasDefaultValue(ArticleCategory.Other);
                entity.Property(e => e.CreatedAt).HasColumnName("createdAt");
                entity.Property(e => e.UpdatedAt).HasColumnName("updatedAt");
                entity.HasMany(e => e.Comments)
                    .WithOne(c => c.Article)
                    .HasForeignKey(c => c.ArticleId)
                    .OnDelete(DeleteBehavior.Cascade);
            });

            // Comment configuration
            modelBuilder.Entity<Comment>(entity =>
            {
                entity.ToTable("Comment");
                entity.HasKey(e => e.Id);
                entity.Property(e => e.Content).IsRequired();
                entity.Property(e => e.Author).IsRequired();
                entity.Property(e => e.Status).HasDefaultValue("pending");
                entity.Property(e => e.Likes).HasDefaultValue(0);
            });

            // Like configuration
            modelBuilder.Entity<Like>(entity =>
            {
                entity.ToTable("Like");
                entity.HasKey(e => e.Id);
                entity.Property(e => e.Type).HasDefaultValue("article");
            });

            // Gallery configuration
            modelBuilder.Entity<Gallery>(entity =>
            {
                entity.ToTable("galleries");
                entity.HasKey(e => e.Id);
                entity.Property(e => e.Title).IsRequired();
                entity.Property(e => e.ImageUrl).IsRequired();
                entity.Property(e => e.SortOrder).HasDefaultValue(0);
                entity.Property(e => e.IsActive).HasDefaultValue(true);
            });
        }
    }
}
