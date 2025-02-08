using controlersLoveGame.Data;
using controlersLoveGame.Models;
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

        public UsersController(LoveGameDbContext context)
        {
            _context = context;
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


        // יצירת משתמש חדש
        [HttpPost]
        public async Task<ActionResult<User>> CreateUser(User user)
        {
            try
            {
                // בדיקה אם האימייל כבר קיים
                var existingUser = await _context.Users.AnyAsync(u => u.Email == user.Email);
                if (existingUser)
                {
                    return BadRequest("A user with this email already exists.");
                }

                // הצפנת הסיסמה לפני השמירה
                user.HashPassword();

                _context.Users.Add(user);
                await _context.SaveChangesAsync();

                return CreatedAtAction(nameof(GetUsers), new { id = user.UserID }, user);
            }
            catch (Exception ex)
            {
                return StatusCode(500, $"An error occurred: {ex.Message}");
            }
        }

        // 🔑 התחברות דרך Firebase עם Google/Facebook
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
                // בדיקה אם כתובת האימייל קיימת במסד הנתונים
                var user = await _context.Users.FirstOrDefaultAsync(u => u.Email == loginRequest.Email);
                if (user == null)
                {
                    return Unauthorized("Invalid email or password.");
                }
                // ❌ אם המשתמש הגיע מרשת חברתית - נחסום אותו מהתחברות רגילה
                if (user.FirebaseUID != null)
                {
                    return Unauthorized("This account is linked to a social login. Please use Google/Facebook login.");
                }   

                // בדיקה אם הסיסמה תואמת
                if (!BCrypt.Net.BCrypt.Verify(loginRequest.Password, user.PasswordHash))
                {
                    return Unauthorized("Invalid email or password.");
                }

                return Ok(new { Message = $"{user.Nickname} is logged in", User = user });
            }
            catch (Exception ex)
            {
                return StatusCode(500, $"An error occurred: {ex.Message}");
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
        public async Task<IActionResult> ResetPassword([FromBody] controlersLoveGame.Models.ResetPasswordRequest request)

        {
            try
            {
                // בדיקה אם המשתמש קיים במערכת
                var user = await _context.Users.FirstOrDefaultAsync(u => u.Email == request.Email);
                if (user == null)
                {
                    return NotFound("User not found.");
                }

                // הצפנת הסיסמה החדשה
                user.PasswordHash = BCrypt.Net.BCrypt.HashPassword(request.NewPassword);

                // שמירת השינויים במסד הנתונים
                await _context.SaveChangesAsync();

                return Ok("Password has been reset successfully.");
            }
            catch (Exception ex)
            {
                return StatusCode(500, $"An error occurred: {ex.Message}");
            }
        }

        [HttpPost("get-selected-cards")]
        public async Task<ActionResult<IEnumerable<Card>>> GetSelectedCards([FromBody] DrawCardRequest request)
        {
            try
            {
                // רשימה לשמירת הכרטיסים שנבחרו
                List<Card> selectedCards = new List<Card>();
                Random random = new Random(); // יצירת אובייקט לבחירה רנדומלית

                // לולאה על כל בחירה שהמשתמש שלח (קטגוריה + רמת קושי + כמות כרטיסים)
                foreach (var selection in request.Selections)
                {
                    int categoryId = selection.CategoryID; // מזהה הקטגוריה
                    int levelId = selection.LevelID; // מזהה רמת הקושי
                    int numberOfCards = selection.NumberOfCards; // מספר הכרטיסים שהמשתמש רוצה לקבל מהשילוב הזה

                    // שליפת כרטיסים מהמסד שמתאימים לקטגוריה ולרמת הקושי שנבחרו
                    var cards = await _context.Cards
                        .Where(c => c.CategoryID == categoryId && c.LevelID == levelId && c.IsActive) // תנאים לבחירת הכרטיסים
                        .ToListAsync(); // שליפת הנתונים מהמסד

                    // ערבוב רשימת הכרטיסים ובחירת כמות רנדומלית לפי בקשת המשתמש
                    var shuffledCards = cards.OrderBy(x => random.Next()).Take(numberOfCards).ToList();

                    // הוספת הכרטיסים שנבחרו לרשימה הסופית של הכרטיסים שיוחזרו
                    selectedCards.AddRange(shuffledCards);
                }

                // אם לא נמצאו כרטיסים בכלל, מחזירים הודעה למשתמש
                if (selectedCards.Count == 0)
                {
                    return NotFound("No cards found for the selected categories and levels.");
                }

                // החזרת הכרטיסים שנבחרו
                return Ok(selectedCards);
            }
            catch (Exception ex)
            {
                // במקרה של תקלה, מחזירים שגיאת 500 עם פרטי השגיאה
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
