namespace controlersLoveGame.Services
{
    public class GooglePlayService
    {
        public async Task<bool> VerifyPurchaseAsync(string productId, string purchaseToken)
        {
            await Task.Delay(100);

            // זמני בלבד לבדיקה.
            // בהמשך כאן תהיה בדיקה אמיתית מול Google Play.
            return !string.IsNullOrWhiteSpace(productId)
                && !string.IsNullOrWhiteSpace(purchaseToken);
        }
    }
}