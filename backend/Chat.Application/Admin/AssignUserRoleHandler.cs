using Chat.Domain.Exceptions;
using Chat.Domain.Interfaces;

namespace Chat.Application.Admin;

public class AssignUserRoleHandler(IUsersRepository usersRepository)
{
    public async Task HandleAsync(AssignUserRoleCommand command, CancellationToken ct = default)
    {
        var user = await usersRepository.GetByIdAsync(command.TargetUserId, ct)
            ?? throw new NotFoundException($"User '{command.TargetUserId}' not found.");

        user.AssignRole(command.Role);
        await usersRepository.UpdateAsync(user, ct);
    }
}