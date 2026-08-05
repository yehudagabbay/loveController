using controlersLoveGame.Data;

using controlersLoveGame.Models;
using controlersLoveGame.Services;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace controlersLoveGame.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class SubscriptionsController : ControllerBase
    {
        private readonly LoveGameDbContext _context;
        private readonly GooglePlayService _googlePlayService;
        private readonly ISubscriptionService _subscriptionService;

        public SubscriptionsController(
            LoveGameDbContext context,
            GooglePlayService googlePlayService,
            ISubscriptionService subscriptionService)
        {
            _context = context;
            _googlePlayService = googlePlayService;
            _subscriptionService = subscriptionService;
        }

        [HttpGet("plans")]
        public async Task<IActionResult> GetPlans()
        {
            var plans = await _context.SubscriptionPlans
                .AsNoTracking()
                .OrderBy(p => p.Price)
                .ThenBy(p => p.PlanID)
                .Select(p => new
                {
                    p.PlanID,
                    p.PlanCode,
                    p.PlanName,
                    p.Description,
                    p.DurationDays,
                    p.Price,
                    p.Currency,
                    p.IsActive,
                    p.CreatedAt,
                    ActiveSubscriptions = _context.Subscriptions.Count(s =>
                        s.PlanID == p.PlanID &&
                        s.IsActive &&
                        s.EndDate > DateTime.UtcNow),
                    TotalSubscriptions = _context.Subscriptions.Count(s => s.PlanID == p.PlanID)
                })
                .ToListAsync();

            return Ok(plans);
        }

        [HttpGet("overview")]
        public async Task<IActionResult> GetSubscriptionsOverview()
        {
            var now = DateTime.UtcNow;

            var totalSubscriptions = await _context.Subscriptions.CountAsync();
            var activeSubscriptions = await _context.Subscriptions
                .CountAsync(s => s.IsActive && s.EndDate > now);
            var expiredSubscriptions = await _context.Subscriptions
                .CountAsync(s => s.EndDate <= now);
            var autoRenewingSubscriptions = await _context.Subscriptions
                .CountAsync(s => s.IsActive && s.EndDate > now && s.AutoRenewing);

            var plans = await _context.SubscriptionPlans
                .AsNoTracking()
                .GroupJoin(
                    _context.Subscriptions.AsNoTracking(),
                    plan => plan.PlanID,
                    subscription => subscription.PlanID,
                    (plan, subscriptions) => new
                    {
                        plan.PlanID,
                        plan.PlanCode,
                        plan.PlanName,
                        plan.Price,
                        plan.Currency,
                        plan.IsActive,
                        ActiveUsers = subscriptions
                            .Where(s => s.IsActive && s.EndDate > now)
                            .Select(s => s.UserID)
                            .Distinct()
                            .Count(),
                        ActiveSubscriptions = subscriptions.Count(s => s.IsActive && s.EndDate > now),
                        TotalSubscriptions = subscriptions.Count(),
                        LatestStartDate = subscriptions
                            .OrderByDescending(s => s.StartDate)
                            .Select(s => (DateTime?)s.StartDate)
                            .FirstOrDefault(),
                        LatestEndDate = subscriptions
                            .OrderByDescending(s => s.EndDate)
                            .Select(s => (DateTime?)s.EndDate)
                            .FirstOrDefault()
                    })
                .OrderBy(p => p.Price)
                .ThenBy(p => p.PlanID)
                .ToListAsync();

            return Ok(new
            {
                TotalSubscriptions = totalSubscriptions,
                ActiveSubscriptions = activeSubscriptions,
                ExpiredSubscriptions = expiredSubscriptions,
                AutoRenewingSubscriptions = autoRenewingSubscriptions,
                Plans = plans
            });
        }

        [HttpGet("subscriptions")]
        public async Task<IActionResult> GetSubscriptions([FromQuery] bool activeOnly = false)
        {
            var now = DateTime.UtcNow;
            var query = _context.Subscriptions
                .AsNoTracking()
                .Include(s => s.User)
                .Include(s => s.SubscriptionPlan)
                .AsQueryable();

            if (activeOnly)
            {
                query = query.Where(s => s.IsActive && s.EndDate > now);
            }

            var subscriptions = await query
                .OrderByDescending(s => s.CreatedAt)
                .Select(s => new
                {
                    s.SubscriptionID,
                    s.UserID,
                    UserNickname = s.User != null ? s.User.Nickname : null,
                    UserEmail = s.User != null ? s.User.Email : null,
                    s.PlanID,
                    PlanCode = s.SubscriptionPlan != null ? s.SubscriptionPlan.PlanCode : null,
                    PlanName = s.SubscriptionPlan != null ? s.SubscriptionPlan.PlanName : null,
                    s.Store,
                    s.ProductId,
                    s.TransactionId,
                    s.StartDate,
                    s.EndDate,
                    s.IsActive,
                    IsCurrentlyActive = s.IsActive && s.EndDate > now,
                    s.AutoRenewing,
                    s.CreatedAt,
                    s.UpdatedAt
                })
                .ToListAsync();

            return Ok(subscriptions);
        }

        [HttpPost("purchase-subscription")]
        [HttpPost("/api/Users/purchase-subscription")]
        public async Task<IActionResult> PurchaseSubscription([FromBody] PurchaseSubscriptionRequest request)
        {
            try
            {
                if (request == null)
                {
                    return BadRequest("Request body is required.");
                }

                if (request.UserID <= 0 || request.PlanID <= 0)
                {
                    return BadRequest("UserID and PlanID are required.");
                }

                var result = await _subscriptionService.SavePurchaseAsync(request);

                if (!result.Success)
                {
                    return BadRequest(result.Message);
                }

                var subscription = result.Subscription!;

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

        [HttpPost("verify-subscription")]
        public async Task<IActionResult> VerifySubscription([FromBody] VerifySubscriptionRequest request)
        {
            if (request.UserID <= 0)
            {
                return BadRequest("Invalid user id");
            }

            bool isValid = await _googlePlayService.VerifyPurchaseAsync(
                request.ProductId,
                request.PurchaseToken);

            if (!isValid)
            {
                return BadRequest("Invalid purchase");
            }

            string planCode = GetPlanCodeByProductId(request.ProductId);

            SubscriptionPlan? plan = await _context.SubscriptionPlans
                .FirstOrDefaultAsync(p => p.PlanCode == planCode && p.IsActive);

            if (plan == null)
            {
                return BadRequest("Plan not found");
            }

            List<Subscription> oldSubscriptions = await _context.Subscriptions
                .Where(s => s.UserID == request.UserID && s.IsActive)
                .ToListAsync();

            foreach (Subscription oldSubscription in oldSubscriptions)
            {
                oldSubscription.IsActive = false;
                oldSubscription.UpdatedAt = DateTime.UtcNow;
            }

            Subscription subscription = new Subscription
            {
                UserID = request.UserID,
                PlanID = plan.PlanID,
                Store = request.Store,
                ProductId = request.ProductId,
                PurchaseToken = request.PurchaseToken,
                TransactionId = request.TransactionId,
                StartDate = DateTime.UtcNow,
                EndDate = DateTime.UtcNow.AddDays(plan.DurationDays),
                IsActive = true,
                AutoRenewing = true,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };

            _context.Subscriptions.Add(subscription);

            await _context.SaveChangesAsync();

            return Ok(new
            {
                message = "Subscription activated",
                plan = plan.PlanCode,
                expires = subscription.EndDate
            });
        }

        [HttpGet("user-plan/{userId}")]
        public async Task<IActionResult> GetUserPlan(int userId)
        {
            SubscriptionPlan? plan = await _subscriptionService.GetUserPlanAsync(userId);

            if (plan == null)
            {
                return NotFound("Plan not found");
            }

            return Ok(plan);
        }

        private string GetPlanCodeByProductId(string productId)
        {
            string cleanProductId = productId.Trim().ToLower();

            if (cleanProductId.Contains("deep"))
            {
                return "DEEP";
            }

            if (cleanProductId.Contains("premium"))
            {
                return "PREMIUM";
            }

            return "FREE";
        }
    }
}
