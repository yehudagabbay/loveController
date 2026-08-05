import { getSelectedCards, getSpecialCards } from '../../api/ApiTools'

export async function drawCardsForSelections({
  selections,
  lang,
  userId,
  filters,
  hasSpecialFilters,
}) {
  if (!hasSpecialFilters) {
    return getSelectedCards({ selections, lang, userId })
  }

  return getSpecialCards({
    selections,
    lang,
    userId,
    includeFavoriteCards: filters.liked || filters.loved,
    includeFeedbackCards: false,
    includeSharedCards: filters.shared,
  })
}
