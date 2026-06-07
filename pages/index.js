import Layout from '../components/Layout'
import Link from 'next/link'
import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/router'
import { GITHUB_BASE } from '../lib/constants'

function HoverBtn({ onClick, children, style, hoverStyle }) {
  const [hov, setHov] = useState(false)
  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{ ...style, ...(hov ? hoverStyle : {}) }}
    >{children}</button>
  )
}

function HomePage() {
  const { data: session } = useSession()
  const router = useRouter()
  const [stats, setStats] = useState({ participants: 0, countries: 0 })
  const [showLoginMsg, setShowLoginMsg] = useState(false)
  const [adminLogged, setAdminLogged] = useState(false)

  useEffect(() => {
    setAdminLogged(localStorage.getItem('admin_logged_in') === 'true')
  }, [])

  function navigate(href) {
    const isAuth = session || adminLogged
    if (!isAuth) {
      setShowLoginMsg(true)
      setTimeout(() => setShowLoginMsg(false), 3000)
    } else {
      router.push(href)
    }
  }

  useEffect(() => {
    fetch('/api/participants').then(r => r.json()).then(data => {
      if (!Array.isArray(data)) return
      const countries = new Set(data.map(p => p.country).filter(Boolean))
      setStats({ participants: data.length, countries: countries.size })
    }).catch(() => {})
  }, [])

  return (
    <Layout>
      {(th) => (
        <div style={{ display:'flex', height:'100%', overflow:'hidden' }}>

          {/* LEFT */}
          <div style={{ flex:1, padding:'40px 48px', overflowY:'auto', display:'flex', flexDirection:'column', gap:24 }}>
            <div>
              <h1 style={{ fontFamily:'Rajdhani,sans-serif', fontSize:52, fontWeight:900, lineHeight:1.1, letterSpacing:-1 }}>
                Марафон<br/><span style={{ color:th.primary }}>Skills 2026</span>
              </h1>
              <p style={{ color:th.textSec, fontSize:15, marginTop:10, maxWidth:480, lineHeight:1.6 }}>
                Официальная система регистрации участников. Проверьте готовность, рассчитайте BMI и отслеживайте статистику.
              </p>
            </div>

            {/* Action buttons */}
            <div style={{ display:'flex', gap:12, flexWrap:'wrap' }}>
              {[
                { label:'📝 Регистрация', href:'/register' },
                { label:'👥 Участники',   href:'/participants' },
                { label:'⚖️ Калькулятор BMI', href:'/bmi' },
              ].map(b => (
                <HoverBtn
                  key={b.href}
                  onClick={() => navigate(b.href)}
                  style={{
                    padding:'12px 24px', borderRadius:10,
                    background:`linear-gradient(135deg,${th.primary},${th.primaryDk})`,
                    color:'#fff', fontWeight:700, fontSize:14, border:'none', cursor:'pointer',
                    boxShadow:`0 4px 14px ${th.shadow}`, fontFamily:'inherit',
                    transition:'all 0.15s',
                  }}
                  hoverStyle={{ transform:'translateY(-2px)', boxShadow:`0 8px 22px ${th.shadow}`, filter:'brightness(1.1)' }}
                >{b.label}</HoverBtn>
              ))}
              <a
                href="https://t.me/MarathonSepia5Bot"
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  padding:'12px 24px', borderRadius:10,
                  background:`linear-gradient(135deg,${th.primary},${th.primaryDk})`,
                  color:'#fff', fontWeight:700, fontSize:14, textDecoration:'none',
                  boxShadow:`0 4px 14px ${th.shadow}`,
                  display:'flex', alignItems:'center', gap:8,
                  transition:'all 0.15s',
                }}
                onMouseEnter={e => { e.currentTarget.style.transform='translateY(-2px)'; e.currentTarget.style.filter='brightness(1.1)' }}
                onMouseLeave={e => { e.currentTarget.style.transform=''; e.currentTarget.style.filter='' }}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="white"><path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.562 8.248-2.04 9.61c-.152.678-.554.843-1.122.524l-3.104-2.287-1.497 1.44c-.165.165-.304.304-.624.304l.223-3.162 5.754-5.198c.25-.223-.054-.346-.388-.123L7.08 14.766l-3.042-.95c-.661-.207-.674-.661.138-.978l11.89-4.586c.551-.2 1.033.134.496.996z"/></svg>
                Написать боту
              </a>
            </div>

            {/* Login required message */}
            {showLoginMsg && (
              <div style={{
                background:'rgba(255,72,96,0.12)', border:'1px solid rgba(255,72,96,0.35)',
                borderRadius:10, padding:'12px 18px', display:'flex', alignItems:'center', gap:10,
              }}>
                <span style={{ fontSize:18 }}>🔒</span>
                <span style={{ color:'#FF4860', fontSize:14, fontWeight:600 }}>Сначала войдите в систему</span>
              </div>
            )}

            {/* Stat cards */}
            <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:12 }}>
              {[
                { icon:'👤', label:'Участников', value: stats.participants },
                { icon:'🌍', label:'Стран', value: stats.countries },
                { icon:'🏆', label:'Забегов', value: 8 },
                { icon:'🏙️', label:'Городов', value: 12 },
              ].map(s => (
                <div key={s.label} style={{ background:th.card, border:`1px solid ${th.border}`, borderRadius:14, padding:'18px 16px', textAlign:'center' }}>
                  <div style={{ fontSize:26 }}>{s.icon}</div>
                  <div style={{ color:th.textSec, fontSize:11, marginTop:4, textTransform:'uppercase', letterSpacing:0.5 }}>{s.label}</div>
                  <div style={{ fontFamily:'Rajdhani,sans-serif', fontSize:30, fontWeight:800, color:th.primary }}>{s.value}</div>
                </div>
              ))}
            </div>

            {/* Info cards */}
            <div style={{ display:'flex', gap:12 }}>
              {[
                { label:'📏 Дистанция', value:'42,195', unit:'км' },
                { label:'🥇 Рекорд', value:'2:01', unit:'ч/мин' },
              ].map(c => (
                <div key={c.label} style={{ flex:1, background:th.card, border:`1px solid ${th.border}`, borderRadius:14, padding:'18px 20px' }}>
                  <div style={{ color:th.textSec, fontSize:12, marginBottom:6 }}>{c.label}</div>
                  <div>
                    <span style={{ fontFamily:'Rajdhani,sans-serif', fontSize:32, fontWeight:800, color:th.text }}>{c.value}</span>
                    <span style={{ color:th.textSec, fontSize:13, marginLeft:6 }}>{c.unit}</span>
                  </div>
                </div>
              ))}
            </div>

            {/* Pace badge */}
            <div style={{ background:th.card, border:`1px solid ${th.border}`, borderRadius:14, padding:'14px 20px', display:'flex', alignItems:'center', gap:14 }}>
              <span style={{ fontSize:28 }}>👟</span>
              <div>
                <div style={{ color:th.textSec, fontSize:11, textTransform:'uppercase', letterSpacing:0.5 }}>Средний результат</div>
                <div style={{ fontFamily:'Rajdhani,sans-serif', fontSize:22, fontWeight:700, color:th.primary }}>4:32 мин/км</div>
              </div>
            </div>

            {/* Quote */}
            <div style={{ background:`rgba(255,255,255,0.03)`, border:`1px solid ${th.border}`, borderRadius:14, padding:'16px 20px', color:th.textSec, fontSize:13, lineHeight:1.7, fontStyle:'italic' }}>
              Примерно на <strong style={{ color:th.text }}>30–35 километре</strong> многие бегуны сталкиваются с явлением, которое называют «стеной».
              В этот момент запасы гликогена в мышцах истощаются. Преодоление этого барьера — это уже не вопрос физики, а вопрос чистого упрямства и силы духа.
            </div>
          </div>

          {/* RIGHT */}
          <div style={{ width:440, position:'relative', flexShrink:0 }}>
            <img src={`${GITHUB_BASE}marathon_hero.png`} alt="hero" style={{ position:'absolute', inset:0, width:'100%', height:'100%', objectFit:'cover', opacity:0.55 }} onError={e=>e.target.style.display='none'}/>
            <div style={{ position:'absolute', inset:0, background:'linear-gradient(to right, rgba(8,19,32,0.8), transparent)' }}/>
            <div style={{ position:'relative', zIndex:1, padding:32, height:'100%', display:'flex', flexDirection:'column', justifyContent:'space-between' }}>
              <div style={{ background:'rgba(0,0,0,0.4)', backdropFilter:'blur(10px)', border:`1px solid ${th.border}`, borderRadius:14, padding:'16px 20px', textAlign:'center' }}>
                <div style={{ fontSize:11, color:th.textSec, textTransform:'uppercase', letterSpacing:1, marginBottom:6 }}>🗓 Дата марафона</div>
                <div style={{ fontFamily:'Rajdhani,sans-serif', fontSize:26, fontWeight:800, color:th.primary }}>15 ИЮНЯ 2026</div>
              </div>
              <div style={{ background:'rgba(0,0,0,0.4)', backdropFilter:'blur(10px)', border:`1px solid ${th.border}`, borderRadius:14, padding:'20px' }}>
                {[
                  { icon:'🥇', label:'Медали', value:'Gold' },
                  { icon:'🌡️', label:'Температура', value:'+18°C' },
                  { icon:'💨', label:'Ветер', value:'12 км/ч' },
                ].map(w => (
                  <div key={w.label} style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'8px 0', borderBottom:`1px solid rgba(255,255,255,0.07)` }}>
                    <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                      <span>{w.icon}</span>
                      <span style={{ color:th.textSec, fontSize:13 }}>{w.label}</span>
                    </div>
                    <span style={{ fontWeight:700, color:th.text }}>{w.value}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </Layout>
  )
}

export default HomePage
