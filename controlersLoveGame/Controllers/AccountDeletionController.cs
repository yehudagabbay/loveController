using controlersLoveGame.Data;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace controlersLoveGame.Controllers;

[ApiController]
[Route("")]
public class AccountDeletionController : ControllerBase
{
    private readonly LoveGameDbContext _context;
    private readonly ILogger<AccountDeletionController> _logger;

    public AccountDeletionController(
        LoveGameDbContext context,
        ILogger<AccountDeletionController> logger)
    {
        _context = context;
        _logger = logger;
    }

    [HttpGet("account-deletion")]
    [Produces("text/html")]
    public ContentResult AccountDeletionPage()
    {
        return Content(AccountDeletionHtml, "text/html; charset=utf-8");
    }

    [HttpPost("api/account-deletion")]
    public async Task<IActionResult> DeleteAccount(
        [FromBody] DeleteAccountRequest request,
        CancellationToken cancellationToken)
    {
        var email = request.Email?.Trim().ToLowerInvariant();

        if (string.IsNullOrWhiteSpace(email) || string.IsNullOrWhiteSpace(request.Password))
        {
            return BadRequest(new
            {
                message = "Enter the email address and password for your LIBA account."
            });
        }

        var user = await _context.Users
            .FirstOrDefaultAsync(
                candidate => candidate.Email.ToLower() == email,
                cancellationToken);

        if (user == null ||
            string.IsNullOrWhiteSpace(user.PasswordHash) ||
            !BCrypt.Net.BCrypt.Verify(request.Password, user.PasswordHash))
        {
            return Unauthorized(new
            {
                message = "The email address or password is incorrect."
            });
        }

        var userId = user.UserID;

        await using var transaction =
            await _context.Database.BeginTransactionAsync(cancellationToken);

        try
        {
            var perfectDates = await _context.PerfectDates
                .Where(date =>
                    date.CreatorUserID == userId ||
                    date.JoinedUserID == userId ||
                    date.User1ID == userId ||
                    date.User2ID == userId)
                .ToListAsync(cancellationToken);

            foreach (var date in perfectDates)
            {
                if (date.CreatorUserID == userId)
                {
                    date.CreatorUserID = null;
                    date.CreatorAccessTokenHash = null;
                    date.CreatorGender = null;
                }

                if (date.JoinedUserID == userId)
                {
                    date.JoinedUserID = null;
                    date.JoinedAccessTokenHash = null;
                    date.JoinedGender = null;
                }

                if (date.User1ID == userId)
                {
                    date.User1ID = null;
                    date.User1Gender = null;
                    date.User1Age = null;
                }

                if (date.User2ID == userId)
                {
                    date.User2ID = null;
                    date.User2Gender = null;
                    date.User2Age = null;
                }
            }

            await _context.UserCardStatus
                .Where(status => status.UserID == userId)
                .ExecuteDeleteAsync(cancellationToken);

            await _context.UserSharedCards
                .Where(sharedCard => sharedCard.UserID == userId)
                .ExecuteDeleteAsync(cancellationToken);

            await _context.Feedback
                .Where(feedback => feedback.UserID == userId)
                .ExecuteDeleteAsync(cancellationToken);

            await _context.Subscriptions
                .Where(subscription => subscription.UserID == userId)
                .ExecuteDeleteAsync(cancellationToken);

            _context.Users.Remove(user);
            await _context.SaveChangesAsync(cancellationToken);
            await transaction.CommitAsync(cancellationToken);

            return Ok(new
            {
                message = "Your LIBA account and associated data have been deleted."
            });
        }
        catch (Exception exception)
        {
            await transaction.RollbackAsync(cancellationToken);
            _logger.LogError(
                exception,
                "Account deletion failed for user ID {UserId}.",
                userId);

            return StatusCode(StatusCodes.Status500InternalServerError, new
            {
                message = "We could not delete the account. Please try again later or contact libaadmin@gmail.com."
            });
        }
    }

    public sealed class DeleteAccountRequest
    {
        public string? Email { get; set; }
        public string? Password { get; set; }
    }

    private const string AccountDeletionHtml = """
<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Delete your LIBA account</title>
  <style>
    :root {
      color-scheme: light;
      font-family: Arial, Helvetica, sans-serif;
      background: #f5f7f8;
      color: #17212b;
    }

    * {
      box-sizing: border-box;
    }

    body {
      margin: 0;
      min-height: 100vh;
      display: grid;
      place-items: center;
      padding: 24px;
    }

    main {
      width: min(100%, 520px);
      background: #ffffff;
      border: 1px solid #dce2e6;
      border-radius: 8px;
      padding: 32px;
      box-shadow: 0 12px 32px rgba(23, 33, 43, 0.08);
    }

    .brand {
      color: #176b60;
      font-size: 14px;
      font-weight: 700;
      letter-spacing: 0;
      margin: 0 0 10px;
    }

    h1 {
      margin: 0 0 12px;
      font-size: 30px;
      line-height: 1.2;
      letter-spacing: 0;
    }

    .intro {
      margin: 0 0 24px;
      color: #4c5b66;
      line-height: 1.55;
    }

    .warning {
      margin: 0 0 24px;
      padding: 14px 16px;
      border-left: 4px solid #c73737;
      background: #fff5f5;
      color: #702020;
      line-height: 1.45;
    }

    label {
      display: block;
      margin: 0 0 8px;
      font-weight: 700;
    }

    input {
      width: 100%;
      height: 48px;
      margin: 0 0 18px;
      padding: 0 12px;
      border: 1px solid #aeb9c0;
      border-radius: 6px;
      background: #ffffff;
      color: #17212b;
      font: inherit;
    }

    input:focus {
      border-color: #176b60;
      outline: 3px solid rgba(23, 107, 96, 0.16);
    }

    button {
      width: 100%;
      min-height: 48px;
      border: 0;
      border-radius: 6px;
      background: #b42323;
      color: #ffffff;
      font: inherit;
      font-weight: 700;
      cursor: pointer;
    }

    button:hover {
      background: #921d1d;
    }

    button:disabled {
      cursor: wait;
      opacity: 0.65;
    }

    #status {
      min-height: 24px;
      margin: 18px 0 0;
      line-height: 1.45;
    }

    #status.error {
      color: #9f1f1f;
    }

    #status.success {
      color: #176b42;
      font-weight: 700;
    }

    .support {
      margin: 24px 0 0;
      color: #596873;
      font-size: 14px;
      line-height: 1.5;
    }

    a {
      color: #176b60;
    }

    @media (max-width: 520px) {
      body {
        padding: 0;
        place-items: stretch;
      }

      main {
        min-height: 100vh;
        border: 0;
        border-radius: 0;
        padding: 28px 20px;
        box-shadow: none;
      }

      h1 {
        font-size: 26px;
      }
    }
  </style>
</head>
<body>
  <main>
    <p class="brand">LIBA</p>
    <h1>Delete your account</h1>
    <p class="intro">
      Enter the email address and password used for your LIBA account.
      Your request will be processed immediately.
    </p>

    <p class="warning">
      This permanently deletes your account, profile information, card activity,
      feedback, and subscription records. This action cannot be undone.
    </p>

    <form id="deletion-form">
      <label for="email">Email (username)</label>
      <input
        id="email"
        name="email"
        type="email"
        autocomplete="username"
        inputmode="email"
        required>

      <label for="password">Password</label>
      <input
        id="password"
        name="password"
        type="password"
        autocomplete="current-password"
        required>

      <button id="delete-button" type="submit">Delete account permanently</button>
      <p id="status" role="status" aria-live="polite"></p>
    </form>

    <p class="support">
      If you created your account with Google, or cannot access your password,
      request deletion at
      <a href="mailto:libaadmin@gmail.com?subject=LIBA%20account%20deletion%20request">libaadmin@gmail.com</a>.
    </p>
  </main>

  <script>
    const form = document.getElementById('deletion-form');
    const button = document.getElementById('delete-button');
    const status = document.getElementById('status');

    form.addEventListener('submit', async (event) => {
      event.preventDefault();

      const confirmed = window.confirm(
        'Permanently delete your LIBA account and associated data?'
      );

      if (!confirmed) {
        return;
      }

      button.disabled = true;
      button.textContent = 'Deleting...';
      status.className = '';
      status.textContent = '';

      try {
        const response = await fetch('/api/account-deletion', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            email: form.email.value,
            password: form.password.value
          })
        });

        const result = await response.json().catch(() => ({}));

        if (!response.ok) {
          throw new Error(result.message || 'Account deletion failed.');
        }

        form.reset();
        Array.from(form.elements).forEach((element) => {
          element.disabled = true;
        });
        status.className = 'success';
        status.textContent = result.message;
      } catch (error) {
        status.className = 'error';
        status.textContent = error.message || 'Account deletion failed.';
        button.disabled = false;
        button.textContent = 'Delete account permanently';
      }
    });
  </script>
</body>
</html>
""";
}
