using Microsoft.EntityFrameworkCore;
using BlogApi.Data;
using BlogApi.Services;
using System.Text.Json.Serialization;
using BlogApi.Utils;
using BlogApi.Models;

var builder = WebApplication.CreateBuilder(args);

// Add services to the container
builder.Services.AddControllers()
    .AddJsonOptions(options =>
    {
        options.JsonSerializerOptions.ReferenceHandler = ReferenceHandler.IgnoreCycles;
        // 移除全局的 JsonStringEnumConverter，因为我们在 ArticleCategory 上使用了自定义转换器
        // options.JsonSerializerOptions.Converters.Add(new JsonStringEnumConverter());
    });

builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

// Add DbContext
builder.Services.AddDbContext<BlogDbContext>(options =>
    options.UseSqlite("Data Source=blog.sqlite"));

// Add services
builder.Services.AddScoped<ArticleService>();
builder.Services.AddScoped<CommentService>();
builder.Services.AddScoped<GalleryService>();
builder.Services.AddScoped<AuthService>();
builder.Services.AddScoped<DeepSeekService>();

// Add CORS
builder.Services.AddCors(options =>
{
    options.AddDefaultPolicy(policy =>
    {
        policy.AllowAnyOrigin()
              .AllowAnyMethod()
              .AllowAnyHeader();
    });
});

var app = builder.Build();

// Ensure database is created
using (var scope = app.Services.CreateScope())
{
    var dbContext = scope.ServiceProvider.GetRequiredService<BlogDbContext>();
    dbContext.Database.EnsureCreated();
}

// Configure the HTTP request pipeline
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseCors();

app.UseHttpsRedirection();

app.UseAuthorization();

app.MapControllers();

app.Run();
