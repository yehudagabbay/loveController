using controlersLoveGame.Data;
using controlersLoveGame.Models.AdminAuth;
using controlersLoveGame.Services.Admin;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace controlersLoveGame.Controllers.Admin
{
    [Route("api/admin-auth")]
    [ApiController]
    public class AdminAuthController : ControllerBase
    {
        private readonly LoveGameDbContext _context;
        private readonly IConfiguration _config;
        private readonly AdminPasswordResetStore _resetStore;
        private readonly AdminPendingCreationStore _pendingCreationStore;
        private readonly AdminAuthEmailService _emailService;

        public AdminAuthController(
            LoveGameDbContext context,
            IConfiguration config,
            AdminPasswordResetStore resetStore,
            AdminPendingCreationStore pendingCreationStore,
            AdminAuthEmailService emailService)
        {
            _context = context;
            _config = config;
            _resetStore = resetStore;
            _pendingCreationStore = pendingCreationStore;
            _emailService = emailService;
        }

        [HttpPost("password-reset/request")]
        public async Task<IActionResult> PasswordResetRequest([FromBody] AdminPasswordResetRequestDto dto)
        {
            try
            {
                var email = dto?.Email?.Trim().ToLowerInvariant();

                if (string.IsNullOrWhiteSpace(email))
                {
                    return Ok(new { message = "If the admin exists, a reset link has been sent." });
                }

                var admin = await _context.Admins.FirstOrDefaultAsync(a => a.Email.ToLower() == email);
                if (admin == null || !admin.IsActive)
                {
                    return Ok(new { message = "If the admin exists, a reset link has been sent." });
                }

                var token = _resetStore.Create(email, TimeSpan.FromMinutes(15));
                var clientOrigin = NormalizeClientOrigin(dto?.ClientOrigin);
                var resetLink =
                    $"{clientOrigin}/?adminReset=1&email={Uri.EscapeDataString(email)}&token={Uri.EscapeDataString(token)}";

                await _emailService.SendPasswordResetEmailAsync(email, resetLink);

                return Ok(new { message = "If the admin exists, a reset link has been sent." });
            }
            catch (Exception ex)
            {
                return StatusCode(500, $"Error sending reset email: {ex.Message}");
            }
        }

        [HttpPost("password-reset/confirm")]
        public async Task<IActionResult> PasswordResetConfirm([FromBody] AdminPasswordResetConfirmDto dto)
        {
            try
            {
                var email = dto?.Email?.Trim().ToLowerInvariant();
                var token = dto?.Token?.Trim();
                var newPassword = dto?.NewPassword?.Trim();

                if (string.IsNullOrWhiteSpace(email) ||
                    string.IsNullOrWhiteSpace(token) ||
                    string.IsNullOrWhiteSpace(newPassword))
                {
                    return BadRequest("Email, token and new password are required.");
                }

                if (newPassword.Length < 6)
                {
                    return BadRequest("Password must be at least 6 characters long.");
                }

                if (!_resetStore.Validate(email, token))
                {
                    return BadRequest("Invalid or expired reset token.");
                }

                var admin = await _context.Admins.FirstOrDefaultAsync(a => a.Email.ToLower() == email);
                if (admin == null || !admin.IsActive)
                {
                    return BadRequest("Invalid or expired reset token.");
                }

                admin.PasswordHash = BCrypt.Net.BCrypt.HashPassword(newPassword);
                await _context.SaveChangesAsync();

                _resetStore.Consume(email);

                return Ok(new { message = "Admin password reset successfully." });
            }
            catch (Exception ex)
            {
                return StatusCode(500, $"Error resetting admin password: {ex.Message}");
            }
        }

        [HttpGet("verify-create-admin")]
        public async Task<IActionResult> VerifyCreateAdmin(
            [FromQuery] string email,
            [FromQuery] string token,
            [FromQuery] string approverEmail)
        {
            try
            {
                if (string.IsNullOrWhiteSpace(email) ||
                    string.IsNullOrWhiteSpace(token) ||
                    string.IsNullOrWhiteSpace(approverEmail))
                {
                    return BadRequest("Missing email, token or approver email.");
                }

                var normalizedEmail = email.Trim().ToLowerInvariant();
                var normalizedApproverEmail = approverEmail.Trim().ToLowerInvariant();
                var allowedApprovers = (_config["AdminSecurity:AllowedCreatorEmails"] ?? string.Empty)
                    .Split(',', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries)
                    .Select(x => x.Trim().ToLowerInvariant())
                    .ToHashSet();

                if (!allowedApprovers.Contains(normalizedApproverEmail))
                {
                    return Content(
                        "<html><body style='font-family:Arial;padding:24px'><h2>This approver is not allowed to approve admin creation.</h2></body></html>",
                        "text/html");
                }

                var pending = _pendingCreationStore.Consume(normalizedEmail, token);

                if (pending == null)
                {
                    return Content(
                        "<html><body style='font-family:Arial;padding:24px'><h2>Invalid or expired verification link.</h2></body></html>",
                        "text/html");
                }

                var exists = await _context.Admins.AnyAsync(a => a.Email.ToLower() == normalizedEmail);
                if (exists)
                {
                    return Content(
                        "<html><body style='font-family:Arial;padding:24px'><h2>Admin already exists for this email.</h2></body></html>",
                        "text/html");
                }

                _context.Admins.Add(new controlersLoveGame.Models.Admin
                {
                    Email = normalizedEmail,
                    PasswordHash = pending.PasswordHash,
                    FullName = pending.FullName,
                    Role = pending.Role,
                    IsActive = true,
                    CreatedAt = DateTime.UtcNow
                });

                await _context.SaveChangesAsync();

                return Content(
                    $"<html><body style='font-family:Arial;padding:24px'><h2>Admin approved successfully.</h2><p>The admin account for <strong>{System.Net.WebUtility.HtmlEncode(normalizedEmail)}</strong> has been created.</p><p>Approved by: <strong>{System.Net.WebUtility.HtmlEncode(normalizedApproverEmail)}</strong></p></body></html>",
                    "text/html");
            }
            catch (Exception ex)
            {
                return StatusCode(500, $"Error verifying admin creation: {ex.Message}");
            }
        }

        private static string NormalizeClientOrigin(string? origin)
        {
            if (Uri.TryCreate(origin, UriKind.Absolute, out var uri))
            {
                return uri.GetLeftPart(UriPartial.Authority);
            }

            return "http://localhost:8081";
        }
    }
}
