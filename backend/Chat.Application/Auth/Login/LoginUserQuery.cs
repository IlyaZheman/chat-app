namespace Chat.Application.Auth.Login;

public record LoginUserQuery(
    string Email,
    string Password
);