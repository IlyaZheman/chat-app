using System.ComponentModel.DataAnnotations;

namespace Chat.API.Contracts.Users;

public record LoginUserRequest(
    [Required] string Email,
    [Required] string Password
);