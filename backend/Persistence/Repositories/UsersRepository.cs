using AutoMapper;
using Microsoft.EntityFrameworkCore;
using Persistence.Entities;
using Persistence.Models;

namespace Persistence.Repositories;

public class UsersRepository
{
    private readonly AppDbContext _context;
    private readonly IMapper _mapper;

    public UsersRepository(AppDbContext context, IMapper mapper)
    {
        _context = context;
        _mapper = mapper;
    }

    public async Task Add(User user)
    {
        var userEntity = new UserEntity(user.Id, user.UserName, user.PasswordHash, user.Email);

        await _context.Users.AddAsync(userEntity);
        await _context.SaveChangesAsync();
    }

    public async Task<User> GetByEmail(string email)
    {
        var userEntity = await _context.Users
            .AsNoTracking()
            .FirstOrDefaultAsync(u => u.Email == email) ?? throw new NullReferenceException();

        return _mapper.Map<User>(userEntity);
    }
}