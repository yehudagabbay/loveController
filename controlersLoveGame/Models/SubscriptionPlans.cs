namespace controlersLoveGame.Models
{
    public class SubscriptionPlan
    {
        public int PlanID { get; set; }
        public string PlanCode { get; set; } = string.Empty;
        public string PlanName { get; set; } = string.Empty;
        public string? Description { get; set; }
        public int DurationDays { get; set; }
        public decimal Price { get; set; }
        public string Currency { get; set; } = "ILS";
        public bool IsActive { get; set; }
        public DateTime CreatedAt { get; set; }
        public ICollection<Subscription> Subscriptions { get; set; } = new List<Subscription>();
    }
}
