namespace controlersLoveGame.Models.AdminCards
{
    public class AdminCardUpdateRequest
    {
        public int CardID { get; set; }
        public int CategoryID { get; set; }
        public int LevelID { get; set; }
        public int ModeID { get; set; }
        public bool IsActive { get; set; }
        public string? CardDescription { get; set; }
        public List<AdminCardTranslationInput>? Translations { get; set; }
    }
}
