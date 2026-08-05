const DEFAULT_API_BASE = 'https://libagame.somee.com/api';
const normalizeApiBase = (base) => String(base || '').trim().replace(/\/+$/, '');

export const API_BASE = normalizeApiBase(
  process.env.EXPO_PUBLIC_API_BASE || DEFAULT_API_BASE,
);
const API_BASES = [API_BASE];
const PERFECT_DATE_API_BASES = [
  API_BASE,
];
const SELECTED_CARDS_PATHS = [
  'Users/get-selected-cards',
];
const SPECIAL_CARDS_PATHS = [
  'Users/get-special-cards',
];
const UPDATE_STATUS_PATHS = [
  'Users/update-card-status',
];
const MARK_SHARED_PATHS = [
  'Users/mark-card-shared',
];
const SOCIAL_LOGIN_PATHS = [
  'Users/social-login',
];
const RESEARCH_CARDS_PATHS = [
  'research/cards',
];
const PERFECT_DATE_CREATE_PATHS = [
  'perfect-date/create',
];
const PERFECT_DATE_JOIN_PATHS = [
  'perfect-date/join',
];
const PERFECT_DATE_SETUP_PATHS = [
  'perfect-date/setup',
];
const PERFECT_DATE_DECK_PATHS = [
  'perfect-date/deck',
];
const PERFECT_DATE_STATE_PATHS = [
  'perfect-date/state',
];
const PERFECT_DATE_READY_PATHS = [
  'perfect-date/ready',
];
const PERFECT_DATE_REVEAL_READY_PATHS = [
  'perfect-date/reveal-ready',
];

async function readApiResponse(response) {
  const raw = await response.text();
  let data = null;

  try {
    data = raw ? JSON.parse(raw) : null;
  } catch (error) {
    data = null;
  }

  return { response, raw, data };
}

/**
 * Shared API helpers for the client app.
 * Keep all server calls here so UI components stay focused on presentation.
 */

/**
 * Users controller
 * Endpoint: POST /Users/submit-feedback
 * Purpose: send feedback about a specific card, or general app feedback.
 *
 * @param {Object} params
 * @param {number|string} params.userId - current user id
 * @param {number|string} params.cardId - related card id
 * @param {number} [params.rating=5] - feedback rating
 * @param {string} params.comment - feedback text
 * @returns {Promise<Response>}
 */
export async function submitFeedback({
  userId,
  cardId,
  rating = 5,
  comment,
}) {
  const normalizedComment = String(comment ?? '').trim().slice(0, 300);
  const payload = {
    UserID: userId,
    CardID: cardId,
    Rating: rating,
    Comment: normalizedComment,
  };

  const response = await fetch(`${API_BASE}/Users/submit-feedback`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    throw new Error(`submitFeedback failed (${response.status})`);
  }

  return response;
}

/**
 * Users controller
 * Endpoint: POST /Users/get-selected-cards
 * Purpose: fetch cards by selected game mode, categories and difficulty levels.
 *
 * @param {Object} params
 * @param {Array} params.selections
 * @param {string} [params.lang='he']
 * @param {boolean} [params.returnNotFoundObject=false]
 * @returns {Promise<Array|Object|null>}
 */
export async function getSelectedCards({
  selections,
  lang = 'he',
  userId = null,
  returnNotFoundObject = false,
}) {
  let lastError = null;

  for (const base of API_BASES) {
    for (const path of SELECTED_CARDS_PATHS) {
      const url = `${base}/${path}`;
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000);

      try {
        const response = await fetch(url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Accept: 'application/json',
          },
          body: JSON.stringify({
            Selections: selections,
            Lang: lang || 'he',
            UserID: userId,
          }),
          signal: controller.signal,
        });

        const raw = await response.text();
        clearTimeout(timeoutId);

        let data = null;
        try {
          data = raw ? JSON.parse(raw) : null;
        } catch {
        }

        if (response.ok) {
          return data;
        }

        const lowerRaw = (raw || '').toLowerCase();
        if (response.status === 404 || lowerRaw.includes('no cards found')) {
          if (returnNotFoundObject) {
            return { notFound: true };
          }
          continue;
        }

        const message = data?.message || data?.error || `HTTP ${response.status}`;
        throw new Error(message);
      } catch (error) {
        clearTimeout(timeoutId);
        lastError = error;
      }
    }
  }

  throw lastError || new Error('Network/API unreachable');
}

export async function getSpecialCards({
  selections,
  lang = 'he',
  userId = null,
  includeFavoriteCards = false,
  includeFeedbackCards = false,
  includeSharedCards = false,
  returnNotFoundObject = false,
}) {
  let lastError = null;

  for (const base of API_BASES) {
    for (const path of SPECIAL_CARDS_PATHS) {
      const url = `${base}/${path}`;
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000);

      try {
        const response = await fetch(url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Accept: 'application/json',
          },
          body: JSON.stringify({
            Selections: selections,
            Lang: lang || 'he',
            UserID: userId,
            IncludeFavoriteCards: includeFavoriteCards,
            IncludeFeedbackCards: includeFeedbackCards,
            IncludeSharedCards: includeSharedCards,
          }),
          signal: controller.signal,
        });

        const raw = await response.text();
        clearTimeout(timeoutId);

        let data = null;
        try {
          data = raw ? JSON.parse(raw) : null;
        } catch {
        }

        if (response.ok) {
          return data;
        }

        const lowerRaw = (raw || '').toLowerCase();
        if (response.status === 404 || lowerRaw.includes('no special cards found')) {
          if (returnNotFoundObject) {
            return { notFound: true };
          }
          continue;
        }

        const message = data?.message || data?.error || `HTTP ${response.status}`;
        throw new Error(message);
      } catch (error) {
        clearTimeout(timeoutId);
        lastError = error;
      }
    }
  }

  throw lastError || new Error('Network/API unreachable');
}

/**
 * Research controller
 * Endpoint: POST /research/cards
 * Purpose: fetch prepared premium book-based cards by mode, category, book, subcategory and level.
 *
 * @param {Object} params
 * @param {Array} params.selections
 * @param {string} [params.lang='he']
 * @param {number|string|null} [params.userId=null]
 * @param {number} [params.maxCards=18]
 * @returns {Promise<{response: Response, raw: string, data: any}>}
 */
export async function getResearchCards({
  selections,
  lang = 'he',
  userId = null,
  maxCards = 18,
}) {
  let lastError = null;

  for (const base of API_BASES) {
    for (const path of RESEARCH_CARDS_PATHS) {
      const url = `${base}/${path}`;
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 15000);

      try {
        const response = await fetch(url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Accept: 'application/json, text/plain, */*',
          },
          body: JSON.stringify({
            UserID: userId ? Number(userId) : 0,
            Lang: lang || 'he',
            MaxCards: Number(maxCards) || 18,
            Selections: (selections || []).map((selection) => ({
              ModeID: Number(selection.ModeID ?? selection.modeID ?? selection.modeId ?? 0),
              CategoryID: Number(selection.CategoryID ?? selection.categoryID ?? selection.categoryId ?? 0),
              BookID: Number(selection.BookID ?? selection.bookID ?? selection.bookId ?? 0),
              SubCategoryID: Number(
                selection.SubCategoryID ?? selection.subCategoryID ?? selection.subCategoryId ?? 0,
              ),
              LevelID: Number(selection.LevelID ?? selection.levelID ?? selection.levelId ?? 0),
            })),
          }),
          signal: controller.signal,
        });

        clearTimeout(timeoutId);
        return readApiResponse(response);
      } catch (error) {
        clearTimeout(timeoutId);
        lastError = error;
      }
    }
  }

  throw lastError || new Error('Research API unreachable');
}

/**
 * PerfectDate controller
 * Endpoint: POST /perfect-date/create
 * Purpose: create a new perfect date room and receive a random invite code.
 */
export async function createPerfectDate({ userId = null, scheduledAt = null } = {}) {
  let lastError = null;

  for (const base of PERFECT_DATE_API_BASES) {
    for (const path of PERFECT_DATE_CREATE_PATHS) {
      const url = `${base}/${path}`;

      try {
        // השרת מייצר את קוד הדייט הרנדומלי ומחזיר גם קישור לשיתוף.
        const response = await fetch(url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Accept: 'application/json, text/plain, */*',
          },
          body: JSON.stringify({
            UserID: userId ? Number(userId) : null,
            ScheduledAt: scheduledAt,
          }),
        });

        const result = await readApiResponse(response);

        if (!response.ok) {
          lastError = new Error(
            result.raw ||
              result.data?.message ||
              result.data?.error ||
              `HTTP ${response.status}`,
          );
          continue;
        }

        return result;
      } catch (error) {
        lastError = error;
      }
    }
  }

  throw lastError || new Error('Perfect date create API unreachable');
}

/**
 * PerfectDate controller
 * Endpoint: POST /perfect-date/join
 * Purpose: join an existing perfect date room by code.
 */
export async function joinPerfectDate({ dateNumber, userId = null }) {
  let lastError = null;

  for (const base of PERFECT_DATE_API_BASES) {
    for (const path of PERFECT_DATE_JOIN_PATHS) {
      const url = `${base}/${path}`;

      try {
        // הקוד יכול להגיע מהקישור או מהזנה ידנית של המשתמש.
        const response = await fetch(url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Accept: 'application/json, text/plain, */*',
          },
          body: JSON.stringify({
            DateNumber: String(dateNumber ?? '').trim(),
            UserID: userId ? Number(userId) : null,
          }),
        });

        const result = await readApiResponse(response);

        if (!response.ok) {
          lastError = new Error(
            result.raw ||
              result.data?.message ||
              result.data?.error ||
              `HTTP ${response.status}`,
          );
          continue;
        }

        return result;
      } catch (error) {
        lastError = error;
      }
    }
  }

  throw lastError || new Error('Perfect date join API unreachable');
}

/**
 * PerfectDate controller
 * Endpoint: POST /perfect-date/setup
 * Purpose: save the user's required setup answers before launching the date.
 */
export async function savePerfectDateSetup({
  dateNumber,
  accessToken = '',
  userId = null,
  participantRole,
  gender,
  age,
  location,
  vibe,
  goal,
  exactLocation = '',
  limitNoWorkAndMoney = false,
  limitNoFutureTalk = false,
  limitNoHeavyPast = false,
  limitNoPhysical = false,
}) {
  let lastError = null;
  const ageText = String(age ?? '').trim();
  const ageValue = ageText ? Number(ageText) : null;

  for (const base of PERFECT_DATE_API_BASES) {
    for (const path of PERFECT_DATE_SETUP_PATHS) {
      const url = `${base}/${path}`;

      try {
        // המגדר נשמר לדייט, והשרת יעדכן את פרופיל המשתמש ברקע רק אם חסר שם מגדר.
        const response = await fetch(url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Accept: 'application/json, text/plain, */*',
          },
          body: JSON.stringify({
            DateNumber: String(dateNumber ?? '').trim(),
            AccessToken: String(accessToken ?? '').trim(),
            UserID: userId ? Number(userId) : null,
            ParticipantRole: participantRole,
            Gender: gender,
            Age: Number.isFinite(ageValue) ? ageValue : null,
            Location: location,
            Vibe: vibe,
            Goal: goal,
            ExactLocation: String(exactLocation ?? '').trim().slice(0, 30),
            LimitNoWorkAndMoney: Boolean(limitNoWorkAndMoney),
            LimitNoFutureTalk: Boolean(limitNoFutureTalk),
            LimitNoHeavyPast: Boolean(limitNoHeavyPast),
            LimitNoPhysical: Boolean(limitNoPhysical),
          }),
        });

        const result = await readApiResponse(response);

        if (!response.ok) {
          lastError = new Error(
            result.raw ||
              result.data?.message ||
              result.data?.error ||
              `HTTP ${response.status}`,
          );
          continue;
        }

        return result;
      } catch (error) {
        lastError = error;
      }
    }
  }

  throw lastError || new Error('Perfect date setup API unreachable');
}

/**
 * PerfectDate controller
 * Endpoint: POST /perfect-date/deck
 * Purpose: fetch the filtered translated deck for the current perfect date session.
 */
export async function fetchPerfectDateDeck({
  dateNumber,
  accessToken = '',
  userId = null,
  participantRole,
  languageCode = 'he',
}) {
  let lastError = null;

  for (const base of PERFECT_DATE_API_BASES) {
    for (const path of PERFECT_DATE_DECK_PATHS) {
      const url = `${base}/${path}`;

      try {
        const response = await fetch(url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Accept: 'application/json, text/plain, */*',
          },
          body: JSON.stringify({
            DateNumber: String(dateNumber ?? '').trim(),
            AccessToken: String(accessToken ?? '').trim(),
            UserID: userId ? Number(userId) : null,
            ParticipantRole: participantRole,
            LanguageCode: languageCode || 'he',
          }),
        });

        const result = await readApiResponse(response);

        if (!response.ok) {
          lastError = new Error(
            result.raw ||
              result.data?.message ||
              result.data?.error ||
              `HTTP ${response.status}`,
          );
          continue;
        }

        return result;
      } catch (error) {
        lastError = error;
      }
    }
  }

  throw lastError || new Error('Perfect date deck API unreachable');
}

export async function fetchPerfectDateState({
  dateNumber,
  accessToken = '',
  userId = null,
  participantRole,
  languageCode = 'he',
}) {
  let lastError = null;

  for (const base of PERFECT_DATE_API_BASES) {
    for (const path of PERFECT_DATE_STATE_PATHS) {
      const url = `${base}/${path}`;

      try {
        const response = await fetch(url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Accept: 'application/json, text/plain, */*',
          },
          body: JSON.stringify({
            DateNumber: String(dateNumber ?? '').trim(),
            AccessToken: String(accessToken ?? '').trim(),
            UserID: userId ? Number(userId) : null,
            ParticipantRole: participantRole,
            LanguageCode: languageCode || 'he',
          }),
        });

        const result = await readApiResponse(response);

        if (!response.ok) {
          lastError = new Error(
            result.raw ||
              result.data?.message ||
              result.data?.error ||
              `HTTP ${response.status}`,
          );
          continue;
        }

        return result;
      } catch (error) {
        lastError = error;
      }
    }
  }

  throw lastError || new Error('Perfect date state API unreachable');
}

export async function markPerfectDateTaskReady({
  dateNumber,
  accessToken = '',
  userId = null,
  participantRole,
  perfectDateTaskId,
  languageCode = 'he',
}) {
  let lastError = null;

  for (const base of PERFECT_DATE_API_BASES) {
    for (const path of PERFECT_DATE_READY_PATHS) {
      const url = `${base}/${path}`;

      try {
        const response = await fetch(url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Accept: 'application/json, text/plain, */*',
          },
          body: JSON.stringify({
            DateNumber: String(dateNumber ?? '').trim(),
            AccessToken: String(accessToken ?? '').trim(),
            UserID: userId ? Number(userId) : null,
            ParticipantRole: participantRole,
            PerfectDateTaskID: Number(perfectDateTaskId || 0),
            LanguageCode: languageCode || 'he',
          }),
        });

        const result = await readApiResponse(response);

        if (response.status === 409 && result.data) {
          return result;
        }

        if (!response.ok) {
          lastError = new Error(
            result.raw ||
              result.data?.message ||
              result.data?.error ||
              `HTTP ${response.status}`,
          );
          continue;
        }

        return result;
      } catch (error) {
        lastError = error;
      }
    }
  }

  throw lastError || new Error('Perfect date ready API unreachable');
}

export async function markPerfectDateTaskRevealReady({
  dateNumber,
  accessToken = '',
  userId = null,
  participantRole,
  perfectDateTaskId,
  languageCode = 'he',
}) {
  let lastError = null;

  for (const base of PERFECT_DATE_API_BASES) {
    for (const path of PERFECT_DATE_REVEAL_READY_PATHS) {
      const url = `${base}/${path}`;

      try {
        const response = await fetch(url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Accept: 'application/json, text/plain, */*',
          },
          body: JSON.stringify({
            DateNumber: String(dateNumber ?? '').trim(),
            AccessToken: String(accessToken ?? '').trim(),
            UserID: userId ? Number(userId) : null,
            ParticipantRole: participantRole,
            PerfectDateTaskID: Number(perfectDateTaskId || 0),
            LanguageCode: languageCode || 'he',
          }),
        });

        const result = await readApiResponse(response);

        if (response.status === 409 && result.data) {
          return result;
        }

        if (!response.ok) {
          lastError = new Error(
            result.raw ||
              result.data?.message ||
              result.data?.error ||
              `HTTP ${response.status}`,
          );
          continue;
        }

        return result;
      } catch (error) {
        lastError = error;
      }
    }
  }

  throw lastError || new Error('Perfect date reveal API unreachable');
}

/**
 * Users controller
 * Endpoint: POST /users/resend-verification-email
 * Purpose: resend account verification mail after a blocked login attempt.
 *
 * @param {Object} params
 * @param {string} params.email
 * @returns {Promise<{response: Response, raw: string, data: any}>}
 */
export async function resendVerificationEmail({ email }) {
  const response = await fetch(`${API_BASE}/Users/resend-verification-email`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: email.trim(),
    }),
  });

  return readApiResponse(response);
}

/**
 * Users controller
 * Endpoint: POST /Users/password-reset/request
 * Purpose: ask the server to send a password reset mail.
 *
 * @param {Object} params
 * @param {string} params.email
 * @returns {Promise<{response: Response, raw: string, data: any}>}
 */
export async function requestPasswordReset({ email }) {
  const response = await fetch(`${API_BASE}/Users/password-reset/request`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: email.trim(),
    }),
  });

  return readApiResponse(response);
}

/**
 * Users controller
 * Endpoint: POST /Users/password-reset/confirm
 * Purpose: confirm a password reset using the mail token and the new password.
 *
 * @param {Object} params
 * @param {string} params.email
 * @param {string} params.token
 * @param {string} params.newPassword
 * @returns {Promise<{response: Response, raw: string, data: any}>}
 */
export async function confirmPasswordReset({ email, token, newPassword }) {
  const response = await fetch(`${API_BASE}/Users/password-reset/confirm`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email,
      token,
      newPassword,
    }),
  });

  return readApiResponse(response);
}

/**
 * Users controller
 * Endpoint: POST /Users/update-card-status
 * Purpose: update a user's reaction state for a specific card.
 *
 * @param {Object} params
 * @param {number|string} params.userId
 * @param {number|string} params.cardId
 * @param {number} [params.likeStatus=0]
 * @param {boolean} [params.isCompleted=false]
 * @returns {Promise<{response: Response, raw: string, data: any}>}
 */
export async function updateCardStatus({
  userId,
  cardId,
  likeStatus = 0,
  isCompleted = false,
}) {
  let lastError = null;

  for (const base of API_BASES) {
    for (const path of UPDATE_STATUS_PATHS) {
      const url = `${base}/${path}`;

      try {
        const response = await fetch(url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Accept: 'application/json, text/plain, */*',
          },
          body: JSON.stringify({
            userID: userId,
            cardID: cardId,
            isCompleted,
            likeStatus,
          }),
        });

        const result = await readApiResponse(response);

        if (!response.ok) {
          lastError = new Error(
            result.raw ||
              result.data?.message ||
              result.data?.error ||
              `HTTP ${response.status}`,
          );
          continue;
        }

        return result;
      } catch (error) {
        lastError = error;
      }
    }
  }

  throw lastError || new Error('Failed to update card status');
}

export async function markCardShared({ userId, cardId }) {
  let lastError = null;

  for (const base of API_BASES) {
    for (const path of MARK_SHARED_PATHS) {
      const url = `${base}/${path}`;

      try {
        const response = await fetch(url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Accept: 'application/json, text/plain, */*',
          },
          body: JSON.stringify({
            userID: userId,
            cardID: cardId,
          }),
        });

        const result = await readApiResponse(response);

        if (!response.ok) {
          lastError = new Error(
            result.raw ||
              result.data?.message ||
              result.data?.error ||
              `HTTP ${response.status}`,
          );
          continue;
        }

        return result;
      } catch (error) {
        lastError = error;
      }
    }
  }

  throw lastError || new Error('Failed to save card share');
}

/**
 * Users controller
 * Endpoint: POST /users/login
 * Purpose: authenticate a user with email and password.
 *
 * @param {Object} params
 * @param {string} params.email
 * @param {string} params.password
 * @returns {Promise<{response: Response, raw: string, data: any}>}
 */
export async function loginUser({ email, password }) {
  const response = await fetch(`${API_BASE}/Users/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: email.trim(),
      password,
    }),
  });

  return readApiResponse(response);
}

/**
 * Users controller
 * Endpoint: POST /users/register
 * Purpose: create a new user account.
 *
 * @param {Object} params
 * @param {string} params.nickname
 * @param {string} params.gender
 * @param {string} params.email
 * @param {string} params.passwordHash
 * @param {number} params.age
 * @returns {Promise<{response: Response, raw: string, data: any}>}
 */
export async function registerUserAccount({
  nickname,
  gender,
  email,
  passwordHash,
  age,
}) {
  const response = await fetch(`${API_BASE}/Users/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      nickname: nickname.trim(),
      gender,
      email: email.trim(),
      passwordHash,
      age,
    }),
  });

  return readApiResponse(response);
}

/**
 * Users controller
 * Endpoint: POST /users/social-login
 * Purpose: finish a Google/Firebase login against the app backend.
 *
 * @param {Object} params
 * @param {string} params.idToken
 * @param {string} params.email
 * @param {string} params.nickname
 * @param {string} params.gender
 * @param {number|null} [params.age=null]
 * @returns {Promise<{response: Response, raw: string, data: any}>}
 */
export async function socialLoginUser({
  idToken,
  email,
  nickname,
  gender,
  age = null,
}) {
  let lastError = null;

  for (const base of API_BASES) {
    for (const path of SOCIAL_LOGIN_PATHS) {
      const url = `${base}/${path}`;
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 15000);

      try {
        const response = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            idToken,
            email: (email || '').trim(),
            nickname: (nickname || '').trim(),
            gender,
            age,
          }),
          signal: controller.signal,
        });

        clearTimeout(timeoutId);
        return readApiResponse(response);
      } catch (error) {
        clearTimeout(timeoutId);
        lastError = error;
      }
    }
  }

  throw lastError || new Error('Social login API unreachable');
}

/**
 * Users controller
 * Endpoint: PUT /Users/update-details/{userId}
 * Purpose: complete or update profile fields after social sign-in.
 *
 * @param {Object} params
 * @param {number|string} params.userId
 * @param {string} params.nickname
 * @param {string} params.gender
 * @param {number|null} params.age
 * @returns {Promise<{response: Response, raw: string, data: any}>}
 */
export async function updateUserDetails({ userId, nickname, gender, age }) {
  const response = await fetch(`${API_BASE}/Users/update-details/${userId}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      nickname: (nickname || '').trim(),
      gender,
      age,
    }),
  });

  return readApiResponse(response);
}
