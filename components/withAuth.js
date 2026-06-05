import { useSession } from 'next-auth/react'
import { useRouter } from 'next/router'
import { useEffect, useState } from 'react'

export default function withAuth(Component) {
  return function Protected(props) {
    const { data: session, status } = useSession()
    const router = useRouter()
    const [checked, setChecked] = useState(false)
    const [isAuth, setIsAuth] = useState(false)

    useEffect(() => {
      const pid = localStorage.getItem('participant_id')
      const admin = localStorage.getItem('admin_logged_in')
      const auth = !!session || !!pid || !!admin
      setIsAuth(auth)
      setChecked(true)
      if (!auth && status !== 'loading') router.replace('/login')
    }, [session, status, router])

    if (!checked || status === 'loading') return (
      <div style={{ display:'flex', alignItems:'center', justifyContent:'center', height:'100vh', background:'#081320', flexDirection:'column', gap:16 }}>
        <div style={{ fontSize:48 }}>🏃</div>
        <div style={{ color:'#00C6FF', fontFamily:'Rajdhani,sans-serif', fontSize:18 }}>Загрузка...</div>
      </div>
    )
    if (!isAuth) return null
    return <Component {...props} />
  }
}
