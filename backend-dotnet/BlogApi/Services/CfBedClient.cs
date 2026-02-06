using System;
using System.Collections.Generic;
using System.IO;
using System.Net.Http;
using System.Net.Http.Headers;
using System.Text.Json;
using System.Threading.Tasks;
using BlogApi.Models;
using Microsoft.AspNetCore.WebUtilities;
using Microsoft.AspNetCore.StaticFiles;
using Microsoft.Extensions.Logging;

namespace BlogApi.Services
{
    public class CfBedClient
    {
        private readonly HttpClient _httpClient;
        private readonly ILogger<CfBedClient> _logger;

        public CfBedClient(HttpClient httpClient, ILogger<CfBedClient> logger)
        {
            _httpClient = httpClient;
            _logger = logger;
        }

        public async Task<string> UploadAsync(ImagebedConfig config, string filePath, string uploadFolder)
        {
            if (config == null)
            {
                throw new InvalidOperationException("图床配置未设置");
            }

            if (string.IsNullOrWhiteSpace(config.Domain) || string.IsNullOrWhiteSpace(config.ApiToken))
            {
                throw new InvalidOperationException("图床配置未设置");
            }

            if (string.IsNullOrWhiteSpace(filePath) || !File.Exists(filePath))
            {
                throw new FileNotFoundException("待上传文件不存在", filePath);
            }

            var baseUrl = NormalizeBaseUrl(config.Domain);
            var query = new Dictionary<string, string>
            {
                ["uploadChannel"] = "cfr2",
                ["returnFormat"] = "default"
            };

            if (!string.IsNullOrWhiteSpace(uploadFolder))
            {
                query["uploadFolder"] = uploadFolder;
            }

            var url = QueryHelpers.AddQueryString($"{baseUrl}/upload", query);

            await using var fileStream = File.OpenRead(filePath);
            using var form = new MultipartFormDataContent();
            var fileContent = new StreamContent(fileStream);
            var contentTypeProvider = new FileExtensionContentTypeProvider();
            if (!contentTypeProvider.TryGetContentType(filePath, out var contentType))
            {
                contentType = "application/octet-stream";
            }
            fileContent.Headers.ContentType = new MediaTypeHeaderValue(contentType);
            form.Add(fileContent, "file", Path.GetFileName(filePath));

            using var request = new HttpRequestMessage(HttpMethod.Post, url)
            {
                Content = form
            };
            request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", config.ApiToken);
            request.Headers.UserAgent.ParseAdd("Mozilla/5.0 (compatible; BlogApi/1.0)");

            using var response = await _httpClient.SendAsync(request);
            var responseText = await response.Content.ReadAsStringAsync();

            if (!response.IsSuccessStatusCode)
            {
                _logger.LogWarning("ImgBed upload failed: {StatusCode} {Body}", response.StatusCode, responseText);
                var statusCode = (int)response.StatusCode;
                var message = string.IsNullOrWhiteSpace(responseText)
                    ? $"上传失败: {statusCode}"
                    : $"上传失败: {statusCode} - {responseText}";
                throw new InvalidOperationException(message);
            }

            using var doc = JsonDocument.Parse(responseText);
            if (doc.RootElement.ValueKind == JsonValueKind.Array && doc.RootElement.GetArrayLength() > 0)
            {
                var first = doc.RootElement[0];
                if (first.TryGetProperty("src", out var srcElement))
                {
                    var src = srcElement.GetString();
                    if (!string.IsNullOrWhiteSpace(src))
                    {
                        return src;
                    }
                }
            }

            throw new InvalidOperationException("上传返回格式异常");
        }

        public async Task DeleteAsync(ImagebedConfig config, string path, bool isFolder)
        {
            if (config == null)
            {
                throw new InvalidOperationException("图床配置未设置");
            }

            if (string.IsNullOrWhiteSpace(config.Domain) || string.IsNullOrWhiteSpace(config.ApiToken))
            {
                throw new InvalidOperationException("图床配置未设置");
            }

            if (string.IsNullOrWhiteSpace(path))
            {
                throw new InvalidOperationException("删除路径不能为空");
            }

            var baseUrl = NormalizeBaseUrl(config.Domain);
            var encodedPath = Uri.EscapeDataString(path);
            var url = $"{baseUrl}/api/manage/delete/{encodedPath}";
            if (isFolder)
            {
                url = QueryHelpers.AddQueryString(url, "folder", "true");
            }

            using var request = new HttpRequestMessage(HttpMethod.Get, url);
            request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", config.ApiToken);
            request.Headers.UserAgent.ParseAdd("Mozilla/5.0 (compatible; BlogApi/1.0)");

            using var response = await _httpClient.SendAsync(request);
            var responseText = await response.Content.ReadAsStringAsync();

            if (!response.IsSuccessStatusCode)
            {
                _logger.LogWarning("ImgBed delete failed: {StatusCode} {Body}", response.StatusCode, responseText);
                var statusCode = (int)response.StatusCode;
                var message = string.IsNullOrWhiteSpace(responseText)
                    ? $"删除失败: {statusCode}"
                    : $"删除失败: {statusCode} - {responseText}";
                throw new InvalidOperationException(message);
            }

            if (!string.IsNullOrWhiteSpace(responseText))
            {
                using var doc = JsonDocument.Parse(responseText);
                if (doc.RootElement.ValueKind == JsonValueKind.Object
                    && doc.RootElement.TryGetProperty("success", out var successElement)
                    && successElement.ValueKind == JsonValueKind.False)
                {
                    var error = doc.RootElement.TryGetProperty("error", out var errorElement)
                        ? errorElement.GetString()
                        : "Delete failed";
                    throw new InvalidOperationException(error ?? "Delete failed");
                }
            }
        }

        private static string NormalizeBaseUrl(string domain)
        {
            if (!Uri.TryCreate(domain, UriKind.Absolute, out var uri))
            {
                throw new InvalidOperationException("图床域名格式无效");
            }

            var builder = new UriBuilder(uri)
            {
                Path = string.Empty,
                Query = string.Empty,
                Fragment = string.Empty
            };

            return builder.Uri.ToString().TrimEnd('/');
        }
    }
}
