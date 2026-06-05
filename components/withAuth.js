import { useSession } from 'next-auth/react'
import { useRouter } from 'next/router'
import { useEffect, useState } from 'react'

export default function withAuth(Component) {
  return function Protected(props) {
    const { data: session, status } = useSession()
    const router = useRouter()
    const [participantId, setParticipantId] = useState(undefined)

    useEffect(() => {
      const pid = localStorage.getItem('participant_id')
      setParticipantId(pid || null)
    }, [])

    // Ждём пока загрузится и сессия и localStorage
    if (status === 'loading' || participantId === undefined) return (
      <div style={{ display:'flex', alignItems:'center', justifyContent:'center', height:'100vh', background:'#081320', flexDirection:'column', gap:16 }}>
        <div style={{ fontSize:48 }}>🏃</div>
        <div style={{ color:'#00C6FF', fontFamily:'Rajdhani,sans-serif', fontSize:18 }}>Загрузка...</div>
      </div>
    )

    // Авторизован если есть Google-сессия или participant_id
    const isAuth = !!session || !!participantId
    if (!isAuth) {
      router.replace('/login')
      return null
    }

    return <Component {...props} />
  }
}
