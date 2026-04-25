using System.Text.Json.Serialization;

namespace Chat.Infrastructure.Notifications;

[JsonPolymorphic(TypeDiscriminatorPropertyName = "type")]
[JsonDerivedType(typeof(TextPayloadDto), "text")]
[JsonDerivedType(typeof(ImagePayloadDto), "image")]
[JsonDerivedType(typeof(FilePayloadDto), "file")]
public abstract record MessagePayloadDto;

public record TextPayloadDto(string Text) : MessagePayloadDto;

public record ImagePayloadDto(string Url, string FileName, string? Caption, string CaptionPosition) : MessagePayloadDto;

public record FilePayloadDto(string Url, string FileName, string MediaType) : MessagePayloadDto;
