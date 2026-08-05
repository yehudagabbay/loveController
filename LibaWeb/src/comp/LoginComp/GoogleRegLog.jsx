import { useCallback, useEffect, useRef, useState } from 'react'
import {
  GOOGLE_WEB_CLIENT_ID,
  exchangeGoogleCredentialForFirebaseToken,
  loadGoogleIdentityScript,
  socialLoginUser,
} from '../../api/ApiTools'
import { useLanguage } from '../../localization/languageStore'
import './GoogleRegLog.css'

const GOOGLE_PROGRESS_STEPS = ['google', 'firebase', 'server', 'ready']
const STEP_PAUSE_MS = 160
const SUCCESS_PAUSE_MS = 320

function pause(ms) {
  return new Promise((resolve) => {
    window.setTimeout(resolve, ms)
  })
}

function getApiErrorMessage(result, t) {
  const message =
    result.data?.message ||
    result.data?.error ||
    result.raw ||
    t('auth.google.serverError')

  const normalized = String(message).toLowerCase()

  if (normalized.includes('social account is already linked to a different email')) {
    return t('auth.google.differentEmail')
  }

  if (normalized.includes('email is already linked to a different social account')) {
    return t('auth.google.differentSocial')
  }

  return message
}

function getSocialUser({ data, email, displayName, firebaseUid, firebaseIdToken }) {
  const userId = String(data?.UserID ?? data?.userID ?? data?.id ?? '')

  return {
    UserID: userId ? Number(userId) : undefined,
    Email: data?.Email || data?.email || email,
    Nickname: data?.Nickname || data?.nickname || displayName,
    Gender: data?.Gender || data?.gender || 'N/A',
    Age: data?.Age ?? data?.age ?? null,
    SocialID: data?.SocialID || data?.socialID || firebaseUid,
    FirebaseUID: data?.FirebaseUID || data?.firebaseUID || firebaseUid,
    FirebaseIdToken: firebaseIdToken,
  }
}

export default function GoogleRegLog({ mode = 'login', onSuccess }) {
  const { lang, t } = useLanguage()

  const buttonRef = useRef(null)
  const mountedRef = useRef(true)

  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState(null)
  const [phase, setPhase] = useState('idle')

  const setMountedMessage = useCallback((nextMessage) => {
    if (mountedRef.current) {
      setMessage(nextMessage)
    }
  }, [])

  const setMountedPhase = useCallback((nextPhase) => {
    if (mountedRef.current) {
      setPhase(nextPhase)
    }
  }, [])

  const handleGoogleCredential = useCallback(
    async (googleResponse) => {
      if (!googleResponse?.credential) {
        setMountedPhase('idle')
        setMountedMessage({
          type: 'error',
          text: t('auth.google.tokenError'),
        })
        return
      }

      setBusy(true)
      setMountedPhase('google')
      setMountedMessage(null)

      try {
        await pause(STEP_PAUSE_MS)
        setMountedPhase('firebase')

        const firebaseToken = await exchangeGoogleCredentialForFirebaseToken(
          googleResponse.credential,
        )

        if (!firebaseToken.firebaseIdToken || !firebaseToken.email) {
          throw new Error(t('auth.google.tokenError'))
        }

        const email = firebaseToken.email
        const displayName = firebaseToken.displayName || email.split('@')[0] || 'Google User'

        setMountedPhase('server')

        const result = await socialLoginUser({
          idToken: firebaseToken.firebaseIdToken,
          email,
          nickname: displayName,
          gender: 'N/A',
          age: null,
        })

        if (!result.response.ok) {
          throw new Error(getApiErrorMessage(result, t))
        }

        const user = getSocialUser({
          data: result.data,
          email,
          displayName,
          firebaseUid: firebaseToken.firebaseUid,
          firebaseIdToken: firebaseToken.firebaseIdToken,
        })

        setMountedPhase('ready')
        await pause(SUCCESS_PAUSE_MS)

        onSuccess?.({
          entryType: 'google',
          authMode: mode,
          nickname: user.Nickname || displayName,
          email: user.Email || email,
          user,
          data: result.data,
        })
      } catch (error) {
        setMountedPhase('idle')
        setMountedMessage({
          type: 'error',
          text: error?.message || t('auth.google.serverError'),
        })
      } finally {
        if (mountedRef.current) {
          setBusy(false)
        }
      }
    },
    [mode, onSuccess, setMountedMessage, setMountedPhase, t],
  )

  useEffect(() => {
    mountedRef.current = true

    return () => {
      mountedRef.current = false
    }
  }, [])

  useEffect(() => {
    let cancelled = false
    const buttonElement = buttonRef.current

    async function mountGoogleButton() {
      if (!GOOGLE_WEB_CLIENT_ID || !buttonElement) {
        setMountedMessage({
          type: 'error',
          text: t('auth.google.unavailable'),
        })
        return
      }

      try {
        await loadGoogleIdentityScript()

        if (cancelled) {
          return
        }

        window.google.accounts.id.initialize({
          client_id: GOOGLE_WEB_CLIENT_ID,
          callback: handleGoogleCredential,
          ux_mode: 'popup',
          auto_select: false,
          cancel_on_tap_outside: true,
        })

        const buttonWidth = Math.round(
          Math.min(280, Math.max(240, buttonElement.getBoundingClientRect().width || 260)),
        )

        buttonElement.innerHTML = ''

        window.google.accounts.id.renderButton(buttonElement, {
          theme: 'outline',
          size: 'medium',
          type: 'standard',
          text: 'continue_with',
          shape: 'pill',
          width: buttonWidth,
          logo_alignment: 'left',
          locale: lang,
        })
      } catch {
        setMountedMessage({
          type: 'error',
          text: t('auth.google.scriptError'),
        })
      }
    }

    mountGoogleButton()

    return () => {
      cancelled = true

      if (buttonElement) {
        buttonElement.innerHTML = ''
      }
    }
  }, [handleGoogleCredential, lang, setMountedMessage, t])

  const activeStepIndex = GOOGLE_PROGRESS_STEPS.indexOf(phase)
  const isProcessing = busy || activeStepIndex >= 0

  return (
    <div
      className={`google-auth-block google-auth-${mode} ${
        isProcessing ? 'is-processing' : ''
      }`}
    >
      <div className="google-auth-divider" aria-hidden="true">
        <span>{t('auth.google.or')}</span>
      </div>

      <div className="google-auth-surface">
        <div className="google-auth-intro">
          <span className="google-auth-logo" aria-hidden="true">
            G
          </span>

          <span className="google-auth-copy">
            <strong>{t(`auth.google.${mode}`)}</strong>
          </span>
        </div>

        <div className="google-auth-button-wrap" aria-busy={busy}>
          <div className="google-auth-button-host" ref={buttonRef} />

          {busy ? (
            <div className="google-auth-loading">
              {t('auth.google.loading')}
            </div>
          ) : null}
        </div>
      </div>

      {isProcessing ? (
        <div className="google-auth-progress" role="status">
          {GOOGLE_PROGRESS_STEPS.map((step, index) => {
            const state =
              index < activeStepIndex
                ? 'done'
                : index === activeStepIndex
                  ? 'active'
                  : 'pending'

            return (
              <div className={`google-auth-step google-auth-step-${state}`} key={step}>
                <span className="google-auth-step-dot" aria-hidden="true" />
                <span>{t(`auth.google.steps.${step}`)}</span>
              </div>
            )
          })}
        </div>
      ) : null}

      {message ? (
        <div className={`form-message ${message.type}`} role="status">
          {message.text}
        </div>
      ) : null}
    </div>
  )
}