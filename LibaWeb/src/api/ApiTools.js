/**
 * Central API surface for LIBA WEB.
 *
 * Keep every external call here:
 * - LIBA backend calls
 * - Google Identity script loading
 * - Firebase REST token exchange for Google sign-in
 *
 * UI components should import functions from this file only, so endpoint
 * changes and payload contracts stay controlled in one place.
 */

export const API_BASE = import.meta.env.VITE_API_BASE || 'https://libagame.somee.com/api'

export const GOOGLE_WEB_CLIENT_ID =
  import.meta.env.VITE_GOOGLE_WEB_CLIENT_ID ||
  '726714686390-s7qsqqu51hhh3mq1srqj74s91907ls2c.apps.googleusercontent.com'

export const FIREBASE_API_KEY =
  import.meta.env.VITE_FIREBASE_API_KEY || 'AIzaSyAzPpTKNvRPE64y_1CKj9TVzxJCNf2FGXY'

const GOOGLE_IDENTITY_SCRIPT_ID = 'google-identity-services'
const GOOGLE_IDENTITY_SCRIPT_SRC = 'https://accounts.google.com/gsi/client'
const REQUEST_TIMEOUT_MS = 15000

async function readApiResponse(response) {
  const raw = await response.text()

  try {
    const data = raw ? JSON.parse(raw) : null
    return { response, raw, data }
  } catch {
    return { response, raw, data: null }
  }
}

async function postJson(url, body, timeoutMs = REQUEST_TIMEOUT_MS) {
  const controller = new AbortController()
  const timeoutId = window.setTimeout(() => controller.abort(), timeoutMs)

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        Accept: 'application/json, text/plain, */*',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
      signal: controller.signal,
    })

    return readApiResponse(response)
  } finally {
    window.clearTimeout(timeoutId)
  }
}

async function getJson(url, timeoutMs = REQUEST_TIMEOUT_MS) {
  const controller = new AbortController()
  const timeoutId = window.setTimeout(() => controller.abort(), timeoutMs)

  try {
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        Accept: 'application/json, text/plain, */*',
      },
      signal: controller.signal,
    })

    return readApiResponse(response)
  } finally {
    window.clearTimeout(timeoutId)
  }
}

/**
 * Users controller
 * Endpoint: POST /Users/register
 * Purpose: create a regular email/password account and trigger server email verification.
 */
export async function registerUserAccount({ nickname, gender, email, password, age }) {
  return postJson(`${API_BASE}/Users/register?client=web`, {
    nickname: nickname.trim(),
    gender,
    email: email.trim(),
    passwordHash: password,
    age: Number(age),
  })
}

export async function resendVerificationEmail(email) {
  return postJson(`${API_BASE}/Users/resend-verification-email?client=web`, {
    email: email.trim(),
  })
}

export async function requestPasswordReset(email) {
  return postJson(`${API_BASE}/Users/password-reset/request?client=web`, {
    email: email.trim(),
  })
}

export async function confirmPasswordReset({ email, token, newPassword }) {
  return postJson(`${API_BASE}/Users/password-reset/confirm`, {
    email: email.trim(),
    token,
    newPassword,
  })
}

/**
 * Users controller
 * Endpoint: POST /Users/login
 * Purpose: authenticate a regular email/password account.
 */
export async function loginUserAccount({ email, password }) {
  return postJson(`${API_BASE}/Users/login`, {
    email: email.trim(),
    password,
  })
}

/**
 * Users controller
 * Endpoint: POST /Users/social-login
 * Purpose: login or create a user through Google/Firebase.
 * Server behavior is authoritative:
 * - existing social account logs in
 * - new Google user is created
 * - backend errors/messages are shown by the UI
 */
export async function socialLoginUser({ idToken, email, nickname, gender = 'N/A', age = null }) {
  return postJson(`${API_BASE}/Users/social-login`, {
    idToken,
    email: (email || '').trim(),
    nickname: (nickname || '').trim(),
    gender,
    age,
  })
}

/**
 * Users controller
 * Endpoint: POST /Users/get-selected-cards
 * Purpose: draw cards by mode, category and level selections.
 */
export async function getSelectedCards({ selections, lang = 'he', userId = null }) {
  return postJson(`${API_BASE}/Users/get-selected-cards`, {
    Selections: selections,
    Lang: lang || 'he',
    UserID: userId ? Number(userId) : null,
  })
}

/**
 * Users controller
 * Endpoint: POST /Users/get-special-cards
 * Purpose: draw cards from previous user marks, filtered by selected categories and levels.
 */
export async function getSpecialCards({
  selections,
  lang = 'he',
  userId = null,
  includeFavoriteCards = false,
  includeFeedbackCards = false,
  includeSharedCards = false,
}) {
  return postJson(`${API_BASE}/Users/get-special-cards`, {
    Selections: selections,
    Lang: lang || 'he',
    UserID: userId ? Number(userId) : null,
    IncludeFavoriteCards: includeFavoriteCards,
    IncludeFeedbackCards: includeFeedbackCards,
    IncludeSharedCards: includeSharedCards,
  })
}

/**
 * Research controller
 * Endpoint: POST /research/cards
 * Purpose: draw premium book-based cards by mode, category, book, subcategory and level.
 * The backend route name is still /research/cards, but the WEB product language is book-based cards.
 */
export async function getResearchCards({
  selections,
  lang = 'he',
  userId = null,
  maxCards = 18,
}) {
  return postJson(`${API_BASE}/research/cards`, {
    userID: userId ? Number(userId) : 0,
    lang: lang || 'he',
    maxCards: Number(maxCards) || 18,
    selections: (selections || []).map((selection) => ({
      modeID: Number(selection.ModeID ?? selection.modeID ?? selection.modeId ?? 0),
      categoryID: Number(selection.CategoryID ?? selection.categoryID ?? selection.categoryId ?? 0),
      bookID: Number(selection.BookID ?? selection.bookID ?? selection.bookId ?? 0),
      subCategoryID: Number(
        selection.SubCategoryID ?? selection.subCategoryID ?? selection.subCategoryId ?? 0,
      ),
      levelID: Number(selection.LevelID ?? selection.levelID ?? selection.levelId ?? 0),
    })),
  })
}

export async function getBookBasedCards(options) {
  return getResearchCards(options)
}

/**
 * Subscriptions controller
 * Endpoint: GET /Subscriptions/user-plan/{userId}
 * Purpose: read the user's current plan before opening premium-only flows.
 */
export async function getUserPlan(userId) {
  return getJson(`${API_BASE}/Subscriptions/user-plan/${Number(userId)}`)
}

/**
 * Users controller
 * Endpoint: POST /Users/update-card-status
 * Purpose: save per-user card state: completed, liked or favorite.
 */
export async function updateCardStatus({
  userId,
  cardId,
  isCompleted = false,
  likeStatus = 0,
}) {
  return postJson(`${API_BASE}/Users/update-card-status`, {
    userID: Number(userId),
    cardID: Number(cardId),
    isCompleted,
    likeStatus,
  })
}

/**
 * Users controller
 * Endpoint: POST /Users/submit-feedback
 * Purpose: save a rating and optional comment for a card.
 */
export async function submitCardFeedback({ userId, cardId, rating = 5, comment = '' }) {
  return postJson(`${API_BASE}/Users/submit-feedback`, {
    UserID: Number(userId),
    CardID: Number(cardId),
    Rating: Number(rating),
    Comment: String(comment || '').trim().slice(0, 300),
  })
}

/**
 * Users controller
 * Endpoint: POST /Users/mark-card-shared
 * Purpose: remember that the user shared a card.
 */
export async function markCardShared({ userId, cardId }) {
  return postJson(`${API_BASE}/Users/mark-card-shared`, {
    userID: Number(userId),
    cardID: Number(cardId),
  })
}

/**
 * Google Identity Services
 * Purpose: load Google's browser auth script once.
 */
export function loadGoogleIdentityScript() {
  if (window.google?.accounts?.id) {
    return Promise.resolve()
  }

  const existingScript = document.getElementById(GOOGLE_IDENTITY_SCRIPT_ID)
  if (existingScript) {
    return new Promise((resolve, reject) => {
      existingScript.addEventListener('load', () => resolve(), { once: true })
      existingScript.addEventListener('error', () => reject(new Error('Google script failed')), {
        once: true,
      })
    })
  }

  return new Promise((resolve, reject) => {
    const script = document.createElement('script')
    script.id = GOOGLE_IDENTITY_SCRIPT_ID
    script.src = GOOGLE_IDENTITY_SCRIPT_SRC
    script.async = true
    script.defer = true
    script.onload = () => resolve()
    script.onerror = () => reject(new Error('Google script failed'))
    document.head.appendChild(script)
  })
}

/**
 * Google Identity Services
 * Purpose: clear Google's automatic account selection for this browser session.
 * This does not sign the user out of Google globally; it only disconnects LIBA WEB UI state.
 */
export function clearGoogleIdentitySession() {
  window.google?.accounts?.id?.disableAutoSelect?.()
}

/**
 * Firebase Auth REST API
 * Endpoint: accounts:signInWithIdp
 * Purpose: exchange Google ID token for Firebase ID token, because the server
 * verifies Firebase tokens with FirebaseAuth.DefaultInstance.VerifyIdTokenAsync.
 */
export async function exchangeGoogleCredentialForFirebaseToken(googleIdToken) {
  const postBody = new URLSearchParams({
    id_token: googleIdToken,
    providerId: 'google.com',
  }).toString()

  const result = await postJson(
    `https://identitytoolkit.googleapis.com/v1/accounts:signInWithIdp?key=${FIREBASE_API_KEY}`,
    {
      postBody,
      requestUri: window.location.origin,
      returnIdpCredential: true,
      returnSecureToken: true,
    },
  )

  if (!result.response.ok) {
    const errorMessage =
      result.data?.error?.message || result.data?.message || result.raw || 'Firebase auth failed'
    throw new Error(errorMessage)
  }

  return {
    firebaseIdToken: result.data?.idToken,
    firebaseUid: result.data?.localId,
    email: result.data?.email,
    displayName: result.data?.displayName,
    raw: result.data,
  }
}
