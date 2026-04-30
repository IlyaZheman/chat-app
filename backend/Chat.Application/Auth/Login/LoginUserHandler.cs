using Chat.Application.Interfaces;
using Chat.Domain.Exceptions;
using Chat.Domain.Interfaces;

namespace Chat.Application.Auth.Login;

public class LoginUserHandler(
    IUsersRepository usersRepository,
    IPasswordHasher passwordHasher,
    IJwtProvider jwtProvider)
{
    public async Task<string> HandleAsync(LoginUserQuery query, CancellationToken ct)
    {
        var user = await usersRepository.GetByEmailAsync(query.Email, ct);
        if (user is null || !passwordHasher.Verify(query.Password, user.PasswordHash))
            throw new UnauthorizedException("Invalid email or password.");

        return jwtProvider.GenerateToken(user);
    }
}