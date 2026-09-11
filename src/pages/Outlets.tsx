import { useEffect, useState } from 'react'
import { supabase } from '../supabase'
import { Outlet, Inspector } from '../types'
import OutletCard from '../components/OutletCard'
import OutletDetail from './OutletDetail'

interface Props {
  inspector: Inspector
  isMain: boolean
}

export default function Outlets({ inspector, isMain }: Props) {
  const [outlets, setOutlets] = useState<Outlet[]>([])
  const [search, setSearch] = useState('')
  const [selected, setSelected] = useState<Outlet | null>(null)
  const [showAdd, setShowAdd] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => { loadOutlets() }, [])

  async function loadOutlets() {
    const { data } = await supabase.from('outlets').select('*').order('city').order('name')
    setOutlets(data ?? [])
    setLoading(false)
  }

  const filtered = outlets.filter(o =>
    o.name.toLowerCase().includes(search.toLowerCase()) ||
    o.city.toLowerCase().includes(search.toLowerCase()) ||
    o.address.toLowerCase().includes(search.toLowerCase())
  )

  if (selected) {
    return <OutletDetail outlet={selected} inspector={inspector} isMain={isMain} onBack={() => { setSelected(null); loadOutlets() }} />
  }

  return (
    <div style={{ padding: '20px 16px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <h1 style={{ fontSize: 22, fontWeight: 800 }}>Объекты</h1>
        {isMain && (
          <button
            onClick={() => setShowAdd(true)}
            style={{
              background: 'var(--color-accent)', color: '#fff',
              border: 'none', borderRadius: 10, padding: '8px 14px',
              fontWeight: 700, fontSize: 13,
            }}
          >+ Добавить</button>
        )}
      </div>

      <input
        value={search}
        onChange={e => setSearch(e.target.value)}
        placeholder="🔍 Поиск по городу, адресу..."
        style={{
          width: '100%', padding: '12px 14px', borderRadius: 12,
          border: '1.5px solid var(--color-border)', fontSize: 14,
          background: 'var(--color-card)', marginBottom: 16,
        }}
      />

      {loading ? (
        <p style={{ textAlign: 'center', color: 'var(--color-text-secondary)' }}>Загрузка...</p>
      ) : (
        <>
          <p style={{ color: 'var(--color-text-secondary)', fontSize: 12, marginBottom: 10 }}>
            {filtered.length} объектов
          </p>
          {filtered.map(outlet => (
            <OutletCard key={outlet.id} outlet={outlet} onClick={() => setSelected(outlet)} />
          ))}
        </>
      )}

      {showAdd && isMain && (
        <AddOutletModal onClose={() => setShowAdd(false)} onSaved={() => { setShowAdd(false); loadOutlets() }} />
      )}
    </div>
  )
}

function AddOutletModal({ onClose, onSaved }: { onClose: () => void; onSaved: () => void }) {
  const [form, setForm] = useState({
    name: '', city: '', address: '',
    manager_name: '', manager_phone: '', outlet_phone: '',
    type: 'franchise' as 'own' | 'franchise',
    check_interval_days: 30,
  })
  const [saving, setSaving] = useState(false)

  async function save() {
    if (!form.name || !form.city || !form.address) return
    setSaving(true)
    await supabase.from('outlets').insert(form)
    setSaving(false)
    onSaved()
  }

  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)',
      display: 'flex', alignItems: 'flex-end', zIndex: 200,
    }}>
      <div style={{
        background: '#fff', borderRadius: '20px 20px 0 0',
        padding: '20px 16px', width: '100%', maxHeight: '85vh', overflowY: 'auto',
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 20 }}>
          <h2 style={{ fontWeight: 800, fontSize: 18 }}>Новый объект</h2>
          <button onClick={onClose} style={{ background: 'none', fontSize: 22, color: '#888' }}>✕</button>
        </div>

        {[
          { label: 'Название', key: 'name' },
          { label: 'Город', key: 'city' },
          { label: 'Адрес', key: 'address' },
          { label: 'ФИО руководителя', key: 'manager_name' },
          { label: 'Телефон руководителя', key: 'manager_phone' },
          { label: 'Телефон заведения', key: 'outlet_phone' },
        ].map(f => (
          <div key={f.key} style={{ marginBottom: 12 }}>
            <p style={{ fontSize: 12, color: 'var(--color-text-secondary)', marginBottom: 4 }}>{f.label}</p>
            <input
              value={(form as any)[f.key]}
              onChange={e => setForm(p => ({ ...p, [f.key]: e.target.value }))}
              style={{
                width: '100%', padding: '10px 12px', borderRadius: 10,
                border: '1.5px solid var(--color-border)', fontSize: 14,
              }}
            />
          </div>
        ))}

        <div style={{ marginBottom: 12 }}>
          <p style={{ fontSize: 12, color: 'var(--color-text-secondary)', marginBottom: 4 }}>Тип</p>
          <div style={{ display: 'flex', gap: 8 }}>
            {(['own', 'franchise'] as const).map(t => (
              <button
                key={t}
                onClick={() => setForm(p => ({ ...p, type: t }))}
                style={{
                  flex: 1, padding: '10px', borderRadius: 10,
                  border: `1.5px solid ${form.type === t ? 'var(--color-accent)' : 'var(--color-border)'}`,
                  background: form.type === t ? 'var(--color-accent-light)' : '#fff',
                  color: form.type === t ? 'var(--color-accent)' : 'var(--color-text)',
                  fontWeight: 600, fontSize: 13,
                }}
              >{t === 'own' ? 'Собственное' : 'Франшиза'}</button>
            ))}
          </div>
        </div>

        <div style={{ marginBottom: 20 }}>
          <p style={{ fontSize: 12, color: 'var(--color-text-secondary)', marginBottom: 4 }}>
            Периодичность проверки (дней)
          </p>
          <input
            type="number"
            value={form.check_interval_days}
            onChange={e => setForm(p => ({ ...p, check_interval_days: Number(e.target.value) }))}
            style={{
              width: '100%', padding: '10px 12px', borderRadius: 10,
              border: '1.5px solid var(--color-border)', fontSize: 14,
            }}
          />
        </div>

        <button
          onClick={save}
          disabled={saving}
          style={{
            width: '100%', padding: '14px', borderRadius: 12,
            background: 'var(--color-accent)', color: '#fff',
            fontWeight: 800, fontSize: 16, border: 'none',
          }}
        >{saving ? 'Сохранение...' : 'Сохранить'}</button>
      </div>
    </div>
  )
}
