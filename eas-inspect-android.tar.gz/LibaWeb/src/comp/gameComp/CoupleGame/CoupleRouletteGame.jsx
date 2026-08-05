import { useMemo, useState } from 'react'
import DeckCompleteAnimation from '../../animations/DeckCompleteAnimation'
import flowerLogo from '../../../image/logo/logo1.png'
import { updateCardStatus } from '../../../api/ApiTools'
import { useLanguage } from '../../../localization/languageStore'
import './CoupleRouletteGame.css'

const EMPTY_DECK = []
const ROULETTE_SPIN_MS = 3600

const categoryKeys = {
  couple: {
    1: 'connection',
    2: 'fun',
    3: 'passion',
  },
  friends: {
    1: 'intro',
    2: 'fun',
    3: 'team',
  },
  family: {
    1: 'intro',
    2: 'fun',
    3: 'team',
  },
}

const rouletteConfigs = {
  couple: {
    selectionScope: 'coupleSelect',
    className: 'couple-roulette-theme',
  },
  friends: {
    selectionScope: 'friendsSelect',
    className: 'friends-roulette-theme',
  },
  family: {
    selectionScope: 'familySelect',
    className: 'family-roulette-theme',
  },
}

const segmentColors = {
  connection: ['#60a5fa', '#5eead4'],
  intro: ['#60a5fa', '#bfdbfe'],
  fun: ['#5eead4', '#fef08a'],
  passion: ['#fb7185', '#f9a8d4'],
  team: ['#fbbf24', '#86efac'],
}

const categorySymbols = {
  connection: 'C',
  intro: 'I',
  fun: 'F',
  passion: 'L',
  team: 'T',
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

function getInitialLikeStatus(card) {
  return card?.LikeStatus ?? card?.likeStatus ?? 0
}

function buildSegments(selections, t, gameType) {
  const unique = new Map()
  const config = rouletteConfigs[gameType] || rouletteConfigs.couple
  const keys = categoryKeys[gameType] || categoryKeys.couple

  selections.forEach((selection) => {
    const categoryId = Number(selection.CategoryID)
    const levelId = Number(selection.LevelID)
    const categoryKey = keys[categoryId] || keys[1]
    const key = `${categoryId}-${levelId}`

    if (!unique.has(key)) {
      unique.set(key, {
        key,
        categoryId,
        levelId,
        categoryKey,
        symbol: categorySymbols[categoryKey] || 'C',
        title: t(`${config.selectionScope}.categories.${categoryKey}.title`),
        level: t(`${config.selectionScope}.levels.${levelId}.label`),
      })
    }
  })

  return Array.from(unique.values())
}

function cardsForSegment(cards, segment, removedIds) {
  return cards.filter((card, index) => {
    const cardId = getCardId(card, index)

    return (
      !removedIds.has(cardId) &&
      Number(getCardMeta(card, 'Category')) === segment.categoryId &&
      Number(getCardMeta(card, 'Level')) === segment.levelId
    )
  })
}

function RouletteIcon({ name }) {
  const commonProps = {
    className: 'roulette-icon',
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

  if (name === 'heart') {
    return (
      <svg {...commonProps}>
        <path {...strokeProps} d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.6l-1-1a5.5 5.5 0 0 0-7.8 7.8L12 21l8.8-8.6a5.5 5.5 0 0 0 0-7.8Z" />
      </svg>
    )
  }

  if (name === 'check') {
    return (
      <svg {...commonProps}>
        <path {...strokeProps} d="M20 6 9 17l-5-5" />
      </svg>
    )
  }

  if (name === 'skip') {
    return (
      <svg {...commonProps}>
        <path {...strokeProps} d="M5 5v14l8-7-8-7Z" />
        <path {...strokeProps} d="M19 5v14" />
      </svg>
    )
  }

  if (name === 'back') {
    return (
      <svg {...commonProps}>
        <path {...strokeProps} d="M19 12H5" />
        <path {...strokeProps} d="m12 19-7-7 7-7" />
      </svg>
    )
  }

  return (
    <svg {...commonProps}>
      <path {...strokeProps} d="M7 11v9H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h3Z" />
      <path {...strokeProps} d="M7 11 11 3a2.2 2.2 0 0 1 3 2l-.7 4H19a3 3 0 0 1 2.9 3.7l-1.2 5A3 3 0 0 1 17.8 20H7" />
    </svg>
  )
}

export default function CoupleRouletteGame({ cards, request, userId, gameType = 'couple', onBack, onRegularDeck }) {
  const { dir, t } = useLanguage()
  const resolvedGameType = request?.gameMode || gameType
  const rouletteConfig = rouletteConfigs[resolvedGameType] || rouletteConfigs.couple
  const deck = useMemo(() => (Array.isArray(cards) ? cards : EMPTY_DECK), [cards])
  const segments = useMemo(
    () => buildSegments(request?.selections || [], t, resolvedGameType),
    [request?.selections, resolvedGameType, t],
  )
  const [removedIds, setRemovedIds] = useState(() => new Set())
  const [selectedSegment, setSelectedSegment] = useState(null)
  const [selectedCard, setSelectedCard] = useState(null)
  const [rotation, setRotation] = useState(0)
  const [spinning, setSpinning] = useState(false)
  const [spinStep, setSpinStep] = useState(0)
  const [revealed, setRevealed] = useState(false)
  const [cardActions, setCardActions] = useState({})
  const [busyAction, setBusyAction] = useState('')
  const [actionMessage, setActionMessage] = useState('')
  const [actionError, setActionError] = useState('')

  const activeSegments = useMemo(() => {
    return segments
      .map((segment) => ({
        ...segment,
        remaining: cardsForSegment(deck, segment, removedIds).length,
      }))
      .filter((segment) => segment.remaining > 0)
  }, [deck, removedIds, segments])

  const totalRemaining = activeSegments.reduce((sum, segment) => sum + segment.remaining, 0)
  const isDeckComplete = deck.length > 0 && totalRemaining === 0
  const currentCardKey = selectedCard ? getCardId(selectedCard, 0) : null
  const currentActionState = currentCardKey ? cardActions[currentCardKey] || {} : {}
  const currentLikeStatus = currentActionState.likeStatus ?? getInitialLikeStatus(selectedCard)
  const segmentSize = activeSegments.length > 0 ? 360 / activeSegments.length : 360
  const wheelBackground =
    activeSegments.length > 0
      ? `conic-gradient(from ${segmentSize / -2}deg, ${activeSegments
          .map((segment, index) => {
            const [startColor, endColor] = segmentColors[segment.categoryKey] || segmentColors.connection
            const start = index * segmentSize
            const end = (index + 1) * segmentSize

            return `${startColor} ${start}deg, ${endColor} ${start + 3}deg, ${endColor} ${end - 2}deg, rgba(255,255,255,0.7) ${end - 1}deg, rgba(255,255,255,0.7) ${end}deg`
          })
          .join(', ')})`
      : 'linear-gradient(135deg, #321522, #122835)'

  const spinRoulette = () => {
    if (spinning || activeSegments.length === 0) {
      return
    }

    setSpinning(true)
    setSpinStep(0)
    setRevealed(false)
    setSelectedCard(null)
    setActionMessage('')
    setActionError('')

    const nextSegmentIndex = Math.floor(Math.random() * activeSegments.length)
    const nextSegment = activeSegments[nextSegmentIndex]
    const segmentCards = cardsForSegment(deck, nextSegment, removedIds)
    const nextCard = segmentCards[Math.floor(Math.random() * segmentCards.length)]
    const fullTurns = (9 + Math.floor(Math.random() * 4)) * 360
    const nextRotation = Math.ceil(rotation / 360) * 360 + fullTurns - nextSegmentIndex * segmentSize

    setRotation(nextRotation)

    window.setTimeout(() => setSpinStep(1), 1200)
    window.setTimeout(() => setSpinStep(2), 2500)
    window.setTimeout(() => {
      setSelectedSegment(nextSegment)
      setSelectedCard(nextCard)
      setSpinning(false)
      setSpinStep(0)
    }, ROULETTE_SPIN_MS)
  }

  const persistCardStatus = async ({ likeStatus = currentLikeStatus, isCompleted = false }) => {
    if (!userId || !currentCardKey) {
      setActionError(t('coupleGame.actions.loginRequired'))
      return false
    }

    const result = await updateCardStatus({
      userId,
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
    setActionMessage('')
    setActionError('')
    setBusyAction('done')

    try {
      const saved = await persistCardStatus({ isCompleted: true })

      if (saved) {
        setRemovedIds((current) => new Set(current).add(currentCardKey))
        setSelectedCard(null)
        setSelectedSegment(null)
        setRevealed(false)
        setActionMessage(t('coupleRoulette.doneMessage'))
      }
    } catch {
      setActionError(t('coupleGame.actions.saveFailed'))
    } finally {
      setBusyAction('')
    }
  }

  const skipCard = () => {
    if (!currentCardKey || busyAction) {
      return
    }

    setRemovedIds((current) => new Set(current).add(currentCardKey))
    setSelectedCard(null)
    setSelectedSegment(null)
    setRevealed(false)
    setActionError('')
    setActionMessage(t('coupleRoulette.skipMessage'))
  }

  if (!deck.length) {
    return (
      <main className={`couple-roulette-page ${rouletteConfig.className}`} dir={dir}>
        <section className="roulette-empty">
          <h1>{t('coupleGame.emptyTitle')}</h1>
          <p>{t('coupleGame.emptyText')}</p>
          <button type="button" onClick={onBack}>
            <RouletteIcon name="back" />
            {t('coupleGame.backToSelect')}
          </button>
        </section>
      </main>
    )
  }

  return (
    <main className={`couple-roulette-page ${rouletteConfig.className}`} dir={dir}>
      <div className="roulette-atmosphere" aria-hidden="true">
        <span />
        <span />
        <span />
      </div>

      <section className="roulette-layout" aria-labelledby="couple-roulette-title">
        <div className="roulette-stage">
          <div className={`roulette-wheel-wrap ${spinning ? `is-spinning spin-step-${spinStep}` : ''}`}>
            <div className="roulette-pointer" aria-hidden="true" />
            <div className="roulette-speed-ring" aria-hidden="true" />
            <div
              className={`roulette-wheel ${spinning ? 'is-spinning' : ''}`}
              style={{
                '--roulette-bg': wheelBackground,
                '--roulette-rotation': `${rotation}deg`,
              }}
            >
              <div className="roulette-wheel-labels" aria-hidden="true">
                {activeSegments.map((segment, index) => (
                  <span
                    className={`roulette-wheel-label label-${segment.categoryKey}`}
                    key={segment.key}
                    style={{ '--label-angle': `${index * segmentSize}deg` }}
                  >
                    <strong>{segment.categoryKey.slice(0, 1).toUpperCase()}</strong>
                    <small>{segment.level}</small>
                  </span>
                ))}
              </div>

              <div className="roulette-wheel-core">
                <img src={flowerLogo} alt={t('common.flowerLogo')} draggable="false" />
              </div>
            </div>
          </div>

          <p className={`roulette-suspense ${spinning ? 'is-active' : ''}`}>
            {spinning ? t(`coupleRoulette.suspense.${spinStep}`) : t('coupleRoulette.suspense.ready')}
          </p>

          <div className={`roulette-result ${selectedSegment ? 'has-result' : 'is-empty'}`} aria-hidden={!selectedSegment}>
            {selectedSegment ? (
              <>
                <p>{t('coupleRoulette.selected')}</p>
                <h2>
                  {selectedSegment.title} | {selectedSegment.level}
                </h2>
              </>
            ) : null}
          </div>

          <button type="button" className="roulette-spin-button" onClick={spinRoulette} disabled={spinning || totalRemaining === 0}>
            <img src={flowerLogo} alt="" aria-hidden="true" draggable="false" />
            <span>{spinning ? t('coupleRoulette.spinning') : t('coupleRoulette.spin')}</span>
          </button>
        </div>

        <section className="roulette-card-panel">
          <div className="roulette-copy">
            <p className="roulette-kicker">{t('coupleRoulette.eyebrow')}</p>
            <h1 id="couple-roulette-title">{t('coupleRoulette.title')}</h1>
            <p>{t('coupleRoulette.subtitle')}</p>

            <div className="roulette-stats">
              <span>{t('coupleRoulette.remaining', { count: totalRemaining })}</span>
              <span>{t('coupleRoulette.segments', { count: activeSegments.length })}</span>
            </div>
          </div>

          <div className="roulette-card-zone">
            <div className={`roulette-card-frame ${selectedCard ? 'has-card' : 'is-waiting'}`}>
              <div className="roulette-waiting-card" aria-hidden={selectedCard ? 'true' : 'false'}>
                <img src={flowerLogo} alt={t('common.flowerLogo')} draggable="false" />
                <h2>{t('coupleRoulette.spin')}</h2>
                <p>{t('coupleRoulette.waitingText')}</p>
              </div>

              {selectedCard ? (
                <div
                  className={`roulette-card-shell ${revealed ? 'is-revealed' : ''}`}
                  role="button"
                  tabIndex={0}
                  aria-label={t('coupleGame.flipCard')}
                  onClick={() => setRevealed(true)}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter' || event.key === ' ') {
                      event.preventDefault()
                      setRevealed(true)
                    }
                  }}
                >
                  <div className="roulette-card-inner">
                    <article className="roulette-card roulette-card-front">
                      <p>{getCardText(selectedCard)}</p>
                    </article>
                    <div className="roulette-card roulette-card-back">
                      <img src={flowerLogo} alt={t('common.flowerLogo')} draggable="false" />
                      <span>{t('coupleGame.flipCard')}</span>
                    </div>
                  </div>
                </div>
              ) : null}
            </div>

            <div className={`roulette-actions ${revealed ? 'is-ready' : ''}`}>
              <button
                type="button"
                className={currentLikeStatus === 1 ? 'active' : ''}
                onClick={() => saveLikeStatus(1, 'like')}
                disabled={!revealed || busyAction === 'like'}
              >
                <RouletteIcon />
                {t('coupleGame.actions.like')}
              </button>
              <button
                type="button"
                className={currentLikeStatus === 2 ? 'active favorite' : 'favorite'}
                onClick={() => saveLikeStatus(2, 'favorite')}
                disabled={!revealed || busyAction === 'favorite'}
              >
                <RouletteIcon name="heart" />
                {t('coupleGame.actions.favorite')}
              </button>
              <button type="button" onClick={skipCard} disabled={!selectedCard || Boolean(busyAction)}>
                <RouletteIcon name="skip" />
                {t('coupleRoulette.skip')}
              </button>
              <button type="button" className="done" onClick={markCompleted} disabled={!revealed || busyAction === 'done'}>
                <RouletteIcon name="check" />
                {t('coupleGame.actions.done')}
              </button>
            </div>
          </div>

          <div className="roulette-action-status" aria-live="polite">
            {actionMessage ? <p className="roulette-action-message">{actionMessage}</p> : null}
            {actionError ? <p className="roulette-action-error">{actionError}</p> : null}
          </div>
        </section>
      </section>

      <section className="roulette-footer">
        <button type="button" className="roulette-secondary" onClick={onBack}>
          <RouletteIcon name="back" />
          {t('coupleGame.backToSelect')}
        </button>
        <button type="button" className="roulette-secondary" onClick={onRegularDeck}>
          {t('coupleRoulette.regularDeck')}
        </button>
      </section>

      {isDeckComplete ? (
        <DeckCompleteAnimation
          title={t('coupleGame.complete.title')}
          text={t('coupleGame.complete.text')}
          actionLabel={t('coupleGame.complete.action')}
          onAction={onBack}
        />
      ) : null}
    </main>
  )
}
