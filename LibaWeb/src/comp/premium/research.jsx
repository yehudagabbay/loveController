import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { getBookBasedCards, getUserPlan } from '../../api/ApiTools'
import { useLanguage } from '../../localization/languageStore'
import comeAsYouAreCover from '../../image/booksImage/Come As You Are (Dahlia Adler).jpeg'
import fiveLoveLanguagesCover from '../../image/booksImage/Five Love Languages.jpg'
import menMarsWomenVenusCover from '../../image/booksImage/John Gray Men Are From Mars and Women Are From Venus.jpg'
import artOfGatheringCover from '../../image/booksImage/The Art of Gathering How We Meet and Why It Matters.jpg'
import supercommunicatorsCover from '../../image/booksImage/The Power of Conversation Supercommunicators.jpg'
import sevenPrinciplesCover from '../../image/booksImage/The Seven Principles for a Happy Marriage.jpg'
import './research.css'

const wizardSteps = [
  'סוג משחק',
  'בחירת ספר',
  'סגנון משחק',
  'בחירת רמות',
  'סיכום והתחלת משחק',
]

const books = [
  {
    id: 'seven-principles',
    bookId: 1,
    title: 'The Seven Principles for Making Marriage Work',
    description: 'שיחה זוגית, אמון, קרבה והרגלים שמחזקים קשר.',
    coverImage: sevenPrinciplesCover,
  },
  {
    id: 'supercommunicators',
    bookId: 2,
    title: 'Supercommunicators',
    description: 'כלים לשיחה עמוקה, הקשבה וחיבור בין אנשים.',
    coverImage: supercommunicatorsCover,
  },
  {
    id: 'art-of-gathering',
    bookId: 3,
    title: 'The Art of Gathering',
    description: 'איך מפגש הופך לרגע משמעותי יותר.',
    coverImage: artOfGatheringCover,
  },
  {
    id: 'mars-venus',
    bookId: 4,
    title: 'Men Are From Mars and Women Are From Venus',
    description: 'פערי תקשורת, צרכים וציפיות בקשר.',
    coverImage: menMarsWomenVenusCover,
  },
  {
    id: 'love-languages',
    bookId: 20,
    title: 'The Five Love Languages',
    description: 'דרכים שונות להרגיש אהובים ולהראות אהבה.',
    coverImage: fiveLoveLanguagesCover,
  },
  {
    id: 'come-as-you-are',
    bookId: 10,
    title: 'Come As You Are',
    description: 'שיחה פתוחה על תשוקה, אינטימיות וביטחון.',
    coverImage: comeAsYouAreCover,
  },
]

const gameTypes = [
  {
    id: 'couples',
    modeId: 1,
    title: 'זוגות',
    description: 'כרטיסים לשיחה זוגית, קרבה, היכרות ותשוקה.',
    route: '/couple-game',
    accentClass: 'research-type-couples',
    styles: [
      {
        id: 'fun',
        title: 'כיף',
        description: 'שאלות ומשימות קלילות לפתיחה, צחוק ותנועה.',
        categoryId: 2,
        subCategoryIds: [1, 2, 3],
      },
      {
        id: 'connection',
        title: 'היכרות',
        description: 'כרטיסים להעמקת שיחה, זיכרונות, ערכים וחיבור.',
        categoryId: 1,
        subCategoryIds: [1, 2, 3],
      },
      {
        id: 'passion',
        title: 'תשוקה',
        description: 'שיחה עדינה וישירה על רצון, קרבה ואינטימיות.',
        categoryId: 3,
        subCategoryIds: [1, 2, 3],
      },
    ],
  },
  {
    id: 'family',
    modeId: 3,
    title: 'משפחה',
    description: 'כרטיסים לשיחה משפחתית, סיפורים משותפים וקרבה.',
    route: '/family-game',
    accentClass: 'research-type-family',
    styles: [
      {
        id: 'family-stories',
        title: 'סיפורים משפחתיים',
        description: 'זיכרונות, מסורת, דורות ורגעים שנשארים.',
        categoryId: 1,
        subCategoryIds: [1, 2, 3],
      },
      {
        id: 'family-fun',
        title: 'צחוק ומשחק',
        description: 'משימות ושאלות קלילות שמתאימות לכל הגילים.',
        categoryId: 2,
        subCategoryIds: [1, 2, 3],
      },
      {
        id: 'family-closeness',
        title: 'קרבה והקשבה',
        description: 'שיתוף, הערכה ושיחה בטוחה בתוך המשפחה.',
        categoryId: 3,
        subCategoryIds: [1, 2, 3],
      },
    ],
  },
  {
    id: 'friends',
    modeId: 2,
    title: 'חברים',
    description: 'כרטיסים לקבוצה, שיחה, אתגר, צחוק ואמון.',
    route: '/friends-game',
    accentClass: 'research-type-friends',
    styles: [
      {
        id: 'friends-intro',
        title: 'היכרות ופתיחה',
        description: 'שאלות שמחברות מהר ופותחות שיחה טבעית.',
        categoryId: 1,
        subCategoryIds: [1, 2, 3],
      },
      {
        id: 'friends-fun',
        title: 'כיף ואתגרים',
        description: 'משימות קלילות, צחוק וסיטואציות מפתיעות.',
        categoryId: 2,
        subCategoryIds: [1, 2, 3],
      },
      {
        id: 'friends-trust',
        title: 'אמון ועומק',
        description: 'כרטיסים לשיחה אמיתית, פרגון והקשבה.',
        categoryId: 3,
        subCategoryIds: [1, 2, 3],
      },
    ],
  },
]

const levelOptions = [
  { value: 1, label: '1', description: 'עדין מאוד' },
  { value: 2, label: '2', description: 'קל ונוח' },
  { value: 3, label: '3', description: 'מאוזן' },
  { value: 4, label: '4', description: 'עמוק יותר' },
  { value: 5, label: '5', description: 'הכי ישיר' },
]

function mapScaleLevelToServerLevel(scaleLevel) {
  const numericLevel = Number(scaleLevel)

  if (numericLevel <= 2) return 1
  if (numericLevel === 3) return 2
  return 3
}

function getPlanText(value, visited = new Set()) {
  if (!value || typeof value !== 'object' || visited.has(value)) {
    return ''
  }

  visited.add(value)

  const directPlan =
    value.plan ||
    value.Plan ||
    value.planCode ||
    value.PlanCode ||
    value.planName ||
    value.PlanName

  if (typeof directPlan === 'string' && directPlan.trim()) {
    return directPlan
  }

  for (const nestedValue of Object.values(value)) {
    const nestedPlan = getPlanText(nestedValue, visited)

    if (nestedPlan) {
      return nestedPlan
    }
  }

  return ''
}

function isPremiumPlan(planValue) {
  const normalizedPlan = String(planValue || '').trim().toLowerCase()
  return normalizedPlan.includes('premium') || normalizedPlan.includes('deep')
}

function getById(items, id) {
  return items.find((item) => item.id === id) || null
}

export default function Research({ user, userId }) {
  const navigate = useNavigate()
  const { lang } = useLanguage()
  const [premiumStatus, setPremiumStatus] = useState(() =>
    isPremiumPlan(getPlanText(user)) ? 'allowed' : 'checking',
  )
  const [premiumMessage, setPremiumMessage] = useState('')
  const [stepIndex, setStepIndex] = useState(0)
  const [selectedGameTypeId, setSelectedGameTypeId] = useState('')
  const [selectedBookId, setSelectedBookId] = useState('')
  const [selectedStyleIds, setSelectedStyleIds] = useState([])
  const [styleLevels, setStyleLevels] = useState({})
  const [isDrawing, setIsDrawing] = useState(false)
  const [drawError, setDrawError] = useState('')

  const selectedGameType = getById(gameTypes, selectedGameTypeId)
  const selectedBook = getById(books, selectedBookId)
  const selectedStyles = useMemo(
    () =>
      selectedGameType
        ? selectedStyleIds.map((styleId) => getById(selectedGameType.styles, styleId)).filter(Boolean)
        : [],
    [selectedGameType, selectedStyleIds],
  )

  const allSelectedStylesHaveLevels =
    selectedStyles.length > 0 && selectedStyles.every((style) => styleLevels[style.id])

  const selections = useMemo(() => {
    if (!selectedGameType || !selectedBook || !allSelectedStylesHaveLevels) {
      return []
    }

    return selectedStyles.flatMap((style) =>
      style.subCategoryIds.map((subCategoryId) => ({
        ModeID: selectedGameType.modeId,
        CategoryID: style.categoryId,
        BookID: selectedBook.bookId,
        SubCategoryID: subCategoryId,
        LevelID: mapScaleLevelToServerLevel(styleLevels[style.id]),
      })),
    )
  }, [allSelectedStylesHaveLevels, selectedBook, selectedGameType, selectedStyles, styleLevels])

  const bookLabelById = useMemo(
    () =>
      books.reduce((acc, book) => {
        acc[book.bookId] = book.title
        return acc
      }, {}),
    [],
  )

  useEffect(() => {
    if (premiumStatus !== 'checking') {
      return undefined
    }

    let isMounted = true

    async function verifyPremiumAccess() {
      if (!userId) {
        setPremiumStatus('blocked')
        setPremiumMessage('האפשרות זמינה למנויי Premium בלבד. לא הצלחנו לזהות מנוי פעיל לחשבון הזה.')
        return
      }

      setPremiumStatus('checking')

      try {
        const result = await getUserPlan(userId)
        const planText = getPlanText(result.data)

        if (!isMounted) {
          return
        }

        if (result.response.ok && isPremiumPlan(planText)) {
          setPremiumStatus('allowed')
          setPremiumMessage('')
          return
        }

        setPremiumStatus('blocked')
        setPremiumMessage('מחקר זמין כרגע למנויי Premium בלבד. אפשר להמשיך לשחק בשאר המשחקים כרגיל.')
      } catch {
        if (!isMounted) {
          return
        }

        setPremiumStatus('unknown')
        setPremiumMessage('לא הצלחנו לבדוק כרגע את סטטוס המנוי. אפשר לנסות להתחיל, ואם אין מנוי פעיל תופיע הודעה מתאימה.')
      }
    }

    verifyPremiumAccess()

    return () => {
      isMounted = false
    }
  }, [premiumStatus, userId])

  const canOpenStep = (index) => {
    if (index === 0) return true
    if (index === 1) return Boolean(selectedGameType)
    if (index === 2) return Boolean(selectedGameType && selectedBook)
    if (index === 3) return Boolean(selectedGameType && selectedBook && selectedStyles.length)
    return Boolean(selectedGameType && selectedBook && allSelectedStylesHaveLevels)
  }

  const goToStep = (nextIndex) => {
    if (nextIndex < 0 || nextIndex >= wizardSteps.length || !canOpenStep(nextIndex)) {
      return
    }

    setDrawError('')
    setStepIndex(nextIndex)
  }

  const selectGameType = (gameTypeId) => {
    if (gameTypeId === selectedGameTypeId) {
      return
    }

    setSelectedGameTypeId(gameTypeId)
    setSelectedBookId('')
    setSelectedStyleIds([])
    setStyleLevels({})
    setDrawError('')
  }

  const toggleStyle = (styleId) => {
    setDrawError('')
    setSelectedStyleIds((current) => {
      if (current.includes(styleId)) {
        setStyleLevels((levels) => {
          const nextLevels = { ...levels }
          delete nextLevels[styleId]
          return nextLevels
        })

        return current.filter((currentStyleId) => currentStyleId !== styleId)
      }

      return [...current, styleId]
    })
  }

  const selectLevel = (styleId, level) => {
    setDrawError('')
    setStyleLevels((current) => ({
      ...current,
      [styleId]: level,
    }))
  }

  const startResearchGame = async () => {
    if (isDrawing || selections.length === 0) {
      return
    }

    setDrawError('')
    setIsDrawing(true)

    try {
      const result = await getBookBasedCards({
        userId,
        lang,
        maxCards: 18,
        selections,
      })

      if (!result.response.ok) {
        const message =
          result.response.status === 403
            ? 'האפשרות זמינה למנויי Premium בלבד.'
            : result.response.status === 404
            ? 'לא נמצאו כרטיסי מחקר שמתאימים לבחירות האלה.'
            : result.data?.message || result.raw || 'לא הצלחנו לשלוף כרטיסי מחקר.'

        throw new Error(message)
      }

      const cards = Array.isArray(result.data) ? result.data : []

      if (cards.length === 0) {
        throw new Error('לא נמצאו כרטיסי מחקר שמתאימים לבחירות האלה.')
      }

      navigate(selectedGameType.route, {
        state: {
          cards,
          gameMode: selectedGameType.id,
          playStyle: 'deck',
          isBookBased: true,
          backRoute: '/research',
          label: 'מחקר',
          summary: `${selectedGameType.title} / ${selectedBook.title} / ${selectedStyles.length} סגנונות`,
          selections,
          filters: {
            bookBased: true,
          },
          bookLabelById,
          bookSummary: selectedBook.title,
          userId,
          gameCopy: {
            eyebrow: 'מחקר',
            title: 'מחקר',
            subtitle: 'הכרטיסים נבחרו לפי סוג המשחק, הספר, הסגנונות והרמות שבחרתם.',
            completeTitle: 'סיימתם את חפיסת המחקר',
            completeText: 'עברתם על כל כרטיסי המחקר שנשלפו לפי הבחירות שלכם.',
            completeAction: 'בחירת מחקר חדשה',
          },
        },
      })
    } catch (error) {
      setDrawError(error instanceof Error ? error.message : 'לא הצלחנו לשלוף כרטיסי מחקר.')
    } finally {
      setIsDrawing(false)
    }
  }

  const progressPercent = Math.round((stepIndex / (wizardSteps.length - 1)) * 100)
  const selectedStyleText = selectedStyles.length
    ? selectedStyles.map((style) => style.title).join(', ')
    : 'טרם נבחר'
  const selectedLevelText = selectedStyles.length
    ? selectedStyles
        .map((style) =>
          styleLevels[style.id]
            ? `${style.title} ${styleLevels[style.id]}`
            : `${style.title} טרם נבחר`,
        )
        .join(', ')
    : 'טרם נבחר'

  const renderStep = () => {
    if (stepIndex === 0) {
      return (
        <>
          <div className="research-step-copy">
            <span>שלב 1 מתוך 5</span>
            <h1 id="research-step-title">בחרו סוג משחק</h1>
            <p>בחרו את מסגרת המשחק שאליה תרצו לשלוף כרטיסים מבוססי מחקר.</p>
          </div>

          <div className="research-choice-grid research-type-grid">
            {gameTypes.map((gameType) => (
              <button
                key={gameType.id}
                type="button"
                className={`${gameType.accentClass} ${
                  selectedGameTypeId === gameType.id ? 'selected' : ''
                }`}
                aria-pressed={selectedGameTypeId === gameType.id}
                onClick={() => selectGameType(gameType.id)}
              >
                <strong>{gameType.title}</strong>
                <span>{gameType.description}</span>
              </button>
            ))}
          </div>
        </>
      )
    }

    if (stepIndex === 1) {
      return (
        <>
          <div className="research-step-copy">
            <span>שלב 2 מתוך 5</span>
            <h1 id="research-step-title">בחרו ספר</h1>
            <p>בשלב הזה הרשימה זמנית ופשוטה. בהמשך נחליף אותה בגלריית ספרים מלאה.</p>
          </div>

          <div className="research-book-grid">
            {books.map((book) => (
              <button
                key={book.id}
                type="button"
                className={selectedBookId === book.id ? 'selected' : ''}
                aria-pressed={selectedBookId === book.id}
                onClick={() => {
                  setDrawError('')
                  setSelectedBookId(book.id)
                }}
              >
                <span className="research-book-cover" aria-hidden="true">
                  <img src={book.coverImage} alt="" draggable="false" />
                </span>
                <span className="research-book-copy">
                  <strong dir="ltr">{book.title}</strong>
                  <small>{book.description}</small>
                </span>
              </button>
            ))}
          </div>
        </>
      )
    }

    if (stepIndex === 2) {
      return (
        <>
          <div className="research-step-copy">
            <span>שלב 3 מתוך 5</span>
            <h1 id="research-step-title">בחרו סגנון משחק</h1>
            <p>אפשר לבחור סגנון אחד או כמה סגנונות, כמו בבחירה הרגילה של האפליקציה.</p>
          </div>

          <div className="research-choice-grid">
            {selectedGameType.styles.map((style) => (
              <button
                key={style.id}
                type="button"
                className={selectedStyleIds.includes(style.id) ? 'selected' : ''}
                aria-pressed={selectedStyleIds.includes(style.id)}
                onClick={() => toggleStyle(style.id)}
              >
                <strong>{style.title}</strong>
                <span>{style.description}</span>
              </button>
            ))}
          </div>
        </>
      )
    }

    if (stepIndex === 3) {
      return (
        <>
          <div className="research-step-copy">
            <span>שלב 4 מתוך 5</span>
            <h1 id="research-step-title">בחרו רמה לכל סגנון</h1>
            <p>הסקאלה מוצגת מ-1 עד 5. לפני השליחה לשרת היא תותאם לרמות 1 עד 3.</p>
          </div>

          <div className="research-level-list">
            {selectedStyles.map((style) => {
              const selectedLevel = styleLevels[style.id]
              const serverLevel = selectedLevel ? mapScaleLevelToServerLevel(selectedLevel) : '-'

              return (
                <section className="research-level-card" key={style.id}>
                  <div>
                    <strong>{style.title}</strong>
                    <span>נשלח לשרת כרמה {serverLevel}</span>
                  </div>

                  <div className="research-level-scale" role="radiogroup" aria-label={`בחירת רמה עבור ${style.title}`}>
                    {levelOptions.map((level) => (
                      <button
                        key={level.value}
                        type="button"
                        className={selectedLevel === level.value ? 'selected' : ''}
                        aria-pressed={selectedLevel === level.value}
                        onClick={() => selectLevel(style.id, level.value)}
                      >
                        <strong>{level.label}</strong>
                        <small>{level.description}</small>
                      </button>
                    ))}
                  </div>
                </section>
              )
            })}
          </div>
        </>
      )
    }

    return (
      <>
        <div className="research-step-copy">
          <span>שלב 5 מתוך 5</span>
          <h1 id="research-step-title">סיכום והתחלת משחק</h1>
          <p>בדקו את הבחירות. לאחר הלחיצה נמשוך את הכרטיסים ונעבור למסך המשחק הרגיל.</p>
        </div>

        <section className="research-final-summary">
          <dl>
            <div>
              <dt>סוג משחק</dt>
              <dd>{selectedGameType.title}</dd>
            </div>
            <div>
              <dt>ספר</dt>
              <dd>{selectedBook.title}</dd>
            </div>
            <div>
              <dt>סגנונות</dt>
              <dd>{selectedStyleText}</dd>
            </div>
            <div>
              <dt>רמות</dt>
              <dd>{selectedLevelText}</dd>
            </div>
          </dl>

          <div className="research-server-summary">
            {selectedStyles.map((style) => (
              <span key={style.id}>
                {style.title}: {styleLevels[style.id]} → {mapScaleLevelToServerLevel(styleLevels[style.id])}
              </span>
            ))}
          </div>

          {drawError ? <p className="research-draw-error">{drawError}</p> : null}

          <div className="research-final-actions">
            <button type="button" className="secondary" onClick={() => goToStep(3)}>
              חזרה לעריכה
            </button>
            <button type="button" onClick={startResearchGame} disabled={isDrawing}>
              {isDrawing ? 'מושכים כרטיסים...' : 'התחל משחק'}
            </button>
          </div>
        </section>
      </>
    )
  }

  if (premiumStatus === 'checking') {
    return (
      <main className="research-page" dir="rtl">
        <section className="research-gate-card" aria-live="polite">
          <span>מחקר</span>
          <h1>בודקים הרשאת Premium</h1>
          <p>רגע אחד, אנחנו בודקים אם האפשרות זמינה לחשבון שלך.</p>
        </section>
      </main>
    )
  }

  if (premiumStatus === 'blocked') {
    return (
      <main className="research-page" dir="rtl">
        <section className="research-gate-card">
          <span>מחקר</span>
          <h1>זמין למנויי Premium בלבד</h1>
          <p>{premiumMessage}</p>
          <div>
            <button type="button" onClick={() => navigate('/profile')}>
              צפייה במסלולים
            </button>
            <button type="button" className="secondary" onClick={() => navigate('/games')}>
              חזרה למשחקים
            </button>
          </div>
        </section>
      </main>
    )
  }

  return (
    <main className="research-page" dir="rtl">
      <section className="research-shell" aria-labelledby="research-step-title">
        {premiumStatus === 'unknown' ? <p className="research-premium-note">{premiumMessage}</p> : null}

        <section className="research-wizard-layout">
          <section className="research-wizard-stage">{renderStep()}</section>

          <aside className="research-progress-panel" aria-label="בר התקדמות מחקר">
            <div className="research-progress-heading">
              <span>מחקר</span>
              <strong>{progressPercent}%</strong>
            </div>

            <div className="research-progress-track" aria-hidden="true">
              <span style={{ '--progress': `${progressPercent}%` }} />
            </div>

            <ol className="research-progress-steps">
              {wizardSteps.map((step, index) => (
                <li key={step}>
                  <button
                    type="button"
                    className={`${stepIndex === index ? 'current' : ''} ${
                      index < stepIndex && canOpenStep(index) ? 'done' : ''
                    }`}
                    disabled={!canOpenStep(index)}
                    onClick={() => goToStep(index)}
                  >
                    <span>{index + 1}</span>
                    <strong>{step}</strong>
                  </button>
                </li>
              ))}
            </ol>

            <dl className="research-selection-summary">
              <div>
                <dt>סוג משחק</dt>
                <dd>{selectedGameType?.title || 'טרם נבחר'}</dd>
              </div>
              <div>
                <dt>ספר</dt>
                <dd>{selectedBook?.title || 'טרם נבחר'}</dd>
              </div>
              <div>
                <dt>סגנונות</dt>
                <dd>{selectedStyleText}</dd>
              </div>
              <div>
                <dt>רמות</dt>
                <dd>{selectedLevelText}</dd>
              </div>
            </dl>

            {stepIndex < wizardSteps.length - 1 ? (
              <div className="research-step-actions">
                <button
                  type="button"
                  className="secondary"
                  onClick={() => (stepIndex === 0 ? navigate('/games') : goToStep(stepIndex - 1))}
                >
                  חזרה
                </button>
                <button
                  type="button"
                  onClick={() => goToStep(stepIndex + 1)}
                  disabled={!canOpenStep(stepIndex + 1)}
                >
                  המשך
                </button>
              </div>
            ) : null}
          </aside>
        </section>
      </section>
    </main>
  )
}
