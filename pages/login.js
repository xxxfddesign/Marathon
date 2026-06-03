import { signIn, useSession } from 'next-auth/react'
import { useRouter } from 'next/router'
import { useEffect } from 'react'
import { GITHUB_BASE } from '../lib/constants'

export default function LoginPage() {
  const { data: session, status } = useSession()
  const router = useRouter()

  useEffect(() => {
    if (status === 'authenticated') router.replace('/')
  }, [status, router])

  if (status === 'loading') return (
    <div style={{ display:'flex', alignItems:'center', justifyContent:'center', height:'100vh', background:'#081320' }}>
      <div style={{ color:'#00C6FF', fontFamily:'Rajdhani,sans-serif', fontSize:18 }}>Загрузка...</div>
    </div>
  )

  return (
    <div style={{
      minHeight:'100vh', background:'#081320', display:'flex', alignItems:'center',
      justifyContent:'center', fontFamily:"'Inter',sans-serif", position:'relative', overflow:'hidden',
    }}>
      {/* background glow */}
      <div style={{ position:'absolute', width:600, height:600, borderRadius:'50%', background:'radial-gradient(circle,rgba(0,114,255,0.12),transparent 70%)', top:'50%', left:'50%', transform:'translate(-50%,-50%)', pointerEvents:'none' }}/>

      <div style={{
        background:'#06121A', border:'1px solid #1E3C64', borderRadius:20,
        padding:'48px 40px', width:400, maxWidth:'90vw', position:'relative', zIndex:1,
        boxShadow:'0 20px 60px rgba(0,0,0,0.5)',
      }}>
        {/* Logo */}
        <div style={{ textAlign:'center', marginBottom:32 }}>
          <img src={`${GITHUB_BASE}nav_logo.png`} alt="logo" style={{ height:48, marginBottom:12 }} onError={e=>e.target.style.display='none'}/>
          <div style={{ fontFamily:'Rajdhani,sans-serif', fontSize:26, fontWeight:700, color:'#fff', letterSpacing:1 }}>
            MARATHON SKILLS
          </div>
          <div style={{ color:'#C9D4E5', fontSize:13, marginTop:6 }}>
            Официальная система регистрации участников
          </div>
        </div>

        {/* divider */}
        <div style={{ borderTop:'1px solid #1E3C64', marginBottom:28 }}/>

        <div style={{ textAlign:'center', color:'#C9D4E5', fontSize:14, marginBottom:24, fontWeight:500 }}>
          Войдите, чтобы продолжить
        </div>

        {/* Google button */}
        <button
          onClick={() => signIn('google', { callbackUrl: '/' })}
          style={{
            width:'100%', padding:'14px 20px', borderRadius:12,
            background:'#fff', border:'none', cursor:'pointer',
            display:'flex', alignItems:'center', justifyContent:'center', gap:12,
            fontSize:15, fontWeight:600, color:'#1a1a2e', fontFamily:'inherit',
            boxShadow:'0 4px 16px rgba(0,0,0,0.3)', transition:'transform 0.15s, box-shadow 0.15s',
          }}
          onMouseEnter={e => { e.target.style.transform='translateY(-2px)'; e.target.style.boxShadow='0 8px 24px rgba(0,0,0,0.4)' }}
          onMouseLeave={e => { e.target.style.transform='translateY(0)'; e.target.style.boxShadow='0 4px 16px rgba(0,0,0,0.3)' }}
        >
          {/* Google SVG icon */}
          <svg width="20" height="20" viewBox="0 0 48 48">
            <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
            <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
            <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
            <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.18 1.48-4.97 2.31-8.16 2.31-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
            <path fill="none" d="M0 0h48v48H0z"/>
          </svg>
          Войти через Google
        </button>

        <div style={{ textAlign:'center', marginTop:24, color:'#C9D4E5', fontSize:12, lineHeight:1.6 }}>
          Авторизация через Google OAuth 2.0.<br/>
          Данные защищены и не передаются третьим лицам.
        </div>

        {/* Marathon date badge */}
        <div style={{
          marginTop:28, background:'rgba(0,198,255,0.06)', border:'1px solid rgba(0,198,255,0.2)',
          borderRadius:10, padding:'10px 16px', textAlign:'center',
        }}>
          <div style={{ fontSize:11, color:'#C9D4E5', textTransform:'uppercase', letterSpacing:1, marginBottom:3 }}>🗓 Дата марафона</div>
          <div style={{ fontFamily:'Rajdhani,sans-serif', fontSize:20, fontWeight:700, color:'#00C6FF' }}>15 ИЮНЯ 2026</div>
        </div>
      </div>
    </div>
  )
}
