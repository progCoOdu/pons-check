import { Outlet } from '../types'

interface Props {
  outlet: Outlet
  onClick: () => void
}

export default function OutletCard({ outlet, onClick }: Props) {
  return (
    <div
      onClick={onClick}
      style={{
        background: 'var(--color-card)', borderRadius: 14,
        padding: '14px', marginBottom: 10, cursor: 'pointer',
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
      }}
    >
      <div>
        <p style={{ fontWeight: 700, fontSize: 14 }}>{outlet.name}</p>
        <p style={{ color: 'var(--color-text-secondary)', fontSize: 12, marginTop: 2 }}>
          {outlet.city} · {outlet.address}
        </p>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <span style={{
          fontSize: 10, fontWeight: 600, padding: '3px 8px', borderRadius: 6,
          background: outlet.type === 'own' ? 'var(--color-accent-light)' : '#F3F4F6',
          color: outlet.type === 'own' ? 'var(--color-accent)' : 'var(--color-text-secondary)',
        }}>
          {outlet.type === 'own' ? 'Своё' : 'Франшиза'}
        </span>
        <span style={{ color: '#ccc', fontSize: 18 }}>›</span>
      </div>
    </div>
  )
}
