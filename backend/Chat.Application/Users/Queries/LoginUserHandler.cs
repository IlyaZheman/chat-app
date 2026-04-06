using Chat.Application.Interfaces;
using Chat.Domain.Interfaces;

namespace Chat.Application.Users.Queries;

public class LoginUserHandler(
    IUsersRepository usersRepository,
    IPasswordHasher hasher,
    IJwtProvider jwtProvider)
{
    public async Task<string> HandleAsync(string email, string password, CancellationToken ct = default)
    {
        var user = await usersRepository.GetByEmailAsync(email, ct)
            ?? throw new InvalidOperationException("User not found.");

        if (!hasher.Verify(password, user.PasswordHash))
            throw new InvalidOperationException("Invalid password.");

        return jwtProvider.GenerateToken(user);
    }
}