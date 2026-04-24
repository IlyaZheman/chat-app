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
            Email = user.Email,
            Role = user.Role
        };

        await context.Users.AddAsync(entity, ct);
        await context.SaveChangesAsync(ct);
    }

    public async Task<User?> GetByIdAsync(Guid id, CancellationToken ct = default)
    {
        var entity = await context.Users
            .AsNoTracking()
            .FirstOrDefaultAsync(u => u.Id == id, ct);

        return entity is null ? null : Map(entity);
    }

    public async Task<User?> GetByEmailAsync(string email, CancellationToken ct = default)
    {
        var entity = await context.Users
            .AsNoTracking()
            .FirstOrDefaultAsync(u => u.Email == email, ct);

        return entity is null ? null : Map(entity);
    }

    public async Task<IReadOnlyList<User>> GetAllAsync(CancellationToken ct = default)
    {
        var entities = await context.Users
            .AsNoTracking()
            .OrderBy(u => u.UserName)
            .ToListAsync(ct);

        return entities.Select(Map).ToList();
    }

    public async Task UpdateAsync(User user, CancellationToken ct = default)
    {
        await context.Users
            .Where(u => u.Id == user.Id)
            .ExecuteUpdateAsync(s => s.SetProperty(u => u.Role, user.Role), ct);
    }

    private static User Map(UserEntity e) =>
        User.Restore(e.Id, e.UserName, e.Email, e.PasswordHash, e.Role);
}