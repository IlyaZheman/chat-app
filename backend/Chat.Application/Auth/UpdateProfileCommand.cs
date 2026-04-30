namespace Chat.Application.Auth;

public record UpdateProfileCommand(
    string? UserName,
    string? AvatarUrl,
    bool ClearAvatar
);