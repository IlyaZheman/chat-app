namespace Chat.API.Contracts.Admin;

public record UserSummaryResponse(
    Guid Id,
    string UserName,
    string Email,
    string Role
);