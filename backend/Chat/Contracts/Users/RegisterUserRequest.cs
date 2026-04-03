using System.ComponentModel.DataAnnotations;

namespace Chat.Contracts.Users;

public record RegisterUserRequest(
    [Required] string UserName,
    [Required] string Email,
    [Required] string Password
);