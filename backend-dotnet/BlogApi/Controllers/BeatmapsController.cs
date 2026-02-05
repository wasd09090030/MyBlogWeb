using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using BlogApi.Services;
using BlogApi.DTOs;
using BlogApi.Models;
using System.Linq;
using System.Text.Json;
using Microsoft.AspNetCore.StaticFiles;

namespace BlogApi.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class BeatmapsController : ControllerBase
    {
        private readonly BeatmapService _beatmapService;

        public BeatmapsController(BeatmapService beatmapService)
        {
            _beatmapService = beatmapService;
        }

        [Authorize]
        [HttpPost("upload")]
        [RequestSizeLimit(200_000_000)]
        public async Task<ActionResult<BeatmapUploadResultDto>> Upload([FromForm] IFormFile file)
        {
            if (file == null)
            {
                return BadRequest(new { error = "请上传 .osz 文件" });
            }

            try
            {
                var beatmapSet = await _beatmapService.CreateFromOszAsync(file);
                var dto = ToBeatmapSetDto(beatmapSet);
                return Ok(new BeatmapUploadResultDto { BeatmapSet = dto });
            }
            catch (Exception ex)
            {
                return BadRequest(new { error = ex.Message });
            }
        }

        [HttpGet]
        public async Task<ActionResult<List<BeatmapSetDto>>> GetAll()
        {
            var sets = await _beatmapService.GetAllSetsAsync();
            var list = sets.Select(ToBeatmapSetDto).ToList();
            return Ok(list);
        }

        [HttpGet("{id:int}")]
        public async Task<ActionResult<BeatmapSetDto>> GetById(int id)
        {
            var set = await _beatmapService.GetSetByIdAsync(id);
            if (set == null) return NotFound();
            return Ok(ToBeatmapSetDto(set));
        }

        [HttpGet("difficulty/{id:int}")]
        public async Task<ActionResult<BeatmapDataDto>> GetDifficultyData(int id)
        {
            var difficulty = await _beatmapService.GetDifficultyByIdAsync(id);
            if (difficulty == null || difficulty.BeatmapSet == null) return NotFound();

            var data = JsonSerializer.Deserialize<BeatmapServiceManiaData>(difficulty.DataJson)
                ?? new BeatmapServiceManiaData();

            var dto = new BeatmapDataDto
            {
                Id = difficulty.Id,
                BeatmapSetId = difficulty.BeatmapSetId,
                Title = difficulty.BeatmapSet.Title,
                Artist = difficulty.BeatmapSet.Artist,
                Creator = difficulty.BeatmapSet.Creator,
                Version = difficulty.Version,
                Columns = difficulty.Columns,
                OverallDifficulty = difficulty.OverallDifficulty,
                Bpm = difficulty.Bpm,
                PreviewTime = data.PreviewTime,
                AudioLeadIn = data.AudioLeadIn,
                BackgroundUrl = BuildAssetUrl(difficulty.BeatmapSet.StorageKey, difficulty.BeatmapSet.BackgroundFile),
                AudioUrl = BuildAssetUrl(difficulty.BeatmapSet.StorageKey, difficulty.BeatmapSet.AudioFile),
                TimingPoints = data.TimingPoints ?? new List<TimingPointDto>(),
                Notes = data.Notes ?? new List<ManiaNoteDto>()
            };

            return Ok(dto);
        }

        [HttpGet("asset/{setKey}/{*path}")]
        public IActionResult GetAsset(string setKey, string path)
        {
            var fullPath = _beatmapService.ResolveAssetPath(setKey, path);
            if (fullPath == null || !System.IO.File.Exists(fullPath))
            {
                return NotFound();
            }

            var provider = new FileExtensionContentTypeProvider();
            if (!provider.TryGetContentType(path, out var contentType))
            {
                contentType = "application/octet-stream";
            }
            return PhysicalFile(fullPath, contentType);
        }

        private BeatmapSetDto ToBeatmapSetDto(BeatmapSet set)
        {
            return new BeatmapSetDto
            {
                Id = set.Id,
                Title = set.Title,
                Artist = set.Artist,
                Creator = set.Creator,
                BackgroundUrl = BuildAssetUrl(set.StorageKey, set.BackgroundFile),
                AudioUrl = BuildAssetUrl(set.StorageKey, set.AudioFile),
                PreviewTime = set.PreviewTime,
                Difficulties = set.Difficulties
                    .OrderBy(d => d.Columns)
                    .ThenBy(d => d.OverallDifficulty)
                    .Select(d => new BeatmapDifficultyDto
                    {
                        Id = d.Id,
                        BeatmapSetId = d.BeatmapSetId,
                        Version = d.Version,
                        Mode = d.Mode,
                        Columns = d.Columns,
                        OverallDifficulty = d.OverallDifficulty,
                        Bpm = d.Bpm,
                        NoteCount = d.NoteCount
                    })
                    .ToList()
            };
        }

        private string? BuildAssetUrl(string storageKey, string? relativePath)
        {
            if (string.IsNullOrWhiteSpace(storageKey) || string.IsNullOrWhiteSpace(relativePath))
            {
                return null;
            }

            var safe = relativePath.Replace("\\", "/");
            var host = Request?.Host.Value;
            if (string.IsNullOrWhiteSpace(host))
            {
                return $"/api/beatmaps/asset/{storageKey}/{safe}";
            }

            return $"{Request.Scheme}://{host}/api/beatmaps/asset/{storageKey}/{safe}";
        }

        private class BeatmapServiceManiaData
        {
            public int Columns { get; set; }
            public int? AudioLeadIn { get; set; }
            public int? PreviewTime { get; set; }
            public List<TimingPointDto>? TimingPoints { get; set; }
            public List<ManiaNoteDto>? Notes { get; set; }
        }
    }
}
