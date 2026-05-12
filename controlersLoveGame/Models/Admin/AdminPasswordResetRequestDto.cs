using System.ComponentModel.DataAnnotations;

namespace controlersLoveGame.Models.AdminAuth
{
    public class AdminPasswordResetRequestDto
    {
        [EmailAddress]
        public string? Email { get; set; }

        public string? ClientOrigin { get; set; }
    }
}
