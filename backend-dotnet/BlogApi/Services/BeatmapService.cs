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
using Microsoft.AspNetCore.Hosting;
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
        private readonly IWebHostEnvironment _env;
        private readonly ILogger<BeatmapService> _logger;

        public BeatmapService(BlogDbContext context, IWebHostEnvironment env, ILogger<BeatmapService> logger)
        {
            _context = context;
            _env = env;
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

            var storageKey = $"set-{Guid.NewGuid():N}";
            var setRoot = GetSetRoot(storageKey);
            Directory.CreateDirectory(setRoot);

            var tempPath = Path.Combine(Path.GetTempPath(), $"{Guid.NewGuid():N}.osz");
            await using (var stream = File.Create(tempPath))
            {
                await oszFile.CopyToAsync(stream);
            }

            try
            {
                ExtractZipSafe(tempPath, setRoot);
            }
            finally
            {
                TryDeleteFile(tempPath);
            }

            var osuFiles = Directory.GetFiles(setRoot, "*.osu", SearchOption.AllDirectories);
            if (osuFiles.Length == 0)
            {
                throw new InvalidOperationException("未找到 .osu 文件");
            }

            var maniaResults = new List<BeatmapParseResult>();
            foreach (var osuPath in osuFiles)
            {
                var relativePath = NormalizeRelativePath(Path.GetRelativePath(setRoot, osuPath));
                var result = ParseOsuFile(setRoot, osuPath, relativePath);
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

            var beatmapSet = new BeatmapSet
            {
                StorageKey = storageKey,
                Title = primary.Title ?? "Unknown",
                Artist = primary.Artist ?? "Unknown",
                Creator = primary.Creator ?? "Unknown",
                BackgroundFile = primary.BackgroundFile,
                AudioFile = primary.AudioFile,
                PreviewTime = primary.PreviewTime,
                CreatedAt = DateTime.UtcNow
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
                    CreatedAt = DateTime.UtcNow
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

        public string? ResolveAssetPath(string storageKey, string relativePath)
        {
            if (string.IsNullOrWhiteSpace(storageKey) || string.IsNullOrWhiteSpace(relativePath))
            {
                return null;
            }

            var safeRelative = NormalizeRelativePath(relativePath);
            if (safeRelative.Contains("..", StringComparison.Ordinal))
            {
                return null;
            }

            var setRoot = GetSetRoot(storageKey);
            var fullPath = Path.GetFullPath(Path.Combine(setRoot, safeRelative));
            var rootFull = Path.GetFullPath(setRoot);
            if (!fullPath.StartsWith(rootFull, StringComparison.OrdinalIgnoreCase))
            {
                return null;
            }

            return fullPath;
        }

        private string GetSetRoot(string storageKey)
        {
            var root = Path.Combine(_env.ContentRootPath, "Storage", "beatmaps");
            return Path.Combine(root, storageKey);
        }

        private static string NormalizeRelativePath(string path)
        {
            return path.Replace('\\', '/');
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
    }
}
