import { useEffect, useMemo, useState } from 'react'
import { registerUserAccount, resendVerificationEmail } from '../../api/ApiTools'
import regBg from '../../image/bgImage/regBg.jpg'
import { useLanguage } from '../../localization/languageStore'
import LanguageSwitcher from '../../localization/components/LanguageSwitcher'
import AuthSwitcher from './AuthSwitcher'
import GoogleRegLog from './GoogleRegLog'
import './Registration.css'

const GENDER_MALE = 'זכר'
const GENDER_FEMALE = 'נקבה'
const RESEND_COOLDOWN_SECONDS = 60

const initialForm = {
  nickname: '',
  gender: '',
  email: '',
  password: '',
  confirmPassword: '',
  age: '',
}

function buildErrors(form, t) {
  const errors = {}
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  const passwordRegex = /^(?=.*[A-Za-z])(?=.*\d).{6,}$/
  const ageNumber = Number(form.age)

  if (!form.nickname.trim()) {
    errors.nickname = t('registration.validation.requiredName')
  }

  if (!form.gender) {
    errors.gender = t('registration.validation.requiredGender')
  }

  if (!form.email.trim()) {
    errors.email = t('registration.validation.requiredEmail')
  } else if (!emailRegex.test(form.email.trim())) {
    errors.email = t('registration.validation.invalidEmail')
  }

  if (!form.password) {
    errors.password = t('registration.validation.requiredPassword')
  } else if (!passwordRegex.test(form.password)) {
    errors.password = t('registration.validation.weakPassword')
  }

  if (form.confirmPassword !== form.password) {
    errors.confirmPassword = t('registration.validation.passwordMismatch')
  }

  if (!form.age || Number.isNaN(ageNumber) || ageNumber <= 0) {
    errors.age = t('registration.validation.invalidAge')
  } else if (ageNumber < 18) {
    errors.age = t('registration.validation.underAge')
  }

  return errors
}

function getServerErrorMessage({ response, raw, data }, t) {
  const message =
    data?.message ||
    data?.error ||
    raw ||
    t('registration.messages.serverError', { status: response.status })

  const normalized = String(message).toLowerCase()

  if (
    normalized.includes('email address already exists') ||
    normalized.includes('email already exists')
  ) {
    return t('registration.messages.emailExists')
  }

  return message
}

export default function Registration({
  authMode = 'register',
  onAuthModeChange,
  onRegistrationSuccess,
}) {
  const { t } = useLanguage()

  const [form, setForm] = useState(initialForm)
  const [touched, setTouched] = useState({})
  const [submitting, setSubmitting] = useState(false)
  const [message, setMessage] = useState(null)

  const [verificationEmail, setVerificationEmail] = useState('')
  const [resendCooldown, setResendCooldown] = useState(0)
  const [resendingVerification, setResendingVerification] = useState(false)

  const [visiblePasswords, setVisiblePasswords] = useState({
    password: false,
    confirmPassword: false,
  })

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
  }

  const showError = (field) => (touched[field] || hasSubmitted) && errors[field]

  const togglePasswordVisibility = (field) => {
    setVisiblePasswords((current) => ({ ...current, [field]: !current[field] }))
  }

  const handleResendVerification = async () => {
    if (!verificationEmail || resendCooldown > 0 || resendingVerification) {
      return
    }

    setResendingVerification(true)
    setMessage(null)

    try {
      const result = await resendVerificationEmail(verificationEmail)

      if (result.response.ok) {
        setMessage({
          type: 'success',
          text: t('registration.messages.verificationResent'),
        })

        setResendCooldown(RESEND_COOLDOWN_SECONDS)
        return
      }

      setMessage({
        type: 'error',
        text: getServerErrorMessage(result, t),
      })
    } catch (error) {
      const isAbort = error?.name === 'AbortError'

      setMessage({
        type: 'error',
        text: isAbort
          ? t('registration.messages.timeout')
          : error?.message || t('registration.messages.network'),
      })
    } finally {
      setResendingVerification(false)
    }
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    setTouched((current) => ({ ...current, __submitted: true }))
    setMessage(null)

    const nextErrors = buildErrors(form, t)
    if (Object.keys(nextErrors).length > 0) {
      return
    }

    setSubmitting(true)

    try {
      const currentEmail = form.email.trim()

      const result = await registerUserAccount({
        nickname: form.nickname,
        gender: form.gender,
        email: form.email,
        password: form.password,
        age: form.age,
      })

      if (result.response.ok) {
        setVerificationEmail(currentEmail)
        setResendCooldown(RESEND_COOLDOWN_SECONDS)

        setMessage({
          type: 'success',
          text: t('registration.messages.success'),
        })

        setForm(initialForm)
        setTouched({})

        return
      }

      setMessage({
        type: 'error',
        text: getServerErrorMessage(result, t),
      })
    } catch (error) {
      const isAbort = error?.name === 'AbortError'

      setMessage({
        type: 'error',
        text: isAbort
          ? t('registration.messages.timeout')
          : error?.message || t('registration.messages.network'),
      })
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <main
      className="registration-page register-page"
      style={{ '--registration-bg': `url(${regBg})` }}
    >
      <LanguageSwitcher />
      <AuthSwitcher activeMode={authMode} onModeChange={onAuthModeChange} />

      <section className="registration-hero" aria-labelledby="registration-title">
        <div className="registration-brand">
          <span>{t('common.brand')}</span>
          <h1 id="registration-title">{t('registration.title')}</h1>
          <p>{t('registration.heroText')}</p>
        </div>

        <div className="registration-note">{t('registration.note')}</div>
      </section>

      <section className="registration-panel-wrap" aria-label={t('registration.panelTitle')}>
        <div className="registration-panel auth-panel-motion">
          <h2>{t('registration.panelTitle')}</h2>
          <p>{t('registration.panelText')}</p>

          <form className="registration-form" onSubmit={handleSubmit} noValidate>
            <div className="field">
              <label htmlFor="nickname">{t('registration.fields.nickname.label')}</label>
              <input
                id="nickname"
                name="nickname"
                type="text"
                autoComplete="username"
                value={form.nickname}
                onBlur={() => setTouched((current) => ({ ...current, nickname: true }))}
                onChange={(event) => updateField('nickname', event.target.value)}
                aria-invalid={Boolean(showError('nickname'))}
                aria-describedby="nickname-error"
                placeholder={t('registration.fields.nickname.placeholder')}
              />
              <span className="field-error" id="nickname-error">
                {showError('nickname') || ''}
              </span>
            </div>

            <fieldset className="gender-field">
              <legend>{t('registration.fields.gender.label')}</legend>

              <div className="gender-options">
                <button
                  type="button"
                  className="gender-option"
                  aria-pressed={form.gender === GENDER_MALE}
                  onClick={() => updateField('gender', GENDER_MALE)}
                >
                  {t('registration.fields.gender.male')}
                </button>

                <button
                  type="button"
                  className="gender-option"
                  aria-pressed={form.gender === GENDER_FEMALE}
                  onClick={() => updateField('gender', GENDER_FEMALE)}
                >
                  {t('registration.fields.gender.female')}
                </button>
              </div>

              <span className="field-error">{showError('gender') || ''}</span>
            </fieldset>

            <div className="field-row">
              <div className="field">
                <label htmlFor="email">{t('registration.fields.email.label')}</label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  inputMode="email"
                  value={form.email}
                  onBlur={() => setTouched((current) => ({ ...current, email: true }))}
                  onChange={(event) => updateField('email', event.target.value)}
                  aria-invalid={Boolean(showError('email'))}
                  aria-describedby="email-error"
                  placeholder={t('registration.fields.email.placeholder')}
                />
                <span className="field-error" id="email-error">
                  {showError('email') || ''}
                </span>
              </div>

              <div className="field">
                <label htmlFor="age">{t('registration.fields.age.label')}</label>
                <input
                  id="age"
                  name="age"
                  type="number"
                  min="18"
                  inputMode="numeric"
                  value={form.age}
                  onBlur={() => setTouched((current) => ({ ...current, age: true }))}
                  onChange={(event) => updateField('age', event.target.value)}
                  aria-invalid={Boolean(showError('age'))}
                  aria-describedby="age-error"
                  placeholder={t('registration.fields.age.placeholder')}
                />
                <span className="field-error" id="age-error">
                  {showError('age') || ''}
                </span>
              </div>
            </div>

            <div className="field-row">
              <div className="field">
                <label htmlFor="password">{t('registration.fields.password.label')}</label>

                <div className="password-field-wrap">
                  <input
                    id="password"
                    name="password"
                    type={visiblePasswords.password ? 'text' : 'password'}
                    autoComplete="new-password"
                    value={form.password}
                    onBlur={() => setTouched((current) => ({ ...current, password: true }))}
                    onChange={(event) => updateField('password', event.target.value)}
                    aria-invalid={Boolean(showError('password'))}
                    aria-describedby="password-error"
                    placeholder={t('registration.fields.password.placeholder')}
                  />

                  <button
                    type="button"
                    className="password-visibility-button"
                    onClick={() => togglePasswordVisibility('password')}
                    aria-label={
                      visiblePasswords.password
                        ? t('common.password.hide')
                        : t('common.password.show')
                    }
                  >
                    {visiblePasswords.password
                      ? t('common.password.hide')
                      : t('common.password.show')}
                  </button>
                </div>

                <span className="field-error" id="password-error">
                  {showError('password') || ''}
                </span>
              </div>

              <div className="field">
                <label htmlFor="confirmPassword">
                  {t('registration.fields.confirmPassword.label')}
                </label>

                <div className="password-field-wrap">
                  <input
                    id="confirmPassword"
                    name="confirmPassword"
                    type={visiblePasswords.confirmPassword ? 'text' : 'password'}
                    autoComplete="new-password"
                    value={form.confirmPassword}
                    onBlur={() =>
                      setTouched((current) => ({ ...current, confirmPassword: true }))
                    }
                    onChange={(event) => updateField('confirmPassword', event.target.value)}
                    aria-invalid={Boolean(showError('confirmPassword'))}
                    aria-describedby="confirm-password-error"
                    placeholder={t('registration.fields.confirmPassword.placeholder')}
                  />

                  <button
                    type="button"
                    className="password-visibility-button"
                    onClick={() => togglePasswordVisibility('confirmPassword')}
                    aria-label={
                      visiblePasswords.confirmPassword
                        ? t('common.password.hide')
                        : t('common.password.show')
                    }
                  >
                    {visiblePasswords.confirmPassword
                      ? t('common.password.hide')
                      : t('common.password.show')}
                  </button>
                </div>

                <span className="field-error" id="confirm-password-error">
                  {showError('confirmPassword') || ''}
                </span>
              </div>
            </div>

            {message ? (
              <div className={`form-message ${message.type}`} role="status">
                {message.text}
              </div>
            ) : null}

            {verificationEmail ? (
              <button
                type="button"
                className="submit-button"
                disabled={resendCooldown > 0 || resendingVerification}
                onClick={handleResendVerification}
              >
                {resendingVerification
                  ? t('registration.resend.sending')
                  : resendCooldown > 0
                    ? t('registration.resend.wait', { seconds: resendCooldown })
                    : t('registration.resend.button')}
              </button>
            ) : null}

            <button className="submit-button" type="submit" disabled={submitting}>
              {submitting ? t('registration.submitting') : t('registration.submit')}
            </button>
          </form>

          <GoogleRegLog mode="register" onSuccess={onRegistrationSuccess} />
        </div>
      </section>
    </main>
  )
}