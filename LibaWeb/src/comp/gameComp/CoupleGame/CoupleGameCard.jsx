import { useMemo, useState } from 'react'
import DeckCompleteAnimation from '../../animations/DeckCompleteAnimation'
import FlowerRoulette from '../../animations/FlowerRoulette'
import flowerLogo from '../../../image/logo/logo1.png'
import { markCardShared, submitCardFeedback, updateCardStatus } from '../../../api/ApiTools'
import { useLanguage } from '../../../localization/languageStore'
import './CoupleGameCard.css'

const EMPTY_DECK = []

function GameIcon({ name }) {
  const commonProps = {
    className: 'couple-game-icon',
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
          <path
            {...strokeProps}
            d="M7 11v9H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h3Z"
          />
          <path
            {...strokeProps}
            d="M7 11 11 3a2.2 2.2 0 0 1 3 2l-.7 4H19a3 3 0 0 1 2.9 3.7l-1.2 5A3 3 0 0 1 17.8 20H7"
          />
        </svg>
      )
    case 'favorite':
      return (
        <svg {...commonProps}>
          <path
            {...strokeProps}
            d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.6l-1-1a5.5 5.5 0 0 0-7.8 7.8l1 1L12 21l7.8-7.6 1-1a5.5 5.5 0 0 0 0-7.8Z"
          />
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
          <path
            {...strokeProps}
            d="m12 3 2.8 5.7 6.2.9-4.5 4.4 1.1 6.2L12 17.3l-5.6 2.9 1.1-6.2L3 9.6l6.2-.9L12 3Z"
          />
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

function formatBookLabel(bookId, request) {
  const numericId = Number(bookId)
  return request?.bookLabelById?.[numericId] || request?.bookSummary || `ספר ${numericId || '-'}`
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

export default function CoupleGameCard({ cards, request, userId, onBack }) {
  const { dir, t } = useLanguage()
  const [currentIndex, setCurrentIndex] = useState(0)
  const [revealedCards, setRevealedCards] = useState(() => new Set())
  const [cardActions, setCardActions] = useState({})
  const [actionMessage, setActionMessage] = useState('')
  const [actionError, setActionError] = useState('')
  const [busyAction, setBusyAction] = useState('')
  const [feedbackOpen, setFeedbackOpen] = useState(false)
  const [feedbackRating, setFeedbackRating] = useState(5)
  const [feedbackComment, setFeedbackComment] = useState('')
  const deck = useMemo(() => (Array.isArray(cards) ? cards : EMPTY_DECK), [cards])
  const totalCards = deck.length
  const currentCard = deck[currentIndex]
  const currentNumber = totalCards ? currentIndex + 1 : 0
  const currentCardKey = getCardId(currentCard, currentIndex)
  const normalizedUserId = userId || request?.userId || null
  const isCurrentCardRevealed = revealedCards.has(currentIndex)
  const currentActionState = cardActions[currentCardKey] || {}
  const currentLikeStatus = currentActionState.likeStatus ?? getInitialLikeStatus(currentCard)
  const gameCopy = request?.gameCopy || {}
  const isBookBasedDeck = Boolean(request?.isBookBased)
  const currentBookId = getDisplayMeta(currentCard, request, 'Book')
  const isCurrentCardCompleted =
    currentActionState.isCompleted ?? currentCard?.IsCompleted ?? currentCard?.isCompleted ?? false
  const canPersistCardActions = Boolean(normalizedUserId && currentCardKey)
  const canShareCard =
    isCurrentCardRevealed && !isTelevisionBrowser() && Boolean(navigator.share || navigator.clipboard)
  const isDeckComplete = totalCards > 0 && currentIndex === totalCards - 1 && isCurrentCardRevealed

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

  const nextCard = () => {
    setCurrentIndex((index) => Math.min(index + 1, totalCards - 1))
  }

  const previousCard = () => {
    setCurrentIndex((index) => Math.max(index - 1, 0))
  }

  const persistCardStatus = async ({ likeStatus = currentLikeStatus, isCompleted = isCurrentCardCompleted }) => {
    if (!canPersistCardActions) {
      setActionError(t('coupleGame.actions.loginRequired'))
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
        setActionMessage(t('coupleGame.actions.saved'))
      }
    } catch {
      setActionError(t('coupleGame.actions.saveFailed'))
    } finally {
      setBusyAction('')
    }
  }

  const markCompleted = async () => {
    if (!canPersistCardActions) {
      setActionError(t('coupleGame.actions.loginRequired'))
      return
    }

    setActionMessage('')
    setActionError('')
    setBusyAction('done')

    try {
      const saved = await persistCardStatus({ isCompleted: true })

      if (saved) {
        setActionMessage(t('coupleGame.actions.doneSaved'))
      }
    } catch {
      setActionError(t('coupleGame.actions.saveFailed'))
    } finally {
      setBusyAction('')
    }
  }

  const openFeedback = () => {
    if (!canPersistCardActions) {
      setActionError(t('coupleGame.actions.loginRequired'))
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
      setActionMessage(t('coupleGame.actions.ratingSaved'))
    } catch {
      setActionError(t('coupleGame.actions.feedbackFailed'))
    } finally {
      setBusyAction('')
    }
  }

  const shareCard = async () => {
    if (!canShareCard) {
      return
    }

    const shareText = getCardText(currentCard)
    setBusyAction('share')
    setActionMessage('')
    setActionError('')

    try {
      if (navigator.share) {
        await navigator.share({
          title: t('common.brand'),
          text: shareText,
        })
      } else {
        await navigator.clipboard.writeText(shareText)
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

      setActionMessage(t('coupleGame.actions.shared'))
    } catch {
      setActionError(t('coupleGame.actions.shareFailed'))
    } finally {
      setBusyAction('')
    }
  }

  if (!totalCards) {
    return (
      <main className="couple-game-page" dir={dir}>
        <section className="couple-game-empty">
          <FlowerRoulette size="clamp(170px, 18vw, 320px)" tapToSpin />
          <div>
            <p className="couple-game-kicker">{t('coupleGame.emptyEyebrow')}</p>
            <h1>{t('coupleGame.emptyTitle')}</h1>
            <p>{t('coupleGame.emptyText')}</p>
            <button type="button" onClick={onBack}>
              <GameIcon name="back" />
              {t('coupleGame.backToSelect')}
            </button>
          </div>
        </section>
      </main>
    )
  }

  return (
    <main className="couple-game-page" dir={dir}>
      <section className="couple-game-stage" aria-labelledby="couple-game-title">
        <div className="couple-game-side">
          <p className="couple-game-kicker">{gameCopy.eyebrow || t('coupleGame.eyebrow')}</p>
          <h1 id="couple-game-title">{gameCopy.title || t('coupleGame.title')}</h1>
          <p>{gameCopy.subtitle || t('coupleGame.subtitle')}</p>

          <div className="couple-game-stats" aria-label={t('coupleGame.deckAria')}>
            <span>{t('coupleGame.progress', { current: currentNumber, total: totalCards })}</span>
            <span>{t('coupleGame.selections', { count: request?.selections?.length || 0 })}</span>
          </div>

          <FlowerRoulette size="clamp(120px, 12vw, 220px)" tapToSpin />
        </div>

        <div
          className={`couple-game-card-shell ${isCurrentCardRevealed ? 'is-revealed' : ''}`}
          role="button"
          tabIndex={0}
          aria-label={t('coupleGame.flipCard')}
          onClick={revealCurrentCard}
          onKeyDown={handleCardKeyDown}
        >
          <div className="couple-game-card-inner">
            <article className="couple-game-card couple-game-card-front">
              <div className="couple-game-card-top">
                <span>
                  {t('coupleGame.cardNumber', { current: currentNumber, total: totalCards })}
                </span>
                <span>{t('coupleGame.cardId', { id: currentCardKey })}</span>
              </div>

              <p className="couple-game-card-text">{getCardText(currentCard)}</p>

              <div className="couple-game-card-meta">
                {isBookBasedDeck ? (
                  <span>
                    ספר: {formatBookLabel(currentBookId, request)}
                  </span>
                ) : null}
                <span>
                  {t('coupleGame.category', {
                    value: getCardMeta(currentCard, 'Category') ?? t('coupleGame.unknown'),
                  })}
                </span>
                <span>
                  {t('coupleGame.level', {
                    value: getCardMeta(currentCard, 'Level') ?? t('coupleGame.unknown'),
                  })}
                </span>
              </div>
            </article>

            <div className="couple-game-card couple-game-card-back">
              <span>{t('coupleGame.cardNumber', { current: currentNumber, total: totalCards })}</span>
              <img src={flowerLogo} alt={t('common.flowerLogo')} draggable="false" />
              <p>{t('coupleGame.flipCard')}</p>
            </div>
          </div>
        </div>
      </section>

      <section className="couple-game-controls" aria-label={t('coupleGame.controlsAria')}>
        <button type="button" className="secondary-game-button" onClick={onBack}>
          <GameIcon name="back" />
          {t('coupleGame.backToSelect')}
        </button>
        <div>
          <button type="button" onClick={previousCard} disabled={currentIndex === 0}>
            <GameIcon name="previous" />
            {t('coupleGame.previous')}
          </button>
          <button
            type="button"
            onClick={nextCard}
            disabled={!isCurrentCardRevealed || currentIndex === totalCards - 1}
          >
            <GameIcon name="next" />
            {t('coupleGame.next')}
          </button>
        </div>
      </section>

      {isCurrentCardRevealed ? (
        <section className="couple-card-actions" aria-label={t('coupleGame.actions.aria')}>
          <button
            type="button"
            className={currentLikeStatus === 1 ? 'active' : ''}
            onClick={() => saveLikeStatus(1, 'like')}
            disabled={busyAction === 'like'}
          >
            <GameIcon name="like" />
            {t('coupleGame.actions.like')}
          </button>
          <button
            type="button"
            className={currentLikeStatus === 2 ? 'active favorite' : 'favorite'}
            onClick={() => saveLikeStatus(2, 'favorite')}
            disabled={busyAction === 'favorite'}
          >
            <GameIcon name="favorite" />
            {t('coupleGame.actions.favorite')}
          </button>
          <button
            type="button"
            className={isCurrentCardCompleted ? 'active done' : 'done'}
            onClick={markCompleted}
            disabled={busyAction === 'done'}
          >
            <GameIcon name="done" />
            {t('coupleGame.actions.done')}
          </button>
          <button
            type="button"
            className="rate"
            onClick={openFeedback}
            disabled={busyAction === 'feedback'}
          >
            <GameIcon name="rate" />
            {t('coupleGame.actions.rate')}
          </button>
          {canShareCard ? (
            <button
              type="button"
              className="share"
              onClick={shareCard}
              disabled={busyAction === 'share'}
            >
              <GameIcon name="share" />
              {t('coupleGame.actions.share')}
            </button>
          ) : null}
        </section>
      ) : null}

      {actionMessage ? <p className="couple-action-message">{actionMessage}</p> : null}
      {actionError ? <p className="couple-action-error">{actionError}</p> : null}

      {isDeckComplete ? (
        <DeckCompleteAnimation
          title={gameCopy.completeTitle || t('coupleGame.complete.title')}
          text={gameCopy.completeText || t('coupleGame.complete.text')}
          actionLabel={gameCopy.completeAction || t('coupleGame.complete.action')}
          onAction={onBack}
        />
      ) : null}

      {feedbackOpen ? (
        <div className="couple-feedback-overlay" role="dialog" aria-modal="true">
          <form className="couple-feedback-modal" onSubmit={submitFeedback}>
            <h2>{t('coupleGame.feedback.title')}</h2>
            <p>{t('coupleGame.feedback.subtitle')}</p>

            <div className="couple-rating-options">
              {[1, 2, 3, 4, 5].map((rating) => (
                <button
                  key={rating}
                  type="button"
                  className={feedbackRating === rating ? 'selected' : ''}
                  onClick={() => setFeedbackRating(rating)}
                  aria-label={t('coupleGame.feedback.ratingAria', { rating })}
                >
                  {rating}
                </button>
              ))}
            </div>

            <label>
              <span>{t('coupleGame.feedback.comment')}</span>
              <textarea
                value={feedbackComment}
                onChange={(event) => setFeedbackComment(event.target.value.slice(0, 300))}
                placeholder={t('coupleGame.feedback.placeholder')}
              />
            </label>

            <div className="couple-feedback-buttons">
              <button
                type="button"
                className="secondary-game-button"
                onClick={() => setFeedbackOpen(false)}
              >
                <GameIcon name="close" />
                {t('coupleGame.feedback.cancel')}
              </button>
              <button type="submit" disabled={busyAction === 'feedback'}>
                <GameIcon name="save" />
                {busyAction === 'feedback'
                  ? t('coupleGame.feedback.saving')
                  : t('coupleGame.feedback.save')}
              </button>
            </div>
          </form>
        </div>
      ) : null}
    </main>
  )
}
