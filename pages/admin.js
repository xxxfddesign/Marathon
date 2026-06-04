import Layout from '../components/Layout'
import withAuth from '../components/withAuth'
import { useState, useEffect } from 'react'
import { BMI_COLOR, BMI_NAME, calcAge } from '../lib/constants'

const ROLE_COLORS = { Runner:'#00C6FF', Coordinator:'#00E5A8', Administrator:'#FF6B35' }
const ROLE_RU = { Runner:'Бегун', Coordinator:'Координатор', Administrator:'Администратор' }

function AdminPage() {
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [login, setLogin] = useState('')
  const [pwd, setPwd] = useState('')
  const [error, setError] = useState('')
  const [participants, setParticipants] = useState([])
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState('All')
  const [sort, setSort] = useState('FirstName')
  const [editing, setEditing] = useState(null)
  const [editForm, setEditForm] = useState({})
  const [editError, setEditError] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const saved = localStorage.getItem('admin_logged_in')
    if (saved === 'true') setIsLoggedIn(true)
  }, [])

  useEffect(() => {
    if (isLoggedIn) loadParticipants()
  }, [isLoggedIn, search, filter, sort])

  async function loadParticipants() {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (search) params.set('search', search)
      if (filter !== 'All') params.set('role', filter)
      params.set('sort', sort)
      const res = await fetch(`/api/participants?${params}`)
      const data = await res.json()
      setParticipants(Array.isArray(data) ? data : [])
    } catch {}
    setLoading(false)
  }

  function doLogin() {
    if (login === 'admin' && pwd === 'admin') {
      setIsLoggedIn(true)
      localStorage.setItem('admin_logged_in', 'true')
      setError('')
    } else {
      setError('⚠ Неверный логин или пароль')
      setPwd('')
    }
  }

  function openEdit(p) {
    setEditing(p.id)
    setEditForm({ first_name: p.first_name, last_name: p.last_name, email: p.email, role: p.role, phone: p.phone, country: p.country, birth_date: p.birth_date, gender: p.gender, bmi: p.bmi, bmi_category: p.bmi_category })
    setEditError('')
  }

  async function saveEdit() {
    if (!editForm.first_name || !editForm.last_name) { setEditError('⚠ Заполните имя и фамилию'); return }
    try {
      const res = await fetch(`/api/participants/${editing}`, {
        method: 'PUT',
        headers: { 'Content-Type':'application/json' },
        body: JSON.stringify(editForm),
      })
      if (res.ok) { setEditing(null); loadParticipants() }
      else setEditError('⚠ Ошибка сохранения')
    } catch { setEditError('⚠ Ошибка сети') }
  }

  async function deleteParticipant(id) {
    if (!confirm('Удалить участника?')) return
    await fetch(`/api/participants/${id}`, { method: 'DELETE' })
    loadParticipants()
  }

  // LOGIN PAGE
  if (!isLoggedIn) return (
    <div style={{ minHeight:'100vh', background:'#081320', display:'flex', alignItems:'center', justifyContent:'center', fontFamily:"'Inter',sans-serif" }}>
      <div style={{ background:'#06121A', border:'1px solid #1E3C64', borderRadius:20, padding:'40px 36px', width:380, maxWidth:'92vw', boxShadow:'0 20px 60px rgba(0,0,0,0.5)' }}>
        <div style={{ fontFamily:'Rajdhani,sans-serif', fontSize:26, fontWeight:700, textAlign:'center', marginBottom:6, color:'#fff' }}>Авторизация</div>
        <div style={{ fontSize:13, color:'#C9D4E5', textAlign:'center', marginBottom:28, lineHeight:1.6 }}>Пожалуйста, авторизуйтесь в системе,<br/>используя ваш логин и пароль.</div>

        {error && <div style={{ background:'rgba(255,72,96,0.1)', border:'1px solid rgba(255,72,96,0.3)', borderRadius:8, padding:'10px 14px', fontSize:12, color:'#FF4860', textAlign:'center', marginBottom:14 }}>{error}</div>}

        {[
          { label:'Логин:', value:login, set:setLogin, type:'text', placeholder:'Введите ваш логин' },
          { label:'Пароль:', value:pwd, set:setPwd, type:'password', placeholder:'Введите ваш пароль', onKey:true },
        ].map(f => (
          <div key={f.label} style={{ display:'grid', gridTemplateColumns:'100px 1fr', alignItems:'center', gap:12, marginBottom:14 }}>
            <label style={{ fontSize:13, fontWeight:600, color:'#C9D4E5', textAlign:'right' }}>{f.label}</label>
            <input type={f.type} value={f.value} onChange={e => f.set(e.target.value)}
              placeholder={f.placeholder} autoComplete="off"
              onKeyDown={f.onKey ? e => e.key==='Enter' && doLogin() : undefined}
              style={{ padding:'10px 14px', background:'#0C1E34', border:'1px solid #1E3C64', borderRadius:10, color:'#fff', fontSize:14, fontFamily:'inherit', outline:'none' }}
            />
          </div>
        ))}

        <div style={{ display:'flex', gap:10, justifyContent:'center', marginTop:20 }}>
          <button onClick={doLogin} style={{ padding:'10px 28px', borderRadius:10, background:'linear-gradient(135deg,#00C6FF,#0072FF)', color:'#fff', fontWeight:700, fontSize:14, border:'none', cursor:'pointer', fontFamily:'inherit' }}>
            Войти
          </button>
        </div>
      </div>
    </div>
  )

  // EDIT PAGE
  if (editing) return (
    <Layout>
      {(th) => (
        <div style={{ display:'flex', alignItems:'center', justifyContent:'center', height:'100%' }}>
          <div style={{ background:th.card, border:`1px solid ${th.border}`, borderRadius:20, padding:'36px 40px', width:620, maxWidth:'96vw', boxShadow:'0 20px 60px rgba(0,0,0,0.4)' }}>
            <div style={{ fontFamily:'Rajdhani,sans-serif', fontSize:22, fontWeight:700, textAlign:'center', marginBottom:24 }}>Редактирование пользователя</div>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:28 }}>
              <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
                <div style={{ fontSize:11, fontWeight:700, color:th.textSec, textTransform:'uppercase', letterSpacing:0.8 }}>Email</div>
                <div style={{ fontSize:13, color:th.textSec, fontStyle:'italic' }}>{editForm.email}</div>
                {[
                  { label:'Имя', key:'first_name', placeholder:'Имя' },
                  { label:'Фамилия', key:'last_name', placeholder:'Фамилия' },
                ].map(f => (
                  <div key={f.key}>
                    <div style={{ fontSize:12, fontWeight:600, color:th.textSec, textTransform:'uppercase', letterSpacing:0.5, marginBottom:6 }}>{f.label}</div>
                    <input value={editForm[f.key]||''} onChange={e => setEditForm(ef => ({...ef, [f.key]:e.target.value}))}
                      placeholder={f.placeholder}
                      style={{ width:'100%', padding:'10px 14px', background:th.inputBg, border:`1px solid ${th.border}`, borderRadius:10, color:th.text, fontSize:14, fontFamily:'inherit', outline:'none' }}
                    />
                  </div>
                ))}
                <div>
                  <div style={{ fontSize:12, fontWeight:600, color:th.textSec, textTransform:'uppercase', letterSpacing:0.5, marginBottom:6 }}>Роль</div>
                  <select value={editForm.role||'Runner'} onChange={e => setEditForm(ef => ({...ef, role:e.target.value}))}
                    style={{ width:'100%', padding:'10px 14px', background:th.inputBg, border:`1px solid ${th.border}`, borderRadius:10, color:th.text, fontSize:14, fontFamily:'inherit', outline:'none', cursor:'pointer' }}
                  >
                    <option value="Runner">Бегун</option>
                    <option value="Coordinator">Координатор</option>
                    <option value="Administrator">Администратор</option>
                  </select>
                </div>
              </div>
              <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
                <div style={{ fontSize:11, fontWeight:700, color:th.textSec, textTransform:'uppercase', letterSpacing:0.8 }}>Дополнительно</div>
                {[
                  { label:'Телефон', key:'phone' },
                  { label:'Страна', key:'country' },
                ].map(f => (
                  <div key={f.key}>
                    <div style={{ fontSize:12, fontWeight:600, color:th.textSec, textTransform:'uppercase', letterSpacing:0.5, marginBottom:6 }}>{f.label}</div>
                    <input value={editForm[f.key]||''} onChange={e => setEditForm(ef => ({...ef, [f.key]:e.target.value}))}
                      style={{ width:'100%', padding:'10px 14px', background:th.inputBg, border:`1px solid ${th.border}`, borderRadius:10, color:th.text, fontSize:14, fontFamily:'inherit', outline:'none' }}
                    />
                  </div>
                ))}
                {editError && <div style={{ background:'rgba(255,72,96,0.1)', border:'1px solid rgba(255,72,96,0.3)', borderRadius:8, padding:'10px 14px', color:'#FF4860', fontSize:12 }}>{editError}</div>}
              </div>
            </div>
            <div style={{ display:'flex', gap:10, justifyContent:'center', marginTop:24 }}>
              <button onClick={saveEdit} style={{ padding:'10px 24px', borderRadius:10, background:`linear-gradient(135deg,${th.primary},${th.primaryDk})`, color:'#fff', fontWeight:700, fontSize:14, border:'none', cursor:'pointer', fontFamily:'inherit' }}>💾 Сохранить</button>
              <button onClick={() => setEditing(null)} style={{ padding:'10px 20px', borderRadius:10, background:'rgba(255,255,255,0.06)', border:`1px solid ${th.border}`, color:th.textSec, fontSize:14, cursor:'pointer', fontFamily:'inherit' }}>Отмена</button>
            </div>
          </div>
        </div>
      )}
    </Layout>
  )

  // ADMIN USERS TABLE
  return (
    <Layout>
      {(th) => (
        <div style={{ display:'flex', flexDirection:'column', height:'100%', overflow:'hidden' }}>
          <div style={{ padding:'20px 32px 0', display:'flex', alignItems:'center', justifyContent:'space-between', flexShrink:0 }}>
            <h2 style={{ fontFamily:'Rajdhani,sans-serif', fontSize:28, fontWeight:800, color:th.primary }}>👑 Панель администратора</h2>
            <button onClick={() => setIsLoggedIn(false)} style={{ padding:'7px 16px', borderRadius:8, background:'rgba(255,72,96,0.1)', border:'1px solid rgba(255,72,96,0.25)', color:'#FF4860', fontSize:12, fontWeight:600, cursor:'pointer', fontFamily:'inherit' }}>Logout</button>
          </div>

          <div style={{ padding:'14px 32px', display:'flex', gap:10, flexShrink:0, flexWrap:'wrap' }}>
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Поиск..."
              style={{ flex:1, minWidth:180, padding:'9px 14px', background:th.inputBg, border:`1px solid ${th.border}`, borderRadius:10, color:th.text, fontSize:13, fontFamily:'inherit', outline:'none' }}
            />
            <select value={filter} onChange={e => setFilter(e.target.value)} style={{ padding:'9px 14px', background:th.inputBg, border:`1px solid ${th.border}`, borderRadius:10, color:th.text, fontSize:13, fontFamily:'inherit', cursor:'pointer', outline:'none' }}>
              <option value="All">Все роли</option>
              <option value="Runner">Бегун</option>
              <option value="Coordinator">Координатор</option>
              <option value="Administrator">Администратор</option>
            </select>
            <select value={sort} onChange={e => setSort(e.target.value)} style={{ padding:'9px 14px', background:th.inputBg, border:`1px solid ${th.border}`, borderRadius:10, color:th.text, fontSize:13, fontFamily:'inherit', cursor:'pointer', outline:'none' }}>
              <option value="FirstName">По имени</option>
              <option value="LastName">По фамилии</option>
              <option value="Id">По ID</option>
            </select>
          </div>

          <div style={{ padding:'0 32px 6px', fontSize:13, color:th.textSec, flexShrink:0 }}>
            Всего пользователей: <span style={{ color:th.text, fontWeight:600 }}>{participants.length}</span>
          </div>

          <div style={{ flex:1, overflowY:'auto', padding:'0 32px 24px' }}>
            {loading ? (
              <div style={{ textAlign:'center', padding:40, color:th.textSec }}>Загрузка...</div>
            ) : (
              <table style={{ width:'100%', borderCollapse:'collapse', fontSize:13 }}>
                <thead>
                  <tr>
                    {['Имя','Фамилия','Email','Роль',''].map(h => (
                      <th key={h} style={{ padding:'10px 14px', textAlign:'left', fontSize:10, fontWeight:700, letterSpacing:1, color:th.textSec, textTransform:'uppercase', background:th.nav, borderBottom:`1px solid ${th.border}`, position:'sticky', top:0 }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {participants.map(p => (
                    <tr key={p.id} style={{ borderBottom:`1px solid rgba(255,255,255,0.04)` }}
                      onMouseEnter={e => e.currentTarget.style.background='rgba(255,255,255,0.03)'}
                      onMouseLeave={e => e.currentTarget.style.background='transparent'}
                    >
                      <td style={{ padding:'12px 14px', fontWeight:600 }}>{p.first_name}</td>
                      <td style={{ padding:'12px 14px' }}>{p.last_name}</td>
                      <td style={{ padding:'12px 14px', color:th.textSec, fontSize:12 }}>{p.email}</td>
                      <td style={{ padding:'12px 14px' }}>
                        <span style={{ background:`${ROLE_COLORS[p.role]||'#888'}1a`, border:`1px solid ${ROLE_COLORS[p.role]||'#888'}44`, borderRadius:6, padding:'2px 10px', color:ROLE_COLORS[p.role]||'#888', fontWeight:600, fontSize:12 }}>
                          {ROLE_RU[p.role]||p.role}
                        </span>
                      </td>
                      <td style={{ padding:'12px 14px', display:'flex', gap:8 }}>
                        <button onClick={() => openEdit(p)} style={{ padding:'5px 14px', borderRadius:7, background:`${th.primary}22`, border:`1px solid ${th.primary}44`, color:th.primary, fontSize:12, fontWeight:600, cursor:'pointer', fontFamily:'inherit' }}>Edit</button>
                        <button onClick={() => deleteParticipant(p.id)} style={{ padding:'5px 14px', borderRadius:7, background:'rgba(255,72,96,0.1)', border:'1px solid rgba(255,72,96,0.3)', color:'#FF4860', fontSize:12, fontWeight:600, cursor:'pointer', fontFamily:'inherit' }}>✕</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}
    </Layout>
  )
}

export default withAuth(AdminPage)
