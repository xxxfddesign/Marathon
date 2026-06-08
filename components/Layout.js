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
  const [t, setT] = useState({ d:'--', h:'--', m:'--', s:'--' })
  useEffect(() => {
    function upd() {
      const diff = getMarathonDate() - Date.now()
      if (diff <= 0) return
      setT({
        d: Math.floor(diff/86400000),
        h: String(Math.floor((diff%86400000)/3600000)).padStart(2,'0'),
        m: String(Math.floor((diff%3600000)/60000)).padStart(2,'0'),
        s: String(Math.floor((diff%60000)/1000)).padStart(2,'0'),
      })
    }
    upd(); const id = setInterval(upd, 1000); return () => clearInterval(id)
  }, [])
  return (
    <div style={{ display:'flex', alignItems:'center', gap:4, background:'rgba(255,255,255,0.04)', border:'1px solid var(--border)', borderRadius:8, padding:'4px 12px', fontSize:12 }}>
      <span>🗓</span>
      {['d','h','m','s'].map((k,i) => (
        <span key={k}>
          <span style={{ fontFamily:'Rajdhani,sans-serif', fontWeight:700, fontSize:14, color:primary, minWidth:20, display:'inline-block', textAlign:'center' }}>{t[k]}</span>
          <span style={{ color:'var(--text-sec)', fontSize:10, marginLeft:1 }}>{['д','ч','м','с'][i]}</span>
          {i < 3 && <span style={{ color:'var(--text-sec)', marginLeft:2 }}>:</span>}
        </span>
      ))}
    </div>
  )
}

function HoverBtn({ onClick, children, style, hoverStyle }) {
  const [hov, setHov] = useState(false)
  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{ ...style, ...(hov ? hoverStyle : {}) }}
    >
      {children}
    </button>
  )
}

export default function Layout({ children }) {
  const { data: session } = useSession()
  const router = useRouter()
  const [theme, setTheme] = useTheme()
  const [showThemeModal, setShowThemeModal] = useState(false)
  const [adminLogged, setAdminLogged] = useState(false)
  const [participantName, setParticipantName] = useState(null)
  const [participantId, setParticipantId] = useState(null)
  const th = THEMES[theme] || THEMES.ocean

  useEffect(() => {
    setAdminLogged(localStorage.getItem('admin_logged_in') === 'true')
    const pid = localStorage.getItem('participant_id')
    const pname = localStorage.getItem('participant_name')
    if (pid && pname) {
      setParticipantId(pid)
      setParticipantName(pname)
    }
  }, [])

  // Refresh participant name if it changes (e.g. after profile save)
  useEffect(() => {
    function onStorage() {
      const pid = localStorage.getItem('participant_id')
      const pname = localStorage.getItem('participant_name')
      if (pid && pname) { setParticipantId(pid); setParticipantName(pname) }
      else { setParticipantId(null); setParticipantName(null) }
      setAdminLogged(localStorage.getItem('admin_logged_in') === 'true')
    }
    window.addEventListener('storage', onStorage)
    return () => window.removeEventListener('storage', onStorage)
  }, [])

  const navItems = [
    { href:'/',             label:'Главная',      icon:'\uE80F' },
    { href:'/register',     label:'Регистрация',  icon:'\uE70F' },
    { href:'/bmi',          label:'Расчёт BMI',   icon:'\uE9F3' },
    { href:'/participants', label:'Участники',    icon:'\uE716' },
  ]
  const mdl2 = { fontFamily:'"Segoe MDL2 Assets","Segoe UI Symbol",sans-serif', fontSize:14 }

  function adminLogout() {
    localStorage.removeItem('admin_logged_in')
    setAdminLogged(false)
    router.push('/')
  }

  function participantLogout() {
    localStorage.removeItem('participant_id')
    localStorage.removeItem('participant_name')
    setParticipantId(null)
    setParticipantName(null)
    router.push('/')
  }

  // Get initials from participant name
  function getInitials(name) {
    if (!name) return '?'
    const parts = name.trim().split(/\s+/)
    if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase()
    return parts[0][0].toUpperCase()
  }

  return (
    <div style={{ display:'flex', flexDirection:'column', height:'100vh', overflow:'hidden', background:th.bg, color:th.text, fontFamily:"'Inter','Segoe UI',sans-serif", transition:'background 0.4s' }}>

      {/* TOPBAR */}
      <nav style={{ background:th.nav, borderBottom:`1px solid ${th.border}`, display:'flex', alignItems:'center', padding:'0 20px', height:56, flexShrink:0, gap:8, zIndex:100 }}>

        <Link href="/" style={{ display:'flex', alignItems:'center', gap:8, marginRight:24, textDecoration:'none' }}>
          <img
            src={`${GITHUB_BASE}${theme==='sunset'||theme==='forest'?'nav_logo_light':'nav_logo'}.png`}
            style={{ height:32, width:'auto' }} alt="logo"
            onError={e => e.target.style.display='none'}
          />
          <span style={{ fontFamily:'Rajdhani,sans-serif', fontSize:18, fontWeight:700, letterSpacing:1, color:th.text }}>
            MARATHON SKILLS
          </span>
        </Link>

        {navItems.map(item => {
          const active = router.pathname === item.href
          return (
            <NavLink key={item.href} href={item.href} active={active} th={th} mdl2={mdl2} icon={item.icon} label={item.label} />
          )
        })}

        <div style={{ marginLeft:'auto', display:'flex', alignItems:'center', gap:10 }}>
          <Countdown primary={th.primary}/>

          <span style={{ fontSize:11, color:th.textSec, fontWeight:500, letterSpacing:0.5 }}>
            {THEMES[theme]?.name}
          </span>

          <HoverBtn
            onClick={() => setShowThemeModal(true)}
            style={{
              padding:'6px 12px', borderRadius:8, background:'rgba(255,255,255,0.05)',
              border:`1px solid ${th.border}`, color:th.textSec, fontSize:13, fontWeight:500,
              cursor:'pointer', display:'flex', alignItems:'center', gap:6, fontFamily:'inherit',
              transition:'all 0.15s',
            }}
            hoverStyle={{ background:'rgba(255,255,255,0.12)', borderColor:th.primary, color:th.text }}
          >
            <span style={mdl2}>{'\uE790'}</span> Тема
          </HoverBtn>

          {/* Admin logged in */}
          {adminLogged && (
            <div style={{ display:'flex', alignItems:'center', gap:8 }}>
              <div style={{
                width:32, height:32, borderRadius:'50%',
                background:`linear-gradient(135deg,${th.primary},${th.primaryDk})`,
                display:'flex', alignItems:'center', justifyContent:'center',
                fontSize:13, fontWeight:700, color:'#fff',
                border:`2px solid ${th.border}`,
                flexShrink:0,
              }}>А</div>
              <span style={{ fontSize:13, color:th.textSec, fontWeight:500 }}>Администратор</span>

              <HoverBtn
                onClick={() => router.push('/admin')}
                style={{
                  padding:'5px 12px', borderRadius:8,
                  background:`rgba(0,114,255,0.12)`,
                  border:`1px solid rgba(0,114,255,0.3)`,
                  color:th.primary, fontSize:12, fontWeight:600,
                  cursor:'pointer', fontFamily:'inherit', transition:'all 0.15s',
                }}
                hoverStyle={{ background:`rgba(0,114,255,0.25)`, borderColor:th.primary, transform:'translateY(-1px)', boxShadow:`0 4px 12px ${th.shadow}` }}
              >⚙️ Панель управления</HoverBtn>

              <HoverBtn
                onClick={adminLogout}
                style={{
                  padding:'5px 12px', borderRadius:8, background:'rgba(255,72,96,0.1)',
                  border:'1px solid rgba(255,72,96,0.25)', color:'#FF4860', fontSize:12,
                  fontWeight:600, cursor:'pointer', fontFamily:'inherit', transition:'all 0.15s',
                }}
                hoverStyle={{ background:'rgba(255,72,96,0.22)', borderColor:'#FF4860', transform:'translateY(-1px)' }}
              >Выйти</HoverBtn>
            </div>
          )}

          {/* Participant logged in */}
          {!adminLogged && participantId && !session?.user && (
            <div style={{ display:'flex', alignItems:'center', gap:8 }}>
              <HoverBtnProfileLink
                href="/profile"
                initials={getInitials(participantName)}
                name={participantName}
                th={th}
                active={router.pathname === '/profile'}
              />
              <HoverBtn
                onClick={participantLogout}
                style={{
                  padding:'5px 12px', borderRadius:8, background:'rgba(255,72,96,0.1)',
                  border:'1px solid rgba(255,72,96,0.25)', color:'#FF4860', fontSize:12,
                  fontWeight:600, cursor:'pointer', fontFamily:'inherit', transition:'all 0.15s',
                }}
                hoverStyle={{ background:'rgba(255,72,96,0.22)', borderColor:'#FF4860', transform:'translateY(-1px)' }}
              >Выйти</HoverBtn>
            </div>
          )}

          {/* Google session */}
          {!adminLogged && !participantId && session?.user && (
            <div style={{ display:'flex', alignItems:'center', gap:8 }}>
              {session.user.image ? (
                <Image src={session.user.image} alt={session.user.name||''} width={32} height={32}
                  style={{ borderRadius:'50%', border:`2px solid ${th.border}` }}/>
              ) : (
                <div style={{
                  width:32, height:32, borderRadius:'50%',
                  background:`linear-gradient(135deg,${th.primary},${th.primaryDk})`,
                  display:'flex', alignItems:'center', justifyContent:'center',
                  fontSize:13, fontWeight:700, color:'#fff', border:`2px solid ${th.border}`, flexShrink:0,
                }}>
                  {(session.user.name||'U')[0].toUpperCase()}
                </div>
              )}
              <span style={{ fontSize:13, color:th.textSec, maxWidth:120, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
                {session.user.name}
              </span>
              <HoverBtn
                onClick={() => signOut({ callbackUrl:'/login' })}
                style={{
                  padding:'5px 12px', borderRadius:8, background:'rgba(255,72,96,0.1)',
                  border:'1px solid rgba(255,72,96,0.25)', color:'#FF4860', fontSize:12,
                  fontWeight:600, cursor:'pointer', fontFamily:'inherit', transition:'all 0.15s',
                }}
                hoverStyle={{ background:'rgba(255,72,96,0.22)', borderColor:'#FF4860', transform:'translateY(-1px)' }}
              >Выйти</HoverBtn>
            </div>
          )}

          {/* Not logged in */}
          {!adminLogged && !participantId && !session?.user && (
            <HoverBtnLink href="/login" th={th} mdl2={mdl2} />
          )}
        </div>
      </nav>

      {/* CONTENT */}
      <main style={{ flex:1, overflow:'hidden', position:'relative' }}>
        <style>{`
          :root {
            --bg: ${th.bg}; --nav: ${th.nav}; --card: ${th.card}; --input-bg: ${th.inputBg};
            --primary: ${th.primary}; --primary-dk: ${th.primaryDk}; --accent: ${th.accent};
            --text: ${th.text}; --text-sec: ${th.textSec}; --border: ${th.border};
            --badge-bg: ${th.badgeBg}; --badge-bd: ${th.badgeBd}; --shadow: ${th.shadow};
          }
        `}</style>
        {typeof children === 'function' ? children(th) : children}
      </main>

      {/* THEME MODAL */}
      {showThemeModal && (
        <div onClick={() => setShowThemeModal(false)} style={{
          position:'fixed', inset:0, zIndex:1000, background:'rgba(0,0,0,0.7)',
          backdropFilter:'blur(4px)', display:'flex', alignItems:'center', justifyContent:'center'
        }}>
          <div onClick={e => e.stopPropagation()} style={{
            background:th.nav, border:`1px solid ${th.border}`, borderRadius:18,
            padding:28, width:460, maxWidth:'95vw',
          }}>
            <div style={{ fontFamily:'Rajdhani,sans-serif', fontSize:22, fontWeight:700, marginBottom:20 }}>🎨 Выбор темы</div>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
              {Object.entries(THEMES).map(([key, t]) => (
                <ThemeCard key={key} thKey={key} t={t} current={theme} primary={th.primary} border={th.border} text={th.text} onSelect={() => { setTheme(key); setShowThemeModal(false) }} />
              ))}
            </div>
            <div style={{ display:'flex', justifyContent:'flex-end', marginTop:20 }}>
              <HoverBtn
                onClick={() => setShowThemeModal(false)}
                style={{ padding:'8px 18px', borderRadius:8, background:'rgba(255,255,255,0.06)', border:`1px solid ${th.border}`, color:th.textSec, fontSize:13, cursor:'pointer', fontFamily:'inherit', transition:'all 0.15s' }}
                hoverStyle={{ background:'rgba(255,255,255,0.12)', borderColor:th.primary }}
              >Закрыть</HoverBtn>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function NavLink({ href, active, th, mdl2, icon, label }) {
  const [hov, setHov] = useState(false)
  return (
    <Link
      href={href}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        display:'flex', alignItems:'center', gap:6, padding:'6px 14px', borderRadius:8,
        fontSize:13, fontWeight:600, letterSpacing:0.3, textDecoration:'none',
        color: active ? th.primary : hov ? th.text : th.textSec,
        borderBottom: active ? `2px solid ${th.primary}` : hov ? `2px solid ${th.primary}88` : '2px solid transparent',
        background: hov && !active ? 'rgba(255,255,255,0.04)' : 'transparent',
        transition:'color 0.15s, border-color 0.15s, background 0.15s',
      }}
    >
      <span style={mdl2}>{icon}</span>
      {label}
    </Link>
  )
}

function HoverBtnLink({ href, th, mdl2 }) {
  const [hov, setHov] = useState(false)
  return (
    <Link
      href={href}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        padding:'6px 14px', borderRadius:8, textDecoration:'none',
        background: hov
          ? `linear-gradient(135deg,${th.primaryDk},${th.primary})`
          : `linear-gradient(135deg,${th.primary},${th.primaryDk})`,
        color:'#fff', fontSize:12, fontWeight:700, letterSpacing:0.5,
        boxShadow: hov ? `0 6px 20px ${th.shadow}` : `0 2px 10px ${th.shadow}`,
        display:'flex', alignItems:'center', gap:5,
        transform: hov ? 'translateY(-1px)' : 'translateY(0)',
        transition:'all 0.15s',
      }}
    >
      <span style={mdl2}>{'\uE72E'}</span> Войти
    </Link>
  )
}

function HoverBtnProfileLink({ href, initials, name, th, active }) {
  const [hov, setHov] = useState(false)
  return (
    <Link
      href={href}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        display:'flex', alignItems:'center', gap:8, textDecoration:'none',
        padding:'4px 10px 4px 4px', borderRadius:24,
        background: hov || active ? `rgba(255,255,255,0.08)` : 'transparent',
        border: `1px solid ${hov || active ? th.primary : th.border}`,
        transition:'all 0.15s',
      }}
    >
      <div style={{
        width:28, height:28, borderRadius:'50%',
        background:`linear-gradient(135deg,${th.primary},${th.primaryDk})`,
        display:'flex', alignItems:'center', justifyContent:'center',
        fontSize:11, fontWeight:800, color:'#fff', flexShrink:0,
        boxShadow: hov ? `0 0 0 2px ${th.primary}66` : 'none',
        transition:'box-shadow 0.15s',
      }}>{initials}</div>
      <span style={{
        fontSize:13, fontWeight:600, color: hov ? th.text : th.textSec,
        maxWidth:110, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap',
        transition:'color 0.15s',
      }}>{name}</span>
    </Link>
  )
}

function ThemeCard({ thKey, t, current, primary, border, text, onSelect }) {
  const [hov, setHov] = useState(false)
  const active = thKey === current
  return (
    <div
      onClick={onSelect}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        border:`2px solid ${active ? primary : hov ? primary+'88' : border}`,
        borderRadius:14, padding:16, cursor:'pointer', position:'relative',
        transition:'all 0.15s', transform: hov && !active ? 'translateY(-2px)' : 'none',
        boxShadow: hov ? `0 6px 20px rgba(0,0,0,0.25)` : 'none',
      }}
    >
      {active && <span style={{ position:'absolute', top:8, right:10, fontSize:14, color:primary, fontWeight:700 }}>✓</span>}
      <div style={{ height:50, borderRadius:8, marginBottom:10, overflow:'hidden', background:`linear-gradient(90deg,${t.bg},${t.card})` }}>
        <img src={`${GITHUB_BASE}theme_${thKey}.png`} alt={t.name} style={{ width:'100%', height:'100%', objectFit:'cover' }} onError={e=>e.target.style.display='none'}/>
      </div>
      <div style={{ fontSize:14, fontWeight:700, color:text }}>{t.name}</div>
    </div>
  )
}
