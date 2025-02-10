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

        // שליפת כרטיסים לפי סוג (קטגוריה)
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

                // עדכון הנתונים של הכרטיס
                existingCard.CategoryID = updatedCard.CategoryID;
                existingCard.LevelID = updatedCard.LevelID;
                existingCard.CardDescription = updatedCard.CardDescription;
                existingCard.IsActive = updatedCard.IsActive;

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
        // שליפת כל הכרטיסים שאהבו במיוחד
        [HttpGet("get-all-favorite-cards")]
        public async Task<ActionResult<IEnumerable<Card>>> GetAllFavoriteCards()
        {
            var favoriteCards = await _context.UserCardStatus
                .Where(ucs => ucs.LikeStatus == 2) // כרטיסים שאהבו במיוחד 💖
                .Select(ucs => ucs.Card)
                .Distinct()
                .ToListAsync();

            return Ok(favoriteCards);
        }

        // שליפת כל הכרטיסים שאהבו (לא במיוחד)
        [HttpGet("get-all-liked-cards")]
        public async Task<ActionResult<IEnumerable<Card>>> GetAllLikedCards()
        {
            var likedCards = await _context.UserCardStatus
                .Where(ucs => ucs.LikeStatus == 1) // כרטיסים שאהבו ❤️
                .Select(ucs => ucs.Card)
                .Distinct()
                .ToListAsync();

            return Ok(likedCards);
        }

        // שליפת כל הכרטיסים שסומנו כבוצעו
        [HttpGet("get-all-completed-cards")]
        public async Task<ActionResult<IEnumerable<Card>>> GetAllCompletedCards()
        {
            var completedCards = await _context.UserCardStatus
                .Where(ucs => ucs.IsCompleted) // כרטיסים שסומנו ✅
                .Select(ucs => ucs.Card)
                .Distinct()
                .ToListAsync();

            return Ok(completedCards);
        }

        [HttpGet("get-all-feedbacks")]
        public async Task<ActionResult<IEnumerable<Feedback>>> GetAllFeedbacks()
        {
            try
            {
                var feedbacks = await _context.Feedback
                    .Include(f => f.User) // מציג פרטי המשתמש
                    .Include(f => f.Card) // מציג את הכרטיס, אם קיים
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
