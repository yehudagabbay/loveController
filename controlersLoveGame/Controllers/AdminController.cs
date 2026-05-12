using controlersLoveGame.Data;
using controlersLoveGame.Models;
using controlersLoveGame.Models.AdminCards;
using controlersLoveGame.Services.Admin;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace controlersLoveGame.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class AdminController : ControllerBase
    {
        private readonly LoveGameDbContext _context;
        private readonly IConfiguration _config;
        private readonly AdminPendingCreationStore _pendingCreationStore;
        private readonly AdminAuthEmailService _adminAuthEmailService;
        private readonly AdminSessionTokenService _adminSessionTokenService;

        public AdminController(
            LoveGameDbContext context,
            IConfiguration config,
            AdminPendingCreationStore pendingCreationStore,
            AdminAuthEmailService adminAuthEmailService,
            AdminSessionTokenService adminSessionTokenService)
        {
            _context = context;
            _config = config;
            _pendingCreationStore = pendingCreationStore;
            _adminAuthEmailService = adminAuthEmailService;
            _adminSessionTokenService = adminSessionTokenService;
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

                var email = request.Email.Trim().ToLowerInvariant();
                var approverEmails = (_config["AdminSecurity:AllowedCreatorEmails"] ?? string.Empty)
                    .Split(',', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries)
                    .Select(x => x.Trim().ToLowerInvariant())
                    .Where(x => !string.IsNullOrWhiteSpace(x))
                    .Distinct()
                    .ToList();

                if (approverEmails.Count == 0)
                {
                    return StatusCode(500, "No admin approver emails are configured.");
                }

                bool exists = await _context.Admins.AnyAsync(a => a.Email.ToLower() == email);
                if (exists)
                {
                    return BadRequest("Admin already exists.");
                }

                var token = _pendingCreationStore.Create(
                    email,
                    BCrypt.Net.BCrypt.HashPassword(request.Password),
                    "Admin",
                    "Admin",
                    TimeSpan.FromMinutes(15));

                foreach (var approverEmail in approverEmails)
                {
                    var verifyLink =
                        $"https://libagame.somee.com/api/admin-auth/verify-create-admin?email={Uri.EscapeDataString(email)}&token={Uri.EscapeDataString(token)}&approverEmail={Uri.EscapeDataString(approverEmail)}";

                    await _adminAuthEmailService.SendAdminVerificationEmailAsync(
                        approverEmail,
                        email,
                        verifyLink);
                }

                return Ok("Approval email sent to the configured admin approvers.");
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

                string email = request.Email.Trim().ToLowerInvariant();

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

                var rawToken = _adminSessionTokenService.GenerateToken();
                var expiresAtUtc = DateTime.UtcNow.AddHours(24);

                _context.AdminSessions.Add(new AdminSession
                {
                    AdminId = admin.AdminID,
                    TokenHash = _adminSessionTokenService.HashToken(rawToken),
                    CreatedAt = DateTime.UtcNow,
                    ExpiresAt = expiresAtUtc,
                    IsActive = true
                });

                await _context.SaveChangesAsync();

                return Ok(new
                {
                    Message = "Admin logged in successfully",
                    Token = rawToken,
                    ExpiresAtUtc = expiresAtUtc,
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

        [HttpPost("logout")]
        public async Task<IActionResult> Logout()
        {
            try
            {
                if (!HttpContext.Items.TryGetValue("AdminSessionId", out var sessionIdRaw) ||
                    !int.TryParse(sessionIdRaw?.ToString(), out var sessionId))
                {
                    return Unauthorized("Admin session is invalid or expired.");
                }

                var session = await _context.AdminSessions.FindAsync(sessionId);
                if (session == null)
                {
                    return Unauthorized("Admin session is invalid or expired.");
                }

                session.IsActive = false;
                await _context.SaveChangesAsync();

                return Ok(new { message = "Admin logged out successfully." });
            }
            catch (Exception ex)
            {
                return StatusCode(500, $"Error logging out: {ex.Message}");
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

                string email = request.Email.Trim().ToLowerInvariant();

                var admin = await _context.Admins.FirstOrDefaultAsync(a => a.Email == email);

                if (admin == null)
                {
                    return NotFound("Admin not found.");
                }

                if (!admin.IsActive)
                {
                    return Unauthorized("Admin account is disabled.");
                }

                bool validOldPassword = BCrypt.Net.BCrypt.Verify(request.OldPassword, admin.PasswordHash);
                if (!validOldPassword)
                {
                    return Unauthorized("Old password is incorrect.");
                }

                admin.PasswordHash = BCrypt.Net.BCrypt.HashPassword(request.NewPassword);
                await _context.SaveChangesAsync();

                return Ok("Password changed successfully.");
            }
            catch (Exception ex)
            {
                return StatusCode(500, $"Error changing password: {ex.Message}");
            }
        }

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

                var translations = await _context.CardTranslations
                    .Where(t => t.CardID == cardId)
                    .ToListAsync();

                if (translations.Count > 0)
                {
                    _context.CardTranslations.RemoveRange(translations);
                }

                _context.Cards.Remove(card);
                await _context.SaveChangesAsync();

                return Ok(new
                {
                    Message = $"Card with ID {cardId} has been deleted.",
                    DeletedTranslations = translations.Count
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, $"Error deleting card: {ex.Message}");
            }
        }

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

                card.IsActive = false;
                await _context.SaveChangesAsync();

                return Ok($"Card with ID {cardId} has been disabled.");
            }
            catch (Exception ex)
            {
                return StatusCode(500, $"Error disabling card: {ex.Message}");
            }
        }

        [HttpPost("create-card")]
        public async Task<IActionResult> CreateCard([FromBody] AdminCardUpdateRequest newCard)
        {
            try
            {
                if (newCard == null)
                {
                    return BadRequest("Invalid card data.");
                }

                var translations = newCard.Translations ?? new List<AdminCardTranslationInput>();
                var normalizedTranslations = translations
                    .Where(t => !string.IsNullOrWhiteSpace(t.LanguageCode))
                    .GroupBy(t => t.LanguageCode!.Trim().ToLowerInvariant())
                    .Select(g => g.Last())
                    .ToList();

                var heText = normalizedTranslations
                    .FirstOrDefault(t => string.Equals(t.LanguageCode?.Trim(), "he", StringComparison.OrdinalIgnoreCase))
                    ?.CardText?.Trim();

                var card = new Card
                {
                    CategoryID = newCard.CategoryID,
                    LevelID = newCard.LevelID,
                    ModeID = newCard.ModeID == 0 ? 1 : newCard.ModeID,
                    IsActive = newCard.IsActive,
                    CardDescription = !string.IsNullOrWhiteSpace(heText)
                        ? heText
                        : (newCard.CardDescription?.Trim() ?? string.Empty),
                };

                _context.Cards.Add(card);
                await _context.SaveChangesAsync();

                foreach (var translation in normalizedTranslations)
                {
                    var lang = translation.LanguageCode!.Trim().ToLowerInvariant();
                    _context.CardTranslations.Add(new CardTranslation
                    {
                        CardID = card.CardID,
                        LanguageCode = lang,
                        CardText = translation.CardText?.Trim() ?? string.Empty,
                        CreatedAt = DateTime.UtcNow
                    });
                }

                await _context.SaveChangesAsync();

                return CreatedAtAction(nameof(GetAllCards), new { cardId = card.CardID }, new
                {
                    card.CardID,
                    card.CategoryID,
                    card.LevelID,
                    card.ModeID,
                    card.IsActive,
                    card.CardDescription
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, $"Error creating card: {ex.Message}");
            }
        }

        [HttpPut("update-card/{cardId}")]
        public async Task<IActionResult> UpdateCard(int cardId, [FromBody] AdminCardUpdateRequest updatedCard)
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
                existingCard.IsActive = updatedCard.IsActive;
                existingCard.ModeID = updatedCard.ModeID == 0 ? 1 : updatedCard.ModeID;

                var translations = updatedCard.Translations ?? new List<AdminCardTranslationInput>();
                var normalizedTranslations = translations
                    .Where(t => !string.IsNullOrWhiteSpace(t.LanguageCode))
                    .GroupBy(t => t.LanguageCode!.Trim().ToLowerInvariant())
                    .Select(g => g.Last())
                    .ToList();

                foreach (var translation in normalizedTranslations)
                {
                    var lang = translation.LanguageCode!.Trim().ToLowerInvariant();
                    var text = translation.CardText?.Trim() ?? string.Empty;

                    var existingTranslation = await _context.CardTranslations
                        .FirstOrDefaultAsync(t => t.CardID == cardId && t.LanguageCode.ToLower() == lang);

                    if (existingTranslation == null)
                    {
                        _context.CardTranslations.Add(new CardTranslation
                        {
                            CardID = cardId,
                            LanguageCode = lang,
                            CardText = text,
                            CreatedAt = DateTime.UtcNow
                        });
                    }
                    else
                    {
                        existingTranslation.CardText = text;
                    }
                }

                var heText = normalizedTranslations
                    .FirstOrDefault(t => string.Equals(t.LanguageCode?.Trim(), "he", StringComparison.OrdinalIgnoreCase))
                    ?.CardText?.Trim();

                existingCard.CardDescription = !string.IsNullOrWhiteSpace(heText)
                    ? heText
                    : (updatedCard.CardDescription?.Trim() ?? existingCard.CardDescription);

                await _context.SaveChangesAsync();

                return Ok($"Card with ID {cardId} has been updated.");
            }
            catch (Exception ex)
            {
                return StatusCode(500, $"Error updating card: {ex.Message}");
            }
        }

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

        [HttpGet("card-translations/{cardId}")]
        public async Task<IActionResult> GetCardTranslations(int cardId)
        {
            try
            {
                var card = await _context.Cards.FindAsync(cardId);
                if (card == null)
                {
                    return NotFound($"Card with ID {cardId} not found.");
                }

                var translations = await _context.CardTranslations
                    .Where(t => t.CardID == cardId)
                    .Select(t => new
                    {
                        t.TranslationID,
                        t.CardID,
                        t.LanguageCode,
                        t.CardText,
                        t.CreatedAt
                    })
                    .ToListAsync();

                return Ok(new
                {
                    card.CardID,
                    card.CategoryID,
                    card.LevelID,
                    card.ModeID,
                    card.IsActive,
                    card.CardDescription,
                    translations
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, $"Error retrieving card translations: {ex.Message}");
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
                        User = f.User != null ? new { f.User.UserID, f.User.Nickname, f.User.Email, UserName = f.User.Nickname } : null,
                        Card = f.Card != null ? new { f.Card.CardID, f.Card.CategoryID, f.Card.LevelID, f.Card.ModeID, f.Card.CardDescription } : null
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
