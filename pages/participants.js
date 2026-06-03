import Layout from '../components/Layout'
import withAuth from '../components/withAuth'
import { useState, useEffect } from 'react'
import { BMI_COLOR, BMI_NAME, calcAge } from '../lib/constants'

const ROLE_COLORS = { Runner:'#00C6FF', Coordinator:'#00E5A8', Administrator:'#FF6B35' }
const ROLE_RU = { Runner:'Бегун', Coordinator:'Координатор', Administrator:'Администратор' }

function ParticipantsPage() {
  const [participants, setParticipants] = useState([])
  const [search, setSearch] = useState('')
  const [role, setRole] = useState('All')
  const [sort, setSort] = useState('Id')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadParticipants()
  }, [search, role, sort])

  async function loadParticipants() {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (search) params.set('search', search)
      if (role !== 'All') params.set('role', role)
      if (sort) params.set('sort', sort)
      const res = await fetch(`/api/participants?${params}`)
      const data = await res.json()
      setParticipants(Array.isArray(data) ? data : [])
    } catch {}
    setLoading(false)
  }

  return (
    <Layout>
      {(th) => (
        <div style={{ display:'flex', flexDirection:'column', height:'100%', overflow:'hidden' }}>

          {/* Header */}
          <div style={{ padding:'24px 32px 0', display:'flex', alignItems:'center', gap:14, flexShrink:0 }}>
            <h2 style={{ fontFamily:'Rajdhani,sans-serif', fontSize:30, fontWeight:800, color:th.primary }}>Участники</h2>
            <span style={{ background:th.card, border:`1px solid ${th.border}`, borderRadius:20, padding:'2px 12px', fontSize:13, fontWeight:700, color:th.textSec }}>
              {participants.length}
            </span>
          </div>

          {/* Toolbar */}
          <div style={{ padding:'16px 32px', display:'flex', gap:12, flexShrink:0, flexWrap:'wrap' }}>
            <div style={{ flex:1, minWidth:220, position:'relative' }}>
              <span style={{ position:'absolute', left:12, top:'50%', transform:'translateY(-50%)', fontSize:14 }}>🔍</span>
              <input value={search} onChange={e => setSearch(e.target.value)}
                placeholder="Поиск по имени, email, стране…"
                style={{
                  width:'100%', paddingLeft:36, paddingRight:12, paddingTop:9, paddingBottom:9,
                  background:th.inputBg, border:`1px solid ${th.border}`, borderRadius:10,
                  color:th.text, fontSize:13, fontFamily:'inherit', outline:'none',
                }}
              />
              {search && <span onClick={() => setSearch('')} style={{ position:'absolute', right:10, top:'50%', transform:'translateY(-50%)', cursor:'pointer', color:th.textSec, fontSize:16 }}>✕</span>}
            </div>
            {[
              { id:'role', value:role, set:setRole, options:[
                ['All','Все роли'],['Runner','Бегун'],['Coordinator','Координатор'],['Administrator','Администратор'],
                ['Underweight','BMI: Недостаток'],['Normal','BMI: Норма'],['Overweight','BMI: Избыток'],['Obese','BMI: Ожирение'],
              ]},
              { id:'sort', value:sort, set:setSort, options:[
                ['Id','По ID'],['FirstName','Имя А–Я'],['BmiAsc','BMI ↑'],['BmiDesc','BMI ↓'],['AgeAsc','Возраст ↑'],['AgeDesc','Возраст ↓'],
              ]},
            ].map(s => (
              <select key={s.id} value={s.value} onChange={e => s.set(e.target.value)} style={{
                padding:'9px 14px', background:th.inputBg, border:`1px solid ${th.border}`,
                borderRadius:10, color:th.text, fontSize:13, fontFamily:'inherit', cursor:'pointer', minWidth:160, outline:'none',
              }}>
                {s.options.map(([v,l]) => <option key={v} value={v}>{l}</option>)}
              </select>
            ))}
          </div>

          {/* Table */}
          <div style={{ flex:1, overflowY:'auto', padding:'0 32px 24px' }}>
            {loading ? (
              <div style={{ textAlign:'center', padding:60, color:th.textSec, fontSize:14 }}>Загрузка...</div>
            ) : participants.length === 0 ? (
              <div style={{ textAlign:'center', padding:60, fontSize:32 }}>😔<br/><span style={{ fontSize:14, color:th.textSec }}>Участники не найдены</span></div>
            ) : (
              <table style={{ width:'100%', borderCollapse:'collapse', fontSize:13 }}>
                <thead>
                  <tr>
                    {['ID','Участник','Email','Телефон','Страна','Возраст','BMI','Роль'].map(h => (
                      <th key={h} style={{ padding:'10px 14px', textAlign:'left', fontSize:10, fontWeight:700, letterSpacing:1, color:th.textSec, textTransform:'uppercase', background:th.nav, borderBottom:`1px solid ${th.border}`, position:'sticky', top:0 }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {participants.map(p => {
                    const bmiCat = p.bmi_category
                    const bmiColor = bmiCat ? BMI_COLOR[bmiCat] : th.textSec
                    const age = calcAge(p.birth_date)
                    return (
                      <tr key={p.id} style={{ borderBottom:`1px solid rgba(255,255,255,0.04)`, transition:'background 0.15s' }}
                        onMouseEnter={e => e.currentTarget.style.background='rgba(255,255,255,0.03)'}
                        onMouseLeave={e => e.currentTarget.style.background='transparent'}
                      >
                        <td style={{ padding:'12px 14px', color:th.textSec, fontWeight:600 }}>#{p.id}</td>
                        <td style={{ padding:'12px 14px' }}>
                          <div style={{ fontWeight:600 }}>{p.first_name} {p.last_name}</div>
                        </td>
                        <td style={{ padding:'12px 14px', color:th.textSec, fontSize:12 }}>{p.email}</td>
                        <td style={{ padding:'12px 14px', color:th.textSec, fontSize:12 }}>{p.phone}</td>
                        <td style={{ padding:'12px 14px' }}>{p.country}</td>
                        <td style={{ padding:'12px 14px', textAlign:'center' }}>{age}</td>
                        <td style={{ padding:'12px 14px' }}>
                          {p.bmi ? (
                            <span style={{ background:`${bmiColor}1a`, border:`1px solid ${bmiColor}44`, borderRadius:6, padding:'2px 8px', color:bmiColor, fontWeight:700, fontSize:12 }}>
                              {p.bmi} {bmiCat ? `· ${BMI_NAME[bmiCat]}` : ''}
                            </span>
                          ) : '—'}
                        </td>
                        <td style={{ padding:'12px 14px' }}>
                          {p.role ? (
                            <span style={{ background:`${ROLE_COLORS[p.role]||'#888'}1a`, border:`1px solid ${ROLE_COLORS[p.role]||'#888'}44`, borderRadius:6, padding:'2px 10px', color:ROLE_COLORS[p.role]||'#888', fontWeight:600, fontSize:12 }}>
                              {ROLE_RU[p.role]||p.role}
                            </span>
                          ) : '—'}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}
    </Layout>
  )
}

export default withAuth(ParticipantsPage)
