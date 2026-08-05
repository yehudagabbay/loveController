import { useEffect, useRef, useState } from 'react'
import flowerLogo from '../../image/logo/logo1.png'
import { useLanguage } from '../../localization/languageStore'
import './FlowerRoulette.css'

const FAST_SPIN_DURATION = 1500

export default function FlowerRoulette({
  size = 128,
  tapToSpin = false,
  decorative = false,
  className = '',
  style,
}) {
  const { t } = useLanguage()
  const [fastSpinKey, setFastSpinKey] = useState(0)
  const fastSpinTimerRef = useRef(null)

  useEffect(() => {
    return () => {
      window.clearTimeout(fastSpinTimerRef.current)
    }
  }, [])

  const restartSpin = () => {
    window.clearTimeout(fastSpinTimerRef.current)
    setFastSpinKey((current) => current + 1)
    fastSpinTimerRef.current = window.setTimeout(() => {
      fastSpinTimerRef.current = null
    }, FAST_SPIN_DURATION)
  }

  const normalizedSize = typeof size === 'number' ? `${size}px` : size
  const classNames = [
    'flower-roulette',
    tapToSpin ? 'flower-roulette-clickable' : '',
    decorative ? 'flower-roulette-decorative' : '',
    className,
  ]
    .filter(Boolean)
    .join(' ')

  const image = (
    <img
      key={fastSpinKey}
      className="flower-roulette-image"
      src={flowerLogo}
      alt={decorative ? '' : t('common.flowerLogo')}
      aria-hidden={decorative ? 'true' : undefined}
      draggable="false"
    />
  )

  if (!tapToSpin) {
    return (
      <span
        className={classNames}
        style={{ '--flower-size': normalizedSize, ...style }}
      >
        {image}
      </span>
    )
  }

  return (
    <button
      type="button"
      className={classNames}
      style={{ '--flower-size': normalizedSize, ...style }}
      onClick={restartSpin}
      aria-label={t('common.flowerLogo')}
    >
      {image}
    </button>
  )
}
