using System.Text.Json.Serialization;

namespace Chat.Domain.Models;

[JsonPolymorphic(TypeDiscriminatorPropertyName = "type")]
[JsonDerivedType(typeof(TextPayload), "text")]
[JsonDerivedType(typeof(ImagePayload), "image")]
[JsonDerivedType(typeof(FilePayload), "file")]
public abstract class MessagePayload;

public class TextPayload : MessagePayload
{
    public string Text { get; private set; } = string.Empty;
    private TextPayload() { }
    public TextPayload(string text) { Text = text; }
}

public class ImagePayload : MessagePayload
{
    public string Url { get; private set; } = string.Empty;
    public string FileName { get; private set; } = string.Empty;
    public string? Caption { get; private set; }
    public CaptionPosition CaptionPosition { get; private set; }
    private ImagePayload() { }
    public ImagePayload(string url, string fileName, string? caption = null,
        CaptionPosition captionPosition = CaptionPosition.Below)
    {
        Url = url;
        FileName = fileName;
        Caption = caption;
        CaptionPosition = captionPosition;
    }
}

public class FilePayload : MessagePayload
{
    public string Url { get; private set; } = string.Empty;
    public string FileName { get; private set; } = string.Empty;
    public string MediaType { get; private set; } = string.Empty;
    private FilePayload() { }
    public FilePayload(string url, string fileName, string mediaType)
    {
        Url = url;
        FileName = fileName;
        MediaType = mediaType;
    }
}

public enum CaptionPosition { Above, Below }
