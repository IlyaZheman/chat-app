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
}