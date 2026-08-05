using controlersLoveGame.Data;
using controlersLoveGame.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace controlersLoveGame.Controllers
{
    [Route("api/Admin/perfect-date")]
    [ApiController]
    public class AdminPerfectDateController : ControllerBase
    {
        private readonly LoveGameDbContext _context;

        public AdminPerfectDateController(LoveGameDbContext context)
        {
            _context = context;
        }

        [HttpGet("dates")]
        public async Task<IActionResult> GetDates(
            [FromQuery] string? status = null,
            [FromQuery] string? q = null,
            [FromQuery] int skip = 0,
            [FromQuery] int take = 80)
        {
            skip = Math.Max(0, skip);
            take = Math.Clamp(take, 1, 200);

            var query = _context.PerfectDates.AsNoTracking();

            var normalizedStatus = NormalizeOptional(status);
            if (!string.IsNullOrWhiteSpace(normalizedStatus) &&
                !string.Equals(normalizedStatus, "all", StringComparison.OrdinalIgnoreCase))
            {
                query = query.Where(date => date.Status == normalizedStatus);
            }

            var search = NormalizeOptional(q);
            if (!string.IsNullOrWhiteSpace(search))
            {
                query = query.Where(date =>
                    date.DateNumber.Contains(search) ||
                    date.RoomCode.ToString().Contains(search) ||
                    (date.ExactLocation != null && date.ExactLocation.Contains(search)));
            }

            var total = await query.CountAsync();
            var dates = await query
                .OrderByDescending(date => date.UpdatedAt ?? date.CreatedAt)
                .ThenByDescending(date => date.PerfectDateID)
                .Skip(skip)
                .Take(take)
                .ToListAsync();

            var users = await LoadUsersAsync(dates.SelectMany(GetDateUserIds));
            var taskCounts = await LoadTaskCountsAsync(dates.Select(date => date.PerfectDateID));

            return Ok(new
            {
                Total = total,
                Items = dates.Select(date => ToDateResponse(
                    date,
                    users,
                    taskCounts.GetValueOrDefault(date.PerfectDateID)))
            });
        }

        [HttpGet("dates/{dateNumber}")]
        public async Task<IActionResult> GetDate(string dateNumber)
        {
            var normalizedDateNumber = NormalizeRequired(dateNumber);
            if (normalizedDateNumber == null)
            {
                return BadRequest("Date number is required.");
            }

            var perfectDate = await _context.PerfectDates
                .AsNoTracking()
                .FirstOrDefaultAsync(date => date.DateNumber == normalizedDateNumber);

            if (perfectDate == null)
            {
                return NotFound("Perfect date was not found.");
            }

            var users = await LoadUsersAsync(GetDateUserIds(perfectDate));
            var tasks = await LoadTasksAsync(perfectDate.PerfectDateID);
            var matchingCards = await FindMatchingCardsAsync(perfectDate, 24);

            return Ok(new
            {
                Date = ToDateResponse(perfectDate, users, tasks.Count),
                Tasks = tasks.Select(ToTaskResponse),
                MatchingCards = matchingCards.Select(card => ToCardResponse(card, includeTranslations: false))
            });
        }

        [HttpGet("dates/{dateNumber}/tasks")]
        public async Task<IActionResult> GetDateTasks(string dateNumber)
        {
            var normalizedDateNumber = NormalizeRequired(dateNumber);
            if (normalizedDateNumber == null)
            {
                return BadRequest("Date number is required.");
            }

            var perfectDate = await _context.PerfectDates
                .AsNoTracking()
                .FirstOrDefaultAsync(date => date.DateNumber == normalizedDateNumber);

            if (perfectDate == null)
            {
                return NotFound("Perfect date was not found.");
            }

            var tasks = await LoadTasksAsync(perfectDate.PerfectDateID);
            return Ok(new
            {
                perfectDate.DateNumber,
                Items = tasks.Select(ToTaskResponse)
            });
        }

        [HttpGet("dates/{dateNumber}/matching-cards")]
        public async Task<IActionResult> GetMatchingCards(string dateNumber, [FromQuery] int take = 24)
        {
            var normalizedDateNumber = NormalizeRequired(dateNumber);
            if (normalizedDateNumber == null)
            {
                return BadRequest("Date number is required.");
            }

            var perfectDate = await _context.PerfectDates
                .AsNoTracking()
                .FirstOrDefaultAsync(date => date.DateNumber == normalizedDateNumber);

            if (perfectDate == null)
            {
                return NotFound("Perfect date was not found.");
            }

            var cards = await FindMatchingCardsAsync(perfectDate, Math.Clamp(take, 1, 100));
            return Ok(new
            {
                perfectDate.DateNumber,
                Items = cards.Select(card => ToCardResponse(card, includeTranslations: false))
            });
        }

        [HttpGet("cards")]
        public async Task<IActionResult> GetCards(
            [FromQuery] string? languageCode = null,
            [FromQuery] bool? isActive = null,
            [FromQuery] string? taskType = null,
            [FromQuery] string? audienceMode = null,
            [FromQuery] string? location = null,
            [FromQuery] string? vibe = null,
            [FromQuery] string? goal = null,
            [FromQuery] string? boundaryKey = null,
            [FromQuery] string? q = null,
            [FromQuery] bool includeTranslations = true,
            [FromQuery] int take = 500)
        {
            take = Math.Clamp(take, 1, 1000);

            IQueryable<PerfectDateCard> query = _context.PerfectDateCards.AsNoTracking();

            if (includeTranslations)
            {
                query = query.Include(card => card.Translations);
            }

            var normalizedLanguage = NormalizeLanguage(languageCode);
            if (!string.IsNullOrWhiteSpace(normalizedLanguage))
            {
                query = query.Where(card => card.LanguageCode == normalizedLanguage);
            }

            if (isActive.HasValue)
            {
                query = query.Where(card => card.IsActive == isActive.Value);
            }

            query = ApplyEqualsFilter(query, taskType, card => card.TaskType);
            query = ApplyEqualsFilter(query, audienceMode, card => card.AudienceMode);
            query = ApplyEqualsFilter(query, location, card => card.Location);
            query = ApplyEqualsFilter(query, vibe, card => card.Vibe);
            query = ApplyEqualsFilter(query, goal, card => card.Goal);
            query = ApplyEqualsFilter(query, boundaryKey, card => card.BoundaryKey);

            var search = NormalizeOptional(q);
            if (!string.IsNullOrWhiteSpace(search))
            {
                query = query.Where(card =>
                    card.CardCode.Contains(search) ||
                    (card.User1Text != null && card.User1Text.Contains(search)) ||
                    (card.User2Text != null && card.User2Text.Contains(search)));
            }

            var items = await query
                .OrderBy(card => card.SortOrder)
                .ThenBy(card => card.PerfectDateCardID)
                .Take(take)
                .ToListAsync();

            return Ok(new
            {
                Total = items.Count,
                Items = items.Select(card => ToCardResponse(card, includeTranslations))
            });
        }

        [HttpGet("cards/{id:int}")]
        public async Task<IActionResult> GetCard(int id)
        {
            var card = await _context.PerfectDateCards
                .AsNoTracking()
                .Include(item => item.Translations)
                .FirstOrDefaultAsync(item => item.PerfectDateCardID == id);

            if (card == null)
            {
                return NotFound("Perfect date card was not found.");
            }

            return Ok(ToCardResponse(card, includeTranslations: true));
        }

        [HttpPost("cards")]
        public async Task<IActionResult> CreateCard([FromBody] AdminPerfectDateCardUpsertRequest request)
        {
            var validationError = ValidateCardRequest(request);
            if (validationError != null)
            {
                return BadRequest(validationError);
            }

            var languageCode = NormalizeLanguage(request.LanguageCode) ?? "he";
            var cardCode = NormalizeCardCode(request.CardCode) ?? GenerateCardCode();

            var exists = await _context.PerfectDateCards.AnyAsync(card =>
                card.CardCode == cardCode &&
                card.LanguageCode == languageCode);

            if (exists)
            {
                return Conflict("A perfect date card with the same code and language already exists.");
            }

            var cardToCreate = new PerfectDateCard();
            ApplyCardRequest(cardToCreate, request, cardCode, languageCode);

            _context.PerfectDateCards.Add(cardToCreate);
            await _context.SaveChangesAsync();

            await UpsertTranslationsAsync(cardToCreate.PerfectDateCardID, request.Translations);
            await _context.SaveChangesAsync();

            var createdCard = await _context.PerfectDateCards
                .AsNoTracking()
                .Include(card => card.Translations)
                .FirstAsync(card => card.PerfectDateCardID == cardToCreate.PerfectDateCardID);

            return CreatedAtAction(nameof(GetCard), new { id = createdCard.PerfectDateCardID }, ToCardResponse(createdCard, includeTranslations: true));
        }

        [HttpPut("cards/{id:int}")]
        public async Task<IActionResult> UpdateCard(int id, [FromBody] AdminPerfectDateCardUpsertRequest request)
        {
            var validationError = ValidateCardRequest(request);
            if (validationError != null)
            {
                return BadRequest(validationError);
            }

            var existingCard = await _context.PerfectDateCards
                .FirstOrDefaultAsync(card => card.PerfectDateCardID == id);

            if (existingCard == null)
            {
                return NotFound("Perfect date card was not found.");
            }

            var languageCode = NormalizeLanguage(request.LanguageCode) ?? existingCard.LanguageCode;
            var cardCode = NormalizeCardCode(request.CardCode) ?? existingCard.CardCode;

            var duplicateExists = await _context.PerfectDateCards.AnyAsync(card =>
                card.PerfectDateCardID != id &&
                card.CardCode == cardCode &&
                card.LanguageCode == languageCode);

            if (duplicateExists)
            {
                return Conflict("A different perfect date card already has the same code and language.");
            }

            ApplyCardRequest(existingCard, request, cardCode, languageCode);
            existingCard.UpdatedAt = DateTime.UtcNow;
            await UpsertTranslationsAsync(existingCard.PerfectDateCardID, request.Translations);
            await _context.SaveChangesAsync();

            var updatedCard = await _context.PerfectDateCards
                .AsNoTracking()
                .Include(card => card.Translations)
                .FirstAsync(card => card.PerfectDateCardID == id);

            return Ok(ToCardResponse(updatedCard, includeTranslations: true));
        }

        [HttpPut("cards/{id:int}/disable")]
        public async Task<IActionResult> DisableCard(int id)
        {
            var existingCard = await _context.PerfectDateCards
                .FirstOrDefaultAsync(card => card.PerfectDateCardID == id);

            if (existingCard == null)
            {
                return NotFound("Perfect date card was not found.");
            }

            existingCard.IsActive = false;
            existingCard.UpdatedAt = DateTime.UtcNow;
            await _context.SaveChangesAsync();

            return Ok(new
            {
                existingCard.PerfectDateCardID,
                existingCard.IsActive
            });
        }

        [HttpPut("cards/{id:int}/translations")]
        public async Task<IActionResult> UpdateCardTranslations(
            int id,
            [FromBody] AdminPerfectDateCardTranslationsRequest request)
        {
            var existingCard = await _context.PerfectDateCards
                .AsNoTracking()
                .FirstOrDefaultAsync(card => card.PerfectDateCardID == id);

            if (existingCard == null)
            {
                return NotFound("Perfect date card was not found.");
            }

            await UpsertTranslationsAsync(id, request.Translations);
            await _context.SaveChangesAsync();

            var updatedCard = await _context.PerfectDateCards
                .AsNoTracking()
                .Include(card => card.Translations)
                .FirstAsync(card => card.PerfectDateCardID == id);

            return Ok(ToCardResponse(updatedCard, includeTranslations: true));
        }

        private async Task<List<PerfectDateTask>> LoadTasksAsync(int perfectDateId)
        {
            return await _context.PerfectDateTasks
                .AsNoTracking()
                .Include(task => task.PerfectDateCard)
                .Where(task => task.PerfectDateID == perfectDateId)
                .OrderBy(task => task.SequenceNumber)
                .ThenBy(task => task.PerfectDateTaskID)
                .ToListAsync();
        }

        private async Task<Dictionary<int, int>> LoadTaskCountsAsync(IEnumerable<int> perfectDateIds)
        {
            var ids = perfectDateIds.Distinct().ToList();
            if (ids.Count == 0)
            {
                return new Dictionary<int, int>();
            }

            return await _context.PerfectDateTasks
                .AsNoTracking()
                .Where(task => ids.Contains(task.PerfectDateID))
                .GroupBy(task => task.PerfectDateID)
                .Select(group => new
                {
                    PerfectDateID = group.Key,
                    Count = group.Count()
                })
                .ToDictionaryAsync(item => item.PerfectDateID, item => item.Count);
        }

        private async Task<Dictionary<int, User>> LoadUsersAsync(IEnumerable<int?> userIds)
        {
            var ids = userIds
                .Where(id => id.HasValue)
                .Select(id => id!.Value)
                .Distinct()
                .ToList();

            if (ids.Count == 0)
            {
                return new Dictionary<int, User>();
            }

            return await _context.Users
                .AsNoTracking()
                .Where(user => ids.Contains(user.UserID))
                .ToDictionaryAsync(user => user.UserID);
        }

        private async Task<List<PerfectDateCard>> FindMatchingCardsAsync(PerfectDate perfectDate, int take)
        {
            var excludedBoundaryKeys = GetExcludedBoundaryKeys(perfectDate);
            var location = NormalizeLocation(perfectDate.Location) ?? perfectDate.Location;
            var selectedVibes = SplitSelectedPreferences(perfectDate.SelectedVibes);
            var selectedGoals = SplitSelectedPreferences(perfectDate.SelectedGoals);

            var query = _context.PerfectDateCards
                .AsNoTracking()
                .Where(card =>
                    card.IsActive &&
                    card.LanguageCode == "he" &&
                    (card.Location == null ||
                     card.Location == string.Empty ||
                     card.Location == "any" ||
                     card.Location == location));

            if (excludedBoundaryKeys.Count > 0)
            {
                query = query.Where(card =>
                    card.BoundaryKey == null ||
                    card.BoundaryKey == string.Empty ||
                    !excludedBoundaryKeys.Contains(card.BoundaryKey));
            }

            var matchingQuery = query;

            if (selectedVibes.Count > 0)
            {
                matchingQuery = matchingQuery.Where(card =>
                    card.Vibe == null ||
                    card.Vibe == string.Empty ||
                    selectedVibes.Contains(card.Vibe));
            }

            if (selectedGoals.Count > 0)
            {
                matchingQuery = matchingQuery.Where(card =>
                    card.Goal == null ||
                    card.Goal == string.Empty ||
                    selectedGoals.Contains(card.Goal));
            }

            var matchingCards = await OrderPerfectDateCards(matchingQuery, selectedVibes, selectedGoals)
                .Take(take)
                .ToListAsync();

            if (matchingCards.Count > 0)
            {
                return matchingCards;
            }

            return await OrderPerfectDateCards(query, selectedVibes, selectedGoals)
                .Take(take)
                .ToListAsync();
        }

        private static IOrderedQueryable<PerfectDateCard> OrderPerfectDateCards(
            IQueryable<PerfectDateCard> query,
            List<string> selectedVibes,
            List<string> selectedGoals)
        {
            return query
                .OrderByDescending(card =>
                    card.Vibe != null &&
                    selectedVibes.Contains(card.Vibe))
                .ThenByDescending(card =>
                    card.Goal != null &&
                    selectedGoals.Contains(card.Goal))
                .ThenBy(card => card.SortOrder)
                .ThenBy(card => card.PerfectDateCardID);
        }

        private async Task UpsertTranslationsAsync(
            int perfectDateCardId,
            List<AdminPerfectDateCardTranslationInput>? translations)
        {
            if (translations == null)
            {
                return;
            }

            var normalizedTranslations = translations
                .Where(item => !string.IsNullOrWhiteSpace(item.LanguageCode))
                .GroupBy(item => NormalizeLanguage(item.LanguageCode) ?? string.Empty)
                .Where(group => !string.IsNullOrWhiteSpace(group.Key))
                .Select(group => group.Last())
                .Where(HasTranslationContent)
                .ToList();

            if (normalizedTranslations.Count == 0)
            {
                return;
            }

            var existingTranslations = await _context.PerfectDateCardTranslations
                .Where(item => item.PerfectDateCardID == perfectDateCardId)
                .ToListAsync();

            foreach (var translation in normalizedTranslations)
            {
                var languageCode = NormalizeLanguage(translation.LanguageCode)!;
                var existing = existingTranslations.FirstOrDefault(item => item.LanguageCode == languageCode);

                if (existing == null)
                {
                    _context.PerfectDateCardTranslations.Add(new PerfectDateCardTranslation
                    {
                        PerfectDateCardID = perfectDateCardId,
                        LanguageCode = languageCode,
                        User1BackLabel = TrimMax(translation.User1BackLabel, 80),
                        User1Label = TrimMax(translation.User1Label, 80),
                        User1Text = NormalizeOptional(translation.User1Text),
                        User2BackLabel = TrimMax(translation.User2BackLabel, 80),
                        User2Label = TrimMax(translation.User2Label, 80),
                        User2Text = NormalizeOptional(translation.User2Text),
                        CreatedAt = DateTime.UtcNow,
                    });
                }
                else
                {
                    existing.User1BackLabel = TrimMax(translation.User1BackLabel, 80);
                    existing.User1Label = TrimMax(translation.User1Label, 80);
                    existing.User1Text = NormalizeOptional(translation.User1Text);
                    existing.User2BackLabel = TrimMax(translation.User2BackLabel, 80);
                    existing.User2Label = TrimMax(translation.User2Label, 80);
                    existing.User2Text = NormalizeOptional(translation.User2Text);
                    existing.UpdatedAt = DateTime.UtcNow;
                }
            }
        }

        private static IQueryable<PerfectDateCard> ApplyEqualsFilter(
            IQueryable<PerfectDateCard> query,
            string? filterValue,
            System.Linq.Expressions.Expression<Func<PerfectDateCard, string?>> selector)
        {
            var value = NormalizeOptional(filterValue);
            if (string.IsNullOrWhiteSpace(value) ||
                string.Equals(value, "all", StringComparison.OrdinalIgnoreCase))
            {
                return query;
            }

            return query.Where(BuildEqualsExpression(selector, value));
        }

        private static System.Linq.Expressions.Expression<Func<PerfectDateCard, bool>> BuildEqualsExpression(
            System.Linq.Expressions.Expression<Func<PerfectDateCard, string?>> selector,
            string value)
        {
            var body = System.Linq.Expressions.Expression.Equal(
                selector.Body,
                System.Linq.Expressions.Expression.Constant(value, typeof(string)));

            return System.Linq.Expressions.Expression.Lambda<Func<PerfectDateCard, bool>>(body, selector.Parameters);
        }

        private static void ApplyCardRequest(
            PerfectDateCard card,
            AdminPerfectDateCardUpsertRequest request,
            string cardCode,
            string languageCode)
        {
            card.CardCode = cardCode;
            card.LanguageCode = languageCode;
            card.TaskType = TrimMax(request.TaskType, 30) ?? "question";
            card.AudienceMode = TrimMax(request.AudienceMode, 30) ?? "both";
            card.Location = TrimMax(request.Location, 20);
            card.Vibe = TrimMax(request.Vibe, 30);
            card.Goal = TrimMax(request.Goal, 50);
            card.BoundaryKey = TrimMax(request.BoundaryKey, 80);
            card.SortOrder = request.SortOrder;
            card.User1BackLabel = TrimMax(request.User1BackLabel, 80);
            card.User1Label = TrimMax(request.User1Label, 80);
            card.User1Text = NormalizeOptional(request.User1Text);
            card.IsUser1Secret = request.IsUser1Secret;
            card.User2BackLabel = TrimMax(request.User2BackLabel, 80);
            card.User2Label = TrimMax(request.User2Label, 80);
            card.User2Text = NormalizeOptional(request.User2Text);
            card.IsUser2Secret = request.IsUser2Secret;
            card.IsActive = request.IsActive;
        }

        private static string? ValidateCardRequest(AdminPerfectDateCardUpsertRequest? request)
        {
            if (request == null)
            {
                return "Invalid perfect date card data.";
            }

            if (string.IsNullOrWhiteSpace(request.User1Text) &&
                string.IsNullOrWhiteSpace(request.User2Text))
            {
                return "At least one side text is required.";
            }

            return null;
        }

        private static bool HasTranslationContent(AdminPerfectDateCardTranslationInput item)
        {
            return !string.IsNullOrWhiteSpace(item.User1BackLabel) ||
                !string.IsNullOrWhiteSpace(item.User1Label) ||
                !string.IsNullOrWhiteSpace(item.User1Text) ||
                !string.IsNullOrWhiteSpace(item.User2BackLabel) ||
                !string.IsNullOrWhiteSpace(item.User2Label) ||
                !string.IsNullOrWhiteSpace(item.User2Text);
        }

        private static IEnumerable<int?> GetDateUserIds(PerfectDate date)
        {
            yield return date.User1ID;
            yield return date.User2ID;
            yield return date.CreatorUserID;
            yield return date.JoinedUserID;
        }

        private static object ToDateResponse(
            PerfectDate date,
            IReadOnlyDictionary<int, User> users,
            int taskCount)
        {
            return new
            {
                date.PerfectDateID,
                date.DateNumber,
                date.RoomCode,
                date.Status,
                date.Location,
                date.ExactLocation,
                date.SelectedVibes,
                date.SelectedGoals,
                date.LimitNoWorkAndMoney,
                date.LimitNoFutureTalk,
                date.LimitNoHeavyPast,
                date.LimitNoPhysical,
                date.ScheduledAt,
                date.StartedAt,
                date.CreatedAt,
                date.UpdatedAt,
                TaskCount = taskCount,
                User1 = ToParticipantResponse("user1", date.User1ID ?? date.CreatorUserID, date.User1Gender ?? date.CreatorGender, date.User1Age, users),
                User2 = ToParticipantResponse("user2", date.User2ID ?? date.JoinedUserID, date.User2Gender ?? date.JoinedGender, date.User2Age, users),
            };
        }

        private static object ToParticipantResponse(
            string role,
            int? userId,
            string? gender,
            int? age,
            IReadOnlyDictionary<int, User> users)
        {
            User? user = null;
            if (userId.HasValue)
            {
                users.TryGetValue(userId.Value, out user);
            }

            return new
            {
                Role = role,
                UserID = userId,
                Nickname = user?.Nickname,
                Email = user?.Email,
                Gender = gender ?? user?.Gender,
                Age = age ?? user?.Age,
            };
        }

        private static object ToTaskResponse(PerfectDateTask task)
        {
            return new
            {
                task.PerfectDateTaskID,
                task.PerfectDateID,
                task.SequenceNumber,
                task.TaskType,
                task.AudienceMode,
                task.PerfectDateCardID,
                task.User1BackLabel,
                task.User1Label,
                task.User1Text,
                task.IsUser1Secret,
                task.User2BackLabel,
                task.User2Label,
                task.User2Text,
                task.IsUser2Secret,
                task.IsRevealed,
                task.RevealedAt,
                task.User1RevealReadyAt,
                task.User2RevealReadyAt,
                task.User1CompletedAt,
                task.User2CompletedAt,
                task.CreatedAt,
                SourceCard = task.PerfectDateCard == null
                    ? null
                    : new
                    {
                        task.PerfectDateCard.CardCode,
                        task.PerfectDateCard.Location,
                        task.PerfectDateCard.Vibe,
                        task.PerfectDateCard.Goal,
                        task.PerfectDateCard.BoundaryKey,
                    },
            };
        }

        private static object ToCardResponse(PerfectDateCard card, bool includeTranslations)
        {
            return new
            {
                card.PerfectDateCardID,
                card.CardCode,
                card.LanguageCode,
                card.TaskType,
                card.AudienceMode,
                card.Location,
                card.Vibe,
                card.Goal,
                card.BoundaryKey,
                card.SortOrder,
                card.User1BackLabel,
                card.User1Label,
                card.User1Text,
                card.IsUser1Secret,
                card.User2BackLabel,
                card.User2Label,
                card.User2Text,
                card.IsUser2Secret,
                card.IsActive,
                card.CreatedAt,
                card.UpdatedAt,
                Translations = includeTranslations
                    ? card.Translations
                        .OrderBy(translation => translation.LanguageCode)
                        .Select(ToTranslationResponse)
                    : Array.Empty<object>(),
            };
        }

        private static object ToTranslationResponse(PerfectDateCardTranslation translation)
        {
            return new
            {
                translation.PerfectDateCardTranslationID,
                translation.PerfectDateCardID,
                translation.LanguageCode,
                translation.User1BackLabel,
                translation.User1Label,
                translation.User1Text,
                translation.User2BackLabel,
                translation.User2Label,
                translation.User2Text,
                translation.CreatedAt,
                translation.UpdatedAt,
            };
        }

        private static string GenerateCardCode()
        {
            return $"PD_ADMIN_{DateTime.UtcNow:yyyyMMddHHmmssfff}";
        }

        private static string? NormalizeCardCode(string? value)
        {
            var normalized = TrimMax(value, 80);
            return string.IsNullOrWhiteSpace(normalized) ? null : normalized;
        }

        private static string? NormalizeLanguage(string? value)
        {
            return TrimMax(value?.ToLowerInvariant(), 10);
        }

        private static string? NormalizeRequired(string? value)
        {
            var normalized = value?.Trim();
            return string.IsNullOrWhiteSpace(normalized) ? null : normalized;
        }

        private static string? NormalizeOptional(string? value)
        {
            var normalized = value?.Trim();
            return string.IsNullOrWhiteSpace(normalized) ? null : normalized;
        }

        private static string? TrimMax(string? value, int maxLength)
        {
            var normalized = NormalizeOptional(value);
            if (normalized == null)
            {
                return null;
            }

            return normalized.Length <= maxLength ? normalized : normalized[..maxLength];
        }

        private static string? NormalizeLocation(string? location)
        {
            var value = NormalizeOptional(location);

            if (value == null)
            {
                return null;
            }

            if (string.Equals(value, "home", StringComparison.OrdinalIgnoreCase) ||
                value == "בית")
            {
                return "home";
            }

            if (string.Equals(value, "out", StringComparison.OrdinalIgnoreCase) ||
                string.Equals(value, "outside", StringComparison.OrdinalIgnoreCase) ||
                value == "בחוץ")
            {
                return "out";
            }

            return value.Length <= 20 ? value : value[..20];
        }

        private static List<string> SplitSelectedPreferences(string? values)
        {
            return (values ?? string.Empty)
                .Split(',', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries)
                .Select(value => value.ToLowerInvariant())
                .Distinct()
                .ToList();
        }

        private static List<string> GetExcludedBoundaryKeys(PerfectDate perfectDate)
        {
            var keys = new List<string>();

            if (perfectDate.LimitNoWorkAndMoney)
            {
                keys.Add("no_work_money");
            }

            if (perfectDate.LimitNoFutureTalk)
            {
                keys.Add("no_future_talk");
            }

            if (perfectDate.LimitNoHeavyPast)
            {
                keys.Add("no_heavy_past");
            }

            if (perfectDate.LimitNoPhysical)
            {
                keys.Add("no_physical");
            }

            return keys;
        }
    }

    public class AdminPerfectDateCardUpsertRequest
    {
        public string? CardCode { get; set; }

        public string? LanguageCode { get; set; } = "he";

        public string? TaskType { get; set; } = "question";

        public string? AudienceMode { get; set; } = "both";

        public string? Location { get; set; }

        public string? Vibe { get; set; }

        public string? Goal { get; set; }

        public string? BoundaryKey { get; set; }

        public int SortOrder { get; set; }

        public string? User1BackLabel { get; set; }

        public string? User1Label { get; set; }

        public string? User1Text { get; set; }

        public bool IsUser1Secret { get; set; }

        public string? User2BackLabel { get; set; }

        public string? User2Label { get; set; }

        public string? User2Text { get; set; }

        public bool IsUser2Secret { get; set; }

        public bool IsActive { get; set; } = true;

        public List<AdminPerfectDateCardTranslationInput>? Translations { get; set; }
    }

    public class AdminPerfectDateCardTranslationsRequest
    {
        public List<AdminPerfectDateCardTranslationInput>? Translations { get; set; }
    }

    public class AdminPerfectDateCardTranslationInput
    {
        public string? LanguageCode { get; set; }

        public string? User1BackLabel { get; set; }

        public string? User1Label { get; set; }

        public string? User1Text { get; set; }

        public string? User2BackLabel { get; set; }

        public string? User2Label { get; set; }

        public string? User2Text { get; set; }
    }
}
