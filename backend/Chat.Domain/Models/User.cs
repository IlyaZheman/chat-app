namespace Chat.Domain.Models;

public class User
{
    public Guid Id { get; private set; }
    public string UserName { get; private set; }
    public string PasswordHash { get; private set; }
    public string Email { get; private set; }

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
            PasswordHash = passwordHash
        };
    }

    public static User Restore(Guid id, string userName, string email, string passwordHash) =>
        new() { Id = id, UserName = userName, Email = email, PasswordHash = passwordHash };
}