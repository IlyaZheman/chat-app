using Chat.Domain.Models;

namespace Chat.Application.Interfaces;

public interface IJwtProvider
{
    string GenerateToken(User user);
}