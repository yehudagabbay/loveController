import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { getBookBasedCards } from '../../api/ApiTools'
import { useLanguage } from '../../localization/languageStore'
import comeAsYouAreCover from '../../image/booksImage/Come As You Are (Dahlia Adler).jpeg'
import fiveLoveLanguagesCover from '../../image/booksImage/Five Love Languages.jpg'
import menMarsWomenVenusCover from '../../image/booksImage/John Gray Men Are From Mars and Women Are From Venus.jpg'
import artOfGatheringCover from '../../image/booksImage/The Art of Gathering How We Meet and Why It Matters.jpg'
import supercommunicatorsCover from '../../image/booksImage/The Power of Conversation Supercommunicators.jpg'
import sevenPrinciplesCover from '../../image/booksImage/The Seven Principles for a Happy Marriage.jpg'
import './CoupleResearch.css'

const modeId = 1

const steps = [
  { id: 'book', title: 'ספר' },
  { id: 'branch', title: 'סגנונות משחק' },
  { id: 'level', title: 'רמות' },
  { id: 'summary', title: 'סיכום' },
]

const createResearchSteps = (branchTitle) => [
  { id: 'book', title: 'ספר' },
  { id: 'branch', title: branchTitle },
  { id: 'level', title: 'רמות' },
  { id: 'summary', title: 'סיכום' },
]

const getStepIndexById = (items, stepId) => {
  const stepIndex = items.findIndex((step) => step.id === stepId)
  return stepIndex >= 0 ? stepIndex : 0
}

const books = [
  {
    id: 'book-1',
    bookId: 1,
    title: 'The Seven Principles for a Happy Marriage',
    blurb: 'לבנות חברות, אמון ושיחה זוגית.',
    sourceUrl: 'https://drive.google.com/file/d/13flul7odXz5fF7BLiqa4Ti9wpdQTv2wY/view?usp=sharing',
    coverImage: sevenPrinciplesCover,
  },
  {
    id: 'book-2',
    bookId: 2,
    title: 'The Power of Conversation: Supercommunicators',
    blurb: 'שיחות עמוקות, הקשבה וחיבור.',
    sourceUrl: 'https://drive.google.com/file/d/1V7UsbLp4P8UJT3MY9S-6Reg-D19b4nmH/view?usp=sharing',
    coverImage: supercommunicatorsCover,
  },
  {
    id: 'book-3',
    bookId: 3,
    title: 'The Art of Gathering',
    blurb: 'להפוך מפגש רגיל לרגע משמעותי.',
    sourceUrl: 'https://drive.google.com/file/d/1VOh8eet-dk5EbWbmAef65EWbKht-UCEc/view?usp=sharing',
    coverImage: artOfGatheringCover,
  },
  {
    id: 'book-4',
    bookId: 4,
    title: 'Men Are From Mars and Women Are From Venus',
    blurb: 'להבין פערי תקשורת וציפיות.',
    sourceUrl: 'https://drive.google.com/file/d/1Y6Nn1puEhPsj3n3dU155_F_VNcyYY1xo/view?usp=sharing',
    coverImage: menMarsWomenVenusCover,
  },
  {
    id: 'book-5',
    bookId: 20,
    title: 'The Five Love Languages',
    blurb: 'לגלות איך כל אחד מרגיש אהוב.',
    sourceUrl: 'https://drive.google.com/file/d/1_emrUA0OFefU0s6IzAC5jWOjCgc4s0LF/view?usp=sharing',
    coverImage: fiveLoveLanguagesCover,
  },
  {
    id: 'book-6',
    bookId: 10,
    title: 'Come As You Are',
    blurb: 'שיחה פתוחה על תשוקה ואינטימיות.',
    sourceUrl: 'https://drive.google.com/file/d/1suh4RPGDd4WS_swiOLLWuyEyLFGEQtxf/view?usp=sharing',
    coverImage: comeAsYouAreCover,
  },
]

const branches = [
  {
    id: 'passion',
    categoryId: 3,
    title: 'תשוקה ואינטימיות',
    hint: 'סגנון לכרטיסים שעוסקים בקרבה, גבולות, רצון וחיבור אינטימי.',
    subtopics: [
      { id: 'shared-pleasure', subCategoryId: 1, title: 'עונג משותף וחיבור מחודש' },
      { id: 'shame-barrier', subCategoryId: 2, title: 'התגברות על הבושה ושבירת מחסום' },
      { id: 'curiosity-boundaries', subCategoryId: 3, title: 'סקרנות, כבוד והצבת גבולות' },
    ],
  },
  {
    id: 'fun',
    categoryId: 2,
    title: 'כיף וצחוקים',
    hint: 'סגנון לכרטיסים קלילים, משחקיים ומפתיעים.',
    subtopics: [
      { id: 'belonging', subCategoryId: 1, title: 'להרגיש שייך' },
      { id: 'sharing-challenge', subCategoryId: 2, title: 'אתגר השיתוף' },
      { id: 'absurd-situations', subCategoryId: 3, title: 'סיטואציות אבסורדיות' },
    ],
  },
  {
    id: 'connection',
    categoryId: 1,
    title: 'היכרות',
    hint: 'סגנון לכרטיסים שמעמיקים היכרות, זיכרון, ערכים וסיפור אישי.',
    subtopics: [
      { id: 'time-travel', subCategoryId: 1, title: 'מסע בזמן' },
      { id: 'values', subCategoryId: 2, title: 'ערכים' },
      { id: 'rediscovery', subCategoryId: 3, title: 'גילוי מחדש' },
    ],
  },
]

const levels = [
  { id: 1, title: 'רמה 1', hint: 'כניסה עדינה ונוחה לשיחה.' },
  { id: 2, title: 'רמה 2', hint: 'שאלות ומשימות עם יותר עומק.' },
  { id: 3, title: 'רמה 3', hint: 'בחירה פתוחה וישירה יותר.' },
]

const levelScaleOptions = [
  { id: 1, title: '1', hint: 'עדין מאוד', serverLevel: 1 },
  { id: 2, title: '2', hint: 'קל ונוח', serverLevel: 1 },
  { id: 3, title: '3', hint: 'מאוזן', serverLevel: 2 },
  { id: 4, title: '4', hint: 'עמוק יותר', serverLevel: 3 },
  { id: 5, title: '5', hint: 'הכי ישיר', serverLevel: 3 },
]

const replayFilters = [
  { id: 'liked', label: 'אהבתי' },
  { id: 'loved', label: 'אהבתי במיוחד' },
  { id: 'shared', label: 'שיתפתי' },
]

const placeholderBookCovers = [
  sevenPrinciplesCover,
  supercommunicatorsCover,
  artOfGatheringCover,
  menMarsWomenVenusCover,
  fiveLoveLanguagesCover,
  comeAsYouAreCover,
]

const familyBooks = Array.from({ length: 6 }, (_, index) => ({
  id: `family-book-${index + 1}`,
  bookId: index + 1,
  title: `ספר משפחה ${index + 1}`,
  titleDirection: 'rtl',
  blurb: 'כאן ייכנס מקור משפחתי מתאים.',
  sourceUrl: '',
  coverImage: placeholderBookCovers[index],
}))

const friendsBooks = Array.from({ length: 6 }, (_, index) => ({
  id: `friends-book-${index + 1}`,
  bookId: index + 1,
  title: `ספר חברים ${index + 1}`,
  titleDirection: 'rtl',
  blurb: 'כאן ייכנס מקור לחברים וקבוצות.',
  sourceUrl: '',
  coverImage: placeholderBookCovers[index],
}))

const familyBranches = [
  {
    id: 'family-stories',
    categoryId: 1,
    title: 'סיפורים משפחתיים',
    hint: 'שלד לסגנון שיעסוק בזיכרונות, מסורת, דורות ורגעים משותפים.',
    subtopics: [
      { id: 'family-roots', subCategoryId: 1, title: 'שורשים וזיכרונות' },
      { id: 'family-moments', subCategoryId: 2, title: 'רגעים שנשארים' },
      { id: 'family-legacy', subCategoryId: 3, title: 'מסורת ומשמעות' },
    ],
  },
  {
    id: 'family-fun',
    categoryId: 2,
    title: 'צחוק ומשחק',
    hint: 'שלד לסגנון קליל למשימות, הומור ושיחה שמתאימה לכל הגילים.',
    subtopics: [
      { id: 'family-light', subCategoryId: 1, title: 'שאלות קלילות' },
      { id: 'family-tasks', subCategoryId: 2, title: 'משימות משפחתיות' },
      { id: 'family-surprises', subCategoryId: 3, title: 'הפתעות קטנות' },
    ],
  },
  {
    id: 'family-closeness',
    categoryId: 3,
    title: 'קרבה והקשבה',
    hint: 'שלד לסגנון שיעסוק בהערכה, שיתוף, גבולות ושיחה בטוחה.',
    subtopics: [
      { id: 'family-listening', subCategoryId: 1, title: 'הקשבה והערכה' },
      { id: 'family-support', subCategoryId: 2, title: 'תמיכה ושיתוף' },
      { id: 'family-safe-talk', subCategoryId: 3, title: 'שיחה בטוחה' },
    ],
  },
]

const friendsBranches = [
  {
    id: 'friends-icebreakers',
    categoryId: 1,
    title: 'היכרות ופתיחה',
    hint: 'שלד לסגנון שפותח שיחה ומחבר בין חברים, צוותים וקבוצות.',
    subtopics: [
      { id: 'friends-first', subCategoryId: 1, title: 'פתיחה מהירה' },
      { id: 'friends-stories', subCategoryId: 2, title: 'סיפורים אישיים' },
      { id: 'friends-common', subCategoryId: 3, title: 'מכנה משותף' },
    ],
  },
  {
    id: 'friends-fun',
    categoryId: 2,
    title: 'כיף ואתגרים',
    hint: 'שלד לסגנון קליל, מצחיק ותחרותי לערב חברים.',
    subtopics: [
      { id: 'friends-laugh', subCategoryId: 1, title: 'צחוק ושבירת קרח' },
      { id: 'friends-challenge', subCategoryId: 2, title: 'אתגרי שיתוף' },
      { id: 'friends-surprise', subCategoryId: 3, title: 'סיטואציות מפתיעות' },
    ],
  },
  {
    id: 'friends-trust',
    categoryId: 3,
    title: 'אמון ועומק',
    hint: 'שלד לסגנון שמעמיק חברות, הקשבה, פרגון ושיחה אמיתית.',
    subtopics: [
      { id: 'friends-trust-talk', subCategoryId: 1, title: 'אמון ושיחה' },
      { id: 'friends-support', subCategoryId: 2, title: 'פרגון ותמיכה' },
      { id: 'friends-values', subCategoryId: 3, title: 'ערכים וחברות' },
    ],
  },
]

const coupleResearchConfig = {
  routeType: 'couples',
  modeId,
  steps,
  books,
  branches,
  levels,
  label: 'זוגיות',
  branchStepTitle: 'בחרו סגנונות משחק לזוגיות',
  themeClass: 'research-theme-couples',
}

const familyResearchConfig = {
  routeType: 'family',
  modeId: 3,
  steps: createResearchSteps('סגנונות משחק'),
  books: familyBooks,
  branches: familyBranches,
  levels,
  label: 'משפחה',
  branchStepTitle: 'בחרו סגנונות משחק למשפחה',
  themeClass: 'research-theme-family',
}

const friendsResearchConfig = {
  routeType: 'friends',
  modeId: 2,
  steps: createResearchSteps('סגנונות משחק'),
  books: friendsBooks,
  branches: friendsBranches,
  levels,
  label: 'חברים',
  branchStepTitle: 'בחרו סגנונות משחק לחברים',
  themeClass: 'research-theme-friends',
}

function getById(items, id) {
  return items.find((item) => item.id === id) || null
}

function getGameRouteByType(routeType) {
  if (routeType === 'family') return '/family-game'
  if (routeType === 'friends') return '/friends-game'
  return '/couple-game'
}

function getCardLikeStatus(card) {
  return Number(card?.LikeStatus ?? card?.likeStatus ?? 0)
}

function mapScaleLevelToServerLevel(scaleLevel) {
  const numericLevel = Number(scaleLevel)

  if (numericLevel <= 2) return 1
  if (numericLevel === 3) return 2
  return 3
}

function isCardShared(card) {
  return Boolean(card?.IsShared ?? card?.isShared ?? card?.isSharedCard)
}

export function FamilyResearchTree({ userId }) {
  return <CoupleResearch config={familyResearchConfig} userId={userId} />
}

export function FriendsResearchTree({ userId }) {
  return <CoupleResearch config={friendsResearchConfig} userId={userId} />
}

export default function CoupleResearch({ config = coupleResearchConfig, userId }) {
  const [searchParams, setSearchParams] = useSearchParams()
  const navigate = useNavigate()
  const { lang } = useLanguage()
  const bookShelfRef = useRef(null)
  const bookTrackRef = useRef(null)
  const stepTransitionTimerRef = useRef(null)
  const shelfOffsetRef = useRef(0)
  const shelfLoopWidthRef = useRef(0)
  const dragStateRef = useRef({
    active: false,
    moved: false,
    suppressClick: false,
    startX: 0,
    startOffset: 0,
    candidateBookId: '',
  })
  const modeId = config.modeId
  const steps = config.steps
  const books = config.books
  const branches = config.branches
  const researchLabel = config.label
  const branchStepTitle = config.branchStepTitle
  const themeClass = config.themeClass
  const routeType = config.routeType
  const routeStepIndex = getStepIndexById(steps, searchParams.get('step'))
  const stepIndex = routeStepIndex
  const [direction, setDirection] = useState('forward')
  const [isStepExiting, setIsStepExiting] = useState(false)
  const [selectedBranchIds, setSelectedBranchIds] = useState([])
  const [selectedBookIds, setSelectedBookIds] = useState([])
  const [selectedStyleLevels, setSelectedStyleLevels] = useState({})
  const [selectedReplayFilters, setSelectedReplayFilters] = useState([])
  const [isDrawingResearch, setIsDrawingResearch] = useState(false)
  const [drawError, setDrawError] = useState('')

  const selectedBranches = useMemo(
    () => selectedBranchIds.map((branchId) => getById(branches, branchId)).filter(Boolean),
    [branches, selectedBranchIds],
  )
  const selectedBooks = useMemo(
    () => selectedBookIds.map((bookId) => getById(books, bookId)).filter(Boolean),
    [books, selectedBookIds],
  )
  const selectedBookTitles = selectedBooks.map((book) => book.title).join(', ')
  const selectedStyleLevelSummaries = useMemo(
    () =>
      selectedBranches
        .map((branch) => {
          const scaleLevel = selectedStyleLevels[branch.id]

          if (!scaleLevel) {
            return null
          }

          return {
            branch,
            scaleLevel,
            serverLevel: mapScaleLevelToServerLevel(scaleLevel),
          }
        })
        .filter(Boolean),
    [selectedBranches, selectedStyleLevels],
  )
  const selectedStyleLevelText = selectedStyleLevelSummaries
    .map(({ branch, scaleLevel }) => `${branch.title}: רמה ${scaleLevel}`)
    .join(', ')
  const hasLevelsForAllSelectedStyles =
    selectedBranches.length > 0 && selectedBranches.every((branch) => selectedStyleLevels[branch.id])
  const displayBooks = useMemo(() => [...books, ...books], [books])
  const hasReplayFilters = selectedReplayFilters.length > 0
  const bookLabelById = useMemo(
    () =>
      books.reduce((acc, book) => {
        acc[book.bookId] = book.title
        return acc
      }, {}),
    [books],
  )

  const serverPayload = useMemo(() => {
    const combinations = selectedStyleLevelSummaries.flatMap(({ branch, serverLevel }) =>
      selectedBooks.flatMap((book) =>
        branch.subtopics.map((subtopic) => ({
          ModeID: modeId,
          CategoryID: branch.categoryId,
          BookID: book.bookId,
          SubCategoryID: subtopic.subCategoryId,
          LevelID: serverLevel,
          IsResearchBased: 1,
          IsActive: 1,
        })),
      ),
    )

    return {
      distribution: 'equal',
      totalCombinations: combinations.length,
      filters: {
        ModeID: modeId,
        CategoryID: selectedBranches.map((branch) => branch.categoryId),
        BookID: selectedBooks.map((book) => book.bookId),
        SubCategoryID: selectedStyleLevelSummaries.flatMap(({ branch }) =>
          branch.subtopics.map((subtopic) => subtopic.subCategoryId),
        ),
        LevelID: selectedStyleLevelSummaries.map(({ serverLevel }) => serverLevel),
        IsResearchBased: 1,
        IsActive: 1,
      },
      combinations,
    }
  }, [modeId, selectedBooks, selectedBranches, selectedStyleLevelSummaries])

  const progressPercent = Math.round((stepIndex / (steps.length - 1)) * 100)

  const normalizeShelfOffset = useCallback((offset) => {
    const loopWidth = shelfLoopWidthRef.current

    if (loopWidth <= 0) {
      return offset
    }

    let normalizedOffset = offset

    while (normalizedOffset >= 0) {
      normalizedOffset -= loopWidth
    }

    while (normalizedOffset < -loopWidth) {
      normalizedOffset += loopWidth
    }

    return normalizedOffset
  }, [])

  const applyShelfOffset = useCallback((offset) => {
    const track = bookTrackRef.current
    const normalizedOffset = normalizeShelfOffset(offset)

    shelfOffsetRef.current = normalizedOffset

    if (track) {
      track.style.transform = `translate3d(${normalizedOffset}px, 0, 0)`
    }
  }, [normalizeShelfOffset])

  const measureBookShelf = useCallback(() => {
    const track = bookTrackRef.current

    if (!track) {
      return 0
    }

    const firstBook = track.children[0]
    const repeatedFirstBook = track.children[books.length]
    const loopWidth = firstBook && repeatedFirstBook ? repeatedFirstBook.offsetLeft - firstBook.offsetLeft : 0

    if (loopWidth > 0) {
      shelfLoopWidthRef.current = loopWidth

      if (shelfOffsetRef.current === 0) {
        shelfOffsetRef.current = -loopWidth
      }

      applyShelfOffset(shelfOffsetRef.current)
    }

    return loopWidth
  }, [applyShelfOffset, books.length])

  useEffect(() => {
    const shelf = bookShelfRef.current
    const track = bookTrackRef.current

    if (!shelf || !track || stepIndex !== 0) {
      return undefined
    }

    let animationFrameId = 0
    let lastTimestamp = 0
    const pixelsPerSecond = 32

    const animateShelf = (timestamp) => {
      if (!lastTimestamp) {
        lastTimestamp = timestamp
      }

      const deltaSeconds = (timestamp - lastTimestamp) / 1000
      lastTimestamp = timestamp

      const loopWidth = shelfLoopWidthRef.current || measureBookShelf()

      if (!dragStateRef.current.active && loopWidth > 0) {
        applyShelfOffset(shelfOffsetRef.current + pixelsPerSecond * deltaSeconds)
      }

      animationFrameId = window.requestAnimationFrame(animateShelf)
    }

    measureBookShelf()
    animationFrameId = window.requestAnimationFrame(animateShelf)

    const resizeObserver =
      typeof ResizeObserver === 'undefined'
        ? null
        : new ResizeObserver(() => {
            measureBookShelf()
          })

    resizeObserver?.observe(shelf)
    resizeObserver?.observe(track)

    return () => {
      window.cancelAnimationFrame(animationFrameId)
      resizeObserver?.disconnect()
    }
  }, [applyShelfOffset, measureBookShelf, stepIndex])

  useEffect(
    () => () => {
      window.clearTimeout(stepTransitionTimerRef.current)
    },
    [],
  )

  const canOpenStep = useCallback((index) => {
    if (index === 0) return true
    if (index === 1) return selectedBooks.length > 0
    if (index === 2) return selectedBooks.length > 0 && selectedBranches.length > 0
    return selectedBooks.length > 0 && selectedBranches.length > 0 && hasLevelsForAllSelectedStyles
  }, [hasLevelsForAllSelectedStyles, selectedBooks.length, selectedBranches.length])

  useEffect(() => {
    const routeStepId = searchParams.get('step')
    const nextStepIndex = getStepIndexById(steps, routeStepId)
    let safeStepIndex = nextStepIndex

    while (safeStepIndex > 0 && !canOpenStep(safeStepIndex)) {
      safeStepIndex -= 1
    }

    if (safeStepIndex !== nextStepIndex || routeStepId !== steps[safeStepIndex].id || searchParams.get('type') !== routeType) {
      const nextParams = new URLSearchParams(searchParams)
      nextParams.set('type', routeType)
      nextParams.set('step', steps[safeStepIndex].id)
      setSearchParams(nextParams, { replace: true })
    }
  }, [
    canOpenStep,
    routeType,
    searchParams,
    setSearchParams,
    steps,
  ])

  const goToStep = (nextIndex, skipGuard = false) => {
    if (
      nextIndex < 0 ||
      nextIndex >= steps.length ||
      nextIndex === stepIndex ||
      (!skipGuard && !canOpenStep(nextIndex)) ||
      isStepExiting
    ) {
      return
    }

    window.clearTimeout(stepTransitionTimerRef.current)
    setDirection(nextIndex >= stepIndex ? 'forward' : 'backward')
    setIsStepExiting(true)

    stepTransitionTimerRef.current = window.setTimeout(() => {
      const nextParams = new URLSearchParams(searchParams)
      nextParams.set('type', routeType)
      nextParams.set('step', steps[nextIndex].id)
      setSearchParams(nextParams)
      setIsStepExiting(false)
    }, 180)
  }

  const chooseBranch = (branch) => {
    setDrawError('')
    const isSelected = selectedBranchIds.includes(branch.id)

    setSelectedBranchIds((current) =>
      isSelected ? current.filter((branchId) => branchId !== branch.id) : [...current, branch.id],
    )

    if (isSelected) {
      setSelectedStyleLevels((currentLevels) => {
        const nextLevels = { ...currentLevels }
        delete nextLevels[branch.id]
        return nextLevels
      })
    }
  }

  const chooseBook = (book) => {
    setDrawError('')

    if (!book) {
      return
    }

    if (dragStateRef.current.suppressClick) {
      return
    }

    setSelectedBookIds((current) => (current.includes(book.id) ? [] : [book.id]))
  }

  const chooseStyleScaleLevel = (branchId, scaleLevel) => {
    setDrawError('')
    setSelectedStyleLevels((current) => ({
      ...current,
      [branchId]: scaleLevel,
    }))
  }

  const toggleReplayFilter = (filterId) => {
    setDrawError('')
    setSelectedReplayFilters((current) =>
      current.includes(filterId)
        ? current.filter((currentFilterId) => currentFilterId !== filterId)
        : [...current, filterId],
    )
  }

  const matchesReplayFilters = (card) => {
    if (!hasReplayFilters) {
      return true
    }

    const likeStatus = getCardLikeStatus(card)

    return (
      (selectedReplayFilters.includes('liked') && likeStatus === 1) ||
      (selectedReplayFilters.includes('loved') && likeStatus === 2) ||
      (selectedReplayFilters.includes('shared') && isCardShared(card))
    )
  }

  const handleShelfPointerDown = (event) => {
    const shelf = bookShelfRef.current

    if (!shelf) {
      return
    }

    const candidateBookCard = event.target.closest?.('.couple-book-card')

    dragStateRef.current = {
      active: true,
      moved: false,
      suppressClick: false,
      startX: event.clientX,
      startOffset: shelfOffsetRef.current,
      candidateBookId: candidateBookCard?.dataset.bookId || '',
    }

    shelf.setPointerCapture?.(event.pointerId)
  }

  const handleShelfPointerMove = (event) => {
    const shelf = bookShelfRef.current
    const dragState = dragStateRef.current

    if (!shelf || !dragState.active) {
      return
    }

    const deltaX = event.clientX - dragState.startX

    if (Math.abs(deltaX) > 10) {
      dragState.moved = true
    }

    applyShelfOffset(dragState.startOffset + deltaX)
  }

  const handleShelfPointerEnd = (event) => {
    const shelf = bookShelfRef.current
    const dragState = dragStateRef.current
    const wasMoved = dragState.moved

    if (shelf?.hasPointerCapture?.(event.pointerId)) {
      shelf.releasePointerCapture(event.pointerId)
    }

    dragState.active = false

    if (wasMoved) {
      dragState.suppressClick = true

      window.setTimeout(() => {
        dragState.suppressClick = false
        dragState.moved = false
        dragState.candidateBookId = ''
      }, 140)
      return
    }

    if (event.type === 'pointerup' && dragState.candidateBookId) {
      const candidateBook = getById(books, dragState.candidateBookId)
      dragState.suppressClick = false
      dragState.moved = false
      dragState.candidateBookId = ''

      if (candidateBook) {
        chooseBook(candidateBook)
      }
      return
    }

    dragState.candidateBookId = ''
  }

  const scrollBookShelf = (directionMultiplier) => {
    const shelf = bookShelfRef.current

    if (!shelf) {
      return
    }

    const moveAmount = shelf.clientWidth * 0.42 * directionMultiplier
    applyShelfOffset(shelfOffsetRef.current + moveAmount)
  }

  const handleBookActionPointerDown = (event) => {
    event.stopPropagation()
  }

  const handleBookSelectClick = (event, book) => {
    event.stopPropagation()
    dragStateRef.current.suppressClick = false
    dragStateRef.current.moved = false
    chooseBook(book)
  }

  const drawResearchCards = async () => {
    if (isDrawingResearch || serverPayload.combinations.length === 0) {
      return
    }

    setDrawError('')
    setIsDrawingResearch(true)

    try {
      const result = await getBookBasedCards({
        userId,
        lang,
        maxCards: hasReplayFilters ? 60 : 18,
        selections: serverPayload.combinations,
      })

      if (!result.response.ok) {
        const message =
          result.data?.message ||
          (result.response.status === 404
            ? 'לא נמצאו כרטיסים שמתאימים לבחירות האלה.'
            : result.raw || 'לא הצלחנו למשוך כרטיסים לפי הספרים שנבחרו.')

        throw new Error(message)
      }

      const cards = Array.isArray(result.data) ? result.data : []
      const playableCards = hasReplayFilters ? cards.filter(matchesReplayFilters) : cards

      if (playableCards.length === 0) {
        throw new Error(
          hasReplayFilters
            ? 'לא נמצאו כרטיסים שסומנו לפי הבחירה הזו.'
            : 'לא נמצאו כרטיסים שמתאימים לבחירות האלה.',
        )
      }

      navigate(getGameRouteByType(routeType), {
        state: {
          cards: playableCards,
          gameMode: routeType,
          playStyle: 'deck',
          isBookBased: true,
          backRoute: '/premium',
          label: `${researchLabel} לפי ספר`,
          summary: `${selectedBranches.length} סגנונות, ${selectedBooks.length} ספר, רמות לפי סגנון`,
          selections: serverPayload.combinations,
          filters: {
            bookBased: true,
            liked: selectedReplayFilters.includes('liked'),
            loved: selectedReplayFilters.includes('loved'),
            shared: selectedReplayFilters.includes('shared'),
          },
          bookLabelById,
          bookSummary: selectedBookTitles,
          gameCopy: {
            eyebrow: 'משחק לפי ספר',
            title: `${researchLabel} לפי ספר`,
            subtitle: 'הכרטיסים נבחרו לפי קטגוריית המשחק, הספר, הסגנונות והרמות שבחרתם.',
            completeTitle: 'החפיסה לפי הספר הושלמה',
            completeText: 'עברתם על כל הכרטיסים שנשלפו מהספרים שבחרתם.',
            completeAction: 'בחירת משחק לפי ספר חדש',
          },
        },
      })
    } catch (error) {
      setDrawError(error instanceof Error ? error.message : 'לא הצלחנו למשוך כרטיסים לפי הספרים שנבחרו.')
    } finally {
      setIsDrawingResearch(false)
    }
  }

  const renderStep = () => {
    if (stepIndex === 0) {
      return (
        <>
          <div className="couple-step-copy">
            <span>שלב 2 מתוך 5</span>
            <h2 id="couple-step-title">בחרו ספר</h2>
            <p>בחרו ספר אחד שישמש לבניית חפיסה מבוססת ספר. בשלב הבא תבחרו את סגנונות המשחק.</p>
          </div>

          <div className="couple-book-count">
            <strong>{selectedBooks.length}/1</strong>
            <span>{selectedBooks.length > 0 ? 'ספר נבחר' : 'בחרו ספר אחד'}</span>
          </div>

          <div className="couple-book-gallery">
            <button
              type="button"
              className="couple-shelf-arrow couple-shelf-arrow-right"
              aria-label="הזזת הספרייה ימינה"
              onClick={() => scrollBookShelf(1)}
            >
              <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
                <path d="M9 18l6-6-6-6" />
              </svg>
            </button>

            <div
              ref={bookShelfRef}
              className="couple-book-shelf"
              aria-label="דפדוף בספרייה"
              onPointerDown={handleShelfPointerDown}
              onPointerMove={handleShelfPointerMove}
              onPointerUp={handleShelfPointerEnd}
              onPointerCancel={handleShelfPointerEnd}
              onPointerLeave={handleShelfPointerEnd}
            >
              <div ref={bookTrackRef} className="couple-book-track">
                {displayBooks.map((book, index) => {
                  const isBookSelected = selectedBookIds.includes(book.id)
                  const isBookLimitReached = false

                  return (
                    <article
                      key={`${book.id}-${index}`}
                      className={`couple-book-card ${isBookSelected ? 'selected' : ''} ${
                        isBookLimitReached ? 'selection-locked' : ''
                      }`}
                      data-book-id={book.id}
                      aria-disabled={isBookLimitReached}
                      aria-selected={isBookSelected}
                    >
                      <div className="couple-book-select">
                        <span className="couple-book-cover" aria-hidden="true">
                          {book.coverImage ? (
                            <img src={book.coverImage} alt="" draggable="false" />
                          ) : (
                            <span>{book.bookId}</span>
                          )}
                        </span>
                        <span className="couple-book-info">
                          <strong dir={book.titleDirection || 'ltr'} title={book.title}>
                            {book.title}
                          </strong>
                          <em>{book.blurb}</em>
                        </span>
                      </div>

                      <div className="couple-book-actions">
                        <button
                          type="button"
                          className="couple-book-pick"
                          disabled={isBookLimitReached}
                          onPointerDown={handleBookActionPointerDown}
                          onClick={(event) => handleBookSelectClick(event, book)}
                        >
                          {isBookSelected ? 'נבחר' : 'בחר ספר'}
                        </button>

                        {book.sourceUrl ? (
                          <a
                            className="couple-book-link"
                            href={book.sourceUrl}
                            target="_blank"
                            rel="noreferrer"
                            onPointerDown={handleBookActionPointerDown}
                            onClick={(event) => event.stopPropagation()}
                          >
                            פתיחת הספר
                          </a>
                        ) : (
                          <span className="couple-book-link is-disabled">מקור יתווסף</span>
                        )}
                      </div>
                    </article>
                  )
                })}
              </div>
            </div>

            <button
              type="button"
              className="couple-shelf-arrow couple-shelf-arrow-left"
              aria-label="הזזת הספרייה שמאלה"
              onClick={() => scrollBookShelf(-1)}
            >
              <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
                <path d="M15 18l-6-6 6-6" />
              </svg>
            </button>
          </div>
        </>
      )
    }

    if (stepIndex === 1) {
      return (
        <>
          <div className="couple-step-copy">
            <span>שלב 3 מתוך 5</span>
            <h2 id="couple-step-title">{branchStepTitle}</h2>
            <p>
              ספר נבחר: <strong>{selectedBookTitles}</strong>. אפשר לבחור סגנון אחד או כמה סגנונות.
            </p>
          </div>

          <div className="couple-option-grid couple-branch-grid">
            {branches.map((branch) => (
              <button
                key={branch.id}
                type="button"
                className={selectedBranchIds.includes(branch.id) ? 'selected' : ''}
                aria-pressed={selectedBranchIds.includes(branch.id)}
                onClick={() => chooseBranch(branch)}
              >
                <strong>{branch.title}</strong>
                <span>{branch.hint}</span>
              </button>
            ))}
          </div>
        </>
      )
    }

    if (stepIndex === 2) {
      return (
        <>
          <div className="couple-step-copy">
            <span>שלב 4 מתוך 5</span>
            <h2 id="couple-step-title">בחרו רמה לכל סגנון</h2>
            <p>
              הסקאלה היא 1-5 כדי לתת תחושת שליטה נוחה. מאחורי הקלעים היא מותאמת לרמות המשחק הקיימות.
            </p>
          </div>

          <div className="couple-style-level-list">
            {selectedBranches.map((branch) => {
              const scaleLevel = selectedStyleLevels[branch.id]
              const serverLevel = scaleLevel ? mapScaleLevelToServerLevel(scaleLevel) : '-'

              return (
                <section className="couple-style-level-card" key={branch.id}>
                  <div>
                    <strong>{branch.title}</strong>
                    <span>עומק בפועל: רמה {serverLevel}</span>
                  </div>

                  <div className="couple-level-scale" role="radiogroup" aria-label={`בחירת רמה עבור ${branch.title}`}>
                    {levelScaleOptions.map((level) => (
                      <button
                        key={level.id}
                        type="button"
                        className={scaleLevel === level.id ? 'selected' : ''}
                        aria-pressed={scaleLevel === level.id}
                        onClick={() => chooseStyleScaleLevel(branch.id, level.id)}
                      >
                        <strong>{level.title}</strong>
                        <small>{level.hint}</small>
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
        <div className="couple-step-copy">
          <span>שלב 5 מתוך 5</span>
          <h2 id="couple-step-title">החפיסה מבוססת הספר מוכנה</h2>
          <p>
            המערכת תשלוף רק כרטיסים מבוססי ספר לפי קטגוריית המשחק, הספר, הסגנונות והרמות שבחרתם.
          </p>
        </div>

        <div className="couple-summary-card">
          <span>{researchLabel}</span>
          <strong>{serverPayload.totalCombinations} שילובים אפשריים</strong>
          <p>
            {selectedBookTitles} / {selectedStyleLevelText}
          </p>
          <div className="couple-replay-filter-box" aria-label="משחק חוזר לפי סימונים קודמים">
            <div>
              <b>רוצים לשחק שוב בכרטיסים שסימנתם?</b>
              <small>השאירו ריק כדי לקבל את כל הכרטיסים המתאימים לבחירה.</small>
            </div>
            <div className="couple-replay-filters">
              {replayFilters.map((filter) => (
                <button
                  key={filter.id}
                  type="button"
                  className={selectedReplayFilters.includes(filter.id) ? 'selected' : ''}
                  aria-pressed={selectedReplayFilters.includes(filter.id)}
                  onClick={() => toggleReplayFilter(filter.id)}
                >
                  {filter.label}
                </button>
              ))}
            </div>
          </div>
          <button type="button" onClick={drawResearchCards} disabled={isDrawingResearch}>
            {isDrawingResearch ? 'מושכים כרטיסים...' : 'התחילו משחק לפי ספר'}
          </button>
          {drawError ? <small className="couple-draw-error">{drawError}</small> : null}
        </div>
      </>
    )
  }

  return (
    <main className={`couple-research-page ${themeClass}`} dir="rtl">
      <section className="couple-research-shell" aria-label={`משחק לפי ספר ${researchLabel}`}>
        <section className="couple-wizard-layout">
          <section
            key={steps[stepIndex].id}
            className={`couple-wizard-stage ${direction} ${isStepExiting ? 'is-exiting' : ''}`}
            aria-labelledby="couple-step-title"
          >
            {renderStep()}

            <div className="couple-step-actions">
              <button type="button" onClick={() => goToStep(stepIndex - 1)} disabled={stepIndex === 0 || isStepExiting}>
                חזרה
              </button>
              <button
                type="button"
                onClick={() => goToStep(stepIndex + 1)}
                disabled={stepIndex === steps.length - 1 || !canOpenStep(stepIndex + 1) || isStepExiting}
              >
                המשך
              </button>
            </div>
          </section>

          <aside className="couple-progress-panel" aria-label="מד התקדמות עץ הבחירה">
            <div className="couple-progress-heading">
              <span>מד התקדמות</span>
              <strong>{progressPercent}%</strong>
            </div>

            <div className="couple-progress-track" aria-hidden="true">
              <span style={{ '--progress': `${progressPercent}%` }} />
            </div>

            <ol className="couple-progress-steps">
              {steps.map((step, index) => (
                <li key={step.id}>
                  <button
                    type="button"
                    className={`${stepIndex === index ? 'current' : ''} ${
                      canOpenStep(index) && index < stepIndex ? 'done' : ''
                    }`}
                    disabled={!canOpenStep(index) || isStepExiting}
                    aria-disabled={!canOpenStep(index) || isStepExiting}
                    onClick={() => goToStep(index)}
                  >
                    <span>{index + 1}</span>
                    <strong>{step.title}</strong>
                  </button>
                </li>
              ))}
            </ol>
          </aside>
        </section>
      </section>
    </main>
  )
}
