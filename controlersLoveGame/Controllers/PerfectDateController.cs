using System.Security.Cryptography;
using System.Text;
using controlersLoveGame;
using controlersLoveGame.Data;
using controlersLoveGame.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;

namespace controlersLoveGame.Controllers
{
    [ApiController]
    [Route("api/perfect-date")]
    public class PerfectDateController : ControllerBase
    {
        private const string DefaultLocationBeforeQuestionnaire = "pending";
        private const string AppDeepLinkPrefix = "loveclient://perfect-date";
        private const string WebInvitePrefix = "https://libagame.somee.com/perfect-date";
        private const int PendingRoomLifetimeHours = 24;

        private readonly LoveGameDbContext _context;
        private readonly IServiceScopeFactory _scopeFactory;

        public PerfectDateController(
            LoveGameDbContext context,
            IServiceScopeFactory scopeFactory)
        {
            _context = context;
            _scopeFactory = scopeFactory;
        }

        [HttpPost("create")]
        public async Task<ActionResult<PerfectDateInviteResponse>> CreatePerfectDate(
            [FromBody] CreatePerfectDateRequest request)
        {
            // אפשר ליצור חדר עד 24 שעות לפני הדייט. אחרי התחלת הדייט אין כאן מגבלת זמן.
            if (request.ScheduledAt.HasValue && request.ScheduledAt.Value.ToUniversalTime() > DateTime.UtcNow.AddHours(24))
            {
                return BadRequest("Perfect date can be created up to 24 hours before the scheduled time.");
            }

            var dateNumber = await GenerateUniqueDateNumber();
            var creatorAccessToken = GenerateAccessToken();

            // בשלב יצירת החדר עדיין אין מיקום מהשאלון, לכן נשמר ערך זמני ברור.
            var perfectDate = new PerfectDate
            {
                RoomCode = int.Parse(dateNumber),
                DateNumber = dateNumber,
                Location = DefaultLocationBeforeQuestionnaire,
                Status = "Created",
                CreatorUserID = request.UserID,
                CreatorAccessTokenHash = HashAccessToken(creatorAccessToken),
                User1ID = request.UserID,
                ScheduledAt = request.ScheduledAt?.ToUniversalTime(),
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow,
            };

            _context.PerfectDates.Add(perfectDate);
            await _context.SaveChangesAsync();

            return Ok(ToInviteResponse(perfectDate, "user1", creatorAccessToken));
        }

        [HttpPost("join")]
        public async Task<ActionResult<PerfectDateInviteResponse>> JoinPerfectDate(
            [FromBody] JoinPerfectDateRequest request)
        {
            var normalizedDateNumber = request.DateNumber.Trim();

            var perfectDate = await _context.PerfectDates
                .FirstOrDefaultAsync(date => date.DateNumber == normalizedDateNumber);

            if (perfectDate == null)
            {
                return NotFound("Perfect date was not found.");
            }

            // אם המשתמש השני עדיין לא נרשם לחדר, נשמור אותו כשותף השני.
            if (!IsPerfectDateRoomValid(perfectDate))
            {
                return BadRequest("This perfect date room is no longer valid.");
            }

            var participantRole = ResolveJoinParticipantRole(perfectDate, request.UserID);
            if (participantRole == null)
            {
                return BadRequest("This perfect date already has two different users.");
            }

            var accessToken = GenerateAccessToken();

            if (participantRole == "user1")
            {
                perfectDate.CreatorAccessTokenHash = HashAccessToken(accessToken);
            }
            else
            {
                // אסימון אישי לשותף השני. בלי האסימון הזה אי אפשר למשוך את חפיסת הכרטיסים.
                perfectDate.JoinedAccessTokenHash = HashAccessToken(accessToken);

                if (request.UserID.HasValue && perfectDate.User2ID == null)
                {
                    perfectDate.User2ID = request.UserID;
                    perfectDate.JoinedUserID = request.UserID;
                }
            }

            perfectDate.UpdatedAt = DateTime.UtcNow;
            await _context.SaveChangesAsync();

            return Ok(ToInviteResponse(perfectDate, participantRole, accessToken));
        }

        [HttpPost("setup")]
        public async Task<ActionResult<PerfectDateInviteResponse>> SavePerfectDateSetup(
            [FromBody] SavePerfectDateSetupRequest request)
        {
            var normalizedDateNumber = request.DateNumber?.Trim();
            var normalizedGender = NormalizeGender(request.Gender);
            var genderCode = ToGenderCode(normalizedGender);
            var normalizedAge = NormalizeAge(request.Age);
            var normalizedLocation = NormalizeLocation(request.Location);
            var normalizedVibe = NormalizeVibe(request.Vibe);
            var normalizedGoal = NormalizeGoal(request.Goal);
            var exactLocation = NormalizeExactLocation(request.ExactLocation);

            if (string.IsNullOrWhiteSpace(normalizedDateNumber))
            {
                return BadRequest("Perfect date code is required.");
            }

            if (normalizedGender == null)
            {
                return BadRequest("Gender must be Male or Female.");
            }

            if (!request.Age.HasValue)
            {
                return BadRequest("Age is required.");
            }

            if (normalizedAge == null)
            {
                return BadRequest("Age must be between 18 and 120.");
            }

            if (normalizedVibe == null)
            {
                return BadRequest("A valid vibe is required.");
            }

            if (normalizedGoal == null)
            {
                return BadRequest("A valid goal is required.");
            }

            var perfectDate = await _context.PerfectDates
                .FirstOrDefaultAsync(date => date.DateNumber == normalizedDateNumber);

            if (perfectDate == null)
            {
                return NotFound("Perfect date was not found.");
            }

            // המיקום הוא מידע משותף: אם צד אחד כבר בחר בית/חוץ, הצד השני חייב להתאים.
            if (!string.IsNullOrWhiteSpace(normalizedLocation))
            {
                if (perfectDate.Location == DefaultLocationBeforeQuestionnaire)
                {
                    perfectDate.Location = normalizedLocation;
                    perfectDate.LocationType = normalizedLocation == "out";
                }
                else if (!string.Equals(perfectDate.Location, normalizedLocation, StringComparison.OrdinalIgnoreCase))
                {
                    return BadRequest("Both partners must choose the same perfect date location.");
                }
            }

            if (!IsPerfectDateRoomValid(perfectDate))
            {
                return BadRequest("This perfect date room is no longer valid.");
            }

            if (string.IsNullOrWhiteSpace(perfectDate.ExactLocation) &&
                !string.IsNullOrWhiteSpace(exactLocation))
            {
                perfectDate.ExactLocation = exactLocation;
            }

            // Boundaries are shared safety rules. A later participant must not
            // be able to remove a boundary already selected by their partner.
            perfectDate.LimitNoWorkAndMoney |= request.LimitNoWorkAndMoney;
            perfectDate.LimitNoFutureTalk |= request.LimitNoFutureTalk;
            perfectDate.LimitNoHeavyPast |= request.LimitNoHeavyPast;
            perfectDate.LimitNoPhysical |= request.LimitNoPhysical;

            var participantRole = ResolveParticipantRole(perfectDate, request);

            if (participantRole == null)
            {
                return BadRequest("This perfect date already has two different users.");
            }

            // המגדר נשמר לפי הצד בחדר כדי להתאים משימות סודיות/משלימות בלי לערבב בין המכשירים.
            if (participantRole == "user1")
            {
                if (!HasValidAccessToken(perfectDate, participantRole, request.AccessToken))
                {
                    return Unauthorized("Perfect date access token is missing or invalid.");
                }

                perfectDate.User1Gender = normalizedGender;
                if (normalizedAge.HasValue)
                {
                    perfectDate.User1Age = normalizedAge;
                }
                perfectDate.CreatorGender = genderCode;
                if (request.UserID.HasValue && perfectDate.User1ID == null)
                {
                    perfectDate.User1ID = request.UserID;
                    perfectDate.CreatorUserID = request.UserID;
                }
            }
            else
            {
                if (!HasValidAccessToken(perfectDate, participantRole, request.AccessToken))
                {
                    return Unauthorized("Perfect date access token is missing or invalid.");
                }

                perfectDate.User2Gender = normalizedGender;
                if (normalizedAge.HasValue)
                {
                    perfectDate.User2Age = normalizedAge;
                }
                perfectDate.JoinedGender = genderCode;
                if (request.UserID.HasValue && perfectDate.User2ID == null)
                {
                    perfectDate.User2ID = request.UserID;
                    perfectDate.JoinedUserID = request.UserID;
                }
            }

            if (perfectDate.StartedAt.HasValue)
            {
                return Conflict("The questionnaire cannot be changed after the date has started.");
            }

            perfectDate.Status = HasBothPartnerSetupDetails(perfectDate)
                ? "QuestionnaireCompleted"
                : "QuestionnaireStarted";
            perfectDate.UpdatedAt = DateTime.UtcNow;

            await _context.SaveChangesAsync();
            await AddSelectedPreferencesAsync(perfectDate.PerfectDateID, normalizedVibe, normalizedGoal);

            if (request.UserID.HasValue)
            {
                // עדכון הפרופיל רץ ברקע ולא מעכב את המשך הדייט.
                _ = Task.Run(() => UpdateUserSetupDetailsAsync(request.UserID.Value, normalizedGender, normalizedAge));
            }

            return Ok(ToInviteResponse(perfectDate, participantRole, request.AccessToken));
        }

        [HttpPost("deck")]
        public async Task<ActionResult<IEnumerable<PerfectDateDeckCardResponse>>> GetPerfectDateDeck(
            [FromBody] PerfectDateDeckRequest request)
        {
            var normalizedDateNumber = request.DateNumber?.Trim();
            var languageCode = NormalizeLanguageCode(request.LanguageCode);

            if (string.IsNullOrWhiteSpace(normalizedDateNumber))
            {
                return BadRequest("Perfect date code is required.");
            }

            var perfectDate = await _context.PerfectDates
                .FirstOrDefaultAsync(date => date.DateNumber == normalizedDateNumber);

            if (perfectDate == null)
            {
                return NotFound("Perfect date was not found.");
            }

            if (!IsPerfectDateRoomValid(perfectDate))
            {
                return BadRequest("This perfect date room is no longer valid.");
            }

            var participantRole = ResolveDeckParticipantRole(perfectDate, request.UserID, request.ParticipantRole);
            if (!HasValidAccessToken(perfectDate, participantRole, request.AccessToken))
            {
                return Unauthorized("Perfect date access token is missing or invalid.");
            }

            var currentGender = participantRole == "user2"
                ? perfectDate.JoinedGender ?? ToGenderCode(perfectDate.User2Gender)
                : perfectDate.CreatorGender ?? ToGenderCode(perfectDate.User1Gender);

            if (!HasBothPartnerSetupDetails(perfectDate))
            {
                return Conflict("Both partners must complete the questionnaire before starting the date.");
            }

            if (perfectDate.StartedAt == null)
            {
                perfectDate.StartedAt = DateTime.UtcNow;
                perfectDate.Status = "Started";
                perfectDate.UpdatedAt = DateTime.UtcNow;
                await _context.SaveChangesAsync();
            }

            var tasks = await EnsurePerfectDateTasksAsync(perfectDate);

            var translations = await FindPerfectDateTaskTranslationsAsync(tasks, languageCode);

            return Ok(tasks.Select(task =>
                ToDeckCardResponse(
                    task,
                    participantRole,
                    currentGender,
                    task.PerfectDateCardID.HasValue && translations.TryGetValue(task.PerfectDateCardID.Value, out var translation)
                        ? translation
                        : null)));
        }

        [HttpPost("state")]
        public async Task<ActionResult<PerfectDateSyncStateResponse>> GetPerfectDateState(
            [FromBody] PerfectDateSyncStateRequest request)
        {
            var normalizedDateNumber = request.DateNumber?.Trim();

            if (string.IsNullOrWhiteSpace(normalizedDateNumber))
            {
                return BadRequest("Perfect date code is required.");
            }

            var perfectDate = await _context.PerfectDates
                .FirstOrDefaultAsync(date => date.DateNumber == normalizedDateNumber);

            if (perfectDate == null)
            {
                return NotFound("Perfect date was not found.");
            }

            if (!IsPerfectDateRoomValid(perfectDate))
            {
                return BadRequest("This perfect date room is no longer valid.");
            }

            var participantRole = ResolveDeckParticipantRole(perfectDate, request.UserID, request.ParticipantRole);
            if (!HasValidAccessToken(perfectDate, participantRole, request.AccessToken))
            {
                return Unauthorized("Perfect date access token is missing or invalid.");
            }

            var tasks = await EnsurePerfectDateTasksAsync(perfectDate);

            return Ok(ToSyncStateResponse(tasks, participantRole));
        }

        [HttpPost("reveal-ready")]
        public async Task<ActionResult<PerfectDateSyncStateResponse>> MarkPerfectDateTaskRevealReady(
            [FromBody] PerfectDateTaskRevealReadyRequest request)
        {
            var normalizedDateNumber = request.DateNumber?.Trim();

            if (string.IsNullOrWhiteSpace(normalizedDateNumber))
            {
                return BadRequest("Perfect date code is required.");
            }

            var perfectDate = await _context.PerfectDates
                .FirstOrDefaultAsync(date => date.DateNumber == normalizedDateNumber);

            if (perfectDate == null)
            {
                return NotFound("Perfect date was not found.");
            }

            if (!IsPerfectDateRoomValid(perfectDate))
            {
                return BadRequest("This perfect date room is no longer valid.");
            }

            var participantRole = ResolveDeckParticipantRole(perfectDate, request.UserID, request.ParticipantRole);
            if (!HasValidAccessToken(perfectDate, participantRole, request.AccessToken))
            {
                return Unauthorized("Perfect date access token is missing or invalid.");
            }

            var tasks = await EnsurePerfectDateTasksAsync(perfectDate);
            var currentTask = FindCurrentSyncTask(tasks);

            if (currentTask == null)
            {
                return Ok(ToSyncStateResponse(tasks, participantRole));
            }

            if (request.PerfectDateTaskID != currentTask.PerfectDateTaskID)
            {
                return Conflict(ToSyncStateResponse(tasks, participantRole));
            }

            var now = DateTime.UtcNow;
            if (participantRole == "user2")
            {
                currentTask.User2RevealReadyAt ??= now;
            }
            else
            {
                currentTask.User1RevealReadyAt ??= now;
            }

            if (!currentTask.IsRevealed &&
                currentTask.User1RevealReadyAt.HasValue &&
                currentTask.User2RevealReadyAt.HasValue)
            {
                currentTask.IsRevealed = true;
                currentTask.RevealedAt = now;
            }

            perfectDate.UpdatedAt = now;
            await _context.SaveChangesAsync();

            // Concurrent requests can each save one side's ready timestamp.
            // Reload so the request that commits second can reveal the card.
            await _context.Entry(currentTask).ReloadAsync();
            if (!currentTask.IsRevealed &&
                currentTask.User1RevealReadyAt.HasValue &&
                currentTask.User2RevealReadyAt.HasValue)
            {
                currentTask.IsRevealed = true;
                currentTask.RevealedAt = DateTime.UtcNow;
                await _context.SaveChangesAsync();
            }

            return Ok(ToSyncStateResponse(tasks, participantRole));
        }

        [HttpPost("ready")]
        public async Task<ActionResult<PerfectDateSyncStateResponse>> MarkPerfectDateTaskReady(
            [FromBody] PerfectDateTaskReadyRequest request)
        {
            var normalizedDateNumber = request.DateNumber?.Trim();

            if (string.IsNullOrWhiteSpace(normalizedDateNumber))
            {
                return BadRequest("Perfect date code is required.");
            }

            var perfectDate = await _context.PerfectDates
                .FirstOrDefaultAsync(date => date.DateNumber == normalizedDateNumber);

            if (perfectDate == null)
            {
                return NotFound("Perfect date was not found.");
            }

            if (!IsPerfectDateRoomValid(perfectDate))
            {
                return BadRequest("This perfect date room is no longer valid.");
            }

            var participantRole = ResolveDeckParticipantRole(perfectDate, request.UserID, request.ParticipantRole);
            if (!HasValidAccessToken(perfectDate, participantRole, request.AccessToken))
            {
                return Unauthorized("Perfect date access token is missing or invalid.");
            }

            var tasks = await EnsurePerfectDateTasksAsync(perfectDate);
            var currentTask = FindCurrentSyncTask(tasks);

            if (currentTask == null)
            {
                return Ok(ToSyncStateResponse(tasks, participantRole));
            }

            // Only the current shared task can be completed. This prevents one phone from racing ahead.
            if (request.PerfectDateTaskID != currentTask.PerfectDateTaskID)
            {
                return Conflict(ToSyncStateResponse(tasks, participantRole));
            }

            if (!currentTask.IsRevealed)
            {
                return Conflict(ToSyncStateResponse(tasks, participantRole));
            }

            var now = DateTime.UtcNow;
            if (participantRole == "user2")
            {
                currentTask.User2CompletedAt ??= now;
            }
            else
            {
                currentTask.User1CompletedAt ??= now;
            }

            perfectDate.UpdatedAt = now;
            await _context.SaveChangesAsync();

            return Ok(ToSyncStateResponse(tasks, participantRole));
        }

        [HttpGet("{dateNumber}")]
        public async Task<ActionResult<PerfectDateInviteResponse>> GetPerfectDate(string dateNumber)
        {
            var normalizedDateNumber = dateNumber.Trim();

            var perfectDate = await _context.PerfectDates
                .FirstOrDefaultAsync(date => date.DateNumber == normalizedDateNumber);

            if (perfectDate == null)
            {
                return NotFound("Perfect date was not found.");
            }

            return Ok(ToInviteResponse(perfectDate));
        }

        private async Task<List<PerfectDateCard>> FindPerfectDateCardsAsync(PerfectDate perfectDate)
        {
            var excludedBoundaryKeys = GetExcludedBoundaryKeys(perfectDate);
            var location = NormalizeLocation(perfectDate.Location) ?? perfectDate.Location;
            var selectedVibes = SplitSelectedPreferences(perfectDate.SelectedVibes);
            var selectedGoals = SplitSelectedPreferences(perfectDate.SelectedGoals);

            var query = _context.PerfectDateCards
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
                .Take(24)
                .ToListAsync();

            if (matchingCards.Count > 0)
            {
                return matchingCards;
            }

            return await OrderPerfectDateCards(query, selectedVibes, selectedGoals)
                .Take(24)
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

        private async Task<List<PerfectDateTask>> EnsurePerfectDateTasksAsync(PerfectDate perfectDate)
        {
            var tasks = await _context.PerfectDateTasks
                .Where(task => task.PerfectDateID == perfectDate.PerfectDateID)
                .OrderBy(task => task.SequenceNumber)
                .ThenBy(task => task.PerfectDateTaskID)
                .ToListAsync();

            if (tasks.Count > 0)
            {
                return tasks;
            }

            var perfectDateCards = await FindPerfectDateCardsAsync(perfectDate);
            var nextSequence = 1;

            foreach (var card in perfectDateCards)
            {
                _context.PerfectDateTasks.Add(new PerfectDateTask
                {
                    PerfectDateID = perfectDate.PerfectDateID,
                    PerfectDateCardID = card.PerfectDateCardID,
                    SequenceNumber = nextSequence++,
                    TaskType = card.TaskType,
                    AudienceMode = card.AudienceMode,
                    User1BackLabel = card.User1BackLabel,
                    User1Label = card.User1Label,
                    User1Text = card.User1Text,
                    IsUser1Secret = card.IsUser1Secret,
                    User2BackLabel = card.User2BackLabel,
                    User2Label = card.User2Label,
                    User2Text = card.User2Text,
                    IsUser2Secret = card.IsUser2Secret,
                    CreatedAt = DateTime.UtcNow,
                });
            }

            if (perfectDateCards.Count > 0)
            {
                try
                {
                    await _context.SaveChangesAsync();
                }
                catch (DbUpdateException)
                {
                    // Both phones can request the deck at the same moment.
                    // The unique date/sequence index lets one request win;
                    // detach this request's duplicate inserts and reload.
                    foreach (var entry in _context.ChangeTracker
                        .Entries<PerfectDateTask>()
                        .Where(entry => entry.State == EntityState.Added))
                    {
                        entry.State = EntityState.Detached;
                    }

                    var anotherRequestCreatedTasks = await _context.PerfectDateTasks
                        .AnyAsync(task => task.PerfectDateID == perfectDate.PerfectDateID);

                    if (!anotherRequestCreatedTasks)
                    {
                        throw;
                    }
                }
            }

            return await _context.PerfectDateTasks
                .Where(task => task.PerfectDateID == perfectDate.PerfectDateID)
                .OrderBy(task => task.SequenceNumber)
                .ThenBy(task => task.PerfectDateTaskID)
                .ToListAsync();
        }

        private static PerfectDateTask? FindCurrentSyncTask(List<PerfectDateTask> tasks)
        {
            return tasks.FirstOrDefault(task =>
                !task.User1CompletedAt.HasValue ||
                !task.User2CompletedAt.HasValue);
        }

        private static PerfectDateSyncStateResponse ToSyncStateResponse(
            List<PerfectDateTask> tasks,
            string participantRole)
        {
            var currentTask = FindCurrentSyncTask(tasks);

            if (currentTask == null)
            {
                return new PerfectDateSyncStateResponse
                {
                    CurrentTaskID = null,
                    CurrentSequenceNumber = tasks.Count,
                    TotalTasks = tasks.Count,
                    CurrentUserReady = true,
                    PartnerReady = true,
                    CurrentUserRevealReady = true,
                    PartnerRevealReady = true,
                    IsCurrentTaskRevealed = true,
                    IsCompleted = true,
                };
            }

            var isUser2 = participantRole == "user2";

            return new PerfectDateSyncStateResponse
            {
                CurrentTaskID = currentTask.PerfectDateTaskID,
                CurrentSequenceNumber = currentTask.SequenceNumber,
                TotalTasks = tasks.Count,
                CurrentUserReady = isUser2
                    ? currentTask.User2CompletedAt.HasValue
                    : currentTask.User1CompletedAt.HasValue,
                PartnerReady = isUser2
                    ? currentTask.User1CompletedAt.HasValue
                    : currentTask.User2CompletedAt.HasValue,
                CurrentUserRevealReady = isUser2
                    ? currentTask.User2RevealReadyAt.HasValue
                    : currentTask.User1RevealReadyAt.HasValue,
                PartnerRevealReady = isUser2
                    ? currentTask.User1RevealReadyAt.HasValue
                    : currentTask.User2RevealReadyAt.HasValue,
                IsCurrentTaskRevealed = currentTask.IsRevealed,
                IsCompleted = false,
            };
        }

        private async Task<Dictionary<int, PerfectDateCardTranslation>> FindPerfectDateTaskTranslationsAsync(
            List<PerfectDateTask> tasks,
            string languageCode)
        {
            if (languageCode == "he")
            {
                return new Dictionary<int, PerfectDateCardTranslation>();
            }

            var cardIds = tasks
                .Select(task => task.PerfectDateCardID)
                .Where(cardId => cardId.HasValue)
                .Select(cardId => cardId!.Value)
                .Distinct()
                .ToList();

            if (cardIds.Count == 0)
            {
                return new Dictionary<int, PerfectDateCardTranslation>();
            }

            return await _context.PerfectDateCardTranslations
                .Where(translation =>
                    cardIds.Contains(translation.PerfectDateCardID) &&
                    translation.LanguageCode == languageCode)
                .ToDictionaryAsync(
                    translation => translation.PerfectDateCardID,
                    translation => translation);
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

        private static PerfectDateDeckCardResponse ToDeckCardResponse(
            PerfectDateTask task,
            string participantRole,
            string? currentGender,
            PerfectDateCardTranslation? translation)
        {
            var isUser2 = participantRole == "user2";
            var contentText = isUser2
                ? translation?.User2Text ?? task.User2Text
                : translation?.User1Text ?? task.User1Text;
            var fallbackText = isUser2
                ? translation?.User1Text ?? task.User1Text
                : translation?.User2Text ?? task.User2Text;
            var isSecret = isUser2 ? task.IsUser2Secret : task.IsUser1Secret;
            var label = isUser2
                ? translation?.User2Label ?? task.User2Label
                : translation?.User1Label ?? task.User1Label;
            var backLabel = isUser2
                ? translation?.User2BackLabel ?? task.User2BackLabel
                : translation?.User1BackLabel ?? task.User1BackLabel;
            var cardType = ResolvePerfectDateCardType(task.TaskType, isSecret);

            contentText = string.IsNullOrWhiteSpace(contentText)
                ? fallbackText ?? string.Empty
                : contentText;

            return new PerfectDateDeckCardResponse
            {
                PerfectDateTaskID = task.PerfectDateTaskID,
                SequenceNumber = task.SequenceNumber,
                CardID = task.PerfectDateCardID ?? task.PerfectDateTaskID,
                CardType = cardType,
                AllowedLocation = 2,
                BackLabel = backLabel ?? GetBackLabel(cardType),
                Label = label ?? GetCardLabel(cardType),
                ContentText = contentText,
                ContentMaleSecret = cardType == 3 && currentGender == "M" ? contentText : null,
                ContentFemaleSecret = cardType == 3 && currentGender == "F" ? contentText : null,
                CurrentUserGender = currentGender ?? string.Empty,
                IsSecret = isSecret,
            };
        }

        private static int ResolvePerfectDateCardType(string? taskType, bool isSecret)
        {
            var value = taskType?.Trim().ToLowerInvariant() ?? string.Empty;

            if (isSecret || value.Contains("secret"))
            {
                return 3;
            }

            if (value.Contains("task") ||
                value.Contains("mission") ||
                value.Contains("shared"))
            {
                return 2;
            }

            return 1;
        }

        private async Task<string> GenerateUniqueDateNumber()
        {
            // קוד קצר ונוח לשיתוף. אם יש התנגשות, מנסים שוב.
            for (var attempt = 0; attempt < 25; attempt++)
            {
                var code = RandomNumberGenerator.GetInt32(1000, 10000).ToString();
                var exists = await _context.PerfectDates.AnyAsync(date => date.DateNumber == code);

                if (!exists)
                {
                    return code;
                }
            }

            throw new InvalidOperationException("Could not generate a unique perfect date code.");
        }

        private static string GenerateAccessToken()
        {
            var bytes = RandomNumberGenerator.GetBytes(32);
            return Convert.ToBase64String(bytes)
                .TrimEnd('=')
                .Replace('+', '-')
                .Replace('/', '_');
        }

        private static string HashAccessToken(string accessToken)
        {
            var normalizedToken = NormalizeAccessToken(accessToken) ?? string.Empty;
            var tokenBytes = Encoding.UTF8.GetBytes(normalizedToken);
            return Convert.ToBase64String(SHA256.HashData(tokenBytes));
        }

        private static string? NormalizeAccessToken(string? accessToken)
        {
            var value = accessToken?.Trim();
            return string.IsNullOrWhiteSpace(value) ? null : value;
        }

        private static bool VerifyAccessToken(string? accessToken, string? expectedHash)
        {
            var normalizedToken = NormalizeAccessToken(accessToken);
            if (normalizedToken == null || string.IsNullOrWhiteSpace(expectedHash))
            {
                return false;
            }

            var actualHash = HashAccessToken(normalizedToken);
            var actualBytes = Encoding.UTF8.GetBytes(actualHash);
            var expectedBytes = Encoding.UTF8.GetBytes(expectedHash);

            return actualBytes.Length == expectedBytes.Length &&
                CryptographicOperations.FixedTimeEquals(actualBytes, expectedBytes);
        }

        private static bool HasValidAccessToken(
            PerfectDate perfectDate,
            string participantRole,
            string? accessToken)
        {
            var expectedHash = participantRole == "user2"
                ? perfectDate.JoinedAccessTokenHash
                : perfectDate.CreatorAccessTokenHash;

            return VerifyAccessToken(accessToken, expectedHash);
        }

        private static bool IsPerfectDateRoomValid(PerfectDate perfectDate)
        {
            if (perfectDate.StartedAt.HasValue)
            {
                return true;
            }

            return perfectDate.CreatedAt >= DateTime.UtcNow.AddHours(-PendingRoomLifetimeHours);
        }

        private static string? NormalizeGender(string? gender)
        {
            var value = gender?.Trim();

            if (string.IsNullOrWhiteSpace(value))
            {
                return null;
            }

            if (string.Equals(value, "Male", StringComparison.OrdinalIgnoreCase) ||
                value == "גבר" ||
                value == "זכר")
            {
                return "Male";
            }

            if (string.Equals(value, "Female", StringComparison.OrdinalIgnoreCase) ||
                value == "אישה" ||
                value == "אשה" ||
                value == "נקבה")
            {
                return "Female";
            }

            return null;
        }

        private static string? ToGenderCode(string? gender)
        {
            var normalizedGender = NormalizeGender(gender);

            if (normalizedGender == "Male")
            {
                return "M";
            }

            if (normalizedGender == "Female")
            {
                return "F";
            }

            return null;
        }

        private static int? NormalizeAge(int? age)
        {
            if (!age.HasValue)
            {
                return null;
            }

            return age.Value is >= 18 and <= 120 ? age.Value : null;
        }

        private static string NormalizeLanguageCode(string? languageCode)
        {
            var value = languageCode?.Trim().ToLowerInvariant();
            return string.IsNullOrWhiteSpace(value) ? "he" : value[..Math.Min(value.Length, 5)];
        }

        private static string NormalizeExactLocation(string? exactLocation)
        {
            var value = exactLocation?.Trim() ?? string.Empty;
            return value.Length <= 30 ? value : value[..30];
        }

        private static string? NormalizeLocation(string? location)
        {
            var value = location?.Trim();

            if (string.IsNullOrWhiteSpace(value))
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

        private static string? NormalizeVibe(string? vibe)
        {
            var value = vibe?.Trim().ToLowerInvariant();
            return value is "light" or "playful" or "deep" or "release" ? value : null;
        }

        private static string? NormalizeGoal(string? goal)
        {
            var value = goal?.Trim().ToLowerInvariant();
            return value is "intimacy" or "fun" or "appreciation" or "future" ? value : null;
        }

        private static List<string> SplitSelectedPreferences(string? values)
        {
            return (values ?? string.Empty)
                .Split(',', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries)
                .Select(value => value.ToLowerInvariant())
                .Distinct()
                .ToList();
        }

        private async Task AddSelectedPreferencesAsync(int perfectDateId, string vibe, string goal)
        {
            await _context.Database.ExecuteSqlInterpolatedAsync($@"
UPDATE PerfectDates
SET
    SelectedVibes = CASE
        WHEN COALESCE(SelectedVibes, '') = '' THEN {vibe}
        WHEN ',' + COALESCE(SelectedVibes, '') + ',' LIKE '%,' + {vibe} + ',%' THEN COALESCE(SelectedVibes, '')
        ELSE COALESCE(SelectedVibes, '') + ',' + {vibe}
    END,
    SelectedGoals = CASE
        WHEN COALESCE(SelectedGoals, '') = '' THEN {goal}
        WHEN ',' + COALESCE(SelectedGoals, '') + ',' LIKE '%,' + {goal} + ',%' THEN COALESCE(SelectedGoals, '')
        ELSE COALESCE(SelectedGoals, '') + ',' + {goal}
    END
WHERE PerfectDateID = {perfectDateId};");

            await _context.Entry(
                    await _context.PerfectDates.FirstAsync(date => date.PerfectDateID == perfectDateId))
                .ReloadAsync();
        }

        private static string GetBackLabel(int cardType)
        {
            return cardType switch
            {
                2 => "משימה משותפת",
                3 => "משימה סודית",
                _ => "שאלה משותפת",
            };
        }

        private static string GetCardLabel(int cardType)
        {
            return cardType switch
            {
                2 => "משימה זוגית",
                3 => "משימה סודית",
                _ => "שאלה",
            };
        }

        private static string? NormalizeParticipantRole(string? participantRole)
        {
            var value = participantRole?.Trim();

            if (string.Equals(value, "user1", StringComparison.OrdinalIgnoreCase))
            {
                return "user1";
            }

            if (string.Equals(value, "user2", StringComparison.OrdinalIgnoreCase))
            {
                return "user2";
            }

            return null;
        }

        private static string? ResolveJoinParticipantRole(PerfectDate perfectDate, int? userId)
        {
            if (userId.HasValue)
            {
                if (perfectDate.CreatorUserID == userId || perfectDate.User1ID == userId)
                {
                    return "user1";
                }

                if (perfectDate.JoinedUserID == userId || perfectDate.User2ID == userId)
                {
                    return "user2";
                }

                if (perfectDate.User2ID.HasValue || perfectDate.JoinedUserID.HasValue)
                {
                    return null;
                }
            }
            else if (perfectDate.User2ID.HasValue || perfectDate.JoinedUserID.HasValue)
            {
                return null;
            }

            return "user2";
        }

        private static string? ResolveParticipantRole(
            PerfectDate perfectDate,
            SavePerfectDateSetupRequest request)
        {
            if (request.UserID.HasValue)
            {
                if (perfectDate.User1ID == request.UserID)
                {
                    return "user1";
                }

                if (perfectDate.User2ID == request.UserID)
                {
                    return "user2";
                }
            }

            var requestedRole = NormalizeParticipantRole(request.ParticipantRole);

            if (requestedRole == "user1")
            {
                if (perfectDate.User1ID.HasValue &&
                    request.UserID.HasValue &&
                    perfectDate.User1ID != request.UserID)
                {
                    return null;
                }

                return "user1";
            }

            if (requestedRole == "user2")
            {
                if (perfectDate.User2ID.HasValue &&
                    request.UserID.HasValue &&
                    perfectDate.User2ID != request.UserID)
                {
                    return null;
                }

                return "user2";
            }

            if (perfectDate.User1ID == null)
            {
                return "user1";
            }

            if (perfectDate.User2ID == null)
            {
                return "user2";
            }

            return null;
        }

        private static string ResolveDeckParticipantRole(
            PerfectDate perfectDate,
            int? userId,
            string? participantRole)
        {
            if (userId.HasValue)
            {
                if (perfectDate.CreatorUserID == userId || perfectDate.User1ID == userId)
                {
                    return "user1";
                }

                if (perfectDate.JoinedUserID == userId || perfectDate.User2ID == userId)
                {
                    return "user2";
                }
            }

            return NormalizeParticipantRole(participantRole) ?? "user1";
        }

        private static bool HasBothPartnerSetupDetails(PerfectDate perfectDate)
        {
            return !string.IsNullOrWhiteSpace(perfectDate.User1Gender) &&
                !string.IsNullOrWhiteSpace(perfectDate.User2Gender) &&
                perfectDate.User1Age.HasValue &&
                perfectDate.User2Age.HasValue;
        }

        private async Task UpdateUserSetupDetailsAsync(int userId, string gender, int? age)
        {
            try
            {
                using var scope = _scopeFactory.CreateScope();
                var context = scope.ServiceProvider.GetRequiredService<LoveGameDbContext>();
                var user = await context.Users.FirstOrDefaultAsync(item => item.UserID == userId);

                if (user == null)
                {
                    return;
                }

                var changed = false;

                if (string.IsNullOrWhiteSpace(user.Gender))
                {
                    user.Gender = gender;
                    changed = true;
                }

                if (age.HasValue && user.Age != age.Value)
                {
                    user.Age = age.Value;
                    changed = true;
                }

                if (changed)
                {
                    await context.SaveChangesAsync();
                }
            }
            catch
            {
                // עדכון פרופיל לא אמור להפיל או לעכב את זרימת הדייט.
            }
        }

        private static PerfectDateInviteResponse ToInviteResponse(
            PerfectDate perfectDate,
            string participantRole = "",
            string accessToken = "")
        {
            var deepLink = $"{AppDeepLinkPrefix}/{perfectDate.DateNumber}";
            var webInviteLink = $"{WebInvitePrefix}/{perfectDate.DateNumber}";

            return new PerfectDateInviteResponse
            {
                PerfectDateID = perfectDate.PerfectDateID,
                DateNumber = perfectDate.DateNumber,
                ParticipantRole = participantRole,
                ParticipantAccessToken = accessToken,
                Status = perfectDate.Status,
                DeepLink = deepLink,
                WebInviteLink = webInviteLink,
                ShareMessage =
                    $"הזמנתי אותך לדייט המושלם.\n" +
                    $"קוד הדייט: {perfectDate.DateNumber}\n" +
                    $"לחיצה להצטרפות: {webInviteLink}",
            };
        }
    }
}
