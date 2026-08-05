import { useEffect, useMemo, useState } from 'react'
import { loginUserAccount, resendVerificationEmail } from '../../api/ApiTools'
import regBg from '../../image/bgImage/regBg.jpg'
import { useLanguage } from '../../localization/languageStore'
import LanguageSwitcher from '../../localization/components/LanguageSwitcher'
import AuthSwitcher from './AuthSwitcher'
import GoogleRegLog from './GoogleRegLog'
import './Registration.css'

const initialForm = {
  email: '',
  password: '',
}

const RESEND_COOLDOWN_SECONDS = 60

function buildErrors(form, t) {
  const errors = {}
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

  if (!form.email.trim()) {
    errors.email = t('login.validation.requiredEmail')
  } else if (!emailRegex.test(form.email.trim())) {
    errors.email = t('login.validation.invalidEmail')
  }

  if (!form.password) {
    errors.password = t('login.validation.requiredPassword')
  }

  return errors
}

function getLoginErrorMessage({ response, raw, data }, t) {
  return data?.message || data?.error || raw || t('login.messages.serverError', { status: response.status })
}

function getUserFromLoginData(data) {
  const user = data?.User || data?.user || data?.profile || data

  if (!user || typeof user !== 'object') {
    return {}
  }

  return user
}

function getDisplayName(user, email) {
  return (
    user.nickname ||
    user.Nickname ||
    user.name ||
    user.Name ||
    user.email ||
    user.Email ||
    email
  )
}

export default function Login({ authMode = 'login', onAuthModeChange, onLoginSuccess }) {
  const { t } = useLanguage()

  const [form, setForm] = useState(initialForm)
  const [touched, setTouched] = useState({})
  const [submitting, setSubmitting] = useState(false)
  const [message, setMessage] = useState(null)
  const [showPassword, setShowPassword] = useState(false)

  const [unverifiedEmail, setUnverifiedEmail] = useState('')
  const [resendCooldown, setResendCooldown] = useState(0)
  const [resendingVerification, setResendingVerification] = useState(false)

  const errors = useMemo(() => buildErrors(form, t), [form, t])
  const hasSubmitted = touched.__submitted

  useEffect(() => {
    if (resendCooldown <= 0) {
      return
    }

    const timerId = window.setTimeout(() => {
      setResendCooldown((current) => Math.max(0, current - 1))
    }, 1000)

    return () => window.clearTimeout(timerId)
  }, [resendCooldown])

  const updateField = (field, value) => {
    setForm((current) => ({ ...current, [field]: value }))
    setMessage(null)

    if (field === 'email') {
      setUnverifiedEmail('')
      setResendCooldown(0)
    }
  }

  const showError = (field) => (touched[field] || hasSubmitted) && errors[field]

  const handleResendVerification = async () => {
    if (!unverifiedEmail || resendCooldown > 0 || resendingVerification) {
      return
    }

    setResendingVerification(true)
    setMessage(null)

    try {
      const result = await resendVerificationEmail(unverifiedEmail)

      if (result.response.ok) {
        setMessage({
          type: 'success',
          text: t('login.messages.verificationResent'),
        })

        setResendCooldown(RESEND_COOLDOWN_SECONDS)
        return
      }

      setMessage({
        type: 'error',
        text: result.data?.message || result.raw || t('login.messages.serverError', {
          status: result.response.status,
        }),
      })
    } catch (error) {
      setMessage({
        type: 'error',
        text:
          error?.name === 'AbortError'
            ? t('login.messages.timeout')
            : error?.message || t('login.messages.failed'),
      })
    } finally {
      setResendingVerification(false)
    }
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    setTouched((current) => ({ ...current, __submitted: true }))
    setMessage(null)
    setUnverifiedEmail('')

    const nextErrors = buildErrors(form, t)
    if (Object.keys(nextErrors).length > 0) {
      return
    }

    setSubmitting(true)

    try {
      const result = await loginUserAccount({
        email: form.email,
        password: form.password,
      })

      if (result.response.ok) {
        const user = getUserFromLoginData(result.data)
        const email = form.email.trim()

        onLoginSuccess?.({
          entryType: 'login',
          nickname: getDisplayName(user, email),
          email,
          user,
          data: result.data,
        })

        return
      }

      if (result.data?.emailNotVerified) {
        const email = form.email.trim()

        setUnverifiedEmail(email)
        setMessage({
          type: 'error',
          text: getLoginErrorMessage(result, t),
        })

        return
      }

      setMessage({
        type: 'error',
        text: getLoginErrorMessage(result, t),
      })
    } catch (error) {
      setMessage({
        type: 'error',
        text:
          error?.name === 'AbortError'
            ? t('login.messages.timeout')
            : error?.message || t('login.messages.failed'),
      })
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <main className="registration-page login-page" style={{ '--registration-bg': `url(${regBg})` }}>
      <LanguageSwitcher />
      <AuthSwitcher activeMode={authMode} onModeChange={onAuthModeChange} />

      <section className="registration-hero" aria-labelledby="login-title">
        <div className="registration-brand">
          <span>{t('common.brand')}</span>
          <h1 id="login-title">{t('login.title')}</h1>
          <p>{t('login.heroText')}</p>
        </div>

        <div className="registration-note">{t('login.note')}</div>
      </section>

      <section className="registration-panel-wrap" aria-label={t('login.panelTitle')}>
        <div className="registration-panel auth-panel-motion login-panel">
          <h2>{t('login.panelTitle')}</h2>
          <p>{t('login.panelText')}</p>

          <form className="registration-form login-form" onSubmit={handleSubmit} noValidate>
            <div className="field">
              <label htmlFor="login-email">{t('login.fields.email.label')}</label>
              <input
                id="login-email"
                name="email"
                type="email"
                autoComplete="email"
                inputMode="email"
                value={form.email}
                onBlur={() => setTouched((current) => ({ ...current, email: true }))}
                onChange={(event) => updateField('email', event.target.value)}
                aria-invalid={Boolean(showError('email'))}
                aria-describedby="login-email-error"
                placeholder={t('login.fields.email.placeholder')}
              />
              <span className="field-error" id="login-email-error">
                {showError('email') || ''}
              </span>
            </div>

            <div className="field">
              <label htmlFor="login-password">{t('login.fields.password.label')}</label>

              <div className="password-field-wrap">
                <input
                  id="login-password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  value={form.password}
                  onBlur={() => setTouched((current) => ({ ...current, password: true }))}
                  onChange={(event) => updateField('password', event.target.value)}
                  aria-invalid={Boolean(showError('password'))}
                  aria-describedby="login-password-error"
                  placeholder={t('login.fields.password.placeholder')}
                />

                <button
                  type="button"
                  className="password-visibility-button"
                  onClick={() => setShowPassword((current) => !current)}
                  aria-label={showPassword ? t('common.password.hide') : t('common.password.show')}
                >
                  {showPassword ? t('common.password.hide') : t('common.password.show')}
                </button>
              </div>

              <span className="field-error" id="login-password-error">
                {showError('password') || ''}
              </span>
            </div>

            {message ? (
              <div className={`form-message ${message.type}`} role="status">
                {message.text}
              </div>
            ) : null}

            {unverifiedEmail ? (
              <button
                type="button"
                className="submit-button"
                disabled={resendCooldown > 0 || resendingVerification}
                onClick={handleResendVerification}
              >
                {resendingVerification
                  ? t('login.resend.sending')
                  : resendCooldown > 0
                    ? t('login.resend.wait', { seconds: resendCooldown })
                    : t('login.resend.button')}
              </button>
            ) : null}

            <button className="submit-button" type="submit" disabled={submitting}>
              {submitting ? t('login.submitting') : t('login.submit')}
            </button>
          </form>

          <GoogleRegLog mode="login" onSuccess={onLoginSuccess} />
        </div>
      </section>
    </main>
  )
}