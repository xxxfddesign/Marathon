import { useSession } from 'next-auth/react'
import { useRouter } from 'next/router'
import { useEffect } from 'react'

export default function withAuth(Component) {
  return function Protected(props) {
    const { data: session, status } = useSession()
    const router = useRouter()
    useEffect(() => {
      if (status === 'unauthenticated') router.replace('/login')
    }, [status, router])
    if (status === 'loading') return (
      <div style={{ display:'flex', alignItems:'center', justifyContent:'center', height:'100vh', background:'#081320', flexDirection:'column', gap:16 }}>
        <div style={{ fontSize:48 }}>🏃</div>
        <div style={{ color:'#00C6FF', fontFamily:'Rajdhani,sans-serif', fontSize:18 }}>Загрузка...</div>
      </div>
    )
    if (!session) return null
    return <Component {...props} />
  }
}
