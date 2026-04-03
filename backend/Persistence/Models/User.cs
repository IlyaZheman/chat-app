namespace Persistence.Models;

public class User(Guid id, string userName, string passwordHash, string email)
{
    public Guid Id { get; set; } = id;
    public string UserName { get; private set; } = userName;
    public string PasswordHash { get; private set; } = passwordHash;
    public string Email { get; private set; } = email;
}