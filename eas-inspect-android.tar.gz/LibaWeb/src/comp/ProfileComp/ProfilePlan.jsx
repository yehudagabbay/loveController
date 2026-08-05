import { useMemo, useState } from 'react'
import { useLanguage } from '../../localization/languageStore'
import './ProfilePlan.css'

const planKeys = ['free', 'premium', 'deep']
const featureKeys = [
  'price',
  'availableCards',
  'cardsPerRound',
  'levels',
  'favorites',
  'sharing',
  'bookResearch',
  'aiCards',
  'perfectDate',
  'challengeGame',
  'relationshipPatterns',
  'customTracks',
  'earlyAccess',
]

export default function ProfilePlan({ user }) {
  const { dir, t } = useLanguage()
  const [selectedPlan, setSelectedPlan] = useState('free')

  const displayName = user?.nickname || user?.email || 'LIBA'
  const currentPlan = user?.plan || 'free'

  const selectedPlanTitle = useMemo(
    () => t(`profilePlan.plans.${selectedPlan}.name`),
    [selectedPlan, t],
  )

  return (
    <main className="profile-plan-page" dir={dir}>
      <section className="profile-plan-hero" aria-labelledby="profile-plan-title">
        <div>
          <p className="profile-plan-kicker">{t('profilePlan.eyebrow')}</p>
          <h1 id="profile-plan-title">{t('profilePlan.title')}</h1>
          <p>{t('profilePlan.subtitle')}</p>
        </div>

        <aside className="profile-current-plan">
          <span>{t('profilePlan.currentLabel')}</span>
          <strong>{t(`profilePlan.plans.${currentPlan}.name`)}</strong>
          <p>{displayName}</p>
        </aside>
      </section>

      <section className="profile-plan-cards" aria-label={t('profilePlan.chooseTitle')}>
        {planKeys.map((planKey) => (
          <button
            type="button"
            key={planKey}
            className={`profile-plan-card ${selectedPlan === planKey ? 'selected' : ''}`}
            onClick={() => setSelectedPlan(planKey)}
          >
            <span>{t(`profilePlan.plans.${planKey}.tag`)}</span>
            <strong>{t(`profilePlan.plans.${planKey}.name`)}</strong>
            <small>{t(`profilePlan.plans.${planKey}.price`)}</small>
            <p>{t(`profilePlan.plans.${planKey}.description`)}</p>
          </button>
        ))}
      </section>

      <section className="profile-selected-plan">
        <div>
          <p className="profile-plan-kicker">{t('profilePlan.selectedLabel')}</p>
          <h2>{selectedPlanTitle}</h2>
          <p>{t(`profilePlan.plans.${selectedPlan}.description`)}</p>
        </div>

        <button type="button">
          {selectedPlan === currentPlan
            ? t('profilePlan.currentButton')
            : t('profilePlan.chooseButton', { plan: selectedPlanTitle })}
        </button>
      </section>

      <section className="profile-compare" aria-labelledby="profile-compare-title">
        <div className="profile-compare-heading">
          <h2 id="profile-compare-title">{t('profilePlan.compareTitle')}</h2>
          <p>{t('profilePlan.compareText')}</p>
        </div>

        <div className="profile-compare-table" role="table" aria-label={t('profilePlan.compareTitle')}>
          <div className="profile-compare-row profile-compare-head" role="row">
            <span role="columnheader">{t('profilePlan.featureColumn')}</span>
            {planKeys.map((planKey) => (
              <strong key={planKey} role="columnheader">
                {t(`profilePlan.plans.${planKey}.name`)}
              </strong>
            ))}
          </div>

          {featureKeys.map((featureKey) => (
            <div className="profile-compare-row" role="row" key={featureKey}>
              <span role="cell">{t(`profilePlan.features.${featureKey}.label`)}</span>
              {planKeys.map((planKey) => (
                <p key={planKey} role="cell">
                  {t(`profilePlan.features.${featureKey}.${planKey}`)}
                </p>
              ))}
            </div>
          ))}
        </div>
      </section>
    </main>
  )
}
