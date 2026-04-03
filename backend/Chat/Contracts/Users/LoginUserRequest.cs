using System.ComponentModel.DataAnnotations;

namespace Chat.Contracts.Users;

public record LoginUserRequest(
    [Required] string Email,
    [Required] string Password
);