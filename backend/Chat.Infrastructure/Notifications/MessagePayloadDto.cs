using System.Text.Json.Serialization;
using Chat.Domain.Models;

namespace Chat.Infrastructure.Notifications;

[JsonPolymorphic(TypeDiscriminatorPropertyName = "type")]
[JsonDerivedType(typeof(TextPayloadDto), "text")]
[JsonDerivedType(typeof(ImagePayloadDto), "image")]
[JsonDerivedType(typeof(FilePayloadDto), "file")]
public abstract record MessagePayloadDto
{
    public static MessagePayloadDto From(MessagePayload payload) => payload switch
    {
        TextPayload t  => new TextPayloadDto(t.Text),
        ImagePayload i => new ImagePayloadDto(i.Url, i.FileName, i.Caption, i.CaptionPosition, i.FileSize),
        FilePayload f  => new FilePayloadDto(f.Url, f.FileName, f.MediaType, f.FileSize),
        _              => throw new NotSupportedException(payload.GetType().Name)
    };

    public MessagePayload ToDomain() => this switch
    {
        TextPayloadDto t  => new TextPayload(t.Text),
        ImagePayloadDto i => new ImagePayload(i.Url, i.FileName, i.Caption, i.CaptionPosition, i.FileSize),
        FilePayloadDto f  => new FilePayload(f.Url, f.FileName, f.MediaType, f.FileSize),
        _                 => throw new NotSupportedException(GetType().Name)
    };
}

public record TextPayloadDto(string Text) : MessagePayloadDto;

public record ImagePayloadDto(string Url, string FileName, string? Caption, CaptionPosition CaptionPosition = CaptionPosition.Below, long FileSize = 0) : MessagePayloadDto;

public record FilePayloadDto(string Url, string FileName, string MediaType, long FileSize = 0) : MessagePayloadDto;
