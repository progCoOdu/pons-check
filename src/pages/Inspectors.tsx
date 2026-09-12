import { useEffect, useState } from 'react'
import { supabase } from '../supabase'
import { Inspector } from '../types'

export default function Inspectors() {
  const [inspectors, setInspectors] = useState<Inspector[]>([])
  const [stats, setStats] = useState<Record<number, { count: number; last: string | null }>>({})
  const [loading, setLoading] = useState(true)

  useEffect(() => { load() }, [])

  async function load() {
    const { data: insp } = await supabase.from('inspectors').select('*').order('name')
    const { data: ins } = await supabase.from('inspections').select('inspector_id, created_at')

    if (insp) setInspectors(insp)

    if (ins) {
      const map: Record<number, { count: number; last: string | null }> = {}
      ins.forEach((i: any) => {
        if (!map[i.inspector_id]) map[i.inspector_id] = { count: 0, last: null }
        map[i.inspector_id].count++
        if (!map[i.inspector_id].last || i.created_at > map[i.inspector_id].last!) {
          map[i.inspector_id].last = i.created_at
        }
      })
      setStats(map)
    }
    setLoading(false)
  }

  return (
    <div style={{ padding: '20px 16px' }}>
      <h1 style={{ fontSize: 22, fontWeight: 800, marginBottom: 20 }}>Инспекторы</h1>
      {loading ? (
        <p style={{ color: 'var(--color-text-secondary)' }}>Загрузка...</p>
      ) : (
        inspectors.map(insp => {
          const s = stats[insp.id]
          return (
            <div key={insp.id} style={{
              background: 'var(--color-card)', borderRadius: 14,
              padding: '14px', marginBottom: 10,
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <p style={{ fontWeight: 700, fontSize: 15 }}>{insp.name}</p>
                  {insp.username && <p style={{ color: 'var(--color-text-secondary)', fontSize: 12 }}>@{insp.username}</p>}
                </div>
                <span style={{
                  background: 'var(--color-accent-light)', color: 'var(--color-accent)',
                  fontWeight: 700, fontSize: 13, padding: '4px 10px', borderRadius: 8,
                }}>
                  {s?.count ?? 0} пров.
                </span>
              </div>
              {s?.last && (
                <p style={{ fontSize: 12, color: 'var(--color-text-secondary)', marginTop: 6 }}>
                  Последняя: {new Date(s.last).toLocaleDateString('ru', { day: 'numeric', month: 'long' })}
                </p>
              )}
            </div>
          )
        })
      )}
    </div>
  )
}
