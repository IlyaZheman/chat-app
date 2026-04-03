using Chat.Utilities;
using Chat.Utilities.Jwt;
using Persistence.Models;
using Persistence.Repositories;

namespace Chat.Services;

public class UsersService
{
    private readonly UsersRepository _usersRepository;
    private readonly PasswordHasher _hasher;
    private readonly JwtProvider _jwtProvider;

    public UsersService(UsersRepository usersRepository, PasswordHasher hasher, JwtProvider jwtProvider)
    {
        _usersRepository = usersRepository;
        _hasher = hasher;
        _jwtProvider = jwtProvider;
    }

    public async Task Register(string userName, string email, string password)
    {
        var hashedPassword = _hasher.Generate(password);

        var user = new User(
            Guid.NewGuid(),
            userName,
            hashedPassword,
            email
        );

        await _usersRepository.Add(user);
    }

    public async Task<string> Login(string email, string password)
    {
        var user = await _usersRepository.GetByEmail(email);

        var result = _hasher.Verify(password, user.PasswordHash);
        if (!result)
        {
            throw new InvalidOperationException("Invalid password");
        }

        var token = _jwtProvider.GenerateToken(user);

        return token;
    }
}