import { useState } from 'react'
import FlowerRoulette from './FlowerRoulette'
import './DeckCompleteAnimation.css'

const sparkColors = ['#5eead4', '#ffd166', '#f9a8d4', '#bfdbfe', '#ff9f6e', '#c4b5fd']

function CelebrationSparks() {
  return (
    <div className="deck-complete-sparks" aria-hidden="true">
      {Array.from({ length: 34 }, (_, index) => (
        <span
          key={index}
          style={{
            '--spark-x': `${5 + ((index * 23) % 90)}%`,
            '--spark-y': `${8 + ((index * 19) % 78)}%`,
            '--spark-delay': `${index * 42}ms`,
            '--spark-size': `${7 + (index % 5) * 2}px`,
            '--spark-distance': `${34 + (index % 7) * 8}px`,
            '--spark-color': sparkColors[index % sparkColors.length],
            '--spark-rotate': `${(index * 31) % 180}deg`,
          }}
        />
      ))}
    </div>
  )
}

function CelebrationBurst() {
  return (
    <div className="deck-complete-burst" aria-hidden="true">
      {Array.from({ length: 20 }, (_, index) => (
        <span
          key={index}
          style={{
            '--ray-angle': `${index * 18}deg`,
            '--ray-delay': `${index * 24}ms`,
          }}
        />
      ))}
    </div>
  )
}

export default function DeckCompleteAnimation({
  title,
  text,
  actionLabel,
  onAction,
  dismissLabel,
}) {
  const [isDismissed, setIsDismissed] = useState(false)

  if (isDismissed) {
    return null
  }

  return (
    <div className="deck-complete-celebration" aria-live="polite">
      <CelebrationSparks />
      <CelebrationBurst />

      <section className="deck-complete-panel">
        <div className="deck-complete-orbit" aria-hidden="true">
          <span />
          <span />
          <span />
        </div>

        <div className="deck-complete-flower">
          <FlowerRoulette size="clamp(94px, 9vw, 154px)" tapToSpin />
        </div>

        <div className="deck-complete-copy">
          <span className="deck-complete-kicker">LIBA</span>
          <h2>{title}</h2>
          <p>{text}</p>
        </div>

        <div className="deck-complete-actions">
          <button type="button" className="deck-complete-primary" onClick={onAction}>
            {actionLabel}
          </button>
          {dismissLabel ? (
            <button
              type="button"
              className="deck-complete-ghost"
              onClick={() => setIsDismissed(true)}
            >
              {dismissLabel}
            </button>
          ) : null}
        </div>
      </section>
    </div>
  )
}
