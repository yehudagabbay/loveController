import { useCallback, useEffect, useRef, useState } from 'react'
import { BrowserRouter, Routes, Route, useLocation, useNavigate } from 'react-router-dom'

import Login from './comp/LoginComp/Login'
import Registration from './comp/LoginComp/Registration'
import Welcom from './comp/WelcomaComp/Welcom'
import GameModeSelect from './comp/WelcomaComp/GameModeSelect'
import ProfilePlan from './comp/ProfileComp/ProfilePlan'
import CoupleGameSelectCard from './comp/gameComp/CoupleGame/CoupleGameSelectCard'
import CoupleGameCard from './comp/gameComp/CoupleGame/CoupleGameCard'
import CoupleRouletteGame from './comp/gameComp/CoupleGame/CoupleRouletteGame'
import SocialGameSelectCard from './comp/gameComp/SocialGame/SocialGameSelectCard'
import Research from './comp/premium/research'
import PerfectDateInvite from './comp/PerfectDateInvite'

import { clearGoogleIdentitySession } from './api/ApiTools'
import { useLanguage } from './localization/languageStore'

const AUTH_USER_STORAGE_KEY = 'liba_web_auth_user'

function readStoredAuthUser() {
  if (typeof window === 'undefined') {
    return null
  }

  const params = new URLSearchParams(window.location.search)
  const verified = params.get('verified')
  const email = params.get('email')

  if (verified === '1') {
    const verifiedUser = {
      entryType: 'login',
      nickname: email || 'LIBA',
      email: email || '',
    }

    saveStoredAuthUser(verifiedUser)
    return verifiedUser
  }

  try {
    const storedUser = window.localStorage.getItem(AUTH_USER_STORAGE_KEY)
    return storedUser ? JSON.parse(storedUser) : null
  } catch {
    window.localStorage.removeItem(AUTH_USER_STORAGE_KEY)
    return null
  }
}

function saveStoredAuthUser(user) {
  if (typeof window === 'undefined') {
    return
  }

  const storedUser = JSON.stringify(user, (key, value) => {
    const normalizedKey = key.toLowerCase()

    if (
      normalizedKey === 'firebaseidtoken' ||
      normalizedKey === 'idtoken' ||
      normalizedKey === 'token'
    ) {
      return undefined
    }

    return value
  })

  window.localStorage.setItem(AUTH_USER_STORAGE_KEY, storedUser)
}

function clearStoredAuthUser() {
  if (typeof window === 'undefined') {
    return
  }

  window.localStorage.removeItem(AUTH_USER_STORAGE_KEY)
}

function getInitialAuthMode() {
  if (typeof window === 'undefined') {
    return 'register'
  }

  const params = new URLSearchParams(window.location.search)
  return params.get('verified') === '0' ? 'login' : 'register'
}

function getRegisteredUserId(user) {
  const visited = new Set()
  const idKeys = new Set(['UserID', 'userID', 'UserId', 'userId'])

  function findId(value) {
    if (!value || typeof value !== 'object' || visited.has(value)) {
      return null
    }

    visited.add(value)

    for (const key of idKeys) {
      const candidate = value[key]

      if (candidate !== undefined && candidate !== null && candidate !== '') {
        return candidate
      }
    }

    for (const nestedValue of Object.values(value)) {
      const nestedId = findId(nestedValue)

      if (nestedId !== null) {
        return nestedId
      }
    }

    return null
  }

  return findId(user)
}

function AppContent() {
  const { t } = useLanguage()
  const navigate = useNavigate()
  const location = useLocation()

  const [authMode, setAuthMode] = useState(getInitialAuthMode)
  const [transition, setTransition] = useState({
    active: false,
    direction: 'to-login',
    key: 0,
  })

  const [registeredUser, setRegisteredUser] = useState(readStoredAuthUser)
  const timersRef = useRef([])
  const registeredUserId = getRegisteredUserId(registeredUser)

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const verified = params.get('verified')

    if (verified === '1' || verified === '0') {
      window.history.replaceState({}, '', window.location.pathname)
    }
  }, [])

  useEffect(() => {
    return () => {
      timersRef.current.forEach((timerId) => window.clearTimeout(timerId))
    }
  }, [])

  const queueTimer = (callback, delay) => {
    const timerId = window.setTimeout(callback, delay)
    timersRef.current.push(timerId)
  }

  const handleAuthSuccess = useCallback(
    (user) => {
      setRegisteredUser(user)
      saveStoredAuthUser(user)
      navigate('/')
    },
    [navigate],
  )

  const handleAuthModeChange = (nextMode) => {
    if (nextMode === authMode || transition.active) {
      return
    }

    timersRef.current.forEach((timerId) => window.clearTimeout(timerId))
    timersRef.current = []

    const nextKey = Date.now()
    const direction = nextMode === 'login' ? 'to-login' : 'to-register'

    setTransition({
      active: true,
      direction,
      key: nextKey,
    })

    queueTimer(() => setAuthMode(nextMode), 190)

    queueTimer(() => {
      setTransition((current) =>
        current.key === nextKey ? { ...current, active: false } : current,
      )
    }, 760)
  }

  const handleNavigate = (pageName) => {
    if (pageName === 'games') {
      navigate('/games')
      return
    }

    if (pageName === 'home') {
      navigate('/')
      return
    }

    if (pageName === 'profile') {
      navigate('/profile')
      return
    }

    if (pageName === 'research') {
      navigate('/premium')
      return
    }

    navigate('/')
  }

  const handleLogout = () => {
    timersRef.current.forEach((timerId) => window.clearTimeout(timerId))
    timersRef.current = []

    clearStoredAuthUser()
    clearGoogleIdentitySession()

    setRegisteredUser(null)
    setAuthMode('login')

    setTransition({
      active: false,
      direction: 'to-login',
      key: Date.now(),
    })

    navigate('/')
  }

  if (location.pathname.startsWith('/perfect-date/')) {
    return <PerfectDateInvite />
  }

  if (!registeredUser) {
    const page =
      authMode === 'login' ? (
        <Login
          authMode={authMode}
          onAuthModeChange={handleAuthModeChange}
          onLoginSuccess={handleAuthSuccess}
        />
      ) : (
        <Registration
          authMode={authMode}
          onAuthModeChange={handleAuthModeChange}
          onRegistrationSuccess={handleAuthSuccess}
        />
      )

    return (
      <div
        className={`auth-stage ${transition.active ? 'is-switching' : ''} ${transition.direction}`}
      >
        {page}

        <div className="auth-transition-layer" aria-hidden="true">
          <div className="auth-transition-band" />
          <div className="auth-transition-mark">{t('common.brandShort')}</div>
        </div>
      </div>
    )
  }

  return (
    <div className="route-transition-frame" key={location.pathname}>
      <Routes>
        <Route
          path="/"
          element={
            <Welcom
              user={registeredUser}
              activePage="games"
              onNavigate={handleNavigate}
              onLogout={handleLogout}
            >
              <GameModeSelect />
            </Welcom>
          }
        />

        <Route
          path="/games"
          element={
            <Welcom
              user={registeredUser}
              activePage="games"
              onNavigate={handleNavigate}
              onLogout={handleLogout}
            >
              <GameModeSelect />
            </Welcom>
          }
        />

        <Route
          path="/profile"
          element={
            <Welcom
              user={registeredUser}
              activePage="profile"
              onNavigate={handleNavigate}
              onLogout={handleLogout}
            >
              <ProfilePlan user={registeredUser} />
            </Welcom>
          }
        />

        <Route
          path="/premium"
          element={
            <Welcom
              user={registeredUser}
              activePage="research"
              onNavigate={handleNavigate}
              onLogout={handleLogout}
            >
              <Research user={registeredUser} userId={registeredUserId} />
            </Welcom>
          }
        />

        <Route
          path="/research"
          element={
            <Welcom
              user={registeredUser}
              activePage="research"
              onNavigate={handleNavigate}
              onLogout={handleLogout}
            >
              <Research user={registeredUser} userId={registeredUserId} />
            </Welcom>
          }
        />

        <Route
          path="/couple-game-select"
          element={
            <Welcom
              user={registeredUser}
              activePage="games"
              onNavigate={handleNavigate}
              onLogout={handleLogout}
            >
              <CoupleGameSelectCard
                userId={registeredUserId}
                onDrawCards={(drawResult) => {
                  navigate(
                    drawResult.playStyle === 'roulette' ? '/couple-roulette-game' : '/couple-game',
                    { state: drawResult },
                  )
                }}
              />
            </Welcom>
          }
        />

        <Route
          path="/couple-roulette-game"
          element={
            <Welcom
              user={registeredUser}
              activePage="games"
              onNavigate={handleNavigate}
              onLogout={handleLogout}
            >
              <CoupleRouletteGame
                cards={location.state?.cards}
                request={location.state}
                userId={registeredUserId}
                onBack={() => navigate('/couple-game-select')}
                onRegularDeck={() => navigate('/couple-game', { state: location.state })}
              />
            </Welcom>
          }
        />

        <Route
          path="/couple-game"
          element={
            <Welcom
              user={registeredUser}
              activePage={location.state?.isBookBased ? 'research' : 'games'}
              onNavigate={handleNavigate}
              onLogout={handleLogout}
            >
              <CoupleGameCard
                cards={location.state?.cards}
                request={location.state}
                userId={registeredUserId}
                onBack={() => navigate(location.state?.backRoute || '/couple-game-select')}
              />
            </Welcom>
          }
        />

        <Route
          path="/friends-game-select"
          element={
            <Welcom
              user={registeredUser}
              activePage="games"
              onNavigate={handleNavigate}
              onLogout={handleLogout}
            >
              <SocialGameSelectCard
                gameType="friends"
                userId={registeredUserId}
                onDrawCards={(drawResult) => {
                  navigate(
                    drawResult.playStyle === 'roulette' ? '/friends-roulette-game' : '/friends-game',
                    { state: drawResult },
                  )
                }}
              />
            </Welcom>
          }
        />

        <Route
          path="/friends-roulette-game"
          element={
            <Welcom
              user={registeredUser}
              activePage="games"
              onNavigate={handleNavigate}
              onLogout={handleLogout}
            >
              <CoupleRouletteGame
                gameType="friends"
                cards={location.state?.cards}
                request={location.state}
                userId={registeredUserId}
                onBack={() => navigate('/friends-game-select')}
                onRegularDeck={() => navigate('/friends-game', { state: location.state })}
              />
            </Welcom>
          }
        />

        <Route
          path="/friends-game"
          element={
            <Welcom
              user={registeredUser}
              activePage={location.state?.isBookBased ? 'research' : 'games'}
              onNavigate={handleNavigate}
              onLogout={handleLogout}
            >
              <CoupleGameCard
                cards={location.state?.cards}
                request={location.state}
                userId={registeredUserId}
                onBack={() => navigate(location.state?.backRoute || '/friends-game-select')}
              />
            </Welcom>
          }
        />

        <Route
          path="/family-game-select"
          element={
            <Welcom
              user={registeredUser}
              activePage="games"
              onNavigate={handleNavigate}
              onLogout={handleLogout}
            >
              <SocialGameSelectCard
                gameType="family"
                userId={registeredUserId}
                onDrawCards={(drawResult) => {
                  navigate(
                    drawResult.playStyle === 'roulette' ? '/family-roulette-game' : '/family-game',
                    { state: drawResult },
                  )
                }}
              />
            </Welcom>
          }
        />

        <Route
          path="/family-roulette-game"
          element={
            <Welcom
              user={registeredUser}
              activePage="games"
              onNavigate={handleNavigate}
              onLogout={handleLogout}
            >
              <CoupleRouletteGame
                gameType="family"
                cards={location.state?.cards}
                request={location.state}
                userId={registeredUserId}
                onBack={() => navigate('/family-game-select')}
                onRegularDeck={() => navigate('/family-game', { state: location.state })}
              />
            </Welcom>
          }
        />

        <Route
          path="/family-game"
          element={
            <Welcom
              user={registeredUser}
              activePage={location.state?.isBookBased ? 'research' : 'games'}
              onNavigate={handleNavigate}
              onLogout={handleLogout}
            >
              <CoupleGameCard
                cards={location.state?.cards}
                request={location.state}
                userId={registeredUserId}
                onBack={() => navigate(location.state?.backRoute || '/family-game-select')}
              />
            </Welcom>
          }
        />

        <Route
          path="*"
          element={
            <Welcom
              user={registeredUser}
              activePage="games"
              onNavigate={handleNavigate}
              onLogout={handleLogout}
            >
              <GameModeSelect />
            </Welcom>
          }
        />
      </Routes>
    </div>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <AppContent />
    </BrowserRouter>
  )
}
