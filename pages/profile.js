import Layout from '../components/Layout'
import { useRouter } from 'next/router'
import { useState, useEffect } from 'react'

const COUNTRIES = ['Австралия','Австрия','Аргентина','Беларусь','Бельгия','Бразилия','Великобритания','Германия','Греция','Дания','Израиль','Индия','Испания','Италия','Казахстан','Канада','Китай','Нидерланды','Норвегия','Польша','Португалия','Россия','США','Финляндия','Франция','Чехия','Швейцария','Швеция','Япония']

function Input({ label, error, ...props }) {
  return (
    <div style={{ display:'flex', flexDirection:'column', gap:6 }}>
      {label && <label style={{ fontSize:12, fontWeight:600, color:'var(--text-sec)', textTransform:'uppercase', letterSpacing:0.5 }}>{label}</label>}
      <input style={{
        padding:'10px 14px', background:'var(--input-bg)', border:`1px solid ${error?'#FF4860':'var(--border)'}`,
        borderRadius:10, color:'var(--text)', fontSize:14, fontFamily:'inherit', outline:'none', width:'100%', boxSizing:'border-box',
      }} {...props}/>
      {error && <span style={{ color:'#FF4860', fontSize:12 }}>{error}</span>}
    </div>
  )
}

export default function ProfilePage() {
  const router = useRouter()
  const [pid, setPid] = useState(null)
  const [form, setForm] = useState(null)
  const [errors, setErrors] = useState({})
  const [saving, setSaving] = useState(false)
  const [success, setSuccess] = useState(false)
  const [newPassword, setNewPassword] = useState('')
  const [newPassword2, setNewPassword2] = useState('')

  useEffect(() => {
    const id = typeof window !== 'undefined' ? localStorage.getItem('participant_id') : null
    if (!id) { router.push('/login'); return }
    setPid(id)
    fetch(`/api/participants/profile?id=${id}`)
      .then(r => r.json())
      .then(d => { if (d.id) setForm(d) })
      .catch(() => {})
  }, [router])

  function set(k, v) { setForm(f => ({...f, [k]:v})); setErrors(e => ({...e, [k]:''})) }

  async function save() {
    const e = {}
    if (!form.first_name?.trim()) e.first_name = 'Введите имя'
    if (!form.last_name?.trim()) e.last_name = 'Введите фамилию'
    if (newPassword && newPassword.length < 6) e.password = 'Минимум 6 символов'
    if (newPassword && newPassword !== newPassword2) e.password2 = 'Пароли не совпадают'
    if (Object.keys(e).length) { setErrors(e); return }

    setSaving(true)
    const body = { id: pid, ...form }
    if (newPassword) body.password = newPassword

    try {
      const res = await fetch(`/api/participants/profile?id=${pid}`, {
        method: 'PUT',
        headers: { 'Content-Type':'application/json' },
        body: JSON.stringify(body),
      })
      if (res.ok) {
        const d = await res.json()
        localStorage.setItem('participant_name', `${d.first_name} ${d.last_name}`)
        setSuccess(true)
        setNewPassword(''); setNewPassword2('')
        setTimeout(() => setSuccess(false), 3000)
      } else {
        const d = await res.json()
        setErrors({ submit: d.error || 'Ошибка сохранения' })
      }
    } catch { setErrors({ submit: 'Ошибка сети' }) }
    setSaving(false)
  }

  function logout() {
    localStorage.removeItem('participant_id')
    localStorage.removeItem('participant_name')
    router.push('/')
  }

  if (!form) return (
    <div style={{ display:'flex', alignItems:'center', justifyContent:'center', height:'100vh', background:'#081320' }}>
      <div style={{ color:'#00C6FF', fontFamily:'Rajdhani,sans-serif', fontSize:18 }}>Загрузка...</div>
    </div>
  )

  return (
    <Layout>
      {(th) => (
        <div style={{ padding:'36px 40px', maxWidth:700, margin:'0 auto', overflowY:'auto', height:'100%' }}>
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:28 }}>
            <h2 style={{ fontFamily:'Rajdhani,sans-serif', fontSize:30, fontWeight:800, color:th.primary, margin:0 }}>
              Мой профиль
            </h2>
            <div style={{ display:'flex', gap:10 }}>
              <button onClick={() => router.push('/')} style={{
                padding:'8px 18px', borderRadius:8, background:'transparent',
                border:`1px solid ${th.border}`, color:th.textSec, fontSize:13, cursor:'pointer', fontFamily:'inherit',
              }}>← Назад</button>
              <button onClick={logout} style={{
                padding:'8px 18px', borderRadius:8, background:'rgba(255,72,96,0.12)',
                border:'1px solid rgba(255,72,96,0.4)', color:'#FF4860', fontSize:13, cursor:'pointer', fontFamily:'inherit',
              }}>Выйти</button>
            </div>
          </div>

          {success && (
            <div style={{ background:'rgba(0,229,168,0.1)', border:'1px solid rgba(0,229,168,0.3)', borderRadius:12, padding:'12px 18px', color:'#00E5A8', fontWeight:600, marginBottom:18, fontSize:14 }}>
              ✅ Профиль обновлён!
            </div>
          )}
          {errors.submit && (
            <div style={{ background:'rgba(255,72,96,0.1)', border:'1px solid rgba(255,72,96,0.3)', borderRadius:12, padding:'12px 18px', color:'#FF4860', marginBottom:18, fontSize:14 }}>
              ⚠ {errors.submit}
            </div>
          )}

          <div style={{ display:'flex', flexDirection:'column', gap:16 }}>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16 }}>
              <Input label="Имя" value={form.first_name||''} onChange={e=>set('first_name',e.target.value)} error={errors.first_name}/>
              <Input label="Фамилия" value={form.last_name||''} onChange={e=>set('last_name',e.target.value)} error={errors.last_name}/>
            </div>
            <Input label="Email" type="email" value={form.email||''} onChange={e=>set('email',e.target.value)}/>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16 }}>
              <Input label="Телефон" value={form.phone||''} onChange={e=>set('phone',e.target.value)}/>
              <Input label="Дата рождения" type="date" value={form.birth_date||''} onChange={e=>set('birth_date',e.target.value)}/>
            </div>

            <div style={{ display:'flex', flexDirection:'column', gap:6 }}>
              <label style={{ fontSize:12, fontWeight:600, color:th.textSec, textTransform:'uppercase', letterSpacing:0.5 }}>Страна</label>
              <select value={form.country||''} onChange={e=>set('country',e.target.value)} style={{
                padding:'10px 14px', background:th.inputBg, border:`1px solid ${th.border}`,
                borderRadius:10, color:th.text, fontSize:14, fontFamily:'inherit', outline:'none',
              }}>
                {COUNTRIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>

            <div>
              <div style={{ fontSize:12, fontWeight:600, color:th.textSec, textTransform:'uppercase', letterSpacing:0.5, marginBottom:8 }}>Пол</div>
              <div style={{ display:'flex', background:th.card, border:`1px solid ${th.border}`, borderRadius:10, overflow:'hidden', width:'fit-content' }}>
                {[{v:'m',l:'♂ Мужской'},{v:'f',l:'♀ Женский'}].map(g => (
                  <button key={g.v} onClick={() => set('gender',g.v)} style={{
                    padding:'9px 24px', fontSize:14, fontWeight:600, border:'none', cursor:'pointer',
                    background: form.gender===g.v ? `linear-gradient(135deg,${th.primary},${th.primaryDk})` : 'transparent',
                    color: form.gender===g.v ? '#fff' : th.textSec, fontFamily:'inherit',
                  }}>{g.l}</button>
                ))}
              </div>
            </div>

            <div style={{ borderTop:`1px solid ${th.border}`, paddingTop:16, marginTop:4 }}>
              <div style={{ fontSize:13, fontWeight:600, color:th.textSec, marginBottom:12 }}>🔒 Сменить пароль (необязательно)</div>
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16 }}>
                <Input label="Новый пароль" type="password" value={newPassword} onChange={e=>setNewPassword(e.target.value)} placeholder="Минимум 6 символов" error={errors.password}/>
                <Input label="Повторите пароль" type="password" value={newPassword2} onChange={e=>setNewPassword2(e.target.value)} placeholder="Повторите пароль" error={errors.password2}/>
              </div>
            </div>

            <div style={{ display:'flex', gap:12, marginTop:8 }}>
              <button onClick={save} disabled={saving} style={{
                padding:'12px 28px', borderRadius:10,
                background:`linear-gradient(135deg,${th.primary},${th.primaryDk})`,
                color:'#fff', fontWeight:700, fontSize:14, border:'none', cursor:'pointer', fontFamily:'inherit',
                opacity: saving ? 0.7 : 1,
              }}>{saving ? 'Сохранение…' : '💾 Сохранить изменения'}</button>
            </div>

            {form.login && (
              <div style={{ background:`rgba(0,0,0,0.3)`, border:`1px solid ${th.border}`, borderRadius:10, padding:'10px 16px', fontSize:13, color:th.textSec }}>
                Ваш логин для входа: <strong style={{ color:th.primary }}>{form.login}</strong>
              </div>
            )}
          </div>
        </div>
      )}
    </Layout>
  )
}
