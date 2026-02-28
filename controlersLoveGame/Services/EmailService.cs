using System.Net;
using System.Net.Mail;

namespace controlersLoveGame.Services
{
    public class EmailService
    {
        private readonly IConfiguration _config;

        public EmailService(IConfiguration config)
        {
            _config = config;
        }

        public async Task SendVerifyEmailAsync(string toEmail, string verifyLink)
        {
            // ✅ קריאה מוגנת מה-Config
            string from = _config["EmailSettings:From"];
            string smtpServer = _config["EmailSettings:SmtpServer"];
            string portRaw = _config["EmailSettings:Port"];
            string username = _config["EmailSettings:Username"];
            string password = _config["EmailSettings:Password"];

            // ✅ אם חסר משהו - תחזיר שגיאה ברורה (במקום Parameter 's')
            if (string.IsNullOrWhiteSpace(from) ||
                string.IsNullOrWhiteSpace(smtpServer) ||
                string.IsNullOrWhiteSpace(portRaw) ||
                string.IsNullOrWhiteSpace(username) ||
                string.IsNullOrWhiteSpace(password))
            {
                throw new InvalidOperationException(
                    "EmailSettings missing in server configuration. " +
                    "Required: From, SmtpServer, Port, Username, Password.");
            }

            if (!int.TryParse(portRaw, out int port))
                throw new InvalidOperationException($"Invalid EmailSettings:Port value: '{portRaw}'");

            using var mail = new MailMessage();
            mail.From = new MailAddress(from, "LoveGame App");
            mail.To.Add(toEmail);

            mail.Subject = "Verify Your Email Address";
            mail.IsBodyHtml = true;
            mail.Body = $@"
                <h3>Welcome to Liba Game!</h3>
                <p>Please verify your email address by clicking the link below:</p>
                <p><a href='{verifyLink}'>Click here to verify your account</a></p>
                <p>If the link doesn't work, copy and paste this URL into your browser:</p>
                <p>{verifyLink}</p>
                <br>
                <p>If you did not sign up for this account, you can safely ignore this email.</p>";

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
