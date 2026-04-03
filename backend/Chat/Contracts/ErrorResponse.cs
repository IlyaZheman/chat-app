namespace Chat.Contracts;

public record ErrorResponse(
    int Status,
    string Message
);