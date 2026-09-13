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

export default function App() {
  const [page, setPage] = useState<Page>('home')
  const [inspector, setInspector] = useState<Inspector | null>(null)
  const [loading, setLoading] = useState(true)
  const [isMain, setIsMain] = useState(false)
  const [pinInput, setPinInput] = useState('')
  const [pinError, setPinError] = useState(false)
  const [showPin, setShowPin] = useState(false)

  useEffect(() => {
    window.Telegram?.WebApp?.ready()
    window.Telegram?.WebApp?.expand()
    setTimeout(() => initUser(), 300)
  }, [])

  async function initUser() {
    const tgUser = window.Telegram?.WebApp?.initDataUnsafe?.user

    if (tgUser) {
      await processUser(String(tgUser.id), `${tgUser.first_name}${tgUser.last_name ? ' ' + tgUser.last_name : ''}`, tgUser.username)
    } else {
      setShowPin(true)
      setLoading(false)
    }
  }

  async function processUser(telegramId: string, name: string, username?: string) {
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
        .insert({ telegram_id: telegramId, name, username })
        .select()
        .single()
      setInspector(newInspector)
    }
    setLoading(false)
  }

  async function handlePin(pin: string) {
    setPinError(false)
    const { data } = await supabase
      .from('inspectors')
      .select('*')
      .eq('pin', pin)
      .single()

    if (data) {
      setIsMain(data.telegram_id === MAIN_ADMIN_ID)
      setInspector(data)
      setShowPin(false)
    } else {
      setPinError(true)
      setPinInput('')
    }
  }

  function handlePinButton(digit: string) {
    if (digit === '←') {
      setPinInput(p => p.slice(0, -1))
      setPinError(false)
      return
    }
    const newPin = pinInput + digit
    setPinInput(newPin)
    if (newPin.length === 4) {
      handlePin(newPin)
    }
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

  if (showPin) {
    return (
      <div style={{
        display: 'flex', flexDirection: 'column', alignItems: 'center',
        justifyContent: 'center', height: '100vh', background: '#fff',
        padding: '0 32px',
      }}>
        {/* Логотип */}
        <div style={{ marginBottom: 32, textAlign: 'center' }}>
          <div style={{
            width: 72, height: 72, borderRadius: '50%',
            background: '#FF0A7E', display: 'flex', alignItems: 'center',
            justifyContent: 'center', margin: '0 auto 12px',
            fontSize: 32,
          }}>🍩</div>
          <h1 style={{ fontWeight: 800, fontSize: 22, color: '#1A1A1A' }}>PON'S | CHECK</h1>
          <p style={{ color: '#888', fontSize: 13, marginTop: 4 }}>Введите PIN-код для входа</p>
        </div>

        {/* Точки */}
        <div style={{ display: 'flex', gap: 16, marginBottom: 8 }}>
          {[0, 1, 2, 3].map(i => (
            <div key={i} style={{
              width: 16, height: 16, borderRadius: '50%',
              background: pinInput.length > i ? '#FF0A7E' : '#E5E7EB',
              transition: 'background 0.15s',
            }} />
          ))}
        </div>

        {/* Ошибка */}
        <p style={{
          color: '#EF4444', fontSize: 13, marginBottom: 24, height: 20,
          opacity: pinError ? 1 : 0, transition: 'opacity 0.2s',
        }}>Неверный PIN-код</p>

        {/* Клавиатура */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, width: '100%', maxWidth: 280 }}>
          {['1','2','3','4','5','6','7','8','9','','0','←'].map((digit, i) => (
            <button
              key={i}
              onClick={() => digit && handlePinButton(digit)}
              disabled={!digit}
              style={{
                height: 72, borderRadius: 16, fontSize: digit === '←' ? 22 : 24,
                fontWeight: 700, border: 'none', cursor: digit ? 'pointer' : 'default',
                background: digit === '←' ? '#F7F7F7' : digit ? '#fff' : 'transparent',
                color: '#1A1A1A',
                boxShadow: digit && digit !== '←' ? '0 2px 8px rgba(0,0,0,0.08)' : 'none',
                transition: 'transform 0.1s',
              }}
            >{digit}</button>
          ))}
        </div>
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
