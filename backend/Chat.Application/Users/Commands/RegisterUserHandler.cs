using Chat.Application.Interfaces;
using Chat.Domain.Interfaces;
using Chat.Domain.Models;

namespace Chat.Application.Users.Commands;

public class RegisterUserHandler(
    IUsersRepository usersRepository,
    IPasswordHasher hasher)
{
    public async Task HandleAsync(string userName, string email, string password, CancellationToken ct = default)
    {
        var hashedPassword = hasher.Generate(password);
        var user = User.Create(userName, email, hashedPassword);

        await usersRepository.AddAsync(user, ct);
    }
}