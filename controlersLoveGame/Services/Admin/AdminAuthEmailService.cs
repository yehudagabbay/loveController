using System.Net;
using System.Net.Mail;

namespace controlersLoveGame.Services.Admin
{
    public class AdminAuthEmailService
    {
        private readonly IConfiguration _config;

        public AdminAuthEmailService(IConfiguration config)
        {
            _config = config;
        }

        public async Task SendPasswordResetEmailAsync(string toEmail, string resetLink)
        {
            string from = _config["EmailSettings:From"] ?? "";
            string smtpServer = _config["EmailSettings:SmtpServer"] ?? "";
            string portRaw = _config["EmailSettings:Port"] ?? "";
            string username = _config["EmailSettings:Username"] ?? "";
            string password = _config["EmailSettings:Password"] ?? "";

            if (string.IsNullOrWhiteSpace(from) ||
                string.IsNullOrWhiteSpace(smtpServer) ||
                string.IsNullOrWhiteSpace(portRaw) ||
                string.IsNullOrWhiteSpace(username) ||
                string.IsNullOrWhiteSpace(password))
            {
                throw new InvalidOperationException("EmailSettings missing in server configuration.");
            }

            if (!int.TryParse(portRaw, out int port))
            {
                throw new InvalidOperationException($"Invalid EmailSettings:Port value: '{portRaw}'");
            }

            using var mail = new MailMessage();
            mail.From = new MailAddress(from, "LoveGame Admin");
            mail.To.Add(toEmail);
            mail.Subject = "Admin Password Reset";
            mail.IsBodyHtml = true;
            mail.Body = $@"
                <h3>Password reset request</h3>
                <p>Click the link below to choose a new password for the admin panel:</p>
                <p><a href='{resetLink}'>Reset admin password</a></p>
                <p>If the button does not work, copy this URL into your browser:</p>
                <p>{resetLink}</p>
                <br>
                <p>If you did not request this change, ignore this email.</p>";

            using var smtp = new SmtpClient(smtpServer)
            {
                Port = port,
                Credentials = new NetworkCredential(username, password),
                EnableSsl = true
            };

            await smtp.SendMailAsync(mail);
        }

        public async Task SendAdminVerificationEmailAsync(string toEmail, string requestedAdminEmail, string verifyLink)
        {
            string from = _config["EmailSettings:From"] ?? "";
            string smtpServer = _config["EmailSettings:SmtpServer"] ?? "";
            string portRaw = _config["EmailSettings:Port"] ?? "";
            string username = _config["EmailSettings:Username"] ?? "";
            string password = _config["EmailSettings:Password"] ?? "";

            if (string.IsNullOrWhiteSpace(from) ||
                string.IsNullOrWhiteSpace(smtpServer) ||
                string.IsNullOrWhiteSpace(portRaw) ||
                string.IsNullOrWhiteSpace(username) ||
                string.IsNullOrWhiteSpace(password))
            {
                throw new InvalidOperationException("EmailSettings missing in server configuration.");
            }

            if (!int.TryParse(portRaw, out int port))
            {
                throw new InvalidOperationException($"Invalid EmailSettings:Port value: '{portRaw}'");
            }

            using var mail = new MailMessage();
            mail.From = new MailAddress(from, "LoveGame Admin");
            mail.To.Add(toEmail);
            mail.Subject = "Approve admin creation";
            mail.IsBodyHtml = true;
            mail.Body = $@"
                <h3>Approve admin creation</h3>
                <p>A new admin account was requested for: <strong>{WebUtility.HtmlEncode(requestedAdminEmail)}</strong></p>
                <p>Click the link below to approve and complete admin creation:</p>
                <p><a href='{verifyLink}'>Approve admin creation</a></p>
                <p>If the link does not work, copy this URL into your browser:</p>
                <p>{verifyLink}</p>
                <br>
                <p>If you do not approve this request, ignore this email.</p>";

            using var smtp = new SmtpClient(smtpServer)
            {
                Port = port,
                Credentials = new NetworkCredential(username, password),
                EnableSsl = true
            };

            await smtp.SendMailAsync(mail);
        }
    }
}
