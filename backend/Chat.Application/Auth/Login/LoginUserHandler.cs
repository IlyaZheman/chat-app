using Chat.Application.Interfaces;
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

        if (user == null)
            throw new Exception(query.Email);

        var isValid = passwordHasher.Verify(query.Password, user.PasswordHash);

        if (!isValid)
            throw new Exception();

        return jwtProvider.GenerateToken(user);
    }
}