using controlersLoveGame.Models;

namespace controlersLoveGame.Services
{
    public interface ISubscriptionService
    {
        Task<SubscriptionPlan?> GetUserPlanAsync(int userId);
        Task<(bool Success, string Message, Subscription? Subscription)> SavePurchaseAsync(PurchaseSubscriptionRequest request);
    }
}
