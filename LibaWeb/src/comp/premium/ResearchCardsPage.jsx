import { useMemo, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import DeckCompleteAnimation from '../animations/DeckCompleteAnimation'
import { markCardShared, submitCardFeedback, updateCardStatus } from '../../api/ApiTools'
import { useLanguage } from '../../localization/languageStore'
import flowerLogo from '../../image/logo/logo1.png'
import './ResearchCardsPage.css'

const EMPTY_CARDS = []

const BOOK_LABELS = {
  1: '7 העקרונות',
  2: 'Supercommunicators',
  3: 'The Art of Gathering',
  4: 'Men Are From Mars',
  10: 'Come As You Are',
  20: '5 שפות לאהבה',
}

const CATEGORY_LABELS_BY_TYPE = {
  couples: {
    1: 'היכרות',
    2: 'כיף וצחוקים',
    3: 'תשוקה ואינטימיות',
  },
  family: {
    1: 'סיפורים משפחתיים',
    2: 'צחוק ומשחק',
    3: 'קרבה והקשבה',
  },
  friends: {
    1: 'היכרות ופתיחה',
    2: 'כיף ואתגרים',
    3: 'אמון ועומק',
  },
}

const LEVEL_LABELS = {
  1: 'רמה 1',
  2: 'רמה 2',
  3: 'רמה 3',
}

function ResearchIcon({ name }) {
  const commonProps = {
    className: 'research-card-icon',
    viewBox: '0 0 24 24',
    fill: 'none',
    xmlns: 'http://www.w3.org/2000/svg',
    'aria-hidden': 'true',
    focusable: 'false',
  }

  const strokeProps = {
    stroke: 'currentColor',
    strokeWidth: 2,
    strokeLinecap: 'round',
    strokeLinejoin: 'round',
  }

  switch (name) {
    case 'back':
      return (
        <svg {...commonProps}>
          <path {...strokeProps} d="M19 12H5" />
          <path {...strokeProps} d="m12 19-7-7 7-7" />
        </svg>
      )
    case 'previous':
      return (
        <svg {...commonProps}>
          <path {...strokeProps} d="m15 18-6-6 6-6" />
        </svg>
      )
    case 'next':
      return (
        <svg {...commonProps}>
          <path {...strokeProps} d="m9 18 6-6-6-6" />
        </svg>
      )
    case 'like':
      return (
        <svg {...commonProps}>
          <path {...strokeProps} d="M7 11v9H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h3Z" />
          <path {...strokeProps} d="M7 11 11 3a2.2 2.2 0 0 1 3 2l-.7 4H19a3 3 0 0 1 2.9 3.7l-1.2 5A3 3 0 0 1 17.8 20H7" />
        </svg>
      )
    case 'favorite':
      return (
        <svg {...commonProps}>
          <path {...strokeProps} d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.6l-1-1a5.5 5.5 0 0 0-7.8 7.8l1 1L12 21l7.8-7.6 1-1a5.5 5.5 0 0 0 0-7.8Z" />
        </svg>
      )
    case 'done':
      return (
        <svg {...commonProps}>
          <path {...strokeProps} d="M20 6 9 17l-5-5" />
          <path {...strokeProps} d="M19 20h-7" />
        </svg>
      )
    case 'rate':
      return (
        <svg {...commonProps}>
          <path {...strokeProps} d="m12 3 2.8 5.7 6.2.9-4.5 4.4 1.1 6.2L12 17.3l-5.6 2.9 1.1-6.2L3 9.6l6.2-.9L12 3Z" />
        </svg>
      )
    case 'share':
      return (
        <svg {...commonProps}>
          <path {...strokeProps} d="M4 12v7a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-7" />
          <path {...strokeProps} d="M12 16V4" />
          <path {...strokeProps} d="m7 9 5-5 5 5" />
        </svg>
      )
    case 'save':
      return (
        <svg {...commonProps}>
          <path {...strokeProps} d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2Z" />
          <path {...strokeProps} d="M17 21v-8H7v8" />
          <path {...strokeProps} d="M7 3v5h8" />
        </svg>
      )
    case 'close':
      return (
        <svg {...commonProps}>
          <path {...strokeProps} d="M18 6 6 18" />
          <path {...strokeProps} d="m6 6 12 12" />
        </svg>
      )
    default:
      return null
  }
}

function getCardId(card, index) {
  return card?.CardID ?? card?.cardID ?? card?.cardId ?? card?.id ?? index + 1
}

function getCardText(card) {
  return (
    card?.CardDescription ??
    card?.cardDescription ??
    card?.CardText ??
    card?.cardText ??
    card?.Question ??
    card?.question ??
    card?.Text ??
    card?.text ??
    ''
  )
}

function getCardMeta(card, key) {
  const upperKey = `${key}ID`
  const lowerKey = `${key.toLowerCase()}ID`
  const camelKey = `${key.toLowerCase()}Id`

  return card?.[upperKey] ?? card?.[lowerKey] ?? card?.[camelKey] ?? null
}

function getFallbackSelectionValue(request, key) {
  const selections = Array.isArray(request?.selections) ? request.selections : []
  const values = new Set(
    selections
      .map((selection) => getCardMeta(selection, key))
      .filter((value) => value !== null && value !== undefined && value !== ''),
  )

  return values.size === 1 ? [...values][0] : null
}

function getDisplayMeta(card, request, key) {
  return getCardMeta(card, key) ?? getFallbackSelectionValue(request, key)
}

function formatBookLabel(bookId) {
  const numericId = Number(bookId)
  return BOOK_LABELS[numericId] || `ספר ${numericId || '-'}`
}

function formatCategoryLabel(categoryId, type) {
  const numericId = Number(categoryId)
  return CATEGORY_LABELS_BY_TYPE[type]?.[numericId] || `ענף ${numericId || '-'}`
}

function formatLevelLabel(levelId) {
  const numericId = Number(levelId)
  return LEVEL_LABELS[numericId] || `רמה ${numericId || '-'}`
}

function getInitialLikeStatus(card) {
  return card?.LikeStatus ?? card?.likeStatus ?? 0
}

function isTelevisionBrowser() {
  if (typeof navigator === 'undefined') {
    return false
  }

  return /smart-tv|smarttv|tizen|webos|netcast|appletv|android tv|googletv|hbbtv/i.test(
    navigator.userAgent,
  )
}

export default function ResearchCardsPage({ userId }) {
  const navigate = useNavigate()
  const location = useLocation()
  const { dir, t } = useLanguage()
  const cards = useMemo(
    () => (Array.isArray(location.state?.cards) ? location.state.cards : EMPTY_CARDS),
    [location.state?.cards],
  )
  const request = location.state?.request || {}
  const normalizedUserId = userId || request.userId || null
  const [currentIndex, setCurrentIndex] = useState(0)
  const [revealedCards, setRevealedCards] = useState(() => new Set())
  const [cardActions, setCardActions] = useState({})
  const [actionMessage, setActionMessage] = useState('')
  const [actionError, setActionError] = useState('')
  const [busyAction, setBusyAction] = useState('')
  const [feedbackOpen, setFeedbackOpen] = useState(false)
  const [feedbackRating, setFeedbackRating] = useState(5)
  const [feedbackComment, setFeedbackComment] = useState('')
  const currentCard = cards[currentIndex]
  const totalCards = cards.length
  const currentNumber = totalCards ? currentIndex + 1 : 0
  const currentCardKey = getCardId(currentCard, currentIndex)
  const currentCardText = getCardText(currentCard)
  const currentBookId = getDisplayMeta(currentCard, request, 'Book')
  const currentCategoryId = getDisplayMeta(currentCard, request, 'Category')
  const currentLevelId = getDisplayMeta(currentCard, request, 'Level')
  const isCurrentCardRevealed = revealedCards.has(currentIndex)
  const currentActionState = cardActions[currentCardKey] || {}
  const currentLikeStatus = currentActionState.likeStatus ?? getInitialLikeStatus(currentCard)
  const isCurrentCardCompleted =
    currentActionState.isCompleted ?? currentCard?.IsCompleted ?? currentCard?.isCompleted ?? false
  const canPersistCardActions = Boolean(normalizedUserId && currentCardKey)
  const canShareCard =
    isCurrentCardRevealed &&
    !isTelevisionBrowser() &&
    typeof navigator !== 'undefined' &&
    Boolean(navigator.share || navigator.clipboard)
  const isDeckComplete = totalCards > 0 && currentIndex === totalCards - 1 && isCurrentCardRevealed

  const goBack = () => {
    navigate('/research')
  }

  const startNewResearch = () => {
    navigate('/research', { replace: true })
  }

  const revealCurrentCard = () => {
    setRevealedCards((current) => {
      if (current.has(currentIndex)) {
        return current
      }

      const updated = new Set(current)
      updated.add(currentIndex)
      return updated
    })
  }

  const handleCardKeyDown = (event) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault()
      revealCurrentCard()
    }
  }

  const previousCard = () => {
    setCurrentIndex((index) => Math.max(index - 1, 0))
  }

  const nextCard = () => {
    setCurrentIndex((index) => Math.min(index + 1, totalCards - 1))
  }

  const persistCardStatus = async ({ likeStatus = currentLikeStatus, isCompleted = isCurrentCardCompleted }) => {
    if (!canPersistCardActions) {
      setActionError('כדי לשמור פעולה על כרטיס צריך משתמש מחובר.')
      return false
    }

    const result = await updateCardStatus({
      userId: normalizedUserId,
      cardId: currentCardKey,
      likeStatus,
      isCompleted,
    })

    if (!result.response.ok) {
      throw new Error(result.raw || `HTTP ${result.response.status}`)
    }

    setCardActions((current) => ({
      ...current,
      [currentCardKey]: {
        ...current[currentCardKey],
        likeStatus,
        isCompleted,
      },
    }))

    return true
  }

  const saveLikeStatus = async (nextLikeStatus, actionKey) => {
    setActionMessage('')
    setActionError('')
    setBusyAction(actionKey)

    try {
      const resolvedLikeStatus = currentLikeStatus === nextLikeStatus ? 0 : nextLikeStatus
      const saved = await persistCardStatus({ likeStatus: resolvedLikeStatus })

      if (saved) {
        setActionMessage('נשמר')
      }
    } catch {
      setActionError('לא הצלחנו לשמור את הפעולה כרגע.')
    } finally {
      setBusyAction('')
    }
  }

  const markCompleted = async () => {
    setActionMessage('')
    setActionError('')
    setBusyAction('done')

    try {
      const saved = await persistCardStatus({ isCompleted: true })

      if (saved) {
        setActionMessage('סומן שבוצע')
      }
    } catch {
      setActionError('לא הצלחנו לשמור את הפעולה כרגע.')
    } finally {
      setBusyAction('')
    }
  }

  const openFeedback = () => {
    if (!canPersistCardActions) {
      setActionError('כדי לדרג כרטיס צריך משתמש מחובר.')
      return
    }

    setActionMessage('')
    setActionError('')
    setFeedbackOpen(true)
  }

  const submitFeedback = async (event) => {
    event.preventDefault()
    setBusyAction('feedback')
    setActionMessage('')
    setActionError('')

    try {
      const result = await submitCardFeedback({
        userId: normalizedUserId,
        cardId: currentCardKey,
        rating: feedbackRating,
        comment: feedbackComment,
      })

      if (!result.response.ok) {
        throw new Error(result.raw || `HTTP ${result.response.status}`)
      }

      setFeedbackOpen(false)
      setFeedbackComment('')
      setFeedbackRating(5)
      setActionMessage('הדירוג נשמר')
    } catch {
      setActionError('הדירוג לא נשמר.')
    } finally {
      setBusyAction('')
    }
  }

  const shareCard = async () => {
    if (!canShareCard) {
      return
    }

    setBusyAction('share')
    setActionMessage('')
    setActionError('')

    try {
      if (navigator.share) {
        await navigator.share({
          title: t('common.brand'),
          text: currentCardText,
        })
      } else {
        await navigator.clipboard.writeText(currentCardText)
      }

      if (canPersistCardActions) {
        const result = await markCardShared({
          userId: normalizedUserId,
          cardId: currentCardKey,
        })

        if (!result.response.ok) {
          throw new Error(result.raw || `HTTP ${result.response.status}`)
        }
      }

      setActionMessage('שותף')
    } catch {
      setActionError('לא הצלחנו לשתף את הכרטיס.')
    } finally {
      setBusyAction('')
    }
  }

  if (!totalCards) {
    return (
      <main className="research-cards-page" dir={dir}>
        <section className="research-cards-empty">
          <span>מחקר</span>
          <h1>לא נמצאו כרטיסים להצגה</h1>
          <p>אפשר לחזור לעץ הבחירה ולבדוק שהספר, הנושא והרמה קיימים במאגר.</p>
          <button type="button" onClick={goBack}>
            <ResearchIcon name="back" />
            חזרה למחקר
          </button>
        </section>
      </main>
    )
  }

  return (
    <main className="research-cards-page" dir={dir}>
      <section className="research-cards-shell" aria-labelledby="research-cards-title">
        <aside className="research-cards-side">
          <span>כרטיסי מחקר</span>
          <h1 id="research-cards-title">{request.label || 'מחקר'}</h1>
          <p>הכרטיסים נשלפו מהמאגר לפי הבחירות שבוצעו בעץ המחקר. חשפו כל כרטיס לפני המעבר לבא.</p>

          <div className="research-cards-stats">
            <strong>
              {currentIndex + 1}/{totalCards}
            </strong>
            <small>{request.summary || 'סט כרטיסים מותאם'}</small>
          </div>
        </aside>

        <div
          className={`research-card-shell ${isCurrentCardRevealed ? 'is-revealed' : ''}`}
          role="button"
          tabIndex={0}
          aria-label="חשיפת הכרטיס"
          onClick={revealCurrentCard}
          onKeyDown={handleCardKeyDown}
        >
          <div className="research-card-inner">
            <article className="research-card-display research-card-front" aria-live="polite">
              <div className="research-card-topline">
                <span>כרטיס {currentNumber}</span>
                <span>#{currentCardKey}</span>
              </div>

              <p>{currentCardText}</p>

              <div className="research-card-meta">
                <span title={`ספר ${currentBookId || '-'}`}>
                  <small>ספר</small>
                  {formatBookLabel(currentBookId)}
                </span>
                <span title={`ענף ${currentCategoryId || '-'}`}>
                  <small>ענף</small>
                  {formatCategoryLabel(currentCategoryId, request.type)}
                </span>
                <span title={`רמה ${currentLevelId || '-'}`}>
                  <small>רמה</small>
                  {formatLevelLabel(currentLevelId)}
                </span>
              </div>
            </article>

            <div className="research-card-display research-card-back">
              <span>
                {currentNumber}/{totalCards}
              </span>
              <img src={flowerLogo} alt="LIBA" draggable="false" />
              <p>לחצו לחשיפת הכרטיס</p>
            </div>
          </div>
        </div>
      </section>

      <section className="research-card-controls" aria-label="ניווט בין כרטיסי מחקר">
        <button type="button" className="secondary" onClick={goBack}>
          <ResearchIcon name="back" />
          חזרה למחקר
        </button>

        <div>
          <button type="button" onClick={previousCard} disabled={currentIndex === 0}>
            <ResearchIcon name="previous" />
            הקודם
          </button>
          <button type="button" onClick={nextCard} disabled={!isCurrentCardRevealed || currentIndex === totalCards - 1}>
            <ResearchIcon name="next" />
            הבא
          </button>
        </div>
      </section>

      {isCurrentCardRevealed ? (
        <section className="research-card-actions" aria-label="פעולות על כרטיס המחקר">
          <button
            type="button"
            className={currentLikeStatus === 1 ? 'active' : ''}
            onClick={() => saveLikeStatus(1, 'like')}
            disabled={busyAction === 'like'}
          >
            <ResearchIcon name="like" />
            אהבתי
          </button>
          <button
            type="button"
            className={currentLikeStatus === 2 ? 'active favorite' : 'favorite'}
            onClick={() => saveLikeStatus(2, 'favorite')}
            disabled={busyAction === 'favorite'}
          >
            <ResearchIcon name="favorite" />
            אהבתי במיוחד
          </button>
          <button
            type="button"
            className={isCurrentCardCompleted ? 'active done' : 'done'}
            onClick={markCompleted}
            disabled={busyAction === 'done'}
          >
            <ResearchIcon name="done" />
            סיימנו
          </button>
          <button type="button" className="rate" onClick={openFeedback} disabled={busyAction === 'feedback'}>
            <ResearchIcon name="rate" />
            דירוג
          </button>
          {canShareCard ? (
            <button type="button" className="share" onClick={shareCard} disabled={busyAction === 'share'}>
              <ResearchIcon name="share" />
              שיתוף
            </button>
          ) : null}
        </section>
      ) : null}

      {actionMessage ? <p className="research-action-message">{actionMessage}</p> : null}
      {actionError ? <p className="research-action-error">{actionError}</p> : null}

      {isDeckComplete ? (
        <DeckCompleteAnimation
          title="החפיסה הושלמה"
          text="עברתם על כל כרטיסי המחקר שנשלפו לבחירה הזו. אפשר לחזור עכשיו ולבנות בחירת מחקר חדשה."
          actionLabel="בחירת מחקר חדש"
          onAction={startNewResearch}
          dismissLabel="להישאר בכרטיסים"
        />
      ) : null}

      {feedbackOpen ? (
        <div className="research-feedback-overlay" role="dialog" aria-modal="true">
          <form className="research-feedback-modal" onSubmit={submitFeedback}>
            <h2>דירוג הכרטיס</h2>
            <p>הדירוג עוזר לנו להבין אילו כרטיסי מחקר עובדים טוב יותר.</p>

            <div className="research-rating-options">
              {[1, 2, 3, 4, 5].map((rating) => (
                <button
                  key={rating}
                  type="button"
                  className={feedbackRating === rating ? 'selected' : ''}
                  onClick={() => setFeedbackRating(rating)}
                  aria-label={`דירוג ${rating}`}
                >
                  {rating}
                </button>
              ))}
            </div>

            <label>
              <span>הערה קצרה</span>
              <textarea
                value={feedbackComment}
                onChange={(event) => setFeedbackComment(event.target.value.slice(0, 300))}
                placeholder="מה עבד טוב או מה כדאי לשפר?"
              />
            </label>

            <div className="research-feedback-buttons">
              <button type="button" className="secondary" onClick={() => setFeedbackOpen(false)}>
                <ResearchIcon name="close" />
                ביטול
              </button>
              <button type="submit" disabled={busyAction === 'feedback'}>
                <ResearchIcon name="save" />
                {busyAction === 'feedback' ? 'שומרים...' : 'שמירה'}
              </button>
            </div>
          </form>
        </div>
      ) : null}
    </main>
  )
}
