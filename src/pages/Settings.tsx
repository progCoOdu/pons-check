import { useEffect, useState } from 'react'
import { supabase } from '../supabase'
import { Inspector } from '../types'

export default function Settings() {
  const [inspectors, setInspectors] = useState<Inspector[]>([])
  const [newTgId, setNewTgId] = useState('')
  const [newName, setNewName] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => { load() }, [])

  async function load() {
    const { data } = await supabase.from('inspectors').select('*').order('name')
    setInspectors(data ?? [])
  }

  async function addInspector() {
    if (!newTgId || !newName) return
    setSaving(true)
    await supabase.from('inspectors').insert({ telegram_id: newTgId, name: newName })
    setNewTgId('')
    setNewName('')
    setSaving(false)
    load()
  }

  async function removeInspector(id: number) {
    await supabase.from('inspectors').delete().eq('id', id)
    load()
  }

  return (
    <div style={{ padding: '20px 16px' }}>
      <h1 style={{ fontSize: 22, fontWeight: 800, marginBottom: 20 }}>Настройки</h1>

      <div style={{ background: 'var(--color-card)', borderRadius: 14, padding: '16px', marginBottom: 20 }}>
        <p style={{ fontWeight: 700, fontSize: 15, marginBottom: 12 }}>Добавить инспектора</p>
        <input
          value={newTgId}
          onChange={e => setNewTgId(e.target.value)}
          placeholder="Telegram ID"
          style={{
            width: '100%', padding: '10px 12px', borderRadius: 10,
            border: '1.5px solid var(--color-border)', fontSize: 14, marginBottom: 8,
          }}
        />
        <input
          value={newName}
          onChange={e => setNewName(e.target.value)}
          placeholder="Имя Фамилия"
          style={{
            width: '100%', padding: '10px 12px', borderRadius: 10,
            border: '1.5px solid var(--color-border)', fontSize: 14, marginBottom: 12,
          }}
        />
        <button
          onClick={addInspector}
          disabled={saving || !newTgId || !newName}
          style={{
            width: '100%', padding: '12px', borderRadius: 10,
            background: 'var(--color-accent)', color: '#fff',
            fontWeight: 700, fontSize: 14,
          }}
        >{saving ? 'Добавление...' : 'Добавить'}</button>
      </div>

      <p style={{ fontWeight: 700, fontSize: 15, marginBottom: 10 }}>Инспекторы ({inspectors.length})</p>
      {inspectors.map(insp => (
        <div key={insp.id} style={{
          background: 'var(--color-card)', borderRadius: 12,
          padding: '12px 14px', marginBottom: 8,
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        }}>
          <div>
            <p style={{ fontWeight: 600, fontSize: 14 }}>{insp.name}</p>
            <p style={{ color: 'var(--color-text-secondary)', fontSize: 11 }}>ID: {insp.telegram_id}</p>
          </div>
          <button
            onClick={() => removeInspector(insp.id)}
            style={{ background: 'none', color: '#EF4444', fontSize: 20, padding: '4px 8px' }}
          >🗑</button>
        </div>
      ))}
    </div>
  )
}
