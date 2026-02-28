using controlersLoveGame.Data;
using controlersLoveGame.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace controlersLoveGame.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class AdminController : ControllerBase
    {
        private readonly LoveGameDbContext _context;

        public AdminController(LoveGameDbContext context)
        {
            _context = context;
        }
        [HttpPost("create-admin")]
        public async Task<IActionResult> CreateAdmin([FromBody] AdminLoginRequest request)
        {
            try
            {
                if (string.IsNullOrWhiteSpace(request.Email) || string.IsNullOrWhiteSpace(request.Password))
                {
                    return BadRequest("Email and Password are required.");
                }

                bool exists = await _context.Admins.AnyAsync(a => a.Email == request.Email);
                if (exists)
                {
                    return BadRequest("Admin already exists.");
                }

                var admin = new Admin
                {
                    Email = request.Email.Trim().ToLower(),
                    PasswordHash = BCrypt.Net.BCrypt.HashPassword(request.Password),
                    FullName = "Admin",
                    Role = "Admin",
                    IsActive = true,
                    CreatedAt = DateTime.UtcNow
                };

                _context.Admins.Add(admin);
                await _context.SaveChangesAsync();

                return Ok("Admin created successfully.");
            }
            catch (Exception ex)
            {
                return StatusCode(500, ex.Message);
            }
        }

        [HttpPost("login")]
        public async Task<IActionResult> Login([FromBody] AdminLoginRequest request)
        {
            try
            {
                if (request == null || string.IsNullOrWhiteSpace(request.Email) || string.IsNullOrWhiteSpace(request.Password))
                {
                    return BadRequest("Email and Password are required.");
                }

                string email = request.Email.Trim().ToLower();

                var admin = await _context.Admins.FirstOrDefaultAsync(a => a.Email.ToLower() == email);

                if (admin == null)
                {
                    return Unauthorized("Invalid email or password.");
                }

                if (!admin.IsActive)
                {
                    return Unauthorized("Admin account is disabled.");
                }

                bool ok = BCrypt.Net.BCrypt.Verify(request.Password, admin.PasswordHash);

                if (!ok)
                {
                    return Unauthorized("Invalid email or password.");
                }

                // ✅ כרגע מחזירים הצלחה (בלי JWT עדיין)
                return Ok(new
                {
                    Message = "Admin logged in successfully",
                    Admin = new
                    {
                        admin.AdminID,
                        admin.Email,
                        admin.FullName,
                        admin.Role
                    }
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, $"Error logging in: {ex.Message}");
            }
        }
        [HttpPut("change-password")]
        public async Task<IActionResult> ChangePassword([FromBody] AdminChangePasswordRequest request)
        {
            try
            {
                if (string.IsNullOrWhiteSpace(request.Email) ||
                    string.IsNullOrWhiteSpace(request.OldPassword) ||
                    string.IsNullOrWhiteSpace(request.NewPassword))
                {
                    return BadRequest("All fields are required.");
                }

                string email = request.Email.Trim().ToLower();

                var admin = await _context.Admins.FirstOrDefaultAsync(a => a.Email == email);

                if (admin == null)
                {
                    return NotFound("Admin not found.");
                }

                if (!admin.IsActive)
                {
                    return Unauthorized("Admin account is disabled.");
                }

                // בדיקת סיסמה ישנה
                bool validOldPassword = BCrypt.Net.BCrypt.Verify(request.OldPassword, admin.PasswordHash);
                if (!validOldPassword)
                {
                    return Unauthorized("Old password is incorrect.");
                }

                // הצפנת סיסמה חדשה
                admin.PasswordHash = BCrypt.Net.BCrypt.HashPassword(request.NewPassword);
                await _context.SaveChangesAsync();

                return Ok("Password changed successfully.");
            }
            catch (Exception ex)
            {
                return StatusCode(500, $"Error changing password: {ex.Message}");
            }
        }

        // שליפת כל הכרטיסים
        [HttpGet("get-all-cards")]
        public async Task<ActionResult<IEnumerable<Card>>> GetAllCards()
        {
            try
            {
                var cards = await _context.Cards.ToListAsync();
                return Ok(cards);
            }
            catch (Exception ex)
            {
                return StatusCode(500, $"Error retrieving cards: {ex.Message}");
            }
        }

        [HttpGet("get-cards-by-category/{categoryId}")]
        public async Task<ActionResult<IEnumerable<Card>>> GetCardsByCategory(int categoryId)
        {
            try
            {
                var cards = await _context.Cards
                    .Where(c => c.CategoryID == categoryId)
                    .ToListAsync();

                if (!cards.Any())
                {
                    return NotFound($"No cards found for category ID {categoryId}");
                }

                return Ok(cards);
            }
            catch (Exception ex)
            {
                return StatusCode(500, $"Error retrieving cards: {ex.Message}");
            }
        }

        // שליפת כרטיסים לפי רמת קושי
        [HttpGet("get-cards-by-level/{levelId}")]
        public async Task<ActionResult<IEnumerable<Card>>> GetCardsByLevel(int levelId)
        {
            try
            {
                var cards = await _context.Cards
                    .Where(c => c.LevelID == levelId)
                    .ToListAsync();

                if (!cards.Any())
                {
                    return NotFound($"No cards found for level ID {levelId}");
                }

                return Ok(cards);
            }
            catch (Exception ex)
            {
                return StatusCode(500, $"Error retrieving cards: {ex.Message}");
            }
        }

        // שליפת כרטיסים לפי סוג ורמת קושי
        [HttpGet("get-cards-by-category-and-level/{categoryId}/{levelId}")]
        public async Task<ActionResult<IEnumerable<Card>>> GetCardsByCategoryAndLevel(int categoryId, int levelId)
        {
            try
            {
                var cards = await _context.Cards
                    .Where(c => c.CategoryID == categoryId && c.LevelID == levelId)
                    .ToListAsync();

                if (!cards.Any())
                {
                    return NotFound($"No cards found for category ID {categoryId} and level ID {levelId}");
                }

                return Ok(cards);
            }
            catch (Exception ex)
            {
                return StatusCode(500, $"Error retrieving cards: {ex.Message}");
            }
        }
        // מחיקת כרטיס לחלוטין מהמערכת
        [HttpDelete("delete-card/{cardId}")]
        public async Task<IActionResult> DeleteCard(int cardId)
        {
            try
            {
                var card = await _context.Cards.FindAsync(cardId);
                if (card == null)
                {
                    return NotFound($"Card with ID {cardId} not found.");
                }

                _context.Cards.Remove(card);
                await _context.SaveChangesAsync();

                return Ok($"Card with ID {cardId} has been deleted.");
            }
            catch (Exception ex)
            {
                return StatusCode(500, $"Error deleting card: {ex.Message}");
            }
        }

        // הפיכת כרטיס ללא זמין (IsActive = false)
        [HttpPut("disable-card/{cardId}")]
        public async Task<IActionResult> DisableCard(int cardId)
        {
            try
            {
                var card = await _context.Cards.FindAsync(cardId);
                if (card == null)
                {
                    return NotFound($"Card with ID {cardId} not found.");
                }

                card.IsActive = false; // שינוי סטטוס הכרטיס ללא פעיל
                await _context.SaveChangesAsync();

                return Ok($"Card with ID {cardId} has been disabled.");
            }
            catch (Exception ex)
            {
                return StatusCode(500, $"Error disabling card: {ex.Message}");
            }
        }
        // יצירת כרטיס חדש
        [HttpPost("create-card")]
        public async Task<IActionResult> CreateCard([FromBody] Card newCard)
        {
            try
            {
                if (newCard == null)
                {
                    return BadRequest("Invalid card data.");
                }

                // ✅ אם לא נשלח ModeID – נניח זוגי כברירת מחדל
                if (newCard.ModeID == 0)
                {
                    newCard.ModeID = 1;
                }

                _context.Cards.Add(newCard);
                await _context.SaveChangesAsync();

                return CreatedAtAction(nameof(GetAllCards), new { cardId = newCard.CardID }, newCard);
            }
            catch (Exception ex)
            {
                return StatusCode(500, $"Error creating card: {ex.Message}");
            }
        }

        // עדכון כרטיס קיים
        [HttpPut("update-card/{cardId}")]
        public async Task<IActionResult> UpdateCard(int cardId, [FromBody] Card updatedCard)
        {
            try
            {
                var existingCard = await _context.Cards.FindAsync(cardId);
                if (existingCard == null)
                {
                    return NotFound($"Card with ID {cardId} not found.");
                }

                existingCard.CategoryID = updatedCard.CategoryID;
                existingCard.LevelID = updatedCard.LevelID;
                existingCard.CardDescription = updatedCard.CardDescription;
                existingCard.IsActive = updatedCard.IsActive;

                // ✅ עדכון מצב משחק (עם ברירת מחדל לזוגי אם הגיע 0)
                existingCard.ModeID = updatedCard.ModeID == 0 ? 1 : updatedCard.ModeID;

                await _context.SaveChangesAsync();

                return Ok($"Card with ID {cardId} has been updated.");
            }
            catch (Exception ex)
            {
                return StatusCode(500, $"Error updating card: {ex.Message}");
            }
        }

        // שליפת כרטיס לפי ID
        [HttpGet("get-card/{cardId}")]
        public async Task<ActionResult<Card>> GetCardById(int cardId)
        {
            try
            {
                var card = await _context.Cards.FindAsync(cardId);
                if (card == null)
                {
                    return NotFound($"Card with ID {cardId} not found.");
                }

                return Ok(card);
            }
            catch (Exception ex)
            {
                return StatusCode(500, $"Error retrieving card: {ex.Message}");
            }
        }
        

        [HttpGet("get-all-feedbacks")]
        public async Task<ActionResult<IEnumerable<Feedback>>> GetAllFeedbacks()
        {
            try
            {
                var feedbacks = await _context.Feedback
                    .Include(f => f.User)
                    .Include(f => f.Card)
                    .Select(f => new
                    {
                        f.FeedbackID,
                        f.UserID,
                        f.CardID,
                        f.Rating,
                        f.Comment,
                        f.FeedbackDate,
                        User = f.User != null ? new { f.User.UserID, f.User.Nickname, f.User.Email } : null,
                        Card = f.Card != null ? new { f.Card.CardID } : null
                    })
                    .ToListAsync();

                if (!feedbacks.Any())
                {
                    return NotFound("No feedbacks found.");
                }

                return Ok(feedbacks);
            }
            catch (Exception ex)
            {
                return StatusCode(500, $"Error retrieving feedbacks: {ex.Message}");
            }
        }
    }

}
