using Chat.Domain.Enums;

namespace Chat.Domain.Models;

public class User
{
    public Guid Id { get; private set; }
    public string UserName { get; private set; }
    public string PasswordHash { get; private set; }
    public string Email { get; private set; }
    public UserRole Role { get; private set; }
    public string? AvatarUrl { get; private set; }

    private User()
    {
    }

    public static User Create(string userName, string email, string passwordHash)
    {
        return new User
        {
            Id = Guid.NewGuid(),
            UserName = userName,
            Email = email,
            PasswordHash = passwordHash,
            Role = UserRole.User
        };
    }

    public static User Restore(Guid id, string userName, string email, string passwordHash, UserRole role, string? avatarUrl = null) =>
        new()
        {
            Id = id,
            UserName = userName,
            Email = email,
            PasswordHash = passwordHash,
            Role = role,
            AvatarUrl = avatarUrl
        };

    public void AssignRole(UserRole role) => Role = role;

    public void UpdateProfile(string? newUserName, string? newAvatarUrl, bool clearAvatar = false)
    {
        if (!string.IsNullOrWhiteSpace(newUserName))
        {
            var trimmed = newUserName.Trim();
            if (trimmed.Length < 2) throw new ArgumentException("Имя слишком короткое.", nameof(newUserName));
            if (trimmed.Length > 64) throw new ArgumentException("Имя слишком длинное.", nameof(newUserName));
            UserName = trimmed;
        }

        if (clearAvatar) AvatarUrl = null;
        else if (!string.IsNullOrWhiteSpace(newAvatarUrl)) AvatarUrl = newAvatarUrl.Trim();
    }
}
