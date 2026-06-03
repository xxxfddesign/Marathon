import Layout from '../components/Layout'
import withAuth from '../components/withAuth'
import { useState, useEffect } from 'react'
import { getBmiCategory, BMI_COLOR, BMI_NAME, BMI_REC, GITHUB_BASE } from '../lib/constants'

function BmiPage() {
  const [height, setHeight] = useState(170)
  const [weight, setWeight] = useState(70)
  const [female, setFemale] = useState(false)
  const [saved, setSaved] = useState(null)

  const bmi = +(weight / ((height / 100) ** 2)).toFixed(1)
  const cat = getBmiCategory(bmi, female)
  const color = BMI_COLOR[cat]
  const totalBmiRange = 35
  const arrowPct = Math.min(Math.max(((bmi - 10) / totalBmiRange) * 100, 0), 100)

  function bmiReset() { setHeight(170); setWeight(70); setFemale(false) }

  function bmySave() {
    if (typeof window !== 'undefined') {
      localStorage.setItem('ms_bmi', JSON.stringify({ bmi, category: cat, height, weight, female }))
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
    }
  }

  const figMap = { Underweight:'thin', Normal:'normal', Overweight:'overweight', Obese:'obese' }
  const figureImg = female
    ? `${GITHUB_BASE}bmi_f_${figMap[cat]}.png`
    : `${GITHUB_BASE}bmi_${figMap[cat]}.png`

  const categories = [
    { key:'Underweight', label:'Недостаток веса', icon:'🟡', color:'#FFC400', range: female ? '< 17.5' : '< 18.5' },
    { key:'Normal',      label:'Норма',           icon:'🟢', color:'#00E5A8', range: female ? '17.5 — 23.9' : '18.5 — 24.9' },
    { key:'Overweight',  label:'Избыточный вес',  icon:'🟠', color:'#FF8C00', range: female ? '24 — 28.9' : '25 — 29.9' },
    { key:'Obese',       label:'Ожирение',        icon:'🔴', color:'#FF4860', range: female ? '≥ 29' : '≥ 30' },
  ]

  return (
    <Layout>
      {(th) => (
        <div style={{ display:'flex', height:'100%', overflow:'hidden' }}>

          {/* LEFT */}
          <div style={{ flex:1, padding:'36px 40px', overflowY:'auto', display:'flex', flexDirection:'column', gap:20 }}>
            <h2 style={{ fontFamily:'Rajdhani,sans-serif', fontSize:32, fontWeight:800, color:th.primary }}>Калькулятор BMI</h2>

            {/* Gender */}
            <div>
              <div style={{ color:th.textSec, fontSize:12, textTransform:'uppercase', letterSpacing:0.5, marginBottom:8 }}>Пол</div>
              <div style={{ display:'flex', background:th.card, border:`1px solid ${th.border}`, borderRadius:10, overflow:'hidden', width:'fit-content' }}>
                {[{val:false,label:'♂ Мужской'},{val:true,label:'♀ Женский'}].map(g => (
                  <button key={String(g.val)} onClick={() => setFemale(g.val)} style={{
                    padding:'9px 24px', fontSize:14, fontWeight:600, border:'none', cursor:'pointer',
                    background: female===g.val ? `linear-gradient(135deg,${th.primary},${th.primaryDk})` : 'transparent',
                    color: female===g.val ? '#fff' : th.textSec, fontFamily:'inherit', transition:'all 0.2s',
                  }}>{g.label}</button>
                ))}
              </div>
            </div>

            {/* BMI display */}
            <div style={{ background:th.card, border:`2px solid ${color}33`, borderRadius:16, padding:'20px 24px' }}>
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:12 }}>
                <div>
                  <div style={{ color:th.textSec, fontSize:12, textTransform:'uppercase', letterSpacing:0.5 }}>Индекс массы тела</div>
                  <div style={{ marginTop:4 }}>
                    <span style={{ fontFamily:'Rajdhani,sans-serif', fontSize:52, fontWeight:900, color }}>{bmi}</span>
                    <span style={{ color:th.textSec, fontSize:16, marginLeft:6 }}>BMI</span>
                  </div>
                </div>
                <div style={{ background:`${color}22`, border:`1px solid ${color}66`, borderRadius:20, padding:'6px 16px', color, fontWeight:700, fontSize:14 }}>
                  {BMI_NAME[cat]}
                </div>
              </div>
              {/* Progress bar */}
              <div style={{ position:'relative', height:8, background:`rgba(255,255,255,0.08)`, borderRadius:8, overflow:'visible' }}>
                <div style={{ position:'absolute', left:0, top:0, height:'100%', width:`${arrowPct}%`, background:`linear-gradient(90deg,#FFC400,${color})`, borderRadius:8, transition:'width 0.3s' }}/>
                <div style={{ position:'absolute', top:'50%', left:`${arrowPct}%`, transform:'translate(-50%,-50%)', width:14, height:14, background:color, borderRadius:'50%', border:'2px solid #fff', boxShadow:`0 0 8px ${color}`, transition:'left 0.3s' }}/>
              </div>
              <div style={{ display:'flex', justifyContent:'space-between', marginTop:8, fontSize:10, color:th.textSec }}>
                <span>Недостаток</span><span>Норма</span><span>Избыток</span><span>Ожирение</span>
              </div>
            </div>

            {/* Sliders */}
            {[
              { label:'Рост', unit:'см', value:height, set:setHeight, min:140, max:220, id:'height' },
              { label:'Вес',  unit:'кг', value:weight, set:setWeight, min:40,  max:160, id:'weight' },
            ].map(s => (
              <div key={s.id}>
                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:8 }}>
                  <span style={{ color:th.textSec, fontSize:13 }}>{s.label}</span>
                  <div style={{ background:th.card, border:`1px solid ${th.border}`, borderRadius:8, padding:'4px 12px' }}>
                    <span style={{ fontFamily:'Rajdhani,sans-serif', fontSize:20, fontWeight:700, color:th.primary }}>{s.value}</span>
                    <span style={{ color:th.textSec, fontSize:11, marginLeft:4 }}>{s.unit}</span>
                  </div>
                </div>
                <input type="range" min={s.min} max={s.max} value={s.value}
                  onChange={e => s.set(+e.target.value)}
                  style={{ width:'100%', accentColor:th.primary, cursor:'pointer', height:6 }}
                />
              </div>
            ))}

            {/* Buttons */}
            <div style={{ display:'flex', gap:10 }}>
              <button onClick={bmySave} style={{
                padding:'11px 22px', borderRadius:10,
                background: saved ? '#00E5A8' : `linear-gradient(135deg,${th.primary},${th.primaryDk})`,
                color:'#fff', fontWeight:700, fontSize:14, cursor:'pointer', border:'none', fontFamily:'inherit', transition:'all 0.2s',
              }}>{saved ? '✅ Сохранено!' : '💾 Сохранить и продолжить'}</button>
              <button onClick={bmiReset} style={{ padding:'11px 18px', borderRadius:10, background:'rgba(255,255,255,0.06)', border:`1px solid ${th.border}`, color:th.textSec, fontSize:14, cursor:'pointer', fontFamily:'inherit' }}>↺ Сбросить</button>
            </div>
          </div>

          {/* RIGHT */}
          <div style={{ width:380, padding:'36px 32px', borderLeft:`1px solid ${th.border}`, overflowY:'auto', display:'flex', flexDirection:'column', gap:20 }}>
            <div>
              <div style={{ fontSize:11, fontWeight:700, textTransform:'uppercase', letterSpacing:0.5, color:th.textSec, marginBottom:12 }}>Категории BMI</div>
              <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
                {categories.map(c => (
                  <div key={c.key} style={{ background: cat===c.key ? `${c.color}14` : th.card, border:`1px solid ${cat===c.key ? c.color+'44' : th.border}`, borderRadius:12, padding:'12px 16px', display:'flex', justifyContent:'space-between', alignItems:'center', transition:'all 0.2s' }}>
                    <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                      <span>{c.icon}</span>
                      <span style={{ fontSize:13, fontWeight:600, color: cat===c.key ? c.color : th.text }}>
                        {c.label} {cat===c.key && '✓'}
                      </span>
                    </div>
                    <span style={{ fontSize:12, color:th.textSec }}>{c.range}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Figure */}
            <div style={{ display:'flex', justifyContent:'center' }}>
              <img src={figureImg} alt="figure" style={{ height:180, objectFit:'contain', opacity:0.9 }} onError={e=>e.target.style.display='none'}/>
            </div>

            {/* Recommendation */}
            <div style={{ background:`${color}12`, border:`1px solid ${color}33`, borderRadius:12, padding:'14px 18px', color, fontSize:13, lineHeight:1.6 }}>
              {BMI_REC[cat]}
            </div>
          </div>
        </div>
      )}
    </Layout>
  )
}

export default withAuth(BmiPage)
