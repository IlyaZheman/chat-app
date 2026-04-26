namespace Chat.Infrastructure.Storage;

public class MinioOptions
{
    public string ServiceUrl { get; set; } = default!;
    public string BucketName { get; set; } = default!;
    public string AccessKey { get; set; } = default!;
    public string SecretKey { get; set; } = default!;
}
