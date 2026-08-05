import { useEffect, useMemo } from 'react'

function getDateNumberFromPath() {
  const parts = window.location.pathname.split('/').filter(Boolean)
  const code = parts[1] || ''

  return code.trim()
}

export default function PerfectDateInvite() {
  const dateNumber = useMemo(getDateNumberFromPath, [])
  const appLink = `loveclient://perfect-date/${dateNumber}`
  const androidDownloadLink = 'https://play.google.com/store/apps/details?id=com.liba.game'

  useEffect(() => {
    // אם האפליקציה מותקנת, הדפדפן ינסה לפתוח אותה ישירות לעמוד הדייט.
    window.location.href = appLink
  }, [appLink])

  return (
    <main style={styles.page}>
      <section style={styles.card}>
        <div style={styles.icon}>♡</div>
        <h1 style={styles.title}>הוזמנת לדייט המושלם</h1>
        <p style={styles.text}>
          אם האפליקציה מותקנת, היא תיפתח אוטומטית עם קוד הדייט.
        </p>

        <div style={styles.codeBox}>
          <span style={styles.codeLabel}>קוד הדייט</span>
          <strong style={styles.code}>{dateNumber || '----'}</strong>
        </div>

        <a href={appLink} style={styles.primaryButton}>
          פתח באפליקציה
        </a>
        <a href={androidDownloadLink} style={styles.secondaryButton}>
          הורד את האפליקציה
        </a>
      </section>
    </main>
  )
}

const styles = {
  page: {
    minHeight: '100vh',
    display: 'grid',
    placeItems: 'center',
    padding: 20,
    background: 'linear-gradient(145deg, #FFF7ED, #FFE4E6 52%, #FEF3C7)',
    color: '#7C2D12',
    direction: 'rtl',
  },
  card: {
    width: '100%',
    maxWidth: 420,
    borderRadius: 28,
    padding: 28,
    background: 'rgba(255,255,255,0.84)',
    border: '1px solid rgba(219,39,119,0.18)',
    boxShadow: '0 18px 46px rgba(124,45,18,0.12)',
    textAlign: 'center',
  },
  icon: {
    width: 72,
    height: 72,
    margin: '0 auto 14px',
    borderRadius: 36,
    display: 'grid',
    placeItems: 'center',
    background: '#FFE4E6',
    color: '#DB2777',
    fontSize: 42,
    fontWeight: 900,
  },
  title: {
    margin: 0,
    fontSize: 30,
    lineHeight: 1.15,
    color: '#7C2D12',
  },
  text: {
    margin: '12px 0 18px',
    fontSize: 16,
    lineHeight: 1.55,
    fontWeight: 700,
    color: '#9A3412',
  },
  codeBox: {
    borderRadius: 20,
    padding: 16,
    marginBottom: 16,
    background: '#FFF7ED',
    border: '1px solid rgba(251,146,60,0.25)',
  },
  codeLabel: {
    display: 'block',
    fontSize: 13,
    fontWeight: 900,
    color: '#9A3412',
    marginBottom: 4,
  },
  code: {
    display: 'block',
    fontSize: 44,
    letterSpacing: 5,
    color: '#DB2777',
  },
  primaryButton: {
    display: 'block',
    textDecoration: 'none',
    borderRadius: 18,
    padding: '15px 18px',
    background: '#DB2777',
    color: '#FFFFFF',
    fontWeight: 900,
    marginTop: 10,
  },
  secondaryButton: {
    display: 'block',
    textDecoration: 'none',
    borderRadius: 18,
    padding: '14px 18px',
    background: '#FFFFFF',
    color: '#7C2D12',
    fontWeight: 900,
    marginTop: 10,
    border: '1px solid rgba(251,146,60,0.25)',
  },
}
