using controlersLoveGame.Data;
using controlersLoveGame.Models;
using controlersLoveGame.Services;
using FirebaseAdmin.Auth;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;


namespace controlersLoveGame.Controllers
{

    [Route("api/[controller]")]
    [ApiController]
    public class UsersController : ControllerBase
    {
        private readonly LoveGameDbContext _context;
        private readonly EmailService _emailService;

        private readonly IConfiguration _config;

        public UsersController(LoveGameDbContext context, EmailService emailService, IConfiguration config)
        {
            _context = context;
            _emailService = emailService;
            _config = config;
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
        public async Task<IActionResult> Register([FromBody] User user)
        {
            try
            {
                if (string.IsNullOrEmpty(user.Email) || string.IsNullOrEmpty(user.PasswordHash))
                {
                    return BadRequest("Email and Password are required.");
                }

                // 🔹 הבטחת ערכים לא NULL לשדות של רשת חברתית
                user.FirebaseUID = "N/A";
                user.SocialID = "N/A";

                // ✅ [ADDED] אימות מייל – השרת קובע
                user.EmailVerified = false;
                user.EmailVerificationToken = Guid.NewGuid().ToString("N");
                user.EmailVerificationExpiry = DateTime.UtcNow.AddMinutes(15);

                // הצפנת הסיסמה
                user.HashPassword();

                _context.Users.Add(user);
                await _context.SaveChangesAsync();

                var verifyLink =
                    $"{Request.Scheme}://{Request.Host}/api/Users/verify-email?token={user.EmailVerificationToken}";

                try
                {
                    await _emailService.SendVerifyEmailAsync(user.Email, verifyLink);
                }
                catch (Exception mailEx)
                {
                    return StatusCode(500, $"User registered BUT email failed: {mailEx.Message}");
                }

                return Ok(new { Message = "User registered successfully", UserID = user.UserID });
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
        public async Task<IActionResult> VerifyEmail([FromQuery] string token)
        {
            if (string.IsNullOrWhiteSpace(token))
            {
                return Redirect("loveclient://login?verified=0&reason=missing-token");
            }

            var user = await _context.Users
                .FirstOrDefaultAsync(u => u.EmailVerificationToken == token);

            if (user == null)
            {
                return Redirect("loveclient://login?verified=0&reason=invalid-token");
            }

            if (user.EmailVerificationExpiry == null || user.EmailVerificationExpiry < DateTime.UtcNow)
            {
                return Redirect("loveclient://login?verified=0&reason=expired-token");
            }

            user.EmailVerified = true;
            user.EmailVerificationToken = null;
            user.EmailVerificationExpiry = null;

            await _context.SaveChangesAsync();

            var email = Uri.EscapeDataString(user.Email ?? "");

            return Redirect($"loveclient://login?verified=1&email={email}");
        }

        [HttpPost("social-login")]
        public async Task<IActionResult> SocialLogin([FromBody] SocialLoginRequest request)
        {
            try
            {
                // ✅ אימות ה-Token מול Firebase
                FirebaseToken decodedToken = await FirebaseAuth.DefaultInstance.VerifyIdTokenAsync(request.IdToken);
                string firebaseUid = decodedToken.Uid;

                // 🔎 חיפוש המשתמש בבסיס הנתונים לפי SocialID
                var user = await _context.Users.FirstOrDefaultAsync(u => u.SocialID == firebaseUid);

                if (user == null)
                {
                    // 🆕 אם המשתמש לא קיים - יצירת משתמש חדש
                    user = new User
                    {
                        SocialID = firebaseUid,
                        Email = request.Email,
                        Nickname = request.Nickname,
                        Gender = request.Gender,
                        Age = request.Age
                    };

                    _context.Users.Add(user);
                    await _context.SaveChangesAsync();
                }

                // ✅ מחזירים תמיד את ה-UserID כדי לעבוד עם שאר המערכת
                return Ok(new { Message = "User logged in successfully", UserID = user.UserID });
            }
            catch (FirebaseAuthException ex)
            {
                return Unauthorized(new { Message = "Invalid Firebase token", Error = ex.Message });
            }
            catch (Exception ex)
            {
                return StatusCode(500, $"An error occurred: {ex.Message}");
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
        [HttpGet("open-reset")]
        public IActionResult OpenReset([FromQuery] string email, [FromQuery] string token)
        {
            if (string.IsNullOrWhiteSpace(email) || string.IsNullOrWhiteSpace(token))
                return BadRequest("Missing email or token");

            var deepLink =
                $"loveclient://reset-password?email={Uri.EscapeDataString(email)}&token={Uri.EscapeDataString(token)}";

            return Redirect(deepLink);
        }
        [HttpPost("password-reset/request")]
        public async Task<IActionResult> PasswordResetRequest([FromBody] PasswordResetRequestDto dto)
        {
            try
            {
                var email = dto?.Email?.Trim();

                if (string.IsNullOrWhiteSpace(email))
                    return Ok("If the email exists, a reset link has been sent.");

                var user = await _context.Users.FirstOrDefaultAsync(u => u.Email == email);

                if (user == null)
                    return Ok("If the email exists, a reset link has been sent.");

                if (user.FirebaseUID != "N/A" || user.SocialID != "N/A")
                    return Ok("This account uses social login.");

                // ✅ משתמש בשדות שכבר קיימים אצלך
                user.PasswordResetToken = Guid.NewGuid().ToString("N");
                user.PasswordResetExpiry = DateTime.UtcNow.AddMinutes(15);

                await _context.SaveChangesAsync();

                   var link =
                     $"http://lovegame.somee.com/api/Users/open-reset?email={Uri.EscapeDataString(user.Email)}&token={user.PasswordResetToken}";

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
        public async Task<IActionResult> ResendVerificationEmail([FromBody] PasswordResetRequestDto dto)
        {
            try
            {
                var email = dto?.Email?.Trim();

                if (string.IsNullOrWhiteSpace(email))
                {
                    return BadRequest(new
                    {
                        message = "Email is required."
                    });
                }

                var user = await _context.Users.FirstOrDefaultAsync(u => u.Email == email);

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

                user.EmailVerificationToken = Guid.NewGuid().ToString("N");
                user.EmailVerificationExpiry = DateTime.UtcNow.AddHours(24);

                await _context.SaveChangesAsync();

                var verificationLink =
                    $"http://lovegame.somee.com/api/Users/verify-email?token={user.EmailVerificationToken}";

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
                string lang = string.IsNullOrWhiteSpace(request?.Lang) ? "he" : request.Lang.Trim().ToLower();

                List<Card> selectedCards = new List<Card>();
                Random random = new Random();

                foreach (var selection in request.Selections)
                {
                    int modeId = selection.ModeID == 0 ? 1 : selection.ModeID;

                    int categoryId = selection.CategoryID;
                    int levelId = selection.LevelID;
                    int numberOfCards = selection.NumberOfCards;

                    var cards = await _context.Cards
                        .Where(c =>
                            c.ModeID == modeId &&
                            c.CategoryID == categoryId &&
                            c.LevelID == levelId &&
                            c.IsActive)
                        .ToListAsync();

                    var shuffledCards = cards
                        .OrderBy(x => random.Next())
                        .Take(numberOfCards)
                        .ToList();

                    foreach (var card in shuffledCards)
                    {
                        var translation = await _context.CardTranslations
                            .FirstOrDefaultAsync(t => t.CardID == card.CardID && t.LanguageCode == lang);

                        if (translation == null)
                        {
                            translation = await _context.CardTranslations
                                .FirstOrDefaultAsync(t => t.CardID == card.CardID && t.LanguageCode == "he");
                        }

                        if (translation == null)
                        {
                            translation = await _context.CardTranslations
                                .FirstOrDefaultAsync(t => t.CardID == card.CardID && t.LanguageCode == "en");
                        }

                        card.CardDescription = translation?.CardText ?? card.CardDescription;

                        selectedCards.Add(card);
                    }
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


        [HttpPost("update-card-status")]
        public async Task<IActionResult> UpdateCardStatus([FromBody] UserCardStatus request)
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
                .Where(ucs => ucs.UserID == userId && ucs.LikeStatus == 2)
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
                .Where(ucs => ucs.UserID == userId && ucs.LikeStatus == 1)
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
                .Where(ucs => ucs.UserID == userId && ucs.IsCompleted)
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


    }

}
