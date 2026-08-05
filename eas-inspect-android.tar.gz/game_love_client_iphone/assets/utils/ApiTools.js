export const API_BASE = 'https://libagame.somee.com/api';
const API_BASES = [API_BASE];
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
