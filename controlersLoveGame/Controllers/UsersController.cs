using controlersLoveGame.Data;
using controlersLoveGame.Models;
using controlersLoveGame.Services;
using FirebaseAdmin.Auth;
using Microsoft.AspNetCore.Identity.Data;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;


namespace controlersLoveGame.Controllers
{

    [Route("api/[controller]")]
    [ApiController]
    public class UsersController : ControllerBase
    {
        private const int MaxCardsPerDraw = 18;
        private const int MaxFeedbackCommentLength = 300;
        private const int HiddenAppCardId = 300;
        private readonly LoveGameDbContext _context;
        private readonly EmailService _emailService;
        private readonly SubscriptionService _subscriptionService;

        private readonly IConfiguration _config;
        private const string PublicUsersApiBase = "https://libagame.somee.com/api/Users";

        public UsersController(LoveGameDbContext context, EmailService emailService, IConfiguration config, SubscriptionService subscriptionService)
        {
            _context = context;
            _emailService = emailService;
            _config = config;
            _subscriptionService = subscriptionService;

        }

        // שליפת כל המשתמשים
        [HttpGet]
        public async Task<ActionResult<IEnumerable<User>>> GetUsers()
        {
            try
            {
                var users = await _context.Users.ToListAsync();

                if (users == null || users.Count == 0)
                {
                    return NotFound("No users found.");
                }

                return Ok(users);
            }
            catch (Exception ex)
            {
                return StatusCode(500, $"An error occurred: {ex.Message}");
            }
        }


        [HttpPost("register")]
        public async Task<IActionResult> Register(
      [FromBody] User user,
      [FromQuery] string client = "app")
        {
            try
            {
                if (string.IsNullOrEmpty(user.Email) || string.IsNullOrEmpty(user.PasswordHash))
                {
                    return BadRequest("Email and Password are required.");
                }

                var normalizedEmail = user.Email.Trim().ToLower();

                var emailExists = await _context.Users
                    .AnyAsync(u => u.Email.ToLower() == normalizedEmail);

                if (emailExists)
                {
                    return BadRequest(new
                    {
                        message = "Email address already exists."
                    });
                }

                // ברירת מחדל app כדי לא לשבור את האפליקציה
                client = client?.Trim().ToLower() == "web" ? "web" : "app";

                user.Email = normalizedEmail;

                // משתמש רגיל, לא משתמש חברתי
                user.FirebaseUID = "N/A";
                user.SocialID = "N/A";

                // אימות מייל
                user.EmailVerified = false;
                user.EmailVerificationToken = Guid.NewGuid().ToString("N");
                user.EmailVerificationExpiry = DateTime.UtcNow.AddMinutes(15);

                // הצפנת הסיסמה
                user.HashPassword();

                _context.Users.Add(user);
                await _context.SaveChangesAsync();

                // הקישור במייל כולל client
                var verifyLink =
                    $"{PublicUsersApiBase}/open-verify?token={Uri.EscapeDataString(user.EmailVerificationToken)}&client={client}";

                try
                {
                    await _emailService.SendVerifyEmailAsync(user.Email, verifyLink);
                }
                catch (Exception mailEx)
                {
                    return StatusCode(500, $"User registered BUT email failed: {mailEx.Message}");
                }

                return Ok(new
                {
                    Message = "User registered successfully",
                    UserID = user.UserID
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, $"Error registering user: {ex.Message}");
            }
        }

        [HttpGet("test-email")]
        public async Task<IActionResult> TestEmail([FromServices] EmailService emailService)
        {
            await emailService.SendVerifyEmailAsync(
                "yehuda.gabbay@gmail.com",
                "https://example.com/verify?token=TEST123"
            );

            return Ok("Email sent");
        }

        [HttpGet("verify-email")]
        public async Task<IActionResult> VerifyEmail(
       [FromQuery] string token,
       [FromQuery] string client = "app")
        {
            // ברירת מחדל היא app כדי לא לשבור את האפליקציה הקיימת
            client = client?.Trim().ToLower() == "web" ? "web" : "app";

            if (string.IsNullOrWhiteSpace(token))
            {
                if (client == "web")
                {
                    return Redirect("http://localhost:5173/?verified=0&reason=missing-token");
                }

                return Redirect("loveclient://login?verified=0&reason=missing-token");
            }

            var user = await _context.Users
                .FirstOrDefaultAsync(u => u.EmailVerificationToken == token);

            if (user == null)
            {
                if (client == "web")
                {
                    return Redirect("http://localhost:5173/?verified=0&reason=invalid-token");
                }

                return Redirect("loveclient://login?verified=0&reason=invalid-token");
            }

            if (user.EmailVerificationExpiry == null || user.EmailVerificationExpiry < DateTime.UtcNow)
            {
                if (client == "web")
                {
                    return Redirect("http://localhost:5173/?verified=0&reason=expired-token");
                }

                return Redirect("loveclient://login?verified=0&reason=expired-token");
            }

            // עדכון המשתמש כמאומת
            user.EmailVerified = true;
            user.EmailVerificationToken = null;
            user.EmailVerificationExpiry = null;

            await _context.SaveChangesAsync();

            var email = Uri.EscapeDataString(user.Email ?? "");

            // אם הבקשה הגיעה מהאתר, מחזירים לאתר
            if (client == "web")
            {
                return Redirect($"http://localhost:5173/?verified=1&email={email}");
            }

            // אם הבקשה הגיעה מהאפליקציה, משאירים את ההתנהגות הקיימת
            return Redirect($"loveclient://login?verified=1&email={email}");
        }
        // IMPORTANT FIX: Email verification now uses the same deep-link flow as password reset:
        // email -> open-verify -> verify-email -> loveclient://login, so the app opens reliably after verification.
        [HttpGet("open-verify")]
        public IActionResult OpenVerify([FromQuery] string token, [FromQuery] string client = "app")
        {
            // ברירת מחדל app כדי לא לפגוע באפליקציה הקיימת
            client = client?.Trim().ToLower() == "web" ? "web" : "app";

            if (string.IsNullOrWhiteSpace(token))
            {
                if (client == "web")
                {
                    return Redirect("http://localhost:5173/?verified=0&reason=missing-token");
                }

                return Redirect("loveclient://login?verified=0&reason=missing-token");
            }

            // מעבירים את המשתמש לפונקציית האימות האמיתית
            // שומרים גם את client כדי לדעת לאן להחזיר אותו בסוף
            var verifyUrl =
                $"{PublicUsersApiBase}/verify-email?token={Uri.EscapeDataString(token)}&client={Uri.EscapeDataString(client)}";

            return Redirect(verifyUrl);
        }

        [HttpPost("social-login")]
        public async Task<IActionResult> SocialLogin([FromBody] SocialLoginRequest request)
        {
            try
            {
                if (string.IsNullOrWhiteSpace(request.IdToken) ||
                    string.IsNullOrWhiteSpace(request.Email))
                {
                    return BadRequest(new { Message = "IdToken and Email are required." });
                }

                // ✅ אימות ה-Token מול Firebase
                FirebaseToken decodedToken = await FirebaseAuth.DefaultInstance.VerifyIdTokenAsync(request.IdToken);
                string firebaseUid = decodedToken.Uid;
                string normalizedEmail = request.Email.Trim().ToLower();

                // First prefer a user already linked to this social account.
                var user = await _context.Users.FirstOrDefaultAsync(
                    u => u.SocialID == firebaseUid || u.FirebaseUID == firebaseUid
                );

                if (user != null)
                {
                    if (!string.Equals(user.Email, normalizedEmail, StringComparison.OrdinalIgnoreCase))
                    {
                        return BadRequest(new
                        {
                            Message = "This social account is already linked to a different email address."
                        });
                    }

                    user.Email = normalizedEmail;
                    user.FirebaseUID = firebaseUid;
                    user.SocialID = firebaseUid;

                    if (string.IsNullOrWhiteSpace(user.Nickname) && !string.IsNullOrWhiteSpace(request.Nickname))
                    {
                        user.Nickname = request.Nickname.Trim();
                    }

                    if (string.IsNullOrWhiteSpace(user.Gender) && !string.IsNullOrWhiteSpace(request.Gender))
                    {
                        user.Gender = request.Gender.Trim();
                    }

                    if (user.Age == null && request.Age != null)
                    {
                        user.Age = request.Age;
                    }

                    user.EmailVerified = true;

                    await _context.SaveChangesAsync();

                    return Ok(new
                    {
                        Message = "User logged in successfully",
                        UserID = user.UserID,
                        user.Email,
                        user.Nickname,
                        user.Gender,
                        user.Age,
                        user.SocialID,
                        user.FirebaseUID
                    });
                }

                // If a regular account already exists with this email, link Google to it.
                user = await _context.Users.FirstOrDefaultAsync(
                    u => u.Email.ToLower() == normalizedEmail
                );

                if (user != null)
                {
                    if (!string.IsNullOrWhiteSpace(user.SocialID) &&
                        user.SocialID != "N/A" &&
                        user.SocialID != firebaseUid)
                    {
                        return BadRequest(new
                        {
                            Message = "This email is already linked to a different social account."
                        });
                    }

                    user.Email = normalizedEmail;
                    user.FirebaseUID = firebaseUid;
                    user.SocialID = firebaseUid;
                    user.EmailVerified = true;

                    if (!string.IsNullOrWhiteSpace(request.Nickname))
                    {
                        user.Nickname = request.Nickname.Trim();
                    }

                    if (!string.IsNullOrWhiteSpace(request.Gender))
                    {
                        user.Gender = request.Gender.Trim();
                    }

                    if (request.Age != null)
                    {
                        user.Age = request.Age;
                    }

                    await _context.SaveChangesAsync();

                    return Ok(new
                    {
                        Message = "User logged in successfully",
                        UserID = user.UserID,
                        user.Email,
                        user.Nickname,
                        user.Gender,
                        user.Age,
                        user.SocialID,
                        user.FirebaseUID
                    });
                }

                // Otherwise create a brand-new social account.
                user = new User
                {
                    FirebaseUID = firebaseUid,
                    SocialID = firebaseUid,
                    Email = normalizedEmail,
                    Nickname = string.IsNullOrWhiteSpace(request.Nickname)
                        ? normalizedEmail.Split('@')[0]
                        : request.Nickname.Trim(),
                    Gender = string.IsNullOrWhiteSpace(request.Gender) ? "N/A" : request.Gender.Trim(),
                    Age = request.Age,
                    // The current SQL schema still requires PasswordHash NOT NULL.
                    PasswordHash = BCrypt.Net.BCrypt.HashPassword(Guid.NewGuid().ToString()),
                    EmailVerified = true,
                    CreationDate = DateTime.UtcNow
                };

                _context.Users.Add(user);
                await _context.SaveChangesAsync();

                return Ok(new
                {
                    Message = "User logged in successfully",
                    UserID = user.UserID,
                    user.Email,
                    user.Nickname,
                    user.Gender,
                    user.Age,
                    user.SocialID,
                    user.FirebaseUID
                });
            }
            catch (FirebaseAuthException ex)
            {
                return Unauthorized(new { Message = "Invalid Firebase token", Error = ex.Message });
            }
            catch (Exception ex)
            {
                var errorMessage = ex.InnerException?.Message ?? ex.Message;
                return StatusCode(500, $"An error occurred: {errorMessage}");
            }
        }


        [HttpPost("login")]
        public async Task<ActionResult<User>> Login([FromBody] controlersLoveGame.Models.LoginRequest loginRequest)
        {
            try
            {
                var user = await _context.Users.FirstOrDefaultAsync(u => u.Email == loginRequest.Email);

                if (user == null)
                {
                    return Unauthorized(new
                    {
                        message = "Invalid email or password."
                    });
                }

                if (user.FirebaseUID != "N/A" || user.SocialID != "N/A")
                {
                    return Unauthorized(new
                    {
                        message = "This account is linked to a social login. Please use Google/Facebook login."
                    });
                }

                if (user.EmailVerified == false)
                {
                    return Unauthorized(new
                    {
                        message = "Please verify your email before logging in.",
                        emailNotVerified = true
                    });
                }

                if (!BCrypt.Net.BCrypt.Verify(loginRequest.Password, user.PasswordHash))
                {
                    return Unauthorized(new
                    {
                        message = "Invalid email or password."
                    });
                }

                return Ok(new
                {
                    Message = $"{user.Nickname} is logged in",
                    User = user
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new
                {
                    message = $"An error occurred: {ex.Message}"
                });
            }
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteUser(int id)
        {
            try
            {
                // חיפוש המשתמש במסד הנתונים
                var user = await _context.Users.FindAsync(id);
                if (user == null)
                {
                    return NotFound("User not found.");
                }

                // מחיקת המשתמש
                _context.Users.Remove(user);
                await _context.SaveChangesAsync();

                return Ok($"User with ID {id} has been deleted successfully.");
            }
            catch (Exception ex)
            {
                return StatusCode(500, $"An error occurred: {ex.Message}");
            }
        }
        [HttpDelete("deleteByEmail/{email}")]
        public async Task<IActionResult> DeleteUserByEmail(string email)
        {
            try
            {
                // בדיקה אם המשתמש קיים
                var user = await _context.Users.FirstOrDefaultAsync(u => u.Email == email);
                if (user == null)
                {
                    return NotFound("User not found.");
                }

                // מחיקת המשתמש
                _context.Users.Remove(user);
                await _context.SaveChangesAsync();

                return Ok($"User with email {email} has been deleted successfully.");
            }
            catch (Exception ex)
            {
                return StatusCode(500, $"An error occurred: {ex.Message}");
            }
        }

        [HttpPost("reset-password")]
        public async Task<IActionResult> AdminResetPassword([FromBody] AdminResetPasswordDto dto)
        {
            try
            {
                var email = dto?.Email?.Trim().ToLower();
                var newPassword = dto?.NewPassword?.Trim();

                if (string.IsNullOrWhiteSpace(email) || string.IsNullOrWhiteSpace(newPassword))
                {
                    return BadRequest("Email and NewPassword are required.");
                }

                if (newPassword.Length < 6)
                {
                    return BadRequest("Password must be at least 6 characters long.");
                }

                var user = await _context.Users.FirstOrDefaultAsync(u => u.Email.ToLower() == email);
                if (user == null)
                {
                    return NotFound("User not found.");
                }

                if (user.FirebaseUID != "N/A" || user.SocialID != "N/A")
                {
                    return BadRequest(new
                    {
                        message = "Password reset is available only for accounts created with regular registration."
                    });
                }

                user.PasswordHash = BCrypt.Net.BCrypt.HashPassword(newPassword);
                user.PasswordResetToken = null;
                user.PasswordResetExpiry = null;

                await _context.SaveChangesAsync();

                return Ok(new
                {
                    message = "Password reset successfully."
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, $"An error occurred: {ex.Message}");
            }
        }

        [HttpGet("open-reset")]
        public IActionResult OpenReset(
      [FromQuery] string email,
      [FromQuery] string token,
      [FromQuery] string client = "app")
        {
            // ברירת מחדל app כדי לא לשבור את האפליקציה
            client = client?.Trim().ToLower() == "web" ? "web" : "app";

            if (string.IsNullOrWhiteSpace(email) || string.IsNullOrWhiteSpace(token))
            {
                if (client == "web")
                {
                    return Redirect("http://localhost:5173/?reset=0&reason=missing-data");
                }

                return Redirect("loveclient://reset-password?reset=0&reason=missing-data");
            }

            var safeEmail = Uri.EscapeDataString(email);
            var safeToken = Uri.EscapeDataString(token);

            // חזרה לאתר
            if (client == "web")
            {
                return Redirect($"http://localhost:5173/?reset=1&email={safeEmail}&token={safeToken}");
            }

            // חזרה לאפליקציה
            return Redirect($"loveclient://reset-password?email={safeEmail}&token={safeToken}");
        }
        [HttpPost("password-reset/request")]
        public async Task<IActionResult> PasswordResetRequest(
      [FromBody] PasswordResetRequestDto dto,
      [FromQuery] string client = "app")
        {
            try
            {
                // ברירת מחדל app כדי לא לשבור את האפליקציה
                client = client?.Trim().ToLower() == "web" ? "web" : "app";

                var email = dto?.Email?.Trim();

                if (string.IsNullOrWhiteSpace(email))
                {
                    return Ok("If the email exists, a reset link has been sent.");
                }

                var normalizedEmail = email.ToLower();

                var user = await _context.Users
                    .FirstOrDefaultAsync(u => u.Email.ToLower() == normalizedEmail);

                if (user == null)
                {
                    return Ok("If the email exists, a reset link has been sent.");
                }

                if (user.FirebaseUID != "N/A" || user.SocialID != "N/A")
                {
                    return BadRequest(new
                    {
                        message = "Password reset is available only for accounts created with regular registration."
                    });
                }

                // יצירת טוקן לאיפוס סיסמה
                user.PasswordResetToken = Guid.NewGuid().ToString("N");
                user.PasswordResetExpiry = DateTime.UtcNow.AddMinutes(15);

                await _context.SaveChangesAsync();

                // מוסיפים client כדי לדעת אם להחזיר לאתר או לאפליקציה
                var link =
                    $"{PublicUsersApiBase}/open-reset?email={Uri.EscapeDataString(user.Email)}&token={Uri.EscapeDataString(user.PasswordResetToken)}&client={client}";

                await _emailService.SendVerifyEmailAsync(user.Email, link);

                return Ok("If the email exists, a reset link has been sent.");
            }
            catch (Exception ex)
            {
                return StatusCode(500, ex.Message);
            }
        }
        [HttpPost("password-reset/confirm")]
        public async Task<IActionResult> PasswordResetConfirm([FromBody] PasswordResetConfirmDto dto)
        {
            try
            {
                var email = dto?.Email?.Trim();
                var token = dto?.Token?.Trim();
                var newPassword = dto?.NewPassword;

                if (string.IsNullOrWhiteSpace(email) ||
                    string.IsNullOrWhiteSpace(token) ||
                    string.IsNullOrWhiteSpace(newPassword))
                {
                    return BadRequest("Email, Token and NewPassword are required.");
                }

                var user = await _context.Users.FirstOrDefaultAsync(u => u.Email == email);

                if (user == null)
                    return BadRequest("Invalid email or token.");

                if (user.FirebaseUID != "N/A" || user.SocialID != "N/A")
                {
                    return BadRequest(new
                    {
                        message = "Password reset is available only for accounts created with regular registration."
                    });
                }

                if (user.PasswordResetToken != token)
                    return BadRequest("Invalid email or token.");

                if (user.PasswordResetExpiry == null ||
                    user.PasswordResetExpiry < DateTime.UtcNow)
                    return BadRequest("Token expired.");

                // ✅ הצפנה ישירה
                user.PasswordHash = BCrypt.Net.BCrypt.HashPassword(newPassword);

                // מנקים כדי שלא יהיה שימוש חוזר
                user.PasswordResetToken = null;
                user.PasswordResetExpiry = null;

                await _context.SaveChangesAsync();

                return Ok("Password reset successfully.");
            }
            catch (Exception ex)
            {
                return StatusCode(500, ex.Message);
            }
        }
        [HttpPost("resend-verification-email")]
        public async Task<IActionResult> ResendVerificationEmail(
       [FromBody] PasswordResetRequestDto dto,
       [FromQuery] string client = "app")
        {
            try
            {
                // ברירת מחדל app כדי לא לשבור את האפליקציה
                client = client?.Trim().ToLower() == "web" ? "web" : "app";

                var email = dto?.Email?.Trim();

                if (string.IsNullOrWhiteSpace(email))
                {
                    return BadRequest(new
                    {
                        message = "Email is required."
                    });
                }

                var normalizedEmail = email.ToLower();

                var user = await _context.Users
                    .FirstOrDefaultAsync(u => u.Email.ToLower() == normalizedEmail);

                if (user == null)
                {
                    return Ok(new
                    {
                        message = "If the email exists, a verification email has been sent."
                    });
                }

                if (user.EmailVerified)
                {
                    return BadRequest(new
                    {
                        message = "Email already verified."
                    });
                }

                // יצירת טוקן חדש לאימות מייל
                user.EmailVerificationToken = Guid.NewGuid().ToString("N");
                user.EmailVerificationExpiry = DateTime.UtcNow.AddHours(24);

                await _context.SaveChangesAsync();

                // מוסיפים client כדי לדעת לאן להחזיר את המשתמש אחרי הלחיצה במייל
                var verificationLink =
                    $"{PublicUsersApiBase}/open-verify?token={Uri.EscapeDataString(user.EmailVerificationToken)}&client={client}";

                await _emailService.SendVerifyEmailAsync(user.Email, verificationLink);

                return Ok(new
                {
                    message = "Verification email sent."
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new
                {
                    message = ex.Message
                });
            }
        }
        [HttpGet("debug-email-settings")]
        public IActionResult DebugEmailSettings()
        {
            var from = _config["EmailSettings:From"];
            var smtp = _config["EmailSettings:SmtpServer"];
            var port = _config["EmailSettings:Port"];
            var user = _config["EmailSettings:Username"];
            var pass = _config["EmailSettings:Password"];

            return Ok(new
            {
                From = string.IsNullOrWhiteSpace(from) ? "MISSING" : "OK",
                SmtpServer = string.IsNullOrWhiteSpace(smtp) ? "MISSING" : "OK",
                Port = string.IsNullOrWhiteSpace(port) ? "MISSING" : "OK",
                Username = string.IsNullOrWhiteSpace(user) ? "MISSING" : "OK",
                Password = string.IsNullOrWhiteSpace(pass) ? "MISSING" : "OK"
            });
        }



        [HttpPut("update-details/{userId}")]
        public async Task<IActionResult> UpdateUserDetails(
    int userId,
    [FromBody] UpdateUserDetailsRequest request)
        {
            try
            {
                var user = await _context.Users.FirstOrDefaultAsync(u => u.UserID == userId);
                if (user == null)
                {
                    return NotFound("User not found.");
                }

                // עדכון שדות מותרים בלבד
                user.Nickname = request.Nickname;
                user.Gender = request.Gender;
                user.Age = request.Age;

                await _context.SaveChangesAsync();

                return Ok(new
                {
                    Message = "User details updated successfully",
                    user.UserID,
                    user.Nickname,
                    user.Gender,
                    user.Age
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, $"Error updating user details: {ex.Message}");
            }
        }



        [HttpPost("get-selected-cards")]
        public async Task<ActionResult<IEnumerable<Card>>> GetSelectedCards([FromBody] DrawCardRequest request)
        {
            try
            {
                if (request?.Selections == null || request.Selections.Count == 0)
                {
                    return BadRequest("At least one category and level selection is required.");
                }

                var selections = request.Selections;
                string lang = string.IsNullOrWhiteSpace(request?.Lang) ? "en" : request.Lang.Trim().ToLower();
                int userId = request?.UserID ?? 0;

                // בדיקת פרימיום עוברת דרך השירות המרכזי.
                // כרגע השירות מחזיר true לכולם, כך שכל המשחקים והרמות פתוחים.
                // בעתיד, כשתחזירו ניהול פרימיום אמיתי, אין צורך לשנות כאן את הזרימה.
                bool isPremium = await _subscriptionService.CheckIfUserPremium(userId);

                List<Card> selectedCards = new List<Card>();
                var userCardMetadata = await LoadUserCardMetadataAsync(userId);

                var normalizedSelections = selections
                    .GroupBy(selection => new
                    {
                        ModeID = selection.ModeID == 0 ? 1 : selection.ModeID,
                        selection.CategoryID,
                        selection.LevelID
                    })
                    .Select(group => new DrawCardRequest.CategoryLevelSelection
                    {
                        ModeID = group.Key.ModeID,
                        CategoryID = group.Key.CategoryID,
                        LevelID = group.Key.LevelID,
                        NumberOfCards = group.Sum(item => Math.Max(0, item.NumberOfCards))
                    })
                    .ToList();

                var buckets = new List<CardSelectionBucket>();

                foreach (var selection in normalizedSelections)
                {
                    int modeId = selection.ModeID == 0 ? 1 : selection.ModeID;
                    int categoryId = selection.CategoryID;
                    int levelId = selection.LevelID;

                    var cards = await _context.Cards
                        .Where(c =>
                            c.ModeID == modeId &&
                            c.CategoryID == categoryId &&
                            c.LevelID == levelId &&
                            c.IsActive &&
                            c.CardID != HiddenAppCardId)
                        .ToListAsync();

                    // ההגבלה הזו נשארת כדי לשמר את הלוגיקה העסקית המקורית.
                    // בפועל כרגע היא לא תופעל, כי השירות מגדיר שכל המשתמשים פרימיום.
                    // בעתיד, אם תחזירו את הפרימיום האמיתי, ההגבלה תחזור לעבוד אוטומטית.
                    if (!isPremium)
                    {
                        cards = cards.Where(c => c.LevelID <= 2).ToList();
                    }

                    buckets.Add(new CardSelectionBucket
                    {
                        ModeID = modeId,
                        CategoryID = categoryId,
                        LevelID = levelId,
                        UnseenCards = TakeRandomCards(
                            cards.Where(c =>
                            {
                                int likeStatus = userCardMetadata.LikeStatusByCardId.GetValueOrDefault(c.CardID);
                                bool isCompleted = userCardMetadata.CompletedCardIds.Contains(c.CardID);
                                bool isFavoriteCard = likeStatus == 2;
                                bool hasFeedback = userCardMetadata.FeedbackCardIds.Contains(c.CardID);

                                c.LikeStatus = likeStatus;
                                c.HasFeedback = hasFeedback;
                                c.IsShared = userCardMetadata.SharedCardIds.Contains(c.CardID);

                                if (isFavoriteCard || hasFeedback)
                                {
                                    return false;
                                }

                                return !isCompleted || likeStatus == 1;
                            }).ToList(),
                            cards.Count),
                        FallbackCards = TakeRandomCards(
                            cards.Where(c =>
                            {
                                int likeStatus = userCardMetadata.LikeStatusByCardId.GetValueOrDefault(c.CardID);
                                bool isCompleted = userCardMetadata.CompletedCardIds.Contains(c.CardID);
                                bool isFavoriteCard = likeStatus == 2;
                                bool hasFeedback = userCardMetadata.FeedbackCardIds.Contains(c.CardID);

                                c.LikeStatus = likeStatus;
                                c.HasFeedback = hasFeedback;
                                c.IsShared = userCardMetadata.SharedCardIds.Contains(c.CardID);

                                return isCompleted && likeStatus <= 0 && !isFavoriteCard && !hasFeedback;
                            }).ToList(),
                            cards.Count)
                    });
                }

                int totalAvailableCards = buckets.Sum(bucket => bucket.UnseenCards.Count + bucket.FallbackCards.Count);
                int targetCardCount = Math.Min(MaxCardsPerDraw, totalAvailableCards);

                var selectedUnseenCards = TakeCardsRoundRobin(
                    buckets,
                    targetCardCount,
                    bucket => bucket.UnseenCards);

                int remainingSlots = targetCardCount - selectedUnseenCards.Count;

                var selectedFallbackCards = remainingSlots > 0
                    ? TakeCardsRoundRobin(buckets, remainingSlots, bucket => bucket.FallbackCards)
                    : new List<Card>();

                foreach (var bucket in buckets)
                {
                    int selectedFromBucket = selectedUnseenCards.Count(card =>
                            card.ModeID == bucket.ModeID &&
                            card.CategoryID == bucket.CategoryID &&
                            card.LevelID == bucket.LevelID) +
                        selectedFallbackCards.Count(card =>
                            card.ModeID == bucket.ModeID &&
                            card.CategoryID == bucket.CategoryID &&
                            card.LevelID == bucket.LevelID);

                    Console.WriteLine(
                        $"[GetSelectedCards] UserID={userId}, ModeID={bucket.ModeID}, CategoryID={bucket.CategoryID}, LevelID={bucket.LevelID}, Selected={selectedFromBucket}, UnseenPool={bucket.UnseenCards.Count}, FallbackPool={bucket.FallbackCards.Count}");
                }

                foreach (var card in selectedUnseenCards.Concat(selectedFallbackCards))
                {
                    selectedCards.Add(await PopulateCardDisplayDataAsync(card, lang, userCardMetadata));
                }

                if (selectedCards.Count == 0)
                {
                    return NotFound("No cards found for the selected categories, levels and modes.");
                }

                return Ok(selectedCards);
            }
            catch (Exception ex)
            {
                return StatusCode(500, $"An error occurred: {ex.Message}");
            }
        }

        [HttpPost("get-special-cards")]
        public async Task<ActionResult<IEnumerable<Card>>> GetSpecialCards([FromBody] SpecialCardRequest request)
        {
            try
            {
                if (request == null || !request.HasAnyFilter())
                {
                    return BadRequest("At least one special filter is required.");
                }

                string lang = string.IsNullOrWhiteSpace(request.Lang) ? "en" : request.Lang.Trim().ToLower();
                int userId = request.UserID ?? 0;
                bool isPremium = await _subscriptionService.CheckIfUserPremium(userId);
                var userCardMetadata = await LoadUserCardMetadataAsync(userId);

                var selections = (request.Selections ?? new List<DrawCardRequest.CategoryLevelSelection>())
                    .GroupBy(selection => new
                    {
                        ModeID = selection.ModeID == 0 ? 1 : selection.ModeID,
                        selection.CategoryID,
                        selection.LevelID
                    })
                    .Select(group => new DrawCardRequest.CategoryLevelSelection
                    {
                        ModeID = group.Key.ModeID,
                        CategoryID = group.Key.CategoryID,
                        LevelID = group.Key.LevelID,
                        NumberOfCards = group.Sum(item => Math.Max(0, item.NumberOfCards))
                    })
                    .ToList();

                if (selections.Count == 0)
                {
                    return BadRequest("At least one category and level selection is required.");
                }

                var buckets = new List<CardSelectionBucket>();

                foreach (var selection in selections)
                {
                    int modeId = selection.ModeID == 0 ? 1 : selection.ModeID;

                    var cards = await _context.Cards
                        .Where(c =>
                            c.ModeID == modeId &&
                            c.CategoryID == selection.CategoryID &&
                            c.LevelID == selection.LevelID &&
                            c.IsActive &&
                            c.CardID != HiddenAppCardId)
                        .ToListAsync();

                    if (!isPremium)
                    {
                        cards = cards.Where(c => c.LevelID <= 2).ToList();
                    }

                    var specialCards = TakeRandomCards(
                        cards.Where(c =>
                        {
                            int likeStatus = userCardMetadata.LikeStatusByCardId.GetValueOrDefault(c.CardID);
                            bool isFavoriteCard = likeStatus == 2;
                            bool hasFeedback = userCardMetadata.FeedbackCardIds.Contains(c.CardID);
                            bool isShared = userCardMetadata.SharedCardIds.Contains(c.CardID);

                            c.LikeStatus = likeStatus;
                            c.HasFeedback = hasFeedback;
                            c.IsShared = isShared;

                            return (request.IncludeFavoriteCards && isFavoriteCard)
                                || (request.IncludeFeedbackCards && hasFeedback)
                                || (request.IncludeSharedCards && isShared);
                        }).ToList(),
                        cards.Count);

                    buckets.Add(new CardSelectionBucket
                    {
                        ModeID = modeId,
                        CategoryID = selection.CategoryID,
                        LevelID = selection.LevelID,
                        UnseenCards = specialCards
                    });
                }

                int totalAvailableCards = buckets.Sum(bucket => bucket.UnseenCards.Count);
                int targetCardCount = Math.Min(MaxCardsPerDraw, totalAvailableCards);

                var selectedCards = TakeCardsRoundRobin(
                    buckets,
                    targetCardCount,
                    bucket => bucket.UnseenCards);

                if (selectedCards.Count == 0)
                {
                    return NotFound("No special cards found for the selected filters.");
                }

                var translatedCards = new List<Card>();
                foreach (var card in selectedCards)
                {
                    translatedCards.Add(await PopulateCardDisplayDataAsync(card, lang, userCardMetadata));
                }

                return Ok(translatedCards);
            }
            catch (Exception ex)
            {
                return StatusCode(500, $"An error occurred: {ex.Message}");
            }
        }

        [HttpPost("purchase-subscription")]
        public async Task<IActionResult> PurchaseSubscription([FromBody] PurchaseSubscriptionRequest request)
        {
            try
            {
                // זה ה-endpoint שהלקוח קורא לו אחרי שהאפליקציה קיבלה אישור על רכישה.
                // התפקיד של הבקר כאן הוא רק:
                // 1. לוודא שהבקשה בסיסית תקינה
                // 2. להעביר את הטיפול לשירות
                // 3. להחזיר תשובה נוחה ללקוח
                if (request == null)
                {
                    return BadRequest("Request body is required.");
                }

                // בלי מזהה משתמש ובלי מזהה תוכנית מנוי אין לנו אפשרות לשמור את הרכישה.
                if (request.UserID <= 0 || request.PlanID <= 0)
                {
                    return BadRequest("UserID and PlanID are required.");
                }

                // כאן עוברים לשירות שבו נמצאת כל הלוגיקה העסקית:
                // בדיקת משתמש, בדיקת תוכנית, חישוב תאריכים, מניעת כפילויות ושמירה למסד.
                var result = await _subscriptionService.SavePurchaseAsync(request);

                if (!result.Success)
                {
                    return BadRequest(result.Message);
                }

                var subscription = result.Subscription!;

                // מחזירים ללקוח רק את הנתונים החשובים של המנוי שנשמר,
                // כדי שהאפליקציה תוכל לדעת שהשמירה הצליחה ולעדכן את ה-UI.
                return Ok(new
                {
                    message = result.Message,
                    subscription.SubscriptionID,
                    subscription.UserID,
                    subscription.PlanID,
                    subscription.Store,
                    subscription.ProductId,
                    subscription.StartDate,
                    subscription.EndDate,
                    subscription.IsActive,
                    subscription.AutoRenewing
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, $"Error saving subscription purchase: {ex.Message}");
            }
        }


        [HttpPost("update-card-status")]
        public async Task<IActionResult> UpdateCardStatus([FromBody] MarkCardCompletedRequest request)
        {
            try
            {
                // הדפסת הבקשה שהתקבלה כדי לבדוק אם הערכים מגיעים נכון
                Console.WriteLine($"UserID: {request.UserID}, CardID: {request.CardID}, IsCompleted: {request.IsCompleted}, LikeStatus: {request.LikeStatus}");

                // חיפוש אם כבר קיימת רשומה לכרטיס הזה עבור המשתמש
                var existingStatus = await _context.UserCardStatus
                    .FirstOrDefaultAsync(ucs => ucs.UserID == request.UserID && ucs.CardID == request.CardID);

                if (existingStatus != null)
                {
                    // עדכון הסטטוס אם כבר קיים רשומה
                    existingStatus.IsCompleted = request.IsCompleted;
                    existingStatus.LikeStatus = request.LikeStatus;
                }
                else
                {
                    // יצירת רשומה חדשה
                    _context.UserCardStatus.Add(new UserCardStatus
                    {
                        UserID = request.UserID,
                        CardID = request.CardID,
                        IsCompleted = request.IsCompleted,
                        LikeStatus = request.LikeStatus
                    });
                }

                await _context.SaveChangesAsync();
                return Ok("Card status updated successfully.");
            }
            catch (Exception ex)
            {
                return StatusCode(500, $"An error occurred: {ex.Message}");
            }
        }
        // ✅ כרטיסים שאהבו במיוחד 💖 לפי משתמש
        [HttpGet("favorite-cards/{userId}")]
        public async Task<ActionResult<IEnumerable<Card>>> GetFavoriteCardsByUser(int userId)
        {
            var cards = await _context.UserCardStatus
                .Where(ucs => ucs.UserID == userId && ucs.LikeStatus == 2 && ucs.CardID != HiddenAppCardId)
                .Select(ucs => ucs.Card)
                .Distinct()
                .ToListAsync();

            return Ok(cards);
        }



        // ✅ כרטיסים שאהבו ❤️ לפי משתמש
        [HttpGet("liked-cards/{userId}")]
        public async Task<ActionResult<IEnumerable<Card>>> GetLikedCardsByUser(int userId)
        {
            var cards = await _context.UserCardStatus
                .Where(ucs => ucs.UserID == userId && ucs.LikeStatus == 1 && ucs.CardID != HiddenAppCardId)
                .Select(ucs => ucs.Card)
                .Distinct()
                .ToListAsync();

            return Ok(cards);
        }


        // ✅ כרטיסים שסומנו כבוצעו ✅ לפי משתמש
        [HttpGet("completed-cards/{userId}")]
        public async Task<ActionResult<IEnumerable<Card>>> GetCompletedCardsByUser(int userId)
        {
            var cards = await _context.UserCardStatus
                .Where(ucs => ucs.UserID == userId && ucs.IsCompleted && ucs.CardID != HiddenAppCardId)
                .Select(ucs => ucs.Card)
                .Distinct()
                .ToListAsync();

            return Ok(cards);
        }

        [HttpPost("mark-card-completed")]
        public async Task<IActionResult> MarkCardCompleted([FromBody] MarkCardCompletedRequest request)
        {
            try
            {
                var status = await _context.UserCardStatus
                    .FirstOrDefaultAsync(u => u.UserID == request.UserID && u.CardID == request.CardID);

                if (status == null)
                {
                    status = new UserCardStatus
                    {
                        UserID = request.UserID,
                        CardID = request.CardID,
                        IsCompleted = request.IsCompleted,
                        LikeStatus = request.LikeStatus
                    };

                    _context.UserCardStatus.Add(status);
                }
                else
                {
                    status.IsCompleted = request.IsCompleted;
                    status.LikeStatus = request.LikeStatus;
                }

                await _context.SaveChangesAsync();
                return Ok("Card marked as completed.");
            }
            catch (Exception ex)
            {
                return StatusCode(500, $"Error marking card as completed: {ex.Message}");
            }
        }

        [HttpPost("mark-card-shared")]
        public async Task<IActionResult> MarkCardShared([FromBody] MarkCardSharedRequest request)
        {
            try
            {
                if (request == null || request.UserID <= 0 || request.CardID <= 0)
                {
                    return BadRequest("UserID and CardID are required.");
                }

                var existingShare = await _context.UserSharedCards
                    .FirstOrDefaultAsync(shared => shared.UserID == request.UserID && shared.CardID == request.CardID);

                if (existingShare == null)
                {
                    _context.UserSharedCards.Add(new UserSharedCard
                    {
                        UserID = request.UserID,
                        CardID = request.CardID,
                        SharedAt = DateTime.UtcNow
                    });

                    await _context.SaveChangesAsync();
                }

                return Ok("Card share saved.");
            }
            catch (Exception ex)
            {
                return StatusCode(500, $"Error saving card share: {ex.Message}");
            }
        }

        // ✅ קלפים שלא בוצעו עדיין ע"י משתמש (כדי לא לחזור על קלפים)
        [HttpGet("available-cards")]
        public async Task<ActionResult<IEnumerable<Card>>> GetAvailableCards(
            [FromQuery] int userId,
            [FromQuery] int modeId,
            [FromQuery] int categoryId,
            [FromQuery] int levelId,
            [FromQuery] int take = 20)
        {
            // כל ה-CardIDs שהמשתמש כבר ביצע
            var completedCardIds = await _context.UserCardStatus
                .Where(ucs => ucs.UserID == userId && ucs.IsCompleted)
                .Select(ucs => ucs.CardID)
                .ToListAsync();

            // מחזירים רק קלפים פעילים שלא נמצאים ברשימת ה"בוצעו"
            var cards = await _context.Cards
                .Where(c =>
                    c.IsActive &&
                    c.ModeID == modeId &&
                    c.CategoryID == categoryId &&
                    c.LevelID == levelId &&
                    c.CardID != HiddenAppCardId &&
                    !completedCardIds.Contains(c.CardID))
                .Take(take)
                .ToListAsync();

            return Ok(cards);
        }

        [HttpPost("submit-feedback")]
        public async Task<IActionResult> SubmitFeedback([FromBody] Feedback feedback)
        {
            try
            {
                if (feedback == null || feedback.UserID <= 0 || feedback.Rating < 1 || feedback.Rating > 5)
                {
                    return BadRequest("Invalid feedback data.");
                }

                feedback.Comment = feedback.Comment?.Trim();

                if (!string.IsNullOrEmpty(feedback.Comment) &&
                    feedback.Comment.Length > MaxFeedbackCommentLength)
                {
                    return BadRequest($"Feedback comment cannot exceed {MaxFeedbackCommentLength} characters.");
                }

                feedback.FeedbackDate = DateTime.UtcNow; // הגדרת תאריך המשוב אוטומטית
                _context.Feedback.Add(feedback);
                await _context.SaveChangesAsync();

                return Ok("Feedback submitted successfully.");
            }
            catch (Exception ex)
            {
                return StatusCode(500, $"Error submitting feedback: {ex.Message}");
            }
        }

        private async Task<UserCardMetadata> LoadUserCardMetadataAsync(int userId)
        {
            if (userId <= 0)
            {
                return new UserCardMetadata();
            }

            var cardStatuses = await _context.UserCardStatus
                .Where(ucs => ucs.UserID == userId)
                .Select(ucs => new
                {
                    ucs.CardID,
                    ucs.IsCompleted,
                    ucs.LikeStatus
                })
                .ToListAsync();

            var feedbackCardIds = await _context.Feedback
                .Where(feedback =>
                    feedback.UserID == userId &&
                    feedback.CardID.HasValue &&
                    !string.IsNullOrWhiteSpace(feedback.Comment))
                .Select(feedback => feedback.CardID!.Value)
                .Distinct()
                .ToListAsync();

            var sharedCardIds = await _context.UserSharedCards
                .Where(shared => shared.UserID == userId)
                .Select(shared => shared.CardID)
                .Distinct()
                .ToListAsync();

            return new UserCardMetadata
            {
                CompletedCardIds = cardStatuses
                    .Where(status => status.IsCompleted)
                    .Select(status => status.CardID)
                    .ToHashSet(),
                LikeStatusByCardId = cardStatuses.ToDictionary(
                    status => status.CardID,
                    status => status.LikeStatus),
                FeedbackCardIds = feedbackCardIds.ToHashSet(),
                SharedCardIds = sharedCardIds.ToHashSet()
            };
        }

        private async Task<Card> PopulateCardDisplayDataAsync(Card card, string lang, UserCardMetadata metadata)
        {
            var translation = await _context.CardTranslations
                .FirstOrDefaultAsync(t => t.CardID == card.CardID && t.LanguageCode == lang);

            if (translation == null)
            {
                translation = await _context.CardTranslations
                    .FirstOrDefaultAsync(t => t.CardID == card.CardID && t.LanguageCode == "en");
            }

            if (translation == null)
            {
                translation = await _context.CardTranslations
                    .FirstOrDefaultAsync(t => t.CardID == card.CardID && t.LanguageCode == "he");
            }

            card.LikeStatus = metadata.LikeStatusByCardId.GetValueOrDefault(card.CardID);
            card.HasFeedback = metadata.FeedbackCardIds.Contains(card.CardID);
            card.IsShared = metadata.SharedCardIds.Contains(card.CardID);
            card.CardDescription = translation?.CardText ?? card.CardDescription;

            return card;
        }

        private static List<Card> TakeRandomCards(List<Card> source, int count)
        {
            if (count <= 0 || source.Count == 0)
            {
                return new List<Card>();
            }

            var pool = new List<Card>(source);

            for (int i = pool.Count - 1; i > 0; i--)
            {
                int swapIndex = Random.Shared.Next(i + 1);
                (pool[i], pool[swapIndex]) = (pool[swapIndex], pool[i]);
            }

            return pool.Take(count).ToList();
        }

        private static List<Card> TakeCardsRoundRobin(
            List<CardSelectionBucket> buckets,
            int maxCount,
            Func<CardSelectionBucket, List<Card>> sourceSelector)
        {
            var selectedCards = new List<Card>();

            if (maxCount <= 0 || buckets.Count == 0)
            {
                return selectedCards;
            }

            var activeBuckets = TakeRandomBuckets(buckets);

            while (selectedCards.Count < maxCount)
            {
                bool addedAny = false;

                foreach (var bucket in activeBuckets)
                {
                    var source = sourceSelector(bucket);
                    if (source.Count == 0)
                    {
                        continue;
                    }

                    selectedCards.Add(source[0]);
                    source.RemoveAt(0);
                    addedAny = true;

                    if (selectedCards.Count >= maxCount)
                    {
                        break;
                    }
                }

                if (!addedAny)
                {
                    break;
                }
            }

            return selectedCards;
        }

        private static List<CardSelectionBucket> TakeRandomBuckets(List<CardSelectionBucket> buckets)
        {
            var pool = new List<CardSelectionBucket>(buckets);

            for (int i = pool.Count - 1; i > 0; i--)
            {
                int swapIndex = Random.Shared.Next(i + 1);
                (pool[i], pool[swapIndex]) = (pool[swapIndex], pool[i]);
            }

            return pool;
        }

        private sealed class CardSelectionBucket
        {
            public int ModeID { get; set; }
            public int CategoryID { get; set; }
            public int LevelID { get; set; }
            public List<Card> UnseenCards { get; set; } = new();
            public List<Card> FallbackCards { get; set; } = new();
        }

        private sealed class UserCardMetadata
        {
            public HashSet<int> CompletedCardIds { get; set; } = new();
            public Dictionary<int, int> LikeStatusByCardId { get; set; } = new();
            public HashSet<int> FeedbackCardIds { get; set; } = new();
            public HashSet<int> SharedCardIds { get; set; } = new();
        }


    }

}
