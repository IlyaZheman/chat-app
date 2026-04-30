namespace Chat.Application.Interfaces;

public interface IFileStorage
{
    Task<string> UploadAsync(Stream stream, string fileName, string contentType, CancellationToken ct = default);
}