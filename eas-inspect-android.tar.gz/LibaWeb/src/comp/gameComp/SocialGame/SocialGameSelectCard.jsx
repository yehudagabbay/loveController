import { useMemo, useState } from 'react'
import FlowerRoulette from '../../animations/FlowerRoulette'
import { drawCardsForSelections } from '../specialCardDraw'
import { useLanguage } from '../../../localization/languageStore'
import './SocialGameSelectCard.css'

const levels = [1, 2, 3]

const gameConfigs = {
  friends: {
    modeId: 2,
    scope: 'friendsSelect',
    className: 'friends-select-page',
    categories: [
      { key: 'intro', categoryId: 1 },
      { key: 'fun', categoryId: 2 },
      { key: 'team', categoryId: 3 },
    ],
  },
  family: {
    modeId: 3,
    scope: 'familySelect',
    className: 'family-select-page',
    categories: [
      { key: 'intro', categoryId: 1 },
      { key: 'fun', categoryId: 2 },
      { key: 'team', categoryId: 3 },
    ],
  },
}

export default function SocialGameSelectCard({ gameType, userId, onDrawCards }) {
  const { dir, lang, t } = useLanguage()
  const config = gameConfigs[gameType] || gameConfigs.friends
  const [isDrawing, setIsDrawing] = useState(false)
  const [drawError, setDrawError] = useState('')
  const [playStyle, setPlayStyle] = useState('deck')
  const [selectedCategories, setSelectedCategories] = useState(() => {
    return config.categories.reduce((acc, category) => {
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

  const selections = useMemo(() => {
    const result = []

    Object.values(selectedCategories).forEach((category) => {
      category.levels.forEach((levelId) => {
        result.push({
          ModeID: config.modeId,
          CategoryID: category.categoryId,
          LevelID: levelId,
          NumberOfCards: 5,
        })
      })
    })

    return result
  }, [config.modeId, selectedCategories])

  const hasSpecialFilters = filters.liked || filters.loved || filters.shared
  const requestSelections = useMemo(() => {
    if (selections.length > 0 || !hasSpecialFilters) {
      return selections
    }

    const result = []

    config.categories.forEach((category) => {
      levels.forEach((levelId) => {
        result.push({
          ModeID: config.modeId,
          CategoryID: category.categoryId,
          LevelID: levelId,
          NumberOfCards: 5,
        })
      })
    })

    return result
  }, [config.categories, config.modeId, hasSpecialFilters, selections])

  const canDrawCards = requestSelections.length > 0

  const handleDrawCards = async () => {
    if (!canDrawCards) {
      alert(t(`${config.scope}.alert`))
      return
    }

    setIsDrawing(true)
    setDrawError('')

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
            ? t(`${config.scope}.messages.noCards`)
            : t(`${config.scope}.messages.serverError`, { status: result.response.status })

        setDrawError(message)
        return
      }

      onDrawCards?.({
        gameMode: gameType,
        selections: requestSelections,
        filters,
        userId,
        playStyle,
        cards,
      })
    } catch (error) {
      setDrawError(
        error?.name === 'AbortError'
          ? t(`${config.scope}.messages.timeout`)
          : t(`${config.scope}.messages.network`),
      )
    } finally {
      setIsDrawing(false)
    }
  }

  return (
    <main className={`social-select-page ${config.className}`} dir={dir}>
      <div className="social-select-atmosphere" aria-hidden="true">
        <span />
        <span />
        <span />
      </div>

      <section className="social-select-hero" aria-labelledby={`${gameType}-select-title`}>
        <div>
          <p className="social-select-kicker">{t(`${config.scope}.eyebrow`)}</p>
          <h1 id={`${gameType}-select-title`}>{t(`${config.scope}.title`)}</h1>
          <p>{t(`${config.scope}.subtitle`)}</p>
        </div>

        <div className="social-select-flower">
          <FlowerRoulette size="clamp(140px, 13vw, 240px)" tapToSpin />
        </div>
      </section>

      <section className="social-select-grid" aria-label={t(`${config.scope}.moodTitle`)}>
        <div className="social-category-stack">
          <div className="social-section-heading">
            <h2>{t(`${config.scope}.moodTitle`)}</h2>
            <p>{t(`${config.scope}.moodText`)}</p>
          </div>

          <div className="social-category-grid">
            {config.categories.map((category, index) => {
              const currentCategory = selectedCategories[category.key]
              const allLevelsSelected = currentCategory.levels.length === levels.length

              return (
                <article
                  key={category.key}
                  className={`social-category-card social-category-${category.key}`}
                  style={{ '--card-index': index }}
                >
                  <div className="social-card-top">
                    <span>{t(`${config.scope}.categories.${category.key}.accent`)}</span>
                    <h2>{t(`${config.scope}.categories.${category.key}.title`)}</h2>
                    <p>{t(`${config.scope}.categories.${category.key}.description`)}</p>
                  </div>

                  <div className="social-level-buttons">
                    {levels.map((levelId) => {
                      const isSelected = currentCategory.levels.includes(levelId)

                      return (
                        <button
                          type="button"
                          key={levelId}
                          className={isSelected ? 'selected' : ''}
                          onClick={() => toggleLevel(category.key, levelId)}
                        >
                          <span>{t(`${config.scope}.levels.${levelId}.label`)}</span>
                          <small>{t(`${config.scope}.levels.${levelId}.description`)}</small>
                        </button>
                      )
                    })}
                  </div>

                  <button
                    type="button"
                    className={`social-select-all ${allLevelsSelected ? 'selected' : ''}`}
                    onClick={() => toggleAllLevels(category.key)}
                  >
                    {allLevelsSelected ? t(`${config.scope}.allSelected`) : t(`${config.scope}.selectAll`)}
                  </button>
                </article>
              )
            })}
          </div>

          <section className="social-status-filter-card">
            <div>
              <h2>{t(`${config.scope}.filtersTitle`)}</h2>
              <p>{t(`${config.scope}.filtersText`)}</p>
            </div>

            <div className="social-filter-options">
              {Object.keys(filters).map((filterName) => (
                <button
                  key={filterName}
                  type="button"
                  className={filters[filterName] ? 'selected' : ''}
                  onClick={() =>
                    setFilters((prev) => ({
                      ...prev,
                      [filterName]: !prev[filterName],
                    }))
                  }
                >
                  {t(`${config.scope}.filters.${filterName}`)}
                </button>
              ))}
            </div>
          </section>

          <section className="social-play-style-card">
            <div>
              <h2>{t(`${config.scope}.playStyle.title`)}</h2>
              <p>{t(`${config.scope}.playStyle.text`)}</p>
            </div>

            <div className="social-play-style-options" aria-label={t(`${config.scope}.playStyle.title`)}>
              {['deck', 'roulette'].map((style) => (
                <button
                  type="button"
                  key={style}
                  className={playStyle === style ? 'selected' : ''}
                  onClick={() => setPlayStyle(style)}
                >
                  <strong>{t(`${config.scope}.playStyle.${style}.title`)}</strong>
                  <span>{t(`${config.scope}.playStyle.${style}.text`)}</span>
                </button>
              ))}
            </div>
          </section>
        </div>

        <aside className="social-draw-panel">
          <div>
            <h2>{t(`${config.scope}.summaryTitle`)}</h2>
            <p>
              {canDrawCards
                ? t(`${config.scope}.summaryText`, { count: requestSelections.length })
                : t(`${config.scope}.emptyText`)}
            </p>
          </div>

          <div className="social-summary-meter" aria-hidden="true">
            <span style={{ '--summary-fill': `${Math.min(100, requestSelections.length * 12)}%` }} />
          </div>

          {drawError ? <p className="social-draw-error">{drawError}</p> : null}
        </aside>
      </section>

      <section className="social-start-zone" aria-label={t(`${config.scope}.start`)}>
        <button
          type="button"
          className="social-start-button"
          onClick={handleDrawCards}
          disabled={!canDrawCards || isDrawing}
        >
          {isDrawing ? t(`${config.scope}.loading`) : t(`${config.scope}.start`)}
        </button>
      </section>
    </main>
  )
}
