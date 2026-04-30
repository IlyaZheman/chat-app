using Amazon.S3;
using Amazon.S3.Model;
using Chat.Application.Interfaces;
using Microsoft.Extensions.Options;

namespace Chat.Infrastructure.Storage;

public class MinioFileStorage(IAmazonS3 s3, IOptions<MinioOptions> options) : IFileStorage
{
    private readonly MinioOptions _options = options.Value;

    public async Task<string> UploadAsync(Stream stream, string fileName, string contentType, CancellationToken ct = default)
    {
        var request = new PutObjectRequest
        {
            BucketName = _options.BucketName,
            Key = fileName,
            InputStream = stream,
            ContentType = contentType
        };

        await s3.PutObjectAsync(request, ct);

        return $"{_options.ServiceUrl}/{_options.BucketName}/{fileName}";
    }
}