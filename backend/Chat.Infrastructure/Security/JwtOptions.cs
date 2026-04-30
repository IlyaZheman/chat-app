namespace Chat.Infrastructure.Security;

public class JwtOptions
{
    public string SecretKey { get; set; } = string.Empty;
    public int ExpiresHours { get; set; } = 24;
    public string Issuer { get; set; } = "chat-api";
    public string Audience { get; set; } = "chat-app";
}