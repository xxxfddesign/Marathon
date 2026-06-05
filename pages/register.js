import Layout from '../components/Layout'
import withAuth from '../components/withAuth'
import { useState } from 'react'
import { useRouter } from 'next/router'
import { getBmiCategory, GITHUB_BASE } from '../lib/constants'

const COUNTRIES = ['Австралия','Австрия','Аргентина','Беларусь','Бельгия','Бразилия','Великобритания','Германия','Греция','Дания','Израиль','Индия','Испания','Италия','Казахстан','Канада','Китай','Нидерланды','Норвегия','Польша','Португалия','Россия','США','Финляндия','Франция','Чехия','Швейцария','Швеция','Япония']

function Input({ label, error, ...props }) {
  return (
    <div style={{ display:'flex', flexDirection:'column', gap:6 }}>
      {label && <label style={{ fontSize:12, fontWeight:600, color:'var(--text-sec)', textTransform:'uppercase', letterSpacing:0.5 }}>{label}</label>}
      <input style={{
        padding:'10px 14px', background:'var(--input-bg)', border:`1px solid ${error?'#FF4860':'var(--border)'}`,
        borderRadius:10, color:'var(--text)', fontSize:14, fontFamily:'inherit', outline:'none', width:'100%',
      }} {...props}/>
      {error && <span style={{ color:'#FF4860', fontSize:12 }}>{error}</span>}
    </div>
  )
}

function RegisterPage() {
  const router = useRouter()
  const [form, setForm] = useState({
    first_name:'', last_name:'', email:'', phone:'', birth_date:'1990-01-01',
    country:'Казахстан', gender:'m', login:'', password:'', password2:'',
  })
  const [errors, setErrors] = useState({})
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)

  const bmiData = typeof window !== 'undefined' ? JSON.parse(localStorage.getItem('ms_bmi')||'null') : null

  function set(k, v) { setForm(f => ({...f, [k]:v})); setErrors(e => ({...e, [k]:''})) }

  function validate() {
    const e = {}
    if (!form.first_name.trim()) e.first_name = 'Введите имя'
    if (!form.last_name.trim()) e.last_name = 'Введите фамилию'
    if (!form.email.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) e.email = 'Некорректный email'
    if (!form.phone.trim()) e.phone = 'Введите телефон'
    if (!form.birth_date) e.birth_date = 'Укажите дату'
    if (!form.country) e.country = 'Выберите страну'
    if (!form.login.trim() || form.login.trim().length < 3) e.login = 'Минимум 3 символа'
    if (form.password.length < 6) e.password = 'Минимум 6 символов'
    if (form.password !== form.password2) e.password2 = 'Пароли не совпадают'
    return e
  }

  async function submit() {
    const e = validate()
    if (Object.keys(e).length) { setErrors(e); return }
    setLoading(true)
    try {
      const body = {
        first_name: form.first_name.trim(),
        last_name: form.last_name.trim(),
        email: form.email.trim(),
        phone: form.phone.trim(),
        birth_date: form.birth_date,
        country: form.country,
        gender: form.gender,
        role: 'Runner',
        bmi: bmiData?.bmi || null,
        bmi_category: bmiData?.category || null,
        login: form.login.trim(),
        password: form.password,
      }
      const res = await fetch('/api/participants', {
        method: 'POST',
        headers: { 'Content-Type':'application/json' },
        body: JSON.stringify(body),
      })
      if (res.ok) {
        const saved = await res.json()
        localStorage.setItem('participant_id', String(saved.id))
        localStorage.setItem('participant_name', `${saved.first_name} ${saved.last_name}`)
        setSuccess(true)
        setTimeout(() => router.push('/participants'), 2000)
      } else {
        const d = await res.json()
        setErrors({ submit: d.error || 'Ошибка при сохранении' })
      }
    } catch {
      setErrors({ submit: 'Ошибка сети' })
    }
    setLoading(false)
  }

  const pwdStrength = form.password.length === 0 ? 0 : form.password.length < 6 ? 1 : form.password.length < 10 ? 2 : 3
  const pwdColors = ['transparent','#FF4860','#FFC400','#00E5A8']
  const pwdLabels = ['','Слабый','Средний','Сильный']

  return (
    <Layout>
      {(th) => (
        <div style={{ display:'flex', height:'100%', overflow:'hidden' }}>

          {/* LEFT - FORM */}
          <div style={{ flex:1, padding:'36px 40px', overflowY:'auto' }}>
            <h2 style={{ fontFamily:'Rajdhani,sans-serif', fontSize:30, fontWeight:800, color:th.primary, marginBottom:24 }}>Регистрация участника</h2>

            {success && (
              <div style={{ background:'rgba(0,229,168,0.1)', border:'1px solid rgba(0,229,168,0.3)', borderRadius:12, padding:'14px 20px', color:'#00E5A8', fontWeight:600, marginBottom:20, fontSize:14 }}>
                ✅ Участник успешно зарегистрирован! Переход к списку…
              </div>
            )}
            {errors.submit && (
              <div style={{ background:'rgba(255,72,96,0.1)', border:'1px solid rgba(255,72,96,0.3)', borderRadius:12, padding:'14px 20px', color:'#FF4860', marginBottom:20, fontSize:14 }}>
                ⚠ {errors.submit}
              </div>
            )}

            <div style={{ display:'flex', flexDirection:'column', gap:16 }}>
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16 }}>
                <Input label="Имя" value={form.first_name} onChange={e=>set('first_name',e.target.value)} placeholder="Введите имя" error={errors.first_name}/>
                <Input label="Фамилия" value={form.last_name} onChange={e=>set('last_name',e.target.value)} placeholder="Введите фамилию" error={errors.last_name}/>
              </div>
              <Input label="Email" type="email" value={form.email} onChange={e=>set('email',e.target.value)} placeholder="example@mail.com" error={errors.email}/>
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16 }}>
                <Input label="Телефон" value={form.phone} onChange={e=>set('phone',e.target.value)} placeholder="+7 (___) ___-__-__" error={errors.phone}/>
                <Input label="Дата рождения" type="date" value={form.birth_date} onChange={e=>set('birth_date',e.target.value)} error={errors.birth_date}/>
              </div>

              <div style={{ display:'flex', flexDirection:'column', gap:6 }}>
                <label style={{ fontSize:12, fontWeight:600, color:th.textSec, textTransform:'uppercase', letterSpacing:0.5 }}>Страна</label>
                <select value={form.country} onChange={e=>set('country',e.target.value)} style={{
                  padding:'10px 14px', background:th.inputBg, border:`1px solid ${errors.country?'#FF4860':th.border}`,
                  borderRadius:10, color:th.text, fontSize:14, fontFamily:'inherit', outline:'none',
                }}>
                  <option value="">— Выберите страну —</option>
                  {COUNTRIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
                {errors.country && <span style={{ color:'#FF4860', fontSize:12 }}>{errors.country}</span>}
              </div>

              <div>
                <div style={{ fontSize:12, fontWeight:600, color:th.textSec, textTransform:'uppercase', letterSpacing:0.5, marginBottom:8 }}>Пол</div>
                <div style={{ display:'flex', background:th.card, border:`1px solid ${th.border}`, borderRadius:10, overflow:'hidden', width:'fit-content' }}>
                  {[{v:'m',l:'♂ Мужской'},{v:'f',l:'♀ Женский'}].map(g => (
                    <button key={g.v} onClick={() => set('gender',g.v)} style={{
                      padding:'9px 24px', fontSize:14, fontWeight:600, border:'none', cursor:'pointer',
                      background: form.gender===g.v ? `linear-gradient(135deg,${th.primary},${th.primaryDk})` : 'transparent',
                      color: form.gender===g.v ? '#fff' : th.textSec, fontFamily:'inherit', transition:'all 0.2s',
                    }}>{g.l}</button>
                  ))}
                </div>
              </div>

              <Input label="Логин" value={form.login} onChange={e=>set('login',e.target.value)} placeholder="Придумайте логин (мин. 3 символа)" error={errors.login}/>

              <Input label="Пароль" type="password" value={form.password} onChange={e=>set('password',e.target.value)} placeholder="Минимум 6 символов" error={errors.password}/>
              {form.password.length > 0 && (
                <div>
                  <div style={{ height:4, background:th.card, borderRadius:4, overflow:'hidden' }}>
                    <div style={{ height:'100%', width:`${(pwdStrength/3)*100}%`, background:pwdColors[pwdStrength], borderRadius:4, transition:'all 0.3s' }}/>
                  </div>
                  <span style={{ fontSize:11, color:pwdColors[pwdStrength] }}>{pwdLabels[pwdStrength]}</span>
                </div>
              )}
              <Input label="Повторите пароль" type="password" value={form.password2} onChange={e=>set('password2',e.target.value)} placeholder="Повторите пароль" error={errors.password2}/>

              {bmiData && (
                <div style={{ background:`rgba(0,229,168,0.07)`, border:'1px solid rgba(0,229,168,0.2)', borderRadius:12, padding:'12px 18px', fontSize:13, color:'#00E5A8' }}>
                  ✅ BMI из калькулятора: <strong>{bmiData.bmi}</strong> ({bmiData.category})
                </div>
              )}

              <div style={{ display:'flex', gap:12, marginTop:8 }}>
                <button onClick={submit} disabled={loading} style={{
                  padding:'12px 28px', borderRadius:10,
                  background:`linear-gradient(135deg,${th.primary},${th.primaryDk})`,
                  color:'#fff', fontWeight:700, fontSize:14, border:'none', cursor:'pointer', fontFamily:'inherit',
                  opacity: loading ? 0.7 : 1, boxShadow:`0 4px 14px ${th.shadow}`,
                }}>{loading ? 'Сохранение…' : 'Далее →'}</button>
                <button onClick={() => router.push('/')} style={{ padding:'12px 20px', borderRadius:10, background:'rgba(255,255,255,0.06)', border:`1px solid ${th.border}`, color:th.textSec, fontSize:14, cursor:'pointer', fontFamily:'inherit' }}>
                  Отмена
                </button>
              </div>
            </div>
          </div>

          {/* RIGHT */}
          <div style={{ width:380, position:'relative', flexShrink:0 }}>
            <img src={`${GITHUB_BASE}marathon_hero.png`} alt="hero" style={{ position:'absolute', inset:0, width:'100%', height:'100%', objectFit:'cover', opacity:0.35 }} onError={e=>e.target.style.display='none'}/>
            <div style={{ position:'absolute', inset:0, background:'linear-gradient(to right, rgba(8,19,32,0.8), transparent)' }}/>
            <div style={{ position:'relative', zIndex:1, padding:36, height:'100%', display:'flex', flexDirection:'column', justifyContent:'center', gap:24 }}>
              <div style={{ fontFamily:'Rajdhani,sans-serif', fontSize:34, fontWeight:900, lineHeight:1.2 }}>
                Присоединяйтесь к<br/><span style={{ color:th.primary }}>марафону</span>
              </div>
              <div style={{ color:th.textSec, fontSize:14, lineHeight:1.7 }}>
                Зарегистрируйтесь, чтобы принять участие в самом масштабном забеге года.
              </div>
              <div style={{ background:'rgba(0,0,0,0.4)', backdropFilter:'blur(10px)', border:`1px solid ${th.border}`, borderRadius:12, padding:'14px 20px', display:'flex', alignItems:'center', gap:14 }}>
                <span style={{ fontSize:24 }}>👟</span>
                <div>
                  <div style={{ fontSize:11, color:th.textSec, textTransform:'uppercase', letterSpacing:0.5 }}>Средний результат</div>
                  <div style={{ fontFamily:'Rajdhani,sans-serif', fontSize:22, fontWeight:700, color:th.primary }}>4:32 мин/км</div>
                </div>
              </div>
              <div style={{ background:'rgba(0,0,0,0.4)', backdropFilter:'blur(10px)', border:`1px solid ${th.border}`, borderRadius:12, padding:'14px 20px', textAlign:'center' }}>
                <div style={{ fontSize:11, color:th.textSec, textTransform:'uppercase', letterSpacing:1, marginBottom:6 }}>🗓 Дата марафона</div>
                <div style={{ fontFamily:'Rajdhani,sans-serif', fontSize:22, fontWeight:700, color:th.primary }}>15 ИЮНЯ 2026</div>
              </div>
            </div>
          </div>
        </div>
      )}
    </Layout>
  )
}

export default withAuth(RegisterPage)
