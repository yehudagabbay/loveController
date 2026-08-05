import { useMemo, useState } from 'react'
import FlowerRoulette from '../../animations/FlowerRoulette'
import { drawCardsForSelections } from '../specialCardDraw'
import { useLanguage } from '../../../localization/languageStore'
import './CoupleGameSelectCard.css'

const categoryConfig = [
  { key: 'connection', categoryId: 1, icon: 'spark' },
  { key: 'fun', categoryId: 2, icon: 'smile' },
  { key: 'passion', categoryId: 3, icon: 'flame' },
]

const levels = [1, 2, 3]

function CategoryIcon({ name }) {
  const commonProps = {
    className: 'couple-category-icon',
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

  if (name === 'flame') {
    return (
      <svg {...commonProps}>
        <path
          {...strokeProps}
          d="M12 22c4.2 0 7-2.9 7-7.1 0-3.4-2.1-5.8-4-7.7-.7 2.5-2 3.6-3.2 4.4.2-3.2-1.1-5.8-3.8-8.6C8 7.4 5 9.7 5 14.9 5 19.1 7.8 22 12 22Z"
        />
        <path {...strokeProps} d="M12 18c1.5 0 2.5-1 2.5-2.5 0-1.1-.7-2-1.6-2.8-.3.9-.8 1.4-1.3 1.8.1-1.2-.4-2.2-1.3-3.2-.1 1.7-.8 2.6-.8 4.2C9.5 17 10.5 18 12 18Z" />
      </svg>
    )
  }

  if (name === 'smile') {
    return (
      <svg {...commonProps}>
        <circle {...strokeProps} cx="12" cy="12" r="9" />
        <path {...strokeProps} d="M8 14s1.3 2 4 2 4-2 4-2" />
        <path {...strokeProps} d="M9 9h.01" />
        <path {...strokeProps} d="M15 9h.01" />
      </svg>
    )
  }

  return (
    <svg {...commonProps}>
      <path {...strokeProps} d="M12 3v4" />
      <path {...strokeProps} d="M12 17v4" />
      <path {...strokeProps} d="M3 12h4" />
      <path {...strokeProps} d="M17 12h4" />
      <path {...strokeProps} d="m5.6 5.6 2.8 2.8" />
      <path {...strokeProps} d="m15.6 15.6 2.8 2.8" />
      <path {...strokeProps} d="m18.4 5.6-2.8 2.8" />
      <path {...strokeProps} d="m8.4 15.6-2.8 2.8" />
    </svg>
  )
}

function FilterIcon({ name }) {
  const commonProps = {
    className: 'couple-filter-icon',
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

  if (name === 'loved') {
    return (
      <svg {...commonProps}>
        <path
          {...strokeProps}
          d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.6l-1-1a5.5 5.5 0 0 0-7.8 7.8l1 1L12 21l7.8-7.6 1-1a5.5 5.5 0 0 0 0-7.8Z"
        />
      </svg>
    )
  }

  if (name === 'shared') {
    return (
      <svg {...commonProps}>
        <path {...strokeProps} d="M4 12v7a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-7" />
        <path {...strokeProps} d="M12 16V4" />
        <path {...strokeProps} d="m7 9 5-5 5 5" />
      </svg>
    )
  }

  return (
    <svg {...commonProps}>
      <path {...strokeProps} d="M7 11v9H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h3Z" />
      <path
        {...strokeProps}
        d="M7 11 11 3a2.2 2.2 0 0 1 3 2l-.7 4H19a3 3 0 0 1 2.9 3.7l-1.2 5A3 3 0 0 1 17.8 20H7"
      />
    </svg>
  )
}

export default function CoupleGameSelectCard({ userId, onDrawCards }) {
  const { dir, lang, t } = useLanguage()
  const [isDrawing, setIsDrawing] = useState(false)
  const [drawError, setDrawError] = useState('')
  const [selectedCategories, setSelectedCategories] = useState(() => {
    return categoryConfig.reduce((acc, category) => {
      acc[category.key] = {
        categoryId: category.categoryId,
        levels: [],
      }

      return acc
    }, {})
  })

  const [filters, setFilters] = useState({
    liked: false,
    loved: false,
    shared: false,
  })
  const [playStyle, setPlayStyle] = useState('deck')

  const toggleLevel = (categoryKey, levelId) => {
    setSelectedCategories((prev) => {
      const currentLevels = prev[categoryKey].levels
      const isSelected = currentLevels.includes(levelId)
      const updatedLevels = isSelected
        ? currentLevels.filter((id) => id !== levelId)
        : [...currentLevels, levelId]

      return {
        ...prev,
        [categoryKey]: {
          ...prev[categoryKey],
          levels: updatedLevels,
        },
      }
    })
  }

  const toggleAllLevels = (categoryKey) => {
    setSelectedCategories((prev) => {
      const currentLevels = prev[categoryKey].levels
      const allLevelsSelected = currentLevels.length === levels.length

      return {
        ...prev,
        [categoryKey]: {
          ...prev[categoryKey],
          levels: allLevelsSelected ? [] : levels,
        },
      }
    })
  }

  const toggleFilter = (filterName) => {
    setFilters((prev) => ({
      ...prev,
      [filterName]: !prev[filterName],
    }))
  }

  const selections = useMemo(() => {
    const result = []

    Object.values(selectedCategories).forEach((category) => {
      category.levels.forEach((levelId) => {
        result.push({
          ModeID: 1,
          CategoryID: category.categoryId,
          LevelID: levelId,
          NumberOfCards: 5,
        })
      })
    })

    return result
  }, [selectedCategories])

  const hasSpecialFilters = filters.liked || filters.loved || filters.shared
  const requestSelections = useMemo(() => {
    if (selections.length > 0 || !hasSpecialFilters) {
      return selections
    }

    const result = []

    categoryConfig.forEach((category) => {
      levels.forEach((levelId) => {
        result.push({
          ModeID: 1,
          CategoryID: category.categoryId,
          LevelID: levelId,
          NumberOfCards: 5,
        })
      })
    })

    return result
  }, [hasSpecialFilters, selections])

  const canDrawCards = requestSelections.length > 0

  const handleDrawCards = async () => {
    if (!canDrawCards) {
      alert(t('coupleSelect.alert'))
      return
    }

    setIsDrawing(true)
    setDrawError('')

    const drawCardsRequest = {
      gameMode: 'couple',
      playStyle,
      selections: requestSelections,
      filters,
      userId,
    }

    try {
      const result = await drawCardsForSelections({
        selections: requestSelections,
        lang,
        userId,
        filters,
        hasSpecialFilters,
      })

      const cards = Array.isArray(result.data) ? result.data : []

      if (!result.response.ok || cards.length === 0) {
        const message =
          result.response.status === 401
            ? t('coupleGame.actions.loginRequired')
            : result.response.status === 404
            ? t('coupleSelect.messages.noCards')
            : t('coupleSelect.messages.serverError', { status: result.response.status })

        setDrawError(message)
        return
      }

      onDrawCards?.({ ...drawCardsRequest, cards })
    } catch (error) {
      setDrawError(
        error?.name === 'AbortError'
          ? t('coupleSelect.messages.timeout')
          : t('coupleSelect.messages.network'),
      )
    } finally {
      setIsDrawing(false)
    }
  }

  return (
    <main className="couple-select-page" dir={dir}>
      <div className="couple-atmosphere" aria-hidden="true">
        <div className="couple-atmosphere-ring" />
        <div className="couple-atmosphere-light light-one" />
        <div className="couple-atmosphere-light light-two" />
      </div>

      <section className="couple-hero-panel" aria-labelledby="couple-select-title">
        <div className="couple-hero-copy">
          <p className="couple-select-kicker">{t('coupleSelect.eyebrow')}</p>
          <h1 id="couple-select-title">{t('coupleSelect.title')}</h1>
          <p>{t('coupleSelect.subtitle')}</p>
        </div>

        <div className="couple-hero-flower">
          <FlowerRoulette size="clamp(150px, 14vw, 260px)" tapToSpin />
        </div>
      </section>

      <section className="couple-workspace" aria-label={t('coupleSelect.moodTitle')}>
        <div className="couple-category-area">
          <div className="couple-section-heading">
            <h2>{t('coupleSelect.moodTitle')}</h2>
            <p>{t('coupleSelect.moodText')}</p>
          </div>

          <section className="couple-category-grid">
            {categoryConfig.map((category, index) => {
              const currentCategory = selectedCategories[category.key]
              const allLevelsSelected = currentCategory.levels.length === levels.length

              return (
                <article
                  key={category.key}
                  className={`couple-category-card couple-category-${category.key}`}
                  style={{ '--card-index': index }}
                >
                  <div className="category-card-top">
                    <div className="category-card-heading">
                      <span className="category-icon-shell">
                        <CategoryIcon name={category.icon} />
                      </span>
                      <span className="category-accent">
                        {t(`coupleSelect.categories.${category.key}.accent`)}
                      </span>
                    </div>
                    <h2>{t(`coupleSelect.categories.${category.key}.title`)}</h2>
                    <p>{t(`coupleSelect.categories.${category.key}.description`)}</p>
                  </div>

                  <div className="level-buttons">
                    {levels.map((levelId) => {
                      const isSelected = currentCategory.levels.includes(levelId)

                      return (
                        <button
                          type="button"
                          key={levelId}
                          className={`level-button ${isSelected ? 'selected' : ''}`}
                          onClick={() => toggleLevel(category.key, levelId)}
                        >
                          <span>{t(`coupleSelect.levels.${levelId}.label`)}</span>
                          <small>{t(`coupleSelect.levels.${levelId}.description`)}</small>
                        </button>
                      )
                    })}
                  </div>

                  <button
                    type="button"
                    className={`select-all-button ${allLevelsSelected ? 'selected' : ''}`}
                    onClick={() => toggleAllLevels(category.key)}
                  >
                    {allLevelsSelected ? t('coupleSelect.allSelected') : t('coupleSelect.selectAll')}
                  </button>
                </article>
              )
            })}
          </section>

          <section className="status-filter-card">
            <div>
              <h2>{t('coupleSelect.filtersTitle')}</h2>
              <p>{t('coupleSelect.filtersText')}</p>
            </div>

            <div className="status-filter-options">
              {Object.keys(filters).map((filterName) => (
                <button
                  key={filterName}
                  type="button"
                  className={filters[filterName] ? 'filter-selected' : ''}
                  onClick={() => toggleFilter(filterName)}
                >
                  <FilterIcon name={filterName} />
                  {t(`coupleSelect.filters.${filterName}`)}
                </button>
              ))}
            </div>
          </section>

          <section className="couple-play-style-card">
            <div>
              <h2>{t('coupleSelect.playStyle.title')}</h2>
              <p>{t('coupleSelect.playStyle.text')}</p>
            </div>

            <div className="couple-play-style-options">
              {['deck', 'roulette'].map((style) => (
                <button
                  key={style}
                  type="button"
                  className={playStyle === style ? 'selected' : ''}
                  onClick={() => setPlayStyle(style)}
                >
                  <strong>{t(`coupleSelect.playStyle.${style}.title`)}</strong>
                  <span>{t(`coupleSelect.playStyle.${style}.text`)}</span>
                </button>
              ))}
            </div>
          </section>
        </div>

        <aside className="couple-mood-panel">
          <div>
            <h2>{t('coupleSelect.summaryTitle')}</h2>
            <p>
              {canDrawCards
                ? t('coupleSelect.summaryText', { count: requestSelections.length })
                : t('coupleSelect.emptyText')}
            </p>
          </div>

          <div className="couple-summary-meter" aria-hidden="true">
            <span style={{ '--summary-fill': `${Math.min(100, requestSelections.length * 12)}%` }} />
          </div>

          {drawError ? <p className="couple-draw-error">{drawError}</p> : null}
        </aside>
      </section>

      <section className="couple-start-zone" aria-label={t('coupleSelect.start')}>
        <button
          type="button"
          className="start-game-button"
          onClick={handleDrawCards}
          disabled={!canDrawCards || isDrawing}
        >
          {isDrawing ? t('coupleSelect.loading') : t('coupleSelect.start')}
        </button>
      </section>
    </main>
  )
}
