using Microsoft.EntityFrameworkCore;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.IdentityModel.Tokens;
using System.Text;
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

builder.Services.AddHttpClient();

// Add services
builder.Services.AddScoped<ArticleService>();
builder.Services.AddScoped<CommentService>();
builder.Services.AddScoped<GalleryService>();
builder.Services.AddScoped<AuthService>();
builder.Services.AddScoped<JwtService>();
builder.Services.AddScoped<DeepSeekService>();
builder.Services.AddScoped<ImagebedService>();
builder.Services.AddScoped<CfImageConfigService>();

// JWT 认证配置
var jwtSecretKey = builder.Configuration["Jwt:SecretKey"] 
    ?? throw new InvalidOperationException("JWT SecretKey 未在配置中设置");

builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuer = true,
            ValidateAudience = true,
            ValidateLifetime = true,
            ValidateIssuerSigningKey = true,
            ValidIssuer = builder.Configuration["Jwt:Issuer"],
            ValidAudience = builder.Configuration["Jwt:Audience"],
            IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtSecretKey)),
            ClockSkew = TimeSpan.Zero // 不允许时间偏差
        };

        // 自定义认证失败响应
        options.Events = new JwtBearerEvents
        {
            OnAuthenticationFailed = context =>
            {
                if (context.Exception.GetType() == typeof(SecurityTokenExpiredException))
                {
                    context.Response.Headers.Append("Token-Expired", "true");
                }
                return Task.CompletedTask;
            }
        };
    });

builder.Services.AddAuthorization();

// Add CORS
builder.Services.AddCors(options =>
{
    options.AddDefaultPolicy(policy =>
    {
        policy.AllowAnyOrigin()
              .AllowAnyMethod()
              .AllowAnyHeader()
              .WithExposedHeaders("Token-Expired"); // 暴露自定义头
    });
});

var app = builder.Build();

// Ensure database is created
using (var scope = app.Services.CreateScope())
{
    var dbContext = scope.ServiceProvider.GetRequiredService<BlogDbContext>();
    dbContext.Database.EnsureCreated();
    EnsureCfImageConfigTable(dbContext);
}

// Configure the HTTP request pipeline
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseCors();

app.UseHttpsRedirection();

app.UseAuthentication();  // 认证中间件必须在授权之前
app.UseAuthorization();

app.MapControllers();

app.Run();

static void EnsureCfImageConfigTable(BlogDbContext dbContext)
{
    const string sql = @"
CREATE TABLE IF NOT EXISTS cf_image_configs (
    Id INTEGER PRIMARY KEY AUTOINCREMENT,
    IsEnabled INTEGER NOT NULL DEFAULT 1,
    ZoneDomain TEXT NULL,
    UseHttps INTEGER NOT NULL DEFAULT 1,
    Fit TEXT NOT NULL DEFAULT 'scale-down',
    Width INTEGER NOT NULL DEFAULT 300,
    Quality INTEGER NOT NULL DEFAULT 50,
    Format TEXT NOT NULL DEFAULT 'webp',
    SignatureParam TEXT NOT NULL DEFAULT 'sig',
    UseWorker INTEGER NOT NULL DEFAULT 0,
    WorkerBaseUrl TEXT NULL,
    TokenTtlSeconds INTEGER NOT NULL DEFAULT 3600,
    SignatureToken TEXT NULL,
    SignatureSecret TEXT NULL,
    CreatedAt TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UpdatedAt TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);";

    dbContext.Database.ExecuteSqlRaw(sql);

    TryAddColumn(dbContext, "ALTER TABLE cf_image_configs ADD COLUMN UseWorker INTEGER NOT NULL DEFAULT 0;");
    TryAddColumn(dbContext, "ALTER TABLE cf_image_configs ADD COLUMN WorkerBaseUrl TEXT NULL;");
    TryAddColumn(dbContext, "ALTER TABLE cf_image_configs ADD COLUMN TokenTtlSeconds INTEGER NOT NULL DEFAULT 3600;");
}

static void TryAddColumn(BlogDbContext dbContext, string sql)
{
    try
    {
        dbContext.Database.ExecuteSqlRaw(sql);
    }
    catch
    {
        // Ignore if the column already exists.
    }
}
