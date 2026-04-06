using Chat.Domain.Interfaces;
using Chat.Domain.Models;
using Chat.Infrastructure.Persistence.Entities;
using Microsoft.EntityFrameworkCore;

namespace Chat.Infrastructure.Persistence.Repositories;

public class UsersRepository(AppDbContext context) : IUsersRepository
{
    public async Task AddAsync(User user, CancellationToken ct = default)
    {
        var entity = new UserEntity
        {
            Id = user.Id,
            UserName = user.UserName,
            PasswordHash = user.PasswordHash,
            Email = user.Email
        };

        await context.Users.AddAsync(entity, ct);
        await context.SaveChangesAsync(ct);
    }

    public async Task<User?> GetByIdAsync(Guid id, CancellationToken ct = default)
    {
        var entity = await context.Users
            .AsNoTracking()
            .FirstOrDefaultAsync(u => u.Id == id, ct);

        return entity is null ? null : User.Restore(entity.Id, entity.UserName, entity.Email, entity.PasswordHash);
    }

    public async Task<User?> GetByEmailAsync(string email, CancellationToken ct = default)
    {
        var entity = await context.Users
            .AsNoTracking()
            .FirstOrDefaultAsync(u => u.Email == email, ct);

        return entity is null ? null : User.Restore(entity.Id, entity.UserName, entity.Email, entity.PasswordHash);
    }
}