import { useSession, signOut } from 'next-auth/react'
import { useRouter } from 'next/router'
import Link from 'next/link'
import Image from 'next/image'
import { useState, useEffect } from 'react'
import { THEMES, GITHUB_BASE, getMarathonDate } from '../lib/constants'

function useTheme() {
  const [theme, setThemeState] = useState('ocean')
  useEffect(() => {
    const saved = localStorage.getItem('ms_theme') || 'ocean'
    setThemeState(saved)
    document.body.setAttribute('data-theme', saved === 'ocean' ? '' : saved)
  }, [])
  function setTheme(t) {
    setThemeState(t)
    localStorage.setItem('ms_theme', t)
    document.body.setAttribute('data-theme', t === 'ocean' ? '' : t)
  }
  return [theme, setTheme]
}

function Countdown({ primary }) {
  const [t, setT] = useState({ d: '--', h: '--', m: '--', s: '--' })
  useEffect(() => {
    function upd() {
      const diff = getMarathonDate() - Date.now()
      if (diff <= 0) return
      setT({
        d: Math.floor(diff / 86400000),
        h: String(Math.floor((diff % 86400000) / 3600000)).padStart(2, '0'),
        m: String(Math.floor((diff % 3600000) / 60000)).padStart(2, '0'),
        s: String(Math.floor((diff % 60000) / 1000)).padStart(2, '0'),
      })
    }
    upd(); const id = setInterval(upd, 1000); return () => clearInterval(id)
  }, [])
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 4, background: 'rgba(255,255,255,0.04)', border: '1px solid var(--border)', borderRadius: 8, padding: '4px 12px', fontSize: 12 }}>
      <span>🗓</span>
      {['d', 'h', 'm', 's'].map((k, i) => (
        <span key={k}>
          <span style={{ fontFamily: 'Rajdhani,sans-serif', fontWeight: 700, fontSize: 14, color: primary, minWidth: 20, display: 'inline-block', textAlign: 'center' }}>{t[k]}</span>
          <span style={{ color: 'var(--text-sec)', fontSize: 10, marginLeft: 1 }}>{['д', 'ч', 'м', 'с'][i]}</span>
          {i < 3 && <span style={{ color: 'var(--text-sec)', marginLeft: 2 }}>:</span>}
        </span>
      ))}
    </div>
  )
}

export default function Layout({ children }) {
  const { data: session } = useSession()
  const router = useRouter()
  const [theme, setTheme] = useTheme()
  const [showThemeModal, setShowThemeModal] = useState(false)
  const [showNavToast, setShowNavToast] = useState(false)

  // Auth state
  const [adminLogged, setAdminLogged] = useState(false)
  const [participantId, setParticipantId] = useState(null)
  const [participantName, setParticipantName] = useState(null)
  const [mounted, setMounted] = useState(false)

  const th = THEMES[theme] || THEMES.ocean
  const mdl2 = { fontFamily: '"Segoe MDL2 Assets","Segoe UI Symbol",sans-serif', fontSize: 14 }

  useEffect(() => {
    function readAuth() {
      const pid = localStorage.getItem('participant_id')
      const pname = localStorage.getItem('participant_name')
      const admin = localStorage.getItem('admin_logged_in') === 'true'
      setAdminLogged(admin)
      setParticipantId(pid || null)
      setParticipantName(pname || null)
      setMounted(true)
    }
    readAuth()
    window.addEventListener('storage', readAuth)
    return () => window.removeEventListener('storage', readAuth)
  }, [session])

  // Auth levels:
  // guest      = !session && !participantId && !adminLogged
  // googleOnly = session && !participantId  (зашёл через Google но не зарегистрировался)
  // participant = participantId (зарегистрированный участник, с Google или логин/пароль)
  // admin       = adminLogged

  const isGuest = mounted && !session && !participantId && !adminLogged
  const isGoogleOnly = mounted && !!session && !participantId && !adminLogged
  const isParticipant = mounted && !!participantId && !adminLogged
  const isAdmin = mounted && adminLogged

  // Что доступно:
  // guest      → ничего кроме главной и войти/тема
  // googleOnly → регистрация, bmi, участники (но не профиль — нет ещё)
  // participant → всё кроме админки
  // admin      → всё

  function canAccess(href) {
    if (!mounted) return true // пока грузится — не блокируем
    if (href === '/' || href === '/login') return true
    if (isAdmin) return true
    if (isGuest) return false
    if (isGoogleOnly) return href !== '/profile' && href !== '/admin'
    if (isParticipant) return href !== '/admin'
    return false
  }

  function handleNavClick(href) {
    if (canAccess(href)) {
      router.push(href)
    } else {
      setShowNavToast(true)
      setTimeout(() => setShowNavToast(false), 4000)
    }
  }

  const navItems = [
    { href: '/register',     label: 'Регистрация', icon: '\uE70F' },
    { href: '/bmi',          label: 'Расчёт BMI',  icon: '\uE9F3' },
    { href: '/participants', label: 'Участники',   icon: '\uE716' },
  ]

  function getInitials(name) {
    if (!name) return '?'
    const parts = name.trim().split(/\s+/)
    if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase()
    return parts[0][0].toUpperCase()
  }

  function doLogout() {
    if (isAdmin) {
      localStorage.removeItem('admin_logged_in')
      setAdminLogged(false)
    }
    if (isParticipant || participantId) {
      localStorage.removeItem('participant_id')
      localStorage.removeItem('participant_name')
      setParticipantId(null)
      setParticipantName(null)
    }
    if (session) {
      signOut({ callbackUrl: '/' })
      return
    }
    router.push('/')
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', overflow: 'hidden', background: th.bg, color: th.text, fontFamily: "'Inter','Segoe UI',sans-serif", transition: 'background 0.4s' }}>

      {/* TOPBAR */}
      <nav style={{ background: th.nav, borderBottom: `1px solid ${th.border}`, display: 'flex', alignItems: 'center', padding: '0 20px', height: 56, flexShrink: 0, gap: 4, zIndex: 100 }}>

        <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: 8, marginRight: 20, textDecoration: 'none', flexShrink: 0 }}>
          <img
            src={`${GITHUB_BASE}${theme === 'sunset' || theme === 'forest' ? 'nav_logo_light' : 'nav_logo'}.png`}
            style={{ height: 32, width: 'auto' }} alt="logo"
            onError={e => e.target.style.display = 'none'}
          />
          <span style={{ fontFamily: 'Rajdhani,sans-serif', fontSize: 18, fontWeight: 700, letterSpacing: 1, color: th.text }}>
            MARATHON SKILLS
          </span>
        </Link>

        {navItems.map(item => {
          const active = router.pathname === item.href
          const accessible = canAccess(item.href)
          return (
            <NavItem
              key={item.href}
              label={item.label}
              icon={item.icon}
              active={active}
              accessible={accessible}
              th={th}
              mdl2={mdl2}
              onClick={() => handleNavClick(item.href)}
            />
          )
        })}

        {/* Admin panel link - only for admin */}
        {isAdmin && (
          <NavItem
            label="Панель управления"
            icon="⚙️"
            active={router.pathname === '/admin'}
            accessible={true}
            th={th}
            mdl2={mdl2}
            onClick={() => router.push('/admin')}
          />
        )}

        <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 10 }}>
          <Countdown primary={th.primary} />

          <span style={{ fontSize: 11, color: th.textSec, fontWeight: 500, letterSpacing: 0.5 }}>
            {THEMES[theme]?.name}
          </span>

          <button onClick={() => setShowThemeModal(true)} style={{
            padding: '6px 12px', borderRadius: 8, background: 'rgba(255,255,255,0.05)',
            border: `1px solid ${th.border}`, color: th.textSec, fontSize: 13, fontWeight: 500,
            cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, fontFamily: 'inherit',
          }}>
            <span style={mdl2}>{'\uE790'}</span> Тема
          </button>

          {/* GUEST */}
          {mounted && isGuest && (
            <Link href="/login" style={{
              padding: '6px 14px', borderRadius: 8, textDecoration: 'none',
              background: `linear-gradient(135deg,${th.primary},${th.primaryDk})`,
              color: '#fff', fontSize: 12, fontWeight: 700, letterSpacing: 0.5,
              boxShadow: `0 2px 10px ${th.shadow}`,
              display: 'flex', alignItems: 'center', gap: 5,
            }}>
              <span style={mdl2}>{'\uE72E'}</span> Войти
            </Link>
          )}

          {/* GOOGLE ONLY - зашёл но не зарегистрировался */}
          {mounted && isGoogleOnly && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              {session.user?.image && (
                <Image src={session.user.image} alt={session.user.name || ''} width={32} height={32}
                  style={{ borderRadius: '50%', border: `2px solid ${th.border}` }} />
              )}
              <span style={{ fontSize: 13, color: th.textSec, maxWidth: 120, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {session.user?.name}
              </span>
              <Link href="/register" style={{
                padding: '5px 12px', borderRadius: 8, textDecoration: 'none',
                background: `rgba(0,198,255,0.12)`, border: `1px solid rgba(0,198,255,0.3)`,
                color: th.primary, fontSize: 12, fontWeight: 700,
              }}>
                Завершить регистрацию
              </Link>
              <button onClick={doLogout} style={{
                padding: '5px 12px', borderRadius: 8, background: 'rgba(255,72,96,0.1)',
                border: '1px solid rgba(255,72,96,0.25)', color: '#FF4860', fontSize: 12,
                fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit',
              }}>Выйти</button>
            </div>
          )}

          {/* PARTICIPANT */}
          {mounted && isParticipant && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              {session?.user?.image ? (
                <Image src={session.user.image} alt="" width={32} height={32}
                  style={{ borderRadius: '50%', border: `2px solid ${th.border}` }} />
              ) : (
                <Link href="/profile" style={{
                  width: 32, height: 32, borderRadius: '50%',
                  background: `linear-gradient(135deg,${th.primary},${th.primaryDk})`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 12, fontWeight: 800, color: '#fff', flexShrink: 0,
                  border: `2px solid ${th.border}`, textDecoration: 'none',
                  cursor: 'pointer',
                }}>
                  {getInitials(participantName)}
                </Link>
              )}
              <Link href="/profile" style={{
                fontSize: 13, color: th.textSec, maxWidth: 120,
                overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                textDecoration: 'none', fontWeight: 600,
              }}>
                {participantName}
              </Link>
              <button onClick={doLogout} style={{
                padding: '5px 12px', borderRadius: 8, background: 'rgba(255,72,96,0.1)',
                border: '1px solid rgba(255,72,96,0.25)', color: '#FF4860', fontSize: 12,
                fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit',
              }}>Выйти</button>
            </div>
          )}

          {/* ADMIN */}
          {mounted && isAdmin && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{
                width: 32, height: 32, borderRadius: '50%',
                background: `linear-gradient(135deg,#FF6B35,#FF4860)`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 14, fontWeight: 800, color: '#fff', flexShrink: 0,
              }}>А</div>
              <span style={{ fontSize: 13, color: th.textSec, fontWeight: 600 }}>Администратор</span>
              <button onClick={doLogout} style={{
                padding: '5px 12px', borderRadius: 8, background: 'rgba(255,72,96,0.1)',
                border: '1px solid rgba(255,72,96,0.25)', color: '#FF4860', fontSize: 12,
                fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit',
              }}>Выйти</button>
            </div>
          )}
        </div>
      </nav>

      {/* CONTENT */}
      <main style={{ flex: 1, overflow: 'hidden', position: 'relative' }}>
        <style>{`
          :root {
            --bg: ${th.bg}; --nav: ${th.nav}; --card: ${th.card}; --input-bg: ${th.inputBg};
            --primary: ${th.primary}; --primary-dk: ${th.primaryDk}; --accent: ${th.accent};
            --text: ${th.text}; --text-sec: ${th.textSec}; --border: ${th.border};
            --badge-bg: ${th.badgeBg}; --badge-bd: ${th.badgeBd}; --shadow: ${th.shadow};
          }
          @keyframes slideDown { from { opacity:0; transform:translate(-50%,-12px) } to { opacity:1; transform:translateX(-50%) } }
        `}</style>
        {typeof children === 'function' ? children(th) : children}
      </main>

      {/* AUTH TOAST */}
      {showNavToast && (
        <div style={{
          position: 'fixed', top: 70, left: '50%', transform: 'translateX(-50%)',
          zIndex: 2000, background: '#0d1f30', border: '1px solid rgba(255,72,96,0.45)',
          borderRadius: 12, padding: '14px 24px', boxShadow: '0 8px 32px rgba(0,0,0,0.6)',
          display: 'flex', alignItems: 'center', gap: 12, whiteSpace: 'nowrap',
          animation: 'slideDown 0.25s ease',
        }}>
          <span style={{ fontSize: 20 }}>🔒</span>
          <span style={{ color: '#fff', fontSize: 14 }}>
            {isGoogleOnly
              ? <>Сначала <Link href="/register" onClick={() => setShowNavToast(false)} style={{ color: th.primary, fontWeight: 700, textDecoration: 'underline' }}>завершите регистрацию</Link></>
              : <>Сначала <Link href="/login" onClick={() => setShowNavToast(false)} style={{ color: th.primary, fontWeight: 700, textDecoration: 'underline' }}>войдите</Link> в систему</>
            }
          </span>
        </div>
      )}

      {/* THEME MODAL */}
      {showThemeModal && (
        <div onClick={() => setShowThemeModal(false)} style={{
          position: 'fixed', inset: 0, zIndex: 1000, background: 'rgba(0,0,0,0.7)',
          backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center'
        }}>
          <div onClick={e => e.stopPropagation()} style={{
            background: th.nav, border: `1px solid ${th.border}`, borderRadius: 18,
            padding: 28, width: 460, maxWidth: '95vw',
          }}>
            <div style={{ fontFamily: 'Rajdhani,sans-serif', fontSize: 22, fontWeight: 700, marginBottom: 20 }}>🎨 Выбор темы</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              {Object.entries(THEMES).map(([key, t]) => (
                <div key={key} onClick={() => { setTheme(key); setShowThemeModal(false) }} style={{
                  border: `2px solid ${theme === key ? th.primary : th.border}`,
                  borderRadius: 14, padding: 16, cursor: 'pointer', position: 'relative',
                  transition: 'all 0.2s',
                }}>
                  {theme === key && <span style={{ position: 'absolute', top: 8, right: 10, fontSize: 14, color: th.primary, fontWeight: 700 }}>✓</span>}
                  <div style={{ height: 50, borderRadius: 8, marginBottom: 10, overflow: 'hidden', background: `linear-gradient(90deg,${t.bg},${t.card})` }}>
                    <img src={`${GITHUB_BASE}theme_${key}.png`} alt={t.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} onError={e => e.target.style.display = 'none'} />
                  </div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: th.text }}>{t.name}</div>
                </div>
              ))}
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 20 }}>
              <button onClick={() => setShowThemeModal(false)} style={{ padding: '8px 18px', borderRadius: 8, background: 'rgba(255,255,255,0.06)', border: `1px solid ${th.border}`, color: th.textSec, fontSize: 13, cursor: 'pointer', fontFamily: 'inherit' }}>
                Закрыть
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function NavItem({ label, icon, active, accessible, th, mdl2, onClick }) {
  const [hov, setHov] = useState(false)
  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        display: 'flex', alignItems: 'center', gap: 6, padding: '6px 14px', borderRadius: 8,
        fontSize: 13, fontWeight: 600, letterSpacing: 0.3, border: 'none', cursor: 'pointer',
        fontFamily: 'inherit', transition: 'all 0.15s',
        color: active ? th.primary : accessible ? (hov ? th.text : th.textSec) : th.textSec,
        borderBottom: active ? `2px solid ${th.primary}` : hov && accessible ? `2px solid ${th.primary}88` : '2px solid transparent',
        background: hov && accessible ? 'rgba(255,255,255,0.04)' : 'transparent',
        opacity: accessible ? 1 : 0.45,
      }}
    >
      <span style={typeof icon === 'string' && icon.length > 2 ? {} : mdl2}>{icon}</span>
      {label}
      {!accessible && <span style={{ fontSize: 10, marginLeft: 2 }}>🔒</span>}
    </button>
  )
}
