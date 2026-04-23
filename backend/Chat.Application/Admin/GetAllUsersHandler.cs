using Chat.Domain.Interfaces;
using Chat.Domain.Models;

namespace Chat.Application.Admin;

public class GetAllUsersHandler(IUsersRepository usersRepository)
{
    public Task<IReadOnlyList<User>> HandleAsync(CancellationToken ct = default) =>
        usersRepository.GetAllAsync(ct);
}
