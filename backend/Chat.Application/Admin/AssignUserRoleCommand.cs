using Chat.Domain.Enums;

namespace Chat.Application.Admin;

public record AssignUserRoleCommand(
    Guid TargetUserId,
    UserRole Role
);