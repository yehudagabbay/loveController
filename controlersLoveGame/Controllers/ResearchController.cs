using controlersLoveGame.Data;
using controlersLoveGame.Models;
using controlersLoveGame.Services;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace controlersLoveGame.Controllers
{
    [Route("api/research")]
    [ApiController]
    public class ResearchController : ControllerBase
    {
        private const int MaxResearchCardsPerDraw = 18;
        private const int HiddenAppCardId = 300;
        private readonly LoveGameDbContext _context;
        private readonly SubscriptionService _subscriptionService;

        public ResearchController(LoveGameDbContext context, SubscriptionService subscriptionService)
        {
            _context = context;
            _subscriptionService = subscriptionService;
        }

        [HttpPost("cards")]
        public async Task<ActionResult<IEnumerable<Card>>> GetResearchCards([FromBody] ResearchCardsRequest request)
        {
            try
            {
                if (request?.Selections == null || request.Selections.Count == 0)
                {
                    return BadRequest("At least one research selection is required.");
                }

                int userId = request.UserID ?? 0;
                bool isPremium = await _subscriptionService.CheckIfUserPremium(userId);

                if (!isPremium)
                {
                    return StatusCode(StatusCodes.Status403Forbidden, new
                    {
                        message = "Research cards are available for premium users only."
                    });
                }

                string lang = string.IsNullOrWhiteSpace(request.Lang) ? "en" : request.Lang.Trim().ToLower();
                int targetCardCount = NormalizeTargetCardCount(request.MaxCards);
                var userCardMetadata = await LoadUserCardMetadataAsync(userId);

                var selections = request.Selections
                    .Where(selection => selection != null)
                    .Select(selection => new ResearchSelection
                    {
                        ModeID = selection.ModeID == 0 ? 1 : selection.ModeID,
                        CategoryID = selection.CategoryID,
                        BookID = selection.BookID,
                        SubCategoryID = selection.SubCategoryID,
                        LevelID = selection.LevelID
                    })
                    .Where(selection =>
                        selection.ModeID > 0 &&
                        selection.CategoryID > 0 &&
                        selection.BookID > 0 &&
                        selection.SubCategoryID > 0 &&
                        selection.LevelID > 0)
                    .GroupBy(selection => new
                    {
                        selection.ModeID,
                        selection.CategoryID,
                        selection.BookID,
                        selection.SubCategoryID,
                        selection.LevelID
                    })
                    .Select(group => group.First())
                    .Take(100)
                    .ToList();

                if (selections.Count == 0)
                {
                    return BadRequest("Research selections must include mode, category, book, subcategory and level.");
                }

                var buckets = new List<ResearchCardSelectionBucket>();

                foreach (var selection in selections)
                {
                    var cards = await LoadResearchCardsAsync(selection);

                    buckets.Add(new ResearchCardSelectionBucket
                    {
                        ModeID = selection.ModeID,
                        CategoryID = selection.CategoryID,
                        BookID = selection.BookID,
                        SubCategoryID = selection.SubCategoryID,
                        LevelID = selection.LevelID,
                        UnseenCards = TakeRandomCards(
                            cards.Where(card =>
                            {
                                int likeStatus = userCardMetadata.LikeStatusByCardId.GetValueOrDefault(card.CardID);
                                bool isCompleted = userCardMetadata.CompletedCardIds.Contains(card.CardID);
                                bool isFavoriteCard = likeStatus == 2;
                                bool hasFeedback = userCardMetadata.FeedbackCardIds.Contains(card.CardID);

                                card.LikeStatus = likeStatus;
                                card.HasFeedback = hasFeedback;
                                card.IsShared = userCardMetadata.SharedCardIds.Contains(card.CardID);

                                if (isFavoriteCard || hasFeedback)
                                {
                                    return false;
                                }

                                return !isCompleted || likeStatus == 1;
                            }).ToList(),
                            cards.Count),
                        FallbackCards = TakeRandomCards(
                            cards.Where(card =>
                            {
                                int likeStatus = userCardMetadata.LikeStatusByCardId.GetValueOrDefault(card.CardID);
                                bool isCompleted = userCardMetadata.CompletedCardIds.Contains(card.CardID);
                                bool isFavoriteCard = likeStatus == 2;
                                bool hasFeedback = userCardMetadata.FeedbackCardIds.Contains(card.CardID);

                                card.LikeStatus = likeStatus;
                                card.HasFeedback = hasFeedback;
                                card.IsShared = userCardMetadata.SharedCardIds.Contains(card.CardID);

                                return isCompleted && likeStatus <= 0 && !isFavoriteCard && !hasFeedback;
                            }).ToList(),
                            cards.Count)
                    });
                }

                int totalAvailableCards = buckets.Sum(bucket => bucket.UnseenCards.Count + bucket.FallbackCards.Count);

                if (totalAvailableCards == 0)
                {
                    return NotFound("No research cards found for the selected filters.");
                }

                targetCardCount = Math.Min(targetCardCount, totalAvailableCards);

                var selectedUnseenCards = TakeCardsRoundRobin(
                    buckets,
                    targetCardCount,
                    bucket => bucket.UnseenCards);

                int remainingSlots = targetCardCount - selectedUnseenCards.Count;

                var selectedFallbackCards = remainingSlots > 0
                    ? TakeCardsRoundRobin(buckets, remainingSlots, bucket => bucket.FallbackCards)
                    : new List<Card>();

                var selectedCards = new List<Card>();

                foreach (var card in selectedUnseenCards.Concat(selectedFallbackCards))
                {
                    selectedCards.Add(await PopulateCardDisplayDataAsync(card, lang, userCardMetadata));
                }

                return Ok(selectedCards);
            }
            catch (Exception ex)
            {
                return StatusCode(500, $"An error occurred: {ex.Message}");
            }
        }

        private async Task<List<Card>> LoadResearchCardsAsync(ResearchSelection selection)
        {
            var cards = await _context.Cards
                .FromSqlInterpolated($@"
                    SELECT
                        CardID,
                        CategoryID,
                        LevelID,
                        CardDescription,
                        IsActive,
                        ModeID,
                        CardType,
                        AllowedLocation,
                        IsWorkAndMoney,
                        IsFutureTalk,
                        IsHeavyPast,
                        IsPhysical
                    FROM Cards
                    WHERE ModeID = {selection.ModeID}
                      AND CategoryID = {selection.CategoryID}
                      AND LevelID = {selection.LevelID}
                      AND BookID = {selection.BookID}
                      AND SubCategoryID = {selection.SubCategoryID}
                      AND IsResearchBased = 1
                      AND IsActive = 1
                      AND CardID <> {HiddenAppCardId}")
                .AsNoTracking()
                .ToListAsync();

            foreach (var card in cards)
            {
                card.BookID = selection.BookID;
                card.SubCategoryID = selection.SubCategoryID;
            }

            return cards;
        }

        private async Task<UserCardMetadata> LoadUserCardMetadataAsync(int userId)
        {
            if (userId <= 0)
            {
                return new UserCardMetadata();
            }

            var cardStatuses = await _context.UserCardStatus
                .Where(status => status.UserID == userId)
                .Select(status => new
                {
                    status.CardID,
                    status.IsCompleted,
                    status.LikeStatus
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
                .FirstOrDefaultAsync(translation => translation.CardID == card.CardID && translation.LanguageCode == lang);

            if (translation == null)
            {
                translation = await _context.CardTranslations
                    .FirstOrDefaultAsync(translation => translation.CardID == card.CardID && translation.LanguageCode == "en");
            }

            if (translation == null)
            {
                translation = await _context.CardTranslations
                    .FirstOrDefaultAsync(translation => translation.CardID == card.CardID && translation.LanguageCode == "he");
            }

            card.LikeStatus = metadata.LikeStatusByCardId.GetValueOrDefault(card.CardID);
            card.HasFeedback = metadata.FeedbackCardIds.Contains(card.CardID);
            card.IsShared = metadata.SharedCardIds.Contains(card.CardID);
            card.CardDescription = translation?.CardText ?? card.CardDescription;

            return card;
        }

        private static int NormalizeTargetCardCount(int? maxCards)
        {
            if (!maxCards.HasValue || maxCards.Value <= 0)
            {
                return MaxResearchCardsPerDraw;
            }

            return Math.Min(maxCards.Value, MaxResearchCardsPerDraw);
        }

        private static List<Card> TakeRandomCards(List<Card> source, int count)
        {
            if (count <= 0 || source.Count == 0)
            {
                return new List<Card>();
            }

            var pool = new List<Card>(source);

            for (int index = pool.Count - 1; index > 0; index--)
            {
                int swapIndex = Random.Shared.Next(index + 1);
                (pool[index], pool[swapIndex]) = (pool[swapIndex], pool[index]);
            }

            return pool.Take(count).ToList();
        }

        private static List<Card> TakeCardsRoundRobin(
            List<ResearchCardSelectionBucket> buckets,
            int maxCount,
            Func<ResearchCardSelectionBucket, List<Card>> sourceSelector)
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

        private static List<ResearchCardSelectionBucket> TakeRandomBuckets(List<ResearchCardSelectionBucket> buckets)
        {
            var pool = new List<ResearchCardSelectionBucket>(buckets);

            for (int index = pool.Count - 1; index > 0; index--)
            {
                int swapIndex = Random.Shared.Next(index + 1);
                (pool[index], pool[swapIndex]) = (pool[swapIndex], pool[index]);
            }

            return pool;
        }

        public sealed class ResearchCardsRequest
        {
            public int? UserID { get; set; }
            public string? Lang { get; set; }
            public int? MaxCards { get; set; }
            public List<ResearchSelection>? Selections { get; set; }
        }

        public sealed class ResearchSelection
        {
            public int ModeID { get; set; }
            public int CategoryID { get; set; }
            public int BookID { get; set; }
            public int SubCategoryID { get; set; }
            public int LevelID { get; set; }
        }

        private sealed class ResearchCardSelectionBucket
        {
            public int ModeID { get; set; }
            public int CategoryID { get; set; }
            public int BookID { get; set; }
            public int SubCategoryID { get; set; }
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
