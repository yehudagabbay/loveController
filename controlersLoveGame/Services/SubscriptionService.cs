using controlersLoveGame.Data;
using controlersLoveGame.Models;
using Microsoft.EntityFrameworkCore;

namespace controlersLoveGame.Services
{
    public class SubscriptionService : ISubscriptionService
    {
        private readonly LoveGameDbContext _context;
        // מצב זמני להשקה:
        // כל המשתמשים נחשבים פרימיום כדי לפתוח את כל המשחקים והרמות לכולם.
        // כשתרצו לחזור למודל אמיתי של פרימיום, שנו את הערך ל-false.
        private const bool ALL_USERS_ARE_PREMIUM = true;

        public SubscriptionService(LoveGameDbContext context)
        {
            _context = context;
        }

        public async Task<bool> CheckIfUserPremium(int userId)
        {
            // כרגע האפליקציה בשלב פתוח לכולם לצורך איסוף שימוש ונתונים.
            // לכן כל משתמש מקבל הרשאת פרימיום מלאה.
            if (ALL_USERS_ARE_PREMIUM)
            {
                return true;
            }

            if (userId == 0)
            {
                return false;
            }

            // זו בדיקת המנוי האמיתית.
            // היא נשארת כאן כדי שבעתיד יהיה אפשר להחזיר בקלות
            // את ניהול משתמשי הפרימיום בלי לשכתב את שאר השרת.
            return await _context.Subscriptions.AnyAsync(s =>
                s.UserID == userId &&
                s.IsActive &&
                s.EndDate > DateTime.UtcNow);
        }

        public async Task<SubscriptionPlan?> GetUserPlanAsync(int userId)
        {
            var activeSubscription = await _context.Subscriptions
                .Include(s => s.SubscriptionPlan)
                .Where(s =>
                    s.UserID == userId &&
                    s.IsActive &&
                    s.EndDate > DateTime.UtcNow)
                .OrderByDescending(s => s.EndDate)
                .FirstOrDefaultAsync();

            if (activeSubscription?.SubscriptionPlan != null)
            {
                return activeSubscription.SubscriptionPlan;
            }

            return await _context.SubscriptionPlans
                .FirstOrDefaultAsync(p => p.PlanCode == "FREE" && p.IsActive);
        }

        public async Task<(bool Success, string Message, Subscription? Subscription)> SavePurchaseAsync(PurchaseSubscriptionRequest request)
        {
            // ×©×œ×‘ 1:
            // ×‘×•×“×§×™× ×©×”×ž×©×ª×ž×© ×§×™×™× ×‘×ž×¡×“ ×”× ×ª×•× ×™×.
            // ×× ××™×Ÿ ×ž×©×ª×ž×© ×›×–×”, ×œ× × ×©×ž×•×¨ ×ž× ×•×™ ×›×™ ×”×•× ×œ× ×™×”×™×” ×©×™×™×š ×œ××£ ××—×“.
            var user = await _context.Users
                .FirstOrDefaultAsync(u => u.UserID == request.UserID);

            if (user == null)
            {
                return (false, "User not found.", null);
            }

            // ×©×œ×‘ 2:
            // ×‘×•×“×§×™× ×©×ª×•×›× ×™×ª ×”×ž× ×•×™ ×©×”×œ×§×•×— ×©×œ×— ×‘××ž×ª ×§×™×™×ž×ª,
            // ×•×’× ×©×”×™× ×¤×¢×™×œ×” ×•×–×ž×™× ×” ×œ×ž×›×™×¨×”.
            var plan = await _context.SubscriptionPlans
                .FirstOrDefaultAsync(p => p.PlanID == request.PlanID && p.IsActive);

            if (plan == null)
            {
                return (false, "Subscription plan not found or inactive.", null);
            }

            // ×©×œ×‘ 3:
            // ××œ×• ×©×“×•×ª ×‘×¡×™×¡×™×™× ×©×—×™×™×‘×™× ×œ×”×’×™×¢ ×‘×›×œ ×¨×›×™×©×”:
            // ×©× ×”×—× ×•×ª ×©×ž×ž× ×” ×‘×•×¦×¢×” ×”×¨×›×™×©×” ×•×ž×–×”×” ×”×ž×•×¦×¨ ×‘×—× ×•×ª.
            if (string.IsNullOrWhiteSpace(request.Store) || string.IsNullOrWhiteSpace(request.ProductId))
            {
                return (false, "Store and ProductId are required.", null);
            }

            // ×ž× ×¨×ž×œ×™× ××ª ×©× ×”×—× ×•×ª ×›×“×™ ×©×›×œ ×”×•×•×¨×™××¦×™×•×ª ×©×œ ××•×ª×™×•×ª ×’×“×•×œ×•×ª/×§×˜× ×•×ª
            // ×™×™×©×ž×¨×• ×‘×¦×•×¨×” ××—×™×“×” ×‘×ž×¡×“ ×”× ×ª×•× ×™×.
            var normalizedStore = request.Store.Trim().ToLowerInvariant();
            if (normalizedStore != "google" && normalizedStore != "apple")
            {
                return (false, "Store must be either google or apple.", null);
            }

            // ×©×œ×‘ 4:
            // ×œ×›×œ ×—× ×•×ª ×™×© ×ž×–×”×” ×¨×›×™×©×” ××—×¨:
            // Google ×ž×©×ª×ž×© ×‘-PurchaseToken
            // Apple ×ž×©×ª×ž×© ×‘-TransactionId
            // ×× ×”×ž×–×”×” ×”×–×” ×œ× ×ž×’×™×¢, ××™ ××¤×©×¨ ×œ×“×¢×ª ××™×–×• ×¨×›×™×©×” × ×©×ž×¨×ª.
            if (normalizedStore == "google" && string.IsNullOrWhiteSpace(request.PurchaseToken))
            {
                return (false, "PurchaseToken is required for Google purchases.", null);
            }

            if (normalizedStore == "apple" && string.IsNullOrWhiteSpace(request.TransactionId))
            {
                return (false, "TransactionId is required for Apple purchases.", null);
            }

            // ×©×œ×‘ 5:
            // ×× ×”×œ×§×•×— ×œ× ×©×œ×— ×ª××¨×™×›×™ ×”×ª×—×œ×” ×•×¡×™×•×, ×”×©×¨×ª ×§×•×‘×¢ ××•×ª× ×œ×‘×“.
            // ×ª×—×™×œ×ª ×ž× ×•×™ = ×¢×›×©×™×•.
            // ×¡×•×£ ×ž× ×•×™ = ×¢×›×©×™×• + ×ž×¡×¤×¨ ×”×™×ž×™× ×©×ž×•×’×“×¨ ×‘×ª×•×›× ×™×ª.
            var startDate = request.StartDate?.ToUniversalTime() ?? DateTime.UtcNow;
            var endDate = request.EndDate?.ToUniversalTime() ?? startDate.AddDays(plan.DurationDays);

            if (endDate <= startDate)
            {
                return (false, "EndDate must be later than StartDate.", null);
            }

            // ×ž× ×§×™× ×¨×•×•×—×™× ×ž×™×•×ª×¨×™× ×ž×”×ž×–×”×™× ×œ×¤× ×™ ×©×ž×—×¤×©×™× ××• ×©×•×ž×¨×™×.
            var trimmedPurchaseToken = string.IsNullOrWhiteSpace(request.PurchaseToken) ? null : request.PurchaseToken.Trim();
            var trimmedTransactionId = string.IsNullOrWhiteSpace(request.TransactionId) ? null : request.TransactionId.Trim();

            // ×©×œ×‘ 6:
            // ×‘×•×“×§×™× ×× ×”×¨×›×™×©×” ×”×–×• ×›×‘×¨ × ×©×ž×¨×” ×‘×¢×‘×¨.
            // ×–×” ×—×©×•×‘ ×›×“×™ ×œ× ×œ×™×¦×•×¨ ×©×ª×™ ×¨×©×•×ž×•×ª ×¢×‘×•×¨ ××•×ª×• ×ª×©×œ×•×,
            // ×œ×ž×©×œ ×× ×”××¤×œ×™×§×¦×™×” ×©×œ×—×” ×©×•×‘ ××ª ××•×ª×” ×‘×§×©×”.
            var duplicateSubscription = await _context.Subscriptions
                .FirstOrDefaultAsync(s =>
                    (normalizedStore == "google" && trimmedPurchaseToken != null && s.PurchaseToken == trimmedPurchaseToken) ||
                    (normalizedStore == "apple" && trimmedTransactionId != null && s.TransactionId == trimmedTransactionId));

            if (duplicateSubscription != null)
            {
                // ×× ×ž×¦×× ×• ×¨×›×™×©×” ×§×™×™×ž×ª, ×× ×—× ×• ×œ× ×ž×•×¡×™×¤×™× ×©×•×¨×” ×—×“×©×”.
                // ×‘×ž×§×•× ×–×” ×ž×¢×“×›× ×™× ××ª ×”×¨×©×•×ž×” ×”×™×©× ×” ×¢× ×”× ×ª×•× ×™× ×”×—×“×©×™×.
                duplicateSubscription.PlanID = request.PlanID;
                duplicateSubscription.Store = normalizedStore;
                duplicateSubscription.ProductId = request.ProductId.Trim();
                duplicateSubscription.StartDate = startDate;
                duplicateSubscription.EndDate = endDate;
                duplicateSubscription.IsActive = true;
                duplicateSubscription.AutoRenewing = request.AutoRenewing;
                duplicateSubscription.UpdatedAt = DateTime.UtcNow;

                await _context.SaveChangesAsync();
                return (true, "Subscription updated successfully.", duplicateSubscription);
            }

            // ×©×œ×‘ 7:
            // ×œ×¤× ×™ ×©×©×•×ž×¨×™× ×ž× ×•×™ ×—×“×©, ×ž×›×‘×™× ×ž× ×•×™×™× ×¤×¢×™×œ×™× ××—×¨×™× ×©×œ ××•×ª×• ×ž×©×ª×ž×©.
            // ×›×š ×× ×—× ×• ×ž×©××™×¨×™× ×œ×ž×©×ª×ž×© ×ž× ×•×™ ×¤×¢×™×œ ××—×“ × ×•×›×—×™,
            // ×•×œ× ×›×ž×” ×ž× ×•×™×™× ×¤×¢×™×œ×™× ×‘×ž×§×‘×™×œ ×‘×œ×™ ×‘×§×¨×”.
            var currentActiveSubscriptions = await _context.Subscriptions
                .Where(s => s.UserID == request.UserID && s.IsActive)
                .ToListAsync();

            foreach (var existingSubscription in currentActiveSubscriptions)
            {
                existingSubscription.IsActive = false;
                existingSubscription.UpdatedAt = DateTime.UtcNow;
            }

            // ×©×œ×‘ 8:
            // ×‘×•× ×™× ××•×‘×™×™×§×˜ ×—×“×© ×©×œ Subscription ×¢× ×›×œ ×”× ×ª×•× ×™× ×©×¢×‘×¨×• ××ª ×”×‘×“×™×§×•×ª.
            // ×–×” ×”××•×‘×™×™×§×˜ ×©×™×™×›× ×¡ ×‘×¤×•×¢×œ ×œ×˜×‘×œ×ª Subscriptions.
            var subscription = new Subscription
            {
                UserID = request.UserID,
                PlanID = request.PlanID,
                Store = normalizedStore,
                ProductId = request.ProductId.Trim(),
                PurchaseToken = trimmedPurchaseToken,
                TransactionId = trimmedTransactionId,
                StartDate = startDate,
                EndDate = endDate,
                IsActive = true,
                AutoRenewing = request.AutoRenewing,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };

            // ×›××Ÿ EF ×ž×ª×—×™×œ ×œ×¢×§×•×‘ ××—×¨×™ ×”××•×‘×™×™×§×˜ ×”×—×“×©,
            // ×•-SaveChangesAsync ×©×•×ž×¨ ××•×ª×• ×‘×¤×•×¢×œ ×‘×ž×¡×“ ×”× ×ª×•× ×™×.
            _context.Subscriptions.Add(subscription);
            await _context.SaveChangesAsync();

            return (true, "Subscription saved successfully.", subscription);
        }
    }
}
