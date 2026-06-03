import Layout from '../components/Layout'
import withAuth from '../components/withAuth'
import Link from 'next/link'
import { useState, useEffect } from 'react'
import { GITHUB_BASE } from '../lib/constants'

function HomePage() {
  const [stats, setStats] = useState({ participants: 0, countries: 0 })

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
              <Link href="/register" style={{
                padding:'12px 24px', borderRadius:10, background:`linear-gradient(135deg,${th.primary},${th.primaryDk})`,
                color:'#fff', fontWeight:700, fontSize:14, textDecoration:'none',
                boxShadow:`0 4px 14px ${th.shadow}`,
              }}>📝 Регистрация</Link>
              <Link href="/participants" style={{
                padding:'12px 24px', borderRadius:10,
                background:'rgba(255,255,255,0.06)', border:`1px solid ${th.border}`,
                color:th.text, fontWeight:600, fontSize:14, textDecoration:'none',
              }}>👥 Участники</Link>
              <Link href="/bmi" style={{
                padding:'12px 24px', borderRadius:10,
                background:'rgba(255,255,255,0.06)', border:`1px solid ${th.border}`,
                color:th.text, fontWeight:600, fontSize:14, textDecoration:'none',
              }}>⚖️ Калькулятор BMI</Link>
            </div>

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

export default withAuth(HomePage)
