using System.ComponentModel.DataAnnotations;

namespace controlersLoveGame.Models
{
    public class SpecialCardRequest
    {
        public List<DrawCardRequest.CategoryLevelSelection>? Selections { get; set; }
        public string? Lang { get; set; }
        public int? UserID { get; set; }
        public bool IncludeFavoriteCards { get; set; }
        public bool IncludeFeedbackCards { get; set; }
        public bool IncludeSharedCards { get; set; }

        public bool HasAnyFilter() =>
            IncludeFavoriteCards || IncludeFeedbackCards || IncludeSharedCards;
    }
}
