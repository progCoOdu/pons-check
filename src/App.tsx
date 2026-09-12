import { useEffect, useState } from 'react'
import { supabase } from './supabase'
import { Inspector } from './types'
import Home from './pages/Home'
import Outlets from './pages/Outlets'
import Inspectors from './pages/Inspectors'
import Settings from './pages/Settings'
import Navbar from './components/Navbar'

declare global {
  interface Window {
    Telegram?: {
      WebApp: {
        initDataUnsafe: { user?: { id: number; first_name: string; last_name?: string; username?: string } }
        ready: () => void
        expand: () => void
      }
    }
  }
}

const MAIN_ADMIN_ID = '6235378997'

export type Page = 'home' | 'outlets' | 'inspectors' | 'settings'

const DEV_USER = {
  id: 6235378997,
  first_name: 'Главный',
  last_name: 'Инспектор',
  username: 'main_inspector',
}

export default function App() {
  const [page, setPage] = useState<Page>('home')
  const [inspector, setInspector] = useState<Inspector | null>(null)
  const [loading, setLoading] = useState(true)
  const [isMain, setIsMain] = useState(false)

  useEffect(() => {
    window.Telegram?.WebApp?.ready()
    window.Telegram?.WebApp?.expand()
    setTimeout(() => initUser(), 300)
  }, [])

  async function initUser() {
    const tgUser = window.Telegram?.WebApp?.initDataUnsafe?.user ?? DEV_USER

    const telegramId = String(tgUser.id)
    setIsMain(telegramId === MAIN_ADMIN_ID)

    const { data } = await supabase
      .from('inspectors')
      .select('*')
      .eq('telegram_id', telegramId)
      .single()

    if (data) {
      setInspector(data)
    } else {
      const { data: newInspector } = await supabase
        .from('inspectors')
        .insert({
          telegram_id: telegramId,
          name: `${tgUser.first_name}${tgUser.last_name ? ' ' + tgUser.last_name : ''}`,
          username: tgUser.username,
        })
        .select()
        .single()
      setInspector(newInspector)
    }
    setLoading(false)
  }

  if (loading) {
    return (
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        height: '100vh', flexDirection: 'column', gap: 12,
      }}>
        <div style={{
          width: 48, height: 48, borderRadius: '50%',
          border: '3px solid #EFEFEF', borderTopColor: '#FF0A7E',
          animation: 'spin 0.8s linear infinite',
        }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
        <p style={{ color: '#888', fontSize: 13 }}>Загрузка...</p>
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh' }}>
      <div style={{ flex: 1, overflowY: 'auto', paddingBottom: 'var(--navbar-height)' }}>
        {page === 'home' && <Home inspector={inspector!} isMain={isMain} />}
        {page === 'outlets' && <Outlets inspector={inspector!} isMain={isMain} />}
        {page === 'inspectors' && isMain && <Inspectors />}
        {page === 'settings' && isMain && <Settings />}
      </div>
      <Navbar page={page} setPage={setPage} isMain={isMain} />
    </div>
  )
}
