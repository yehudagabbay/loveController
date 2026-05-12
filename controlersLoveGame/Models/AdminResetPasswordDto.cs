using System.ComponentModel.DataAnnotations;

namespace controlersLoveGame.Models
{
    public class AdminResetPasswordDto
    {
        [EmailAddress]
        public string? Email { get; set; }

        public string? NewPassword { get; set; }
    }
}
