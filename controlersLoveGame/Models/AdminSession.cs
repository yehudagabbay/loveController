namespace controlersLoveGame.Models
{
    public class AdminSession
    {
        public int SessionId { get; set; }
        public int AdminId { get; set; }
        public string TokenHash { get; set; } = string.Empty;
        public DateTime CreatedAt { get; set; }
        public DateTime ExpiresAt { get; set; }
        public bool IsActive { get; set; }

        public Admin? Admin { get; set; }
    }
}
