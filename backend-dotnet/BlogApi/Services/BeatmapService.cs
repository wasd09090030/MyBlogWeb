using System;
using System.Collections.Generic;
using System.Globalization;
using System.IO;
using System.IO.Compression;
using System.Linq;
using System.Text;
using System.Text.Json;
using System.Threading.Tasks;
using BlogApi.Data;
using BlogApi.DTOs;
using BlogApi.Models;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using Microsoft.AspNetCore.Http;

namespace BlogApi.Services
{
    public class BeatmapService
    {
        private static readonly HashSet<string> AllowedExtensions = new(StringComparer.OrdinalIgnoreCase)
        {
            ".osu",
            ".ogg",
            ".mp3",
            ".wav",
            ".flac",
            ".png",
            ".jpg",
            ".jpeg",
            ".webp",
            ".bmp",
            ".gif"
        };

        private readonly BlogDbContext _context;
        private readonly ImagebedService _imagebedService;
        private readonly CfBedClient _cfBedClient;
        private readonly ILogger<BeatmapService> _logger;

        public BeatmapService(
            BlogDbContext context,
            ImagebedService imagebedService,
            CfBedClient cfBedClient,
            ILogger<BeatmapService> logger)
        {
            _context = context;
            _imagebedService = imagebedService;
            _cfBedClient = cfBedClient;
            _logger = logger;
        }

        public async Task<BeatmapSet> CreateFromOszAsync(IFormFile oszFile)
        {
            if (oszFile == null || oszFile.Length == 0)
            {
                throw new InvalidOperationException("上传文件为空");
            }

            var ext = Path.GetExtension(oszFile.FileName);
            if (!string.Equals(ext, ".osz", StringComparison.OrdinalIgnoreCase))
            {
                throw new InvalidOperationException("仅支持 .osz 文件");
            }

            var storageKey = BuildStorageKey(oszFile?.FileName);
            var tempRoot = Path.Combine(Path.GetTempPath(), $"beatmap-{Guid.NewGuid():N}");
            Directory.CreateDirectory(tempRoot);

            var tempPath = Path.Combine(tempRoot, $"{Guid.NewGuid():N}.osz");
            await using (var stream = File.Create(tempPath))
            {
                await oszFile.CopyToAsync(stream);
            }

            Dictionary<string, string> uploadedFiles = new(StringComparer.OrdinalIgnoreCase);
            try
            {
                ExtractZipSafe(tempPath, tempRoot);

                var osuFiles = Directory.GetFiles(tempRoot, "*.osu", SearchOption.AllDirectories);
                if (osuFiles.Length == 0)
                {
                    throw new InvalidOperationException("未找到 .osu 文件");
                }

                var maniaResults = new List<BeatmapParseResult>();
                foreach (var osuPath in osuFiles)
                {
                    var relativePath = NormalizeRelativePath(Path.GetRelativePath(tempRoot, osuPath));
                    var result = ParseOsuFile(tempRoot, osuPath, relativePath);
                    if (result.IsMania)
                    {
                        maniaResults.Add(result);
                    }
                }
                if (maniaResults.Count == 0)
                {
                    throw new InvalidOperationException("未找到 osu!mania 谱面");
                }

                var primary = maniaResults[0];
                var oszInfo = ParseOszFileName(oszFile.FileName);
                var resolvedTitle = !string.IsNullOrWhiteSpace(oszInfo.Title) ? oszInfo.Title : primary.Title;
                var resolvedArtist = !string.IsNullOrWhiteSpace(oszInfo.Artist) ? oszInfo.Artist : primary.Artist;
                var createdAt = oszInfo.CreatedAt ?? DateTime.UtcNow;

                var config = await _imagebedService.GetConfigAsync();
                if (config == null || string.IsNullOrWhiteSpace(config.Domain) || string.IsNullOrWhiteSpace(config.ApiToken))
                {
                    throw new InvalidOperationException("图床配置未设置");
                }

                var uploadRoot = BuildUploadRoot(config.UploadFolder, storageKey);
                uploadedFiles = await UploadExtractedFilesAsync(tempRoot, uploadRoot, config);

                var beatmapSet = new BeatmapSet
                {
                    StorageKey = storageKey,
                    Title = resolvedTitle ?? "Unknown",
                    Artist = resolvedArtist ?? "Unknown",
                    Creator = primary.Creator ?? "Unknown",
                    BackgroundFile = MapUploadedSrc(uploadedFiles, primary.BackgroundFile),
                    AudioFile = MapUploadedSrc(uploadedFiles, primary.AudioFile),
                    PreviewTime = primary.PreviewTime,
                    CreatedAt = createdAt
                };

                _context.BeatmapSets.Add(beatmapSet);
                await _context.SaveChangesAsync();

                foreach (var result in maniaResults)
                {
                    var data = new ManiaBeatmapData
                    {
                        Columns = result.Columns,
                        AudioLeadIn = result.AudioLeadIn,
                        PreviewTime = result.PreviewTime,
                        TimingPoints = result.TimingPoints,
                        Notes = result.Notes
                    };

                    var difficulty = new BeatmapDifficulty
                    {
                        BeatmapSetId = beatmapSet.Id,
                        Version = result.Version ?? "Unknown",
                        Mode = 3,
                        Columns = result.Columns,
                        OverallDifficulty = result.OverallDifficulty,
                        Bpm = result.Bpm,
                        OsuFileName = result.OsuFileName,
                        DataJson = JsonSerializer.Serialize(data),
                        NoteCount = result.Notes.Count,
                        CreatedAt = createdAt
                    };

                    _context.BeatmapDifficulties.Add(difficulty);
                    beatmapSet.Difficulties.Add(difficulty);
                }

                await _context.SaveChangesAsync();

                return beatmapSet;
            }
            finally
            {
                TryDeleteFile(tempPath);
                TryDeleteDirectory(tempRoot);
            }
        }

        public async Task<BeatmapSet> CreateFromImportAsync(BeatmapImportRequestDto dto)
        {
            if (dto == null)
            {
                throw new InvalidOperationException("导入数据不能为空");
            }

            if (dto.OsuFiles == null || dto.OsuFiles.Count == 0)
            {
                throw new InvalidOperationException("未找到 .osu 文件");
            }

            var storageKey = string.IsNullOrWhiteSpace(dto.StorageKey)
                ? BuildStorageKey(dto.SourceFileName)
                : dto.StorageKey.Trim();

            var uploadedFiles = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase);
            if (dto.UploadedFiles != null)
            {
                foreach (var file in dto.UploadedFiles)
                {
                    if (string.IsNullOrWhiteSpace(file.Path) || string.IsNullOrWhiteSpace(file.Src))
                    {
                        continue;
                    }

                    var normalizedPath = NormalizeRelativePath(file.Path).TrimStart('/');
                    uploadedFiles[normalizedPath] = file.Src;
                }
            }

            var maniaResults = new List<BeatmapParseResult>();
            foreach (var osuFile in dto.OsuFiles)
            {
                if (string.IsNullOrWhiteSpace(osuFile?.Content))
                {
                    continue;
                }

                var relativePath = NormalizeRelativePath(osuFile.Path ?? string.Empty).TrimStart('/');
                var result = ParseOsuContent(osuFile.Content, relativePath, uploadedFiles);
                if (result.IsMania)
                {
                    maniaResults.Add(result);
                }
            }

            if (maniaResults.Count == 0)
            {
                throw new InvalidOperationException("未找到 osu!mania 谱面");
            }

            var primary = maniaResults[0];
            var oszInfo = ParseOszFileName(dto.SourceFileName ?? string.Empty);
            var resolvedTitle = !string.IsNullOrWhiteSpace(oszInfo.Title) ? oszInfo.Title : primary.Title;
            var resolvedArtist = !string.IsNullOrWhiteSpace(oszInfo.Artist) ? oszInfo.Artist : primary.Artist;
            var createdAt = oszInfo.CreatedAt ?? DateTime.UtcNow;

            var beatmapSet = new BeatmapSet
            {
                StorageKey = storageKey,
                Title = resolvedTitle ?? "Unknown",
                Artist = resolvedArtist ?? "Unknown",
                Creator = primary.Creator ?? "Unknown",
                BackgroundFile = MapUploadedSrc(uploadedFiles, primary.BackgroundFile),
                AudioFile = MapUploadedSrc(uploadedFiles, primary.AudioFile),
                PreviewTime = primary.PreviewTime,
                CreatedAt = createdAt
            };

            _context.BeatmapSets.Add(beatmapSet);
            await _context.SaveChangesAsync();

            foreach (var result in maniaResults)
            {
                var data = new ManiaBeatmapData
                {
                    Columns = result.Columns,
                    AudioLeadIn = result.AudioLeadIn,
                    PreviewTime = result.PreviewTime,
                    TimingPoints = result.TimingPoints,
                    Notes = result.Notes
                };

                var difficulty = new BeatmapDifficulty
                {
                    BeatmapSetId = beatmapSet.Id,
                    Version = result.Version ?? "Unknown",
                    Mode = 3,
                    Columns = result.Columns,
                    OverallDifficulty = result.OverallDifficulty,
                    Bpm = result.Bpm,
                    OsuFileName = result.OsuFileName,
                    DataJson = JsonSerializer.Serialize(data),
                    NoteCount = result.Notes.Count,
                    CreatedAt = createdAt
                };

                _context.BeatmapDifficulties.Add(difficulty);
                beatmapSet.Difficulties.Add(difficulty);
            }

            await _context.SaveChangesAsync();

            return beatmapSet;
        }

        public async Task<List<BeatmapSet>> GetAllSetsAsync()
        {
            return await _context.BeatmapSets
                .Include(s => s.Difficulties)
                .OrderByDescending(s => s.CreatedAt)
                .AsNoTracking()
                .ToListAsync();
        }

        public async Task<BeatmapSet?> GetSetByIdAsync(int id)
        {
            return await _context.BeatmapSets
                .Include(s => s.Difficulties)
                .AsNoTracking()
                .FirstOrDefaultAsync(s => s.Id == id);
        }

        public async Task<BeatmapDifficulty?> GetDifficultyByIdAsync(int id)
        {
            return await _context.BeatmapDifficulties
                .Include(d => d.BeatmapSet)
                .AsNoTracking()
                .FirstOrDefaultAsync(d => d.Id == id);
        }

        public async Task<bool> DeleteSetAsync(int id)
        {
            var set = await _context.BeatmapSets
                .Include(s => s.Difficulties)
                .FirstOrDefaultAsync(s => s.Id == id);

            if (set == null)
            {
                return false;
            }

            var config = await _imagebedService.GetConfigAsync();
            if (config == null || string.IsNullOrWhiteSpace(config.Domain) || string.IsNullOrWhiteSpace(config.ApiToken))
            {
                throw new InvalidOperationException("图床配置未设置");
            }

            var folderPath = ResolveBeatmapFolderPath(set, config);
            if (!string.IsNullOrWhiteSpace(folderPath))
            {
                await _cfBedClient.DeleteAsync(config, folderPath, true);
            }

            _context.BeatmapSets.Remove(set);
            await _context.SaveChangesAsync();
            return true;
        }

        private static string NormalizeRelativePath(string path)
        {
            return path.Replace('\\', '/');
        }

        private BeatmapParseResult ParseOsuContent(
            string content,
            string osuRelativePath,
            Dictionary<string, string> uploadedFiles)
        {
            var result = new BeatmapParseResult
            {
                OsuFileName = osuRelativePath
            };

            string? section = null;
            using var reader = new StringReader(content);
            string? rawLine;
            while ((rawLine = reader.ReadLine()) != null)
            {
                var line = rawLine.Trim();
                if (string.IsNullOrWhiteSpace(line) || line.StartsWith("//", StringComparison.Ordinal))
                {
                    continue;
                }

                if (line.StartsWith("[", StringComparison.Ordinal) && line.EndsWith("]", StringComparison.Ordinal))
                {
                    section = line.Substring(1, line.Length - 2);
                    continue;
                }

                switch (section)
                {
                    case "General":
                        ParseKeyValue(line, result.General);
                        break;
                    case "Metadata":
                        ParseKeyValue(line, result.Metadata);
                        break;
                    case "Difficulty":
                        ParseKeyValue(line, result.Difficulty);
                        break;
                    case "Events":
                        if (string.IsNullOrWhiteSpace(result.BackgroundFile))
                        {
                            var background = TryParseBackground(line);
                            if (!string.IsNullOrWhiteSpace(background))
                            {
                                result.BackgroundFile = ResolveAssetFromMap(osuRelativePath, background, uploadedFiles);
                            }
                        }
                        break;
                    case "TimingPoints":
                        var timingPoint = TryParseTimingPoint(line);
                        if (timingPoint != null)
                        {
                            result.TimingPoints.Add(timingPoint);
                        }
                        break;
                    case "HitObjects":
                        var note = TryParseManiaNote(line, result.Columns);
                        if (note != null)
                        {
                            result.Notes.Add(note);
                        }
                        break;
                }
            }

            result.Mode = ParseInt(result.General, "Mode", 0);
            result.IsMania = result.Mode == 3;

            result.Title = GetValue(result.Metadata, "Title") ?? GetValue(result.Metadata, "TitleUnicode");
            result.Artist = GetValue(result.Metadata, "Artist") ?? GetValue(result.Metadata, "ArtistUnicode");
            result.Creator = GetValue(result.Metadata, "Creator");
            result.Version = GetValue(result.Metadata, "Version");

            result.AudioLeadIn = ParseInt(result.General, "AudioLeadIn", null);
            result.PreviewTime = ParseInt(result.General, "PreviewTime", null);

            var audioFilename = GetValue(result.General, "AudioFilename");
            if (!string.IsNullOrWhiteSpace(audioFilename))
            {
                result.AudioFile = ResolveAssetFromMap(osuRelativePath, audioFilename, uploadedFiles);
            }

            var circleSize = ParseDouble(result.Difficulty, "CircleSize", 4d);
            result.Columns = Math.Max(1, (int)Math.Round(circleSize));
            result.OverallDifficulty = ParseDouble(result.Difficulty, "OverallDifficulty", 5d);

            var firstTiming = result.TimingPoints.FirstOrDefault(tp => tp.Uninherited && tp.BeatLength > 0);
            if (firstTiming != null)
            {
                result.Bpm = 60000d / firstTiming.BeatLength;
            }

            if (!result.IsMania)
            {
                result.Notes.Clear();
            }

            return result;
        }

        private async Task<Dictionary<string, string>> UploadExtractedFilesAsync(
            string root,
            string uploadRoot,
            ImagebedConfig config)
        {
            var results = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase);
            var files = Directory.GetFiles(root, "*", SearchOption.AllDirectories);

            foreach (var filePath in files)
            {
                var ext = Path.GetExtension(filePath);
                if (string.IsNullOrWhiteSpace(ext) || !AllowedExtensions.Contains(ext))
                {
                    continue;
                }

                var relativePath = NormalizeRelativePath(Path.GetRelativePath(root, filePath)).TrimStart('/');
                var relativeDir = Path.GetDirectoryName(relativePath) ?? string.Empty;
                var uploadFolder = CombineUploadFolder(uploadRoot, relativeDir);

                try
                {
                    var src = await _cfBedClient.UploadAsync(config, filePath, uploadFolder);
                    results[relativePath] = src;
                }
                catch (Exception ex)
                {
                    _logger.LogWarning(ex, "上传文件失败: {File}", relativePath);
                    throw new InvalidOperationException($"上传文件失败: {relativePath} - {ex.Message}", ex);
                }
            }

            return results;
        }

        private static string BuildUploadRoot(string? baseFolder, string storageKey)
        {
            var normalizedBase = NormalizeFolderSegment(baseFolder);
            if (string.IsNullOrWhiteSpace(normalizedBase))
            {
                normalizedBase = "beatmaps";
            }

            return $"{normalizedBase}/{storageKey}";
        }

        private static string CombineUploadFolder(string root, string relativeDir)
        {
            var normalizedRoot = NormalizeFolderSegment(root);
            var normalizedDir = NormalizeFolderSegment(relativeDir);

            if (string.IsNullOrWhiteSpace(normalizedRoot))
            {
                return normalizedDir;
            }

            if (string.IsNullOrWhiteSpace(normalizedDir))
            {
                return normalizedRoot;
            }

            return $"{normalizedRoot}/{normalizedDir}";
        }

        private static string NormalizeFolderSegment(string? folder)
        {
            if (string.IsNullOrWhiteSpace(folder))
            {
                return string.Empty;
            }

            return folder.Replace('\\', '/').Trim().Trim('/');
        }

        private static string? MapUploadedSrc(Dictionary<string, string> uploaded, string? relativePath)
        {
            if (string.IsNullOrWhiteSpace(relativePath))
            {
                return null;
            }

            var normalized = NormalizeRelativePath(relativePath).TrimStart('/');
            if (uploaded.TryGetValue(normalized, out var src))
            {
                return src;
            }

            return null;
        }

        private static string ResolveBeatmapFolderPath(BeatmapSet set, ImagebedConfig config)
        {
            var candidate = !string.IsNullOrWhiteSpace(set.BackgroundFile)
                ? set.BackgroundFile
                : set.AudioFile;

            var normalized = NormalizeAssetPath(candidate);
            if (!string.IsNullOrWhiteSpace(normalized))
            {
                var root = ExtractRootByStorageKey(normalized, set.StorageKey);
                if (!string.IsNullOrWhiteSpace(root))
                {
                    return root;
                }

                var dir = GetDirectoryPath(normalized);
                if (!string.IsNullOrWhiteSpace(dir))
                {
                    return dir;
                }
            }

            return BuildUploadRoot(config.UploadFolder, set.StorageKey);
        }

        private static string NormalizeAssetPath(string? src)
        {
            if (string.IsNullOrWhiteSpace(src))
            {
                return string.Empty;
            }

            var trimmed = src.Trim();
            if (Uri.TryCreate(trimmed, UriKind.Absolute, out var uri))
            {
                trimmed = uri.AbsolutePath;
            }

            var normalized = trimmed.Replace('\\', '/').TrimStart('/');
            if (normalized.StartsWith("file/", StringComparison.OrdinalIgnoreCase))
            {
                normalized = normalized.Substring("file/".Length);
            }

            return normalized;
        }

        private static string? ExtractRootByStorageKey(string normalizedPath, string storageKey)
        {
            if (string.IsNullOrWhiteSpace(normalizedPath) || string.IsNullOrWhiteSpace(storageKey))
            {
                return null;
            }

            var segments = normalizedPath
                .Split('/', StringSplitOptions.RemoveEmptyEntries);

            for (var i = 0; i < segments.Length; i++)
            {
                if (string.Equals(segments[i], storageKey, StringComparison.OrdinalIgnoreCase))
                {
                    return string.Join('/', segments.Take(i + 1));
                }
            }

            return null;
        }

        private static string? GetDirectoryPath(string normalizedPath)
        {
            var index = normalizedPath.LastIndexOf('/');
            if (index <= 0)
            {
                return null;
            }

            return normalizedPath.Substring(0, index);
        }

        private static string BuildStorageKey(string? fileName)
        {
            var baseName = Path.GetFileNameWithoutExtension(fileName ?? string.Empty) ?? string.Empty;
            var sanitized = SanitizeFolderName(baseName);
            if (!string.IsNullOrWhiteSpace(sanitized))
            {
                return sanitized;
            }

            return $"set-{Guid.NewGuid():N}";
        }

        private static string SanitizeFolderName(string value)
        {
            if (string.IsNullOrWhiteSpace(value))
            {
                return string.Empty;
            }

            var invalidChars = Path.GetInvalidFileNameChars();
            var builder = new StringBuilder(value.Length);
            var previousDash = false;

            foreach (var ch in value.Trim())
            {
                char output;
                if (ch == '/' || ch == '\\' || invalidChars.Contains(ch) || char.IsControl(ch))
                {
                    output = '-';
                }
                else if (char.IsWhiteSpace(ch))
                {
                    output = '-';
                }
                else
                {
                    output = ch;
                }

                if (output == '-')
                {
                    if (previousDash)
                    {
                        continue;
                    }
                    previousDash = true;
                    builder.Append(output);
                }
                else
                {
                    previousDash = false;
                    builder.Append(output);
                }
            }

            var result = builder.ToString().Trim('-', '.');
            if (result.Length > 64)
            {
                result = result.Substring(0, 64).Trim('-', '.');
            }

            return result;
        }

        private static void ExtractZipSafe(string zipPath, string destinationDir)
        {
            var rootFullPath = Path.GetFullPath(destinationDir);
            using var archive = ZipFile.OpenRead(zipPath);
            foreach (var entry in archive.Entries)
            {
                if (string.IsNullOrWhiteSpace(entry.FullName))
                {
                    continue;
                }

                if (entry.FullName.EndsWith("/", StringComparison.Ordinal))
                {
                    continue;
                }

                var ext = Path.GetExtension(entry.FullName);
                if (string.IsNullOrWhiteSpace(ext) || !AllowedExtensions.Contains(ext))
                {
                    continue;
                }

                var destinationPath = Path.GetFullPath(Path.Combine(destinationDir, entry.FullName));
                if (!destinationPath.StartsWith(rootFullPath, StringComparison.OrdinalIgnoreCase))
                {
                    continue;
                }

                var directory = Path.GetDirectoryName(destinationPath);
                if (!string.IsNullOrWhiteSpace(directory))
                {
                    Directory.CreateDirectory(directory);
                }

                entry.ExtractToFile(destinationPath, true);
            }
        }

        private static void TryDeleteFile(string path)
        {
            try
            {
                if (File.Exists(path))
                {
                    File.Delete(path);
                }
            }
            catch
            {
                // Ignore cleanup failures
            }
        }

        private static void TryDeleteDirectory(string path)
        {
            try
            {
                if (Directory.Exists(path))
                {
                    Directory.Delete(path, true);
                }
            }
            catch
            {
                // Ignore cleanup failures
            }
        }

        private BeatmapParseResult ParseOsuFile(string setRoot, string osuPath, string osuRelativePath)
        {
            var result = new BeatmapParseResult
            {
                OsuFileName = osuRelativePath
            };

            string? section = null;
            foreach (var rawLine in File.ReadLines(osuPath, Encoding.UTF8))
            {
                var line = rawLine.Trim();
                if (string.IsNullOrWhiteSpace(line) || line.StartsWith("//", StringComparison.Ordinal))
                {
                    continue;
                }

                if (line.StartsWith("[", StringComparison.Ordinal) && line.EndsWith("]", StringComparison.Ordinal))
                {
                    section = line.Substring(1, line.Length - 2);
                    continue;
                }

                switch (section)
                {
                    case "General":
                        ParseKeyValue(line, result.General);
                        break;
                    case "Metadata":
                        ParseKeyValue(line, result.Metadata);
                        break;
                    case "Difficulty":
                        ParseKeyValue(line, result.Difficulty);
                        break;
                    case "Events":
                        if (string.IsNullOrWhiteSpace(result.BackgroundFile))
                        {
                            var background = TryParseBackground(line);
                            if (!string.IsNullOrWhiteSpace(background))
                            {
                                result.BackgroundFile = ResolveAssetRelativePath(setRoot, osuRelativePath, background);
                            }
                        }
                        break;
                    case "TimingPoints":
                        var timingPoint = TryParseTimingPoint(line);
                        if (timingPoint != null)
                        {
                            result.TimingPoints.Add(timingPoint);
                        }
                        break;
                    case "HitObjects":
                        var note = TryParseManiaNote(line, result.Columns);
                        if (note != null)
                        {
                            result.Notes.Add(note);
                        }
                        break;
                }
            }

            result.Mode = ParseInt(result.General, "Mode", 0);
            result.IsMania = result.Mode == 3;

            result.Title = GetValue(result.Metadata, "Title") ?? GetValue(result.Metadata, "TitleUnicode");
            result.Artist = GetValue(result.Metadata, "Artist") ?? GetValue(result.Metadata, "ArtistUnicode");
            result.Creator = GetValue(result.Metadata, "Creator");
            result.Version = GetValue(result.Metadata, "Version");

            result.AudioLeadIn = ParseInt(result.General, "AudioLeadIn", null);
            result.PreviewTime = ParseInt(result.General, "PreviewTime", null);

            var audioFilename = GetValue(result.General, "AudioFilename");
            if (!string.IsNullOrWhiteSpace(audioFilename))
            {
                result.AudioFile = ResolveAssetRelativePath(setRoot, osuRelativePath, audioFilename);
            }

            var circleSize = ParseDouble(result.Difficulty, "CircleSize", 4d);
            result.Columns = Math.Max(1, (int)Math.Round(circleSize));
            result.OverallDifficulty = ParseDouble(result.Difficulty, "OverallDifficulty", 5d);

            var firstTiming = result.TimingPoints.FirstOrDefault(tp => tp.Uninherited && tp.BeatLength > 0);
            if (firstTiming != null)
            {
                result.Bpm = 60000d / firstTiming.BeatLength;
            }

            if (!result.IsMania)
            {
                result.Notes.Clear();
            }

            return result;
        }

        private static void ParseKeyValue(string line, Dictionary<string, string> target)
        {
            var index = line.IndexOf(':');
            if (index <= 0) return;
            var key = line.Substring(0, index).Trim();
            var value = line.Substring(index + 1).Trim();
            if (!string.IsNullOrWhiteSpace(key))
            {
                target[key] = value;
            }
        }

        private static string? GetValue(Dictionary<string, string> source, string key)
        {
            return source.TryGetValue(key, out var value) ? value : null;
        }

        private static int ParseInt(Dictionary<string, string> source, string key, int? defaultValue)
        {
            if (source.TryGetValue(key, out var value) && int.TryParse(value, NumberStyles.Integer, CultureInfo.InvariantCulture, out var result))
            {
                return result;
            }

            return defaultValue ?? 0;
        }

        private static double ParseDouble(Dictionary<string, string> source, string key, double defaultValue)
        {
            if (source.TryGetValue(key, out var value) && double.TryParse(value, NumberStyles.Float, CultureInfo.InvariantCulture, out var result))
            {
                return result;
            }

            return defaultValue;
        }

        private static TimingPointDto? TryParseTimingPoint(string line)
        {
            var parts = line.Split(',');
            if (parts.Length < 2) return null;

            if (!int.TryParse(parts[0].Trim(), NumberStyles.Integer, CultureInfo.InvariantCulture, out var time))
            {
                return null;
            }

            if (!double.TryParse(parts[1].Trim(), NumberStyles.Float, CultureInfo.InvariantCulture, out var beatLength))
            {
                return null;
            }

            var meter = 4;
            if (parts.Length > 2)
            {
                int.TryParse(parts[2].Trim(), NumberStyles.Integer, CultureInfo.InvariantCulture, out meter);
            }

            var uninherited = true;
            if (parts.Length > 6)
            {
                uninherited = parts[6].Trim() == "1";
            }

            return new TimingPointDto
            {
                Time = time,
                BeatLength = beatLength,
                Meter = meter,
                Uninherited = uninherited
            };
        }

        private static ManiaNoteDto? TryParseManiaNote(string line, int columns)
        {
            if (columns <= 0)
            {
                columns = 4;
            }

            var parts = line.Split(',');
            if (parts.Length < 5) return null;

            if (!int.TryParse(parts[0].Trim(), NumberStyles.Integer, CultureInfo.InvariantCulture, out var x))
            {
                return null;
            }

            if (!int.TryParse(parts[2].Trim(), NumberStyles.Integer, CultureInfo.InvariantCulture, out var time))
            {
                return null;
            }

            if (!int.TryParse(parts[3].Trim(), NumberStyles.Integer, CultureInfo.InvariantCulture, out var type))
            {
                return null;
            }

            var column = (int)Math.Floor(x * columns / 512d);
            if (column < 0) column = 0;
            if (column >= columns) column = columns - 1;

            int? endTime = null;
            if ((type & 128) != 0 && parts.Length > 5)
            {
                var endPart = parts[5].Split(':').FirstOrDefault();
                if (int.TryParse(endPart, NumberStyles.Integer, CultureInfo.InvariantCulture, out var parsedEnd))
                {
                    endTime = parsedEnd;
                }
            }

            return new ManiaNoteDto
            {
                Time = time,
                Column = column,
                EndTime = endTime
            };
        }

        private static string? TryParseBackground(string line)
        {
            if (line.StartsWith("//", StringComparison.Ordinal))
            {
                return null;
            }

            var parts = line.Split(',');
            if (parts.Length < 3) return null;

            var eventType = parts[0].Trim();
            if (eventType != "0" && !eventType.Equals("Background", StringComparison.OrdinalIgnoreCase))
            {
                return null;
            }

            var filename = parts[2].Trim().Trim('"');
            return string.IsNullOrWhiteSpace(filename) ? null : filename;
        }

        private static string? ResolveAssetRelativePath(string setRoot, string osuRelativePath, string assetRelativePath)
        {
            if (string.IsNullOrWhiteSpace(assetRelativePath)) return null;

            var baseDir = Path.GetDirectoryName(osuRelativePath) ?? string.Empty;
            var combined = Path.GetFullPath(Path.Combine(setRoot, baseDir, assetRelativePath));
            var rootFull = Path.GetFullPath(setRoot);
            if (!combined.StartsWith(rootFull, StringComparison.OrdinalIgnoreCase))
            {
                return null;
            }

            if (!File.Exists(combined))
            {
                var dir = Path.GetDirectoryName(combined);
                var fileName = Path.GetFileName(combined);
                if (!string.IsNullOrWhiteSpace(dir) && Directory.Exists(dir))
                {
                    var match = Directory.EnumerateFiles(dir)
                        .FirstOrDefault(path => string.Equals(Path.GetFileName(path), fileName, StringComparison.OrdinalIgnoreCase));
                    if (!string.IsNullOrWhiteSpace(match))
                    {
                        return NormalizeRelativePath(Path.GetRelativePath(rootFull, match));
                    }
                }
                return null;
            }

            return NormalizeRelativePath(Path.GetRelativePath(rootFull, combined));
        }

        private static string? ResolveAssetFromMap(
            string osuRelativePath,
            string assetRelativePath,
            Dictionary<string, string> uploadedFiles)
        {
            if (string.IsNullOrWhiteSpace(assetRelativePath))
            {
                return null;
            }

            var baseDir = Path.GetDirectoryName(osuRelativePath) ?? string.Empty;
            var combined = NormalizeRelativePath(Path.Combine(baseDir, assetRelativePath)).TrimStart('/');
            if (combined.Contains("..", StringComparison.Ordinal))
            {
                return null;
            }

            return uploadedFiles.ContainsKey(combined) ? combined : null;
        }

        private static OszFileNameInfo ParseOszFileName(string fileName)
        {
            var info = new OszFileNameInfo();
            var baseName = Path.GetFileNameWithoutExtension(fileName) ?? string.Empty;
            if (string.IsNullOrWhiteSpace(baseName))
            {
                return info;
            }

            var trimmed = baseName.Trim();
            var index = 0;
            while (index < trimmed.Length && char.IsDigit(trimmed[index]))
            {
                index++;
            }

            if (index == 0)
            {
                return info;
            }

            var digits = trimmed.Substring(0, index);
            info.CreatedAt = TryParseCreatedAtFromDigits(digits);

            var rest = trimmed.Substring(index).Trim();
            if (string.IsNullOrWhiteSpace(rest))
            {
                return info;
            }

            rest = rest.TrimStart('-', '_').Trim();
            if (string.IsNullOrWhiteSpace(rest))
            {
                return info;
            }

            var parts = rest.Split(new[] { " - " }, 2, StringSplitOptions.None);
            if (parts.Length == 2)
            {
                info.Artist = parts[0].Trim();
                info.Title = parts[1].Trim();
                return info;
            }

            var dashIndex = rest.IndexOf('-', StringComparison.Ordinal);
            if (dashIndex > 0 && dashIndex < rest.Length - 1)
            {
                info.Artist = rest.Substring(0, dashIndex).Trim();
                info.Title = rest.Substring(dashIndex + 1).Trim();
            }

            return info;
        }

        private static DateTime? TryParseCreatedAtFromDigits(string digits)
        {
            if (string.IsNullOrWhiteSpace(digits) || !digits.All(char.IsDigit))
            {
                return null;
            }

            if (digits.Length == 13 && long.TryParse(digits, out var milliseconds))
            {
                return DateTimeOffset.FromUnixTimeMilliseconds(milliseconds).UtcDateTime;
            }

            if (digits.Length == 10 && long.TryParse(digits, out var seconds))
            {
                return DateTimeOffset.FromUnixTimeSeconds(seconds).UtcDateTime;
            }

            var format = digits.Length switch
            {
                8 => "yyyyMMdd",
                7 => "yyMMddH",
                6 => "yyMMdd",
                _ => null
            };

            if (format == null)
            {
                return null;
            }

            if (!DateTime.TryParseExact(digits, format, CultureInfo.InvariantCulture, DateTimeStyles.None, out var parsed))
            {
                return null;
            }

            return DateTime.SpecifyKind(parsed, DateTimeKind.Utc);
        }

        private class BeatmapParseResult
        {
            public Dictionary<string, string> General { get; } = new(StringComparer.OrdinalIgnoreCase);
            public Dictionary<string, string> Metadata { get; } = new(StringComparer.OrdinalIgnoreCase);
            public Dictionary<string, string> Difficulty { get; } = new(StringComparer.OrdinalIgnoreCase);
            public string OsuFileName { get; set; } = string.Empty;
            public bool IsMania { get; set; }
            public int Mode { get; set; }
            public string? Title { get; set; }
            public string? Artist { get; set; }
            public string? Creator { get; set; }
            public string? Version { get; set; }
            public string? AudioFile { get; set; }
            public string? BackgroundFile { get; set; }
            public int? PreviewTime { get; set; }
            public int? AudioLeadIn { get; set; }
            public int Columns { get; set; } = 4;
            public double OverallDifficulty { get; set; } = 5;
            public double? Bpm { get; set; }
            public List<TimingPointDto> TimingPoints { get; } = new();
            public List<ManiaNoteDto> Notes { get; } = new();
        }

        private class ManiaBeatmapData
        {
            public int Columns { get; set; }
            public int? AudioLeadIn { get; set; }
            public int? PreviewTime { get; set; }
            public List<TimingPointDto> TimingPoints { get; set; } = new();
            public List<ManiaNoteDto> Notes { get; set; } = new();
        }

        private class OszFileNameInfo
        {
            public DateTime? CreatedAt { get; set; }
            public string? Artist { get; set; }
            public string? Title { get; set; }
        }
    }
}
