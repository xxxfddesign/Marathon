import { signIn, useSession } from 'next-auth/react'
import { useRouter } from 'next/router'
import { useEffect, useState } from 'react'
import { GITHUB_BASE } from '../lib/constants'

export default function LoginPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [login, setLogin] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')

  // Если уже залогинен через Google — на главную
  useEffect(() => {
    if (status === 'authenticated') router.replace('/')
  }, [status, router])

  if (status === 'loading') return (
    <div style={{ display:'flex', alignItems:'center', justifyContent:'center', height:'100vh', background:'#081320' }}>
      <div style={{ color:'#00C6FF', fontFamily:'Rajdhani,sans-serif', fontSize:18 }}>Загрузка...</div>
    </div>
  )

  function handleLoginPassword() {
    if (login === 'admin' && password === 'admin') {
      localStorage.setItem('admin_logged_in', 'true')
      router.push('/admin')
    } else {
      setError('Неверный логин или пароль')
      setTimeout(() => setError(''), 3000)
    }
  }

  return (
    <div style={{
      minHeight:'100vh', background:'#081320', display:'flex', alignItems:'center',
      justifyContent:'center', fontFamily:"'Inter',sans-serif", position:'relative', overflow:'hidden',
    }}>
      <div style={{ position:'absolute', width:600, height:600, borderRadius:'50%', background:'radial-gradient(circle,rgba(0,114,255,0.12),transparent 70%)', top:'50%', left:'50%', transform:'translate(-50%,-50%)', pointerEvents:'none' }}/>

      <div style={{
        background:'#06121A', border:'1px solid #1E3C64', borderRadius:20,
        padding:'48px 40px', width:420, maxWidth:'90vw', position:'relative', zIndex:1,
        boxShadow:'0 20px 60px rgba(0,0,0,0.5)',
      }}>
        <div style={{ textAlign:'center', marginBottom:28 }}>
          <img src={`${GITHUB_BASE}nav_logo.png`} alt="logo" style={{ height:48, marginBottom:12 }} onError={e=>e.target.style.display='none'}/>
          <div style={{ fontFamily:'Rajdhani,sans-serif', fontSize:26, fontWeight:700, color:'#fff', letterSpacing:1 }}>
            MARATHON SKILLS
          </div>
          <div style={{ color:'#C9D4E5', fontSize:13, marginTop:6 }}>
            Официальная система регистрации участников
          </div>
        </div>

        <div style={{ borderTop:'1px solid #1E3C64', marginBottom:24 }}/>

        <div style={{ display:'flex', flexDirection:'column', gap:12, marginBottom:20 }}>
          <div>
            <label style={{ color:'#C9D4E5', fontSize:12, marginBottom:6, display:'block' }}>Логин</label>
            <input
              type="text"
              value={login}
              onChange={e => setLogin(e.target.value)}
              placeholder="Введите логин"
              style={{
                width:'100%', padding:'12px 14px', borderRadius:10, boxSizing:'border-box',
                background:'rgba(255,255,255,0.05)', border:'1px solid #1E3C64',
                color:'#fff', fontSize:14, fontFamily:'inherit', outline:'none',
              }}
            />
          </div>
          <div>
            <label style={{ color:'#C9D4E5', fontSize:12, marginBottom:6, display:'block' }}>Пароль</label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleLoginPassword()}
              placeholder="Введите пароль"
              style={{
                width:'100%', padding:'12px 14px', borderRadius:10, boxSizing:'border-box',
                background:'rgba(255,255,255,0.05)', border:'1px solid #1E3C64',
                color:'#fff', fontSize:14, fontFamily:'inherit', outline:'none',
              }}
            />
          </div>

          {error && (
            <div style={{ color:'#FF4860', fontSize:13, textAlign:'center', padding:'8px', background:'rgba(255,72,96,0.1)', borderRadius:8, border:'1px solid rgba(255,72,96,0.25)' }}>
              {error}
            </div>
          )}

          <div style={{ display:'flex', gap:10, marginTop:4 }}>
            <button type="button" onClick={handleLoginPassword} style={{
              flex:1, padding:'12px', borderRadius:10, background:'linear-gradient(135deg,#0072FF,#00C6FF)',
              border:'none', color:'#fff', fontWeight:700, fontSize:14, cursor:'pointer', fontFamily:'inherit',
            }}>Login</button>
            <button type="button" onClick={() => router.push('/')} style={{
              flex:1, padding:'12px', borderRadius:10,
              background:'rgba(255,255,255,0.05)', border:'1px solid #1E3C64',
              color:'#C9D4E5', fontWeight:600, fontSize:14, cursor:'pointer', fontFamily:'inherit',
            }}>Cancel</button>
          </div>
        </div>

        <div style={{ borderTop:'1px solid #1E3C64', marginBottom:20 }}/>

        <div style={{ textAlign:'center', color:'#C9D4E5', fontSize:13, marginBottom:16, fontWeight:500 }}>
          или войдите через Google
        </div>

        <button
          onClick={() => signIn('google', { callbackUrl: '/' })}
          style={{
            width:'100%', padding:'14px 20px', borderRadius:12,
            background:'#fff', border:'none', cursor:'pointer',
            display:'flex', alignItems:'center', justifyContent:'center', gap:12,
            fontSize:15, fontWeight:600, color:'#1a1a2e', fontFamily:'inherit',
            boxShadow:'0 4px 16px rgba(0,0,0,0.3)',
          }}
        >
          <svg width="20" height="20" viewBox="0 0 48 48">
            <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
            <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
            <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
            <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.18 1.48-4.97 2.31-8.16 2.31-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
            <path fill="none" d="M0 0h48v48H0z"/>
          </svg>
          Войти через Google
        </button>

        <div style={{
          marginTop:24, background:'rgba(0,198,255,0.06)', border:'1px solid rgba(0,198,255,0.2)',
          borderRadius:10, padding:'10px 16px', textAlign:'center',
        }}>
          <div style={{ fontSize:11, color:'#C9D4E5', textTransform:'uppercase', letterSpacing:1, marginBottom:3 }}>🗓 Дата марафона</div>
          <div style={{ fontFamily:'Rajdhani,sans-serif', fontSize:20, fontWeight:700, color:'#00C6FF' }}>15 ИЮНЯ 2026</div>
        </div>
      </div>
    </div>
  )
}
