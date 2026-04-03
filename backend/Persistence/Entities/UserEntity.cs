namespace Persistence.Entities;

public record UserEntity(Guid Id, string UserName, string PasswordHash, string Email);