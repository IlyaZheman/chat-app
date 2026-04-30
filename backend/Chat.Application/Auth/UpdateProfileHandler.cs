using Chat.Application.Interfaces;
using Chat.Domain.Exceptions;
using Chat.Domain.Interfaces;
using Chat.Domain.Models;

namespace Chat.Application.Auth;

public class UpdateProfileHandler(IUsersRepository usersRepository, IJwtProvider jwtProvider)
{
    public async Task<(User User, string Token)> HandleAsync(
        Guid userId,
        UpdateProfileCommand command,
        CancellationToken ct = default)
    {
        var user = await usersRepository.GetByIdAsync(userId, ct)
            ?? throw new NotFoundException($"User '{userId}' not found.");

        user.UpdateProfile(command.UserName, command.AvatarUrl, command.ClearAvatar);

        await usersRepository.UpdateAsync(user, ct);

        var token = jwtProvider.GenerateToken(user);
        return (user, token);
    }
}
