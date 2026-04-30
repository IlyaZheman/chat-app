using Chat.Application.Interfaces;

namespace Chat.API.Endpoints;

public static class UploadsEndpoints
{
    private static readonly long MaxFileSize = 10 * 1024 * 1024;

    private static readonly HashSet<string> AllowedExtensions = new(StringComparer.OrdinalIgnoreCase)
    {
        ".jpg", ".jpeg", ".png", ".gif", ".webp",
        ".pdf", ".docx", ".txt", ".zip",
        ".mp4", ".webm", ".mov",
        ".mp3", ".wav", ".ogg"
    };

    // Allowed MIME types per extension — prevents extension/content-type mismatch
    private static readonly Dictionary<string, string[]> AllowedMimeTypes = new(StringComparer.OrdinalIgnoreCase)
    {
        { ".jpg",  ["image/jpeg"] },
        { ".jpeg", ["image/jpeg"] },
        { ".png",  ["image/png"] },
        { ".gif",  ["image/gif"] },
        { ".webp", ["image/webp"] },
        { ".pdf",  ["application/pdf"] },
        { ".docx", ["application/vnd.openxmlformats-officedocument.wordprocessingml.document", "application/zip", "application/octet-stream"] },
        { ".txt",  ["text/plain"] },
        { ".zip",  ["application/zip", "application/x-zip-compressed", "application/octet-stream"] },
        { ".mp4",  ["video/mp4"] },
        { ".webm", ["video/webm"] },
        { ".mov",  ["video/quicktime"] },
        { ".mp3",  ["audio/mpeg", "audio/mp3"] },
        { ".wav",  ["audio/wav", "audio/wave", "audio/x-wav"] },
        { ".ogg",  ["audio/ogg", "application/ogg"] },
    };

    // Magic bytes for image formats — checked against the actual file content
    private static readonly Dictionary<string, byte[]> ImageMagicBytes = new(StringComparer.OrdinalIgnoreCase)
    {
        { ".jpg",  [0xFF, 0xD8, 0xFF] },
        { ".jpeg", [0xFF, 0xD8, 0xFF] },
        { ".png",  [0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A] },
        { ".gif",  [0x47, 0x49, 0x46, 0x38] },
    };

    public static IEndpointRouteBuilder MapUploadsEndpoints(this IEndpointRouteBuilder builder)
    {
        builder.MapPost("uploads", UploadFile)
            .RequireAuthorization()
            .DisableAntiforgery();

        return builder;
    }

    private static async Task<IResult> UploadFile(
        IFormFile file,
        IFileStorage fileStorage,
        CancellationToken ct)
    {
        if (file.Length > MaxFileSize)
            return Results.BadRequest(new { error = "Файл превышает лимит 10 МБ." });

        var ext = Path.GetExtension(file.FileName);
        if (!AllowedExtensions.Contains(ext))
            return Results.BadRequest(new { error = "Тип файла не поддерживается." });

        if (!IsMimeTypeAllowed(ext, file.ContentType))
            return Results.BadRequest(new { error = "Тип файла не поддерживается." });

        if (!await HasValidMagicBytesAsync(file, ext))
            return Results.BadRequest(new { error = "Содержимое файла не соответствует его расширению." });

        var uniqueName = $"{Guid.NewGuid()}{ext}";
        await using var stream = file.OpenReadStream();
        var url = await fileStorage.UploadAsync(stream, uniqueName, file.ContentType, ct);

        return Results.Ok(new
        {
            url,
            fileName = file.FileName,
            mediaType = file.ContentType,
            fileSize = file.Length
        });
    }

    private static bool IsMimeTypeAllowed(string ext, string contentType)
    {
        if (!AllowedMimeTypes.TryGetValue(ext, out var allowed)) return false;
        var baseType = contentType.Split(';')[0].Trim();
        return allowed.Contains(baseType, StringComparer.OrdinalIgnoreCase);
    }

    private static async Task<bool> HasValidMagicBytesAsync(IFormFile file, string ext)
    {
        // WebP: starts with RIFF (4 bytes) + 4-byte size + WEBP
        if (ext.Equals(".webp", StringComparison.OrdinalIgnoreCase))
        {
            var buf = new byte[12];
            await using var s = file.OpenReadStream();
            if (await s.ReadAsync(buf.AsMemory(0, 12)) < 12) return false;
            return buf[..4].SequenceEqual(new byte[] { 0x52, 0x49, 0x46, 0x46 })
                && buf[8..12].SequenceEqual(new byte[] { 0x57, 0x45, 0x42, 0x50 });
        }

        if (!ImageMagicBytes.TryGetValue(ext, out var magic)) return true;

        var buffer = new byte[magic.Length];
        await using var stream = file.OpenReadStream();
        if (await stream.ReadAsync(buffer.AsMemory(0, magic.Length)) < magic.Length) return false;
        return buffer.SequenceEqual(magic);
    }
}
