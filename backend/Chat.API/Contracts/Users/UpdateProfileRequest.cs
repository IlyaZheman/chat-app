namespace Chat.API.Contracts.Users;

public record UpdateProfileRequest(
    string? UserName,
    string? AvatarUrl,
    bool ClearAvatar = false
);