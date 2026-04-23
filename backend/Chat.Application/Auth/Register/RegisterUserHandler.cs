using Chat.Application.Interfaces;
using Chat.Domain.Exceptions;
using Chat.Domain.Interfaces;
using Chat.Domain.Models;

namespace Chat.Application.Auth.Register;

public class RegisterUserHandler(
    IUsersRepository usersRepository,
    IPasswordHasher passwordHasher)
{
    public async Task HandleAsync(RegisterUserCommand command, CancellationToken ct)
    {
        var existingUser = await usersRepository.GetByEmailAsync(command.Email, ct);

        if (existingUser != null)
            throw new ConflictException($"User with email '{command.Email}' already exists.");

        var passwordHash = passwordHasher.Generate(command.Password);

        var user = User.Create(
            command.UserName,
            command.Email,
            passwordHash);

        await usersRepository.AddAsync(user, ct);
    }
}