using Microsoft.AspNetCore.Http.Features;

namespace Chat.API.Endpoints;

public static class UploadsEndpoints
{
    private static readonly long MaxFileSize = 10 * 1024 * 1024; // 10 MB

    private static readonly HashSet<string> AllowedExtensions = new(StringComparer.OrdinalIgnoreCase)
    {
        ".jpg", ".jpeg", ".png", ".gif", ".webp",
        ".pdf", ".docx", ".txt", ".zip"
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
        IWebHostEnvironment env,
        CancellationToken ct)
    {
        if (file.Length > MaxFileSize)
            return Results.BadRequest(new { error = "Файл превышает лимит 10 МБ." });

        var ext = Path.GetExtension(file.FileName);
        if (!AllowedExtensions.Contains(ext))
            return Results.BadRequest(new { error = "Тип файла не поддерживается." });

        var uniqueName = $"{Guid.NewGuid()}{ext}";
        var uploadsPath = Path.Combine(env.WebRootPath, "uploads");
        Directory.CreateDirectory(uploadsPath);

        var fullPath = Path.Combine(uploadsPath, uniqueName);
        await using var stream = File.Create(fullPath);
        await file.CopyToAsync(stream, ct);

        return Results.Ok(new
        {
            url = $"/uploads/{uniqueName}",
            fileName = file.FileName,
            mediaType = file.ContentType
        });
    }
}
