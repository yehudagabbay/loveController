import { useNavigate } from 'react-router-dom'
import { useLanguage } from '../../localization/languageStore'
import familyIcon from '../../image/icons/family.png'
import friendsIcon from '../../image/icons/friends.png'
import funIcon from '../../image/icons/fun.png'
import loveIcon from '../../image/icons/love.png'
import relationsIcon from '../../image/icons/relations.png'
import './GameModeSelect.css'

const gameModes = [
  {
    id: 'couples',
    icon: loveIcon,
    isComingSoon: false,
    path: '/couple-game-select',
  },
  {
    id: 'family',
    icon: familyIcon,
    isComingSoon: false,
    path: '/family-game-select',
  },
  {
    id: 'friends',
    icon: friendsIcon,
    isComingSoon: false,
    path: '/friends-game-select',
  },
  {
    id: 'drinks',
    icon: funIcon,
    isComingSoon: true,
    path: '',
  },
  {
    id: 'research',
    icon: relationsIcon,
    isComingSoon: false,
    path: '/research',
  },
]

export default function GameModeSelect() {
  const navigate = useNavigate()
  const { dir, t } = useLanguage()

  const handleSelectGame = (gameMode) => {
    if (gameMode.isComingSoon) {
      return
    }

    navigate(gameMode.path)
  }

  return (
    <section className="game-mode-page" dir={dir}>
      <div className="game-mode-background-glow glow-one" />
      <div className="game-mode-background-glow glow-two" />

      <div className="game-mode-shell">
        <header className="game-mode-header">
          <p className="game-mode-eyebrow">{t('gameMode.eyebrow')}</p>
          <h1>{t('gameMode.title')}</h1>
          <p>{t('gameMode.subtitle')}</p>
        </header>

        <div className="game-mode-grid">
          {gameModes.map((gameMode) => (
            <button
              key={gameMode.id}
              type="button"
              className={`game-mode-card game-mode-${gameMode.id} ${
                gameMode.isComingSoon ? 'is-coming-soon' : ''
              }`}
              onClick={() => handleSelectGame(gameMode)}
            >
              {gameMode.isComingSoon ? (
                <span className="game-mode-badge">{t('gameMode.comingSoon')}</span>
              ) : null}

              <div className="game-mode-icon-wrap">
                <img
                  className="game-mode-icon"
                  src={gameMode.icon}
                  alt=""
                  aria-hidden="true"
                  draggable="false"
                />
              </div>

              <h2>{t(`gameMode.modes.${gameMode.id}.title`)}</h2>
              <p>{t(`gameMode.modes.${gameMode.id}.description`)}</p>
              <span className="game-mode-action">{t(`gameMode.modes.${gameMode.id}.button`)}</span>
            </button>
          ))}
        </div>
      </div>
    </section>
  )
}
