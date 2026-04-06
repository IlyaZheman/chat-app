namespace Chat.Application.Auth.Register;

public record RegisterUserCommand(
    string UserName,
    string Email,
    string Password
);