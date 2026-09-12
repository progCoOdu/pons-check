import { Page } from '../App'

interface NavItem {
  key: string
  label: string
  icon: string
  mainOnly?: boolean
}

interface Props {
  page: Page
  setPage: (p: Page) => void
  isMain: boolean
}

const NAV_ITEMS: NavItem[] = [
  { key: 'home', label: 'Домой', icon: '🏠' },
  { key: 'outlets', label: 'Объекты', icon: '🏪' },
  { key: 'inspectors', label: 'Инспекторы', icon: '👥', mainOnly: true },
  { key: 'settings', label: 'Настройки', icon: '⚙️', mainOnly: true },
]

export default function Navbar({ page, setPage, isMain }: Props) {
  const items = NAV_ITEMS.filter(i => !i.mainOnly || isMain)

  return (
    <nav style={{
      position: 'fixed', bottom: 0, left: 0, right: 0,
      height: 'var(--navbar-height)',
      background: '#fff',
      borderTop: '1px solid var(--color-border)',
      display: 'flex',
      zIndex: 100,
    }}>
      {items.map(item => {
        const active = page === item.key
        return (
          <button
            key={item.key}
            onClick={() => setPage(item.key as Page)}
            style={{
              flex: 1, display: 'flex', flexDirection: 'column',
              alignItems: 'center', justifyContent: 'center', gap: 2,
              background: 'none', border: 'none', cursor: 'pointer',
              color: active ? 'var(--color-accent)' : 'var(--color-text-secondary)',
              transition: 'color 0.15s',
            }}
          >
            <span style={{ fontSize: 22 }}>{item.icon}</span>
            <span style={{ fontSize: 10, fontWeight: active ? 700 : 500 }}>{item.label}</span>
          </button>
        )
      })}
    </nav>
  )
}
