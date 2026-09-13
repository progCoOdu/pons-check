import { useEffect, useState } from 'react' 
import { supabase } from '../supabase'
import { Outlet, Inspector, Inspection } from '../types'
import InspectionFlow from './InspectionFlow'
import InspectionResult from './InspectionResult'
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'

interface Props {
  outlet: Outlet
  inspector: Inspector
  isMain?: boolean
  onBack: () => void
}

function getScoreColor(score: number) {
  if (score >= 80) return '#22C55E'
  if (score >= 60) return '#F59E0B'
  return '#EF4444'
}

export default function OutletDetail({ outlet, inspector, isMain, onBack }: Props) {
  const [inspections, setInspections] = useState<Inspection[]>([])
  const [showInspection, setShowInspection] = useState(false)
  const [selectedInspection, setSelectedInspection] = useState<Inspection | null>(null)
  const [loading, setLoading] = useState(true)
  const [interval, setIntervalDays] = useState(outlet.check_interval_days)
  const [savingInterval, setSavingInterval] = useState(false)

  useEffect(() => { loadInspections() }, [])

  async function loadInspections() {
    const { data } = await supabase
      .from('inspections')
      .select('*, inspector:inspectors(name)')
      .eq('outlet_id', outlet.id)
      .order('created_at', { ascending: false })
      .limit(20)
    setInspections(data ?? [])
    setLoading(false)
  }

  async function saveInterval(days: number) {
    setSavingInterval(true)
    await supabase.from('outlets').update({ check_interval_days: days }).eq('id', outlet.id)
    setIntervalDays(days)
    setSavingInterval(false)
  }

  function getCheckStatus() {
    if (inspections.length === 0) return { label: 'Проверок не было', color: '#888', emoji: '⬜' }
    const last = new Date(inspections[0].created_at)
    const now = new Date()
    const daysSince = Math.floor((now.getTime() - last.getTime()) / (1000 * 60 * 60 * 24))
    const daysLeft = interval - daysSince

    if (daysLeft < 0) return { label: `Просрочено на ${Math.abs(daysLeft)} дн.`, color: '#EF4444', emoji: '🔴' }
    if (daysLeft <= 7) return { label: `Через ${daysLeft} дн.`, color: '#F59E0B', emoji: '🟡' }
    return { label: `Через ${daysLeft} дн.`, color: '#22C55E', emoji: '🟢' }
  }

  if (showInspection) {
    return (
      <InspectionFlow
        outlet={outlet}
        inspector={inspector}
        onBack={() => { setShowInspection(false); loadInspections() }}
      />
    )
  }

  if (selectedInspection) {
    return (
      <InspectionResult
        result={selectedInspection}
        outlet={outlet}
        inspector={(selectedInspection as any).inspector ?? inspector}
        answers={selectedInspection.answers}
        comments={selectedInspection.comments}
        docAnswers={selectedInspection.doc_answers}
        onBack={() => setSelectedInspection(null)}
        readOnly
      />
    )
  }

  const last = inspections[0]
  const avgScore = inspections.length > 0
    ? Math.round(inspections.reduce((s, i) => s + i.total_score, 0) / inspections.length)
    : null

  const chartData = [...inspections].reverse().map(i => ({
    date: new Date(i.created_at).toLocaleDateString('ru', { day: 'numeric', month: 'short' }),
    score: i.total_score,
  }))

  const status = getCheckStatus()

  return (
    <div style={{ minHeight: '100%' }}>
      <div style={{
        padding: '16px', background: 'var(--color-accent)',
        color: '#fff',
      }}>
        <button
          onClick={onBack}
          style={{ background: 'none', color: '#fff', fontSize: 14, fontWeight: 600, marginBottom: 12 }}
        >← Назад</button>
        <h1 style={{ fontSize: 20, fontWeight: 800 }}>{outlet.name}</h1>
        <p style={{ opacity: 0.85, fontSize: 13, marginTop: 4 }}>{outlet.city} · {outlet.address}</p>
      </div>

      <div style={{ padding: '16px' }}>
        {/* Кружок + инфо */}
        <div style={{ display: 'flex', gap: 12, marginBottom: 16 }}>
          <div style={{
            width: 90, height: 90, borderRadius: '50%',
            border: `4px solid ${avgScore !== null ? getScoreColor(avgScore) : '#EFEFEF'}`,
            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
            flexShrink: 0,
          }}>
            {avgScore !== null ? (
              <>
                <span style={{ fontWeight: 800, fontSize: 20, color: getScoreColor(avgScore) }}>{avgScore}%</span>
                <span style={{ fontSize: 9, color: 'var(--color-text-secondary)' }}>успешность</span>
              </>
            ) : (
              <span style={{ fontSize: 11, color: '#ccc', textAlign: 'center' }}>нет данных</span>
            )}
          </div>
          <div style={{ flex: 1 }}>
            {outlet.legal_entity && <InfoRow label="Юр. лицо" value={outlet.legal_entity} />}
            <InfoRow label="Руководитель" value={outlet.manager_name || '—'} />
            <InfoRow label="Телефон" value={outlet.manager_phone || '—'} />
            {outlet.outlet_phone && <InfoRow label="Тел. заведения" value={outlet.outlet_phone} />}
            <InfoRow label="Тип" value={outlet.type === 'own' ? 'Собственное' : 'Франшиза'} />
            {last && (
              <InfoRow
                label="Последняя проверка"
                value={new Date(last.created_at).toLocaleDateString('ru')}
              />
            )}
          </div>
        </div>

        {/* Статус проверки */}
        <div style={{
          background: 'var(--color-card)', borderRadius: 14, padding: '14px', marginBottom: 16,
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <p style={{ fontWeight: 700, fontSize: 15 }}>Периодичность проверки</p>
            <span style={{ fontSize: 13, fontWeight: 700, color: status.color }}>
              {status.emoji} {status.label}
            </span>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            {[7, 14, 30, 60].map(days => (
              <button
                key={days}
                onClick={() => isMain && saveInterval(days)}
                disabled={savingInterval || !isMain}
                style={{
                  flex: 1, padding: '8px 0', borderRadius: 10, fontSize: 12, fontWeight: 700,
                  border: `2px solid ${interval === days ? 'var(--color-accent)' : 'var(--color-border)'}`,
                  background: interval === days ? 'var(--color-accent-light)' : '#fff',
                  color: interval === days ? 'var(--color-accent)' : 'var(--color-text-secondary)',
                  cursor: isMain ? 'pointer' : 'default',
                }}
              >{days}д</button>
            ))}
          </div>
        </div>

        {/* График */}
        {chartData.length > 1 && (
          <div style={{
            background: 'var(--color-card)', borderRadius: 14, padding: '14px', marginBottom: 16,
          }}>
            <p style={{ fontWeight: 700, fontSize: 14, marginBottom: 10 }}>График баллов</p>
            <div style={{ height: 120 }}>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData}>
                  <XAxis dataKey="date" tick={{ fontSize: 9 }} axisLine={false} tickLine={false} />
                  <YAxis domain={[0, 100]} hide />
                  <Tooltip formatter={(v) => [`${v}%`, 'Балл']} />
                  <Line type="monotone" dataKey="score" stroke="#FF0A7E" strokeWidth={2} dot={{ r: 3 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        <button
          onClick={() => setShowInspection(true)}
          style={{
            width: '100%', padding: '16px', borderRadius: 14,
            background: 'var(--color-accent)', color: '#fff',
            fontWeight: 800, fontSize: 16, marginBottom: 16,
          }}
        >🔍 Начать инспекцию</button>

        {!loading && inspections.length > 0 && (
          <div>
            <p style={{ fontWeight: 700, fontSize: 15, marginBottom: 10 }}>История проверок</p>
            {inspections.map(ins => (
              <div
                key={ins.id}
                onClick={() => setSelectedInspection(ins)}
                style={{
                  background: 'var(--color-card)', borderRadius: 12,
                  padding: '12px 14px', marginBottom: 8,
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  cursor: 'pointer',
                }}
              >
                <div>
                  <p style={{ fontWeight: 600, fontSize: 13 }}>
                    {new Date(ins.created_at).toLocaleDateString('ru', { day: 'numeric', month: 'long', year: 'numeric' })}
                  </p>
                  <p style={{ color: 'var(--color-text-secondary)', fontSize: 11, marginTop: 2 }}>
                    {(ins as any).inspector?.name ?? '—'}
                  </p>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{
                    fontWeight: 800, fontSize: 18,
                    color: getScoreColor(ins.total_score),
                  }}>{ins.total_score}%</span>
                  <span style={{ color: '#ccc', fontSize: 18 }}>›</span>
                </div>
              </div>
            ))}
          </div>
        )}

        {!loading && inspections.length === 0 && (
          <p style={{ textAlign: 'center', color: 'var(--color-text-secondary)', marginTop: 20 }}>
            Проверок по этому объекту ещё не было
          </p>
        )}
      </div>
    </div>
  )
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ marginBottom: 4 }}>
      <span style={{ color: 'var(--color-text-secondary)', fontSize: 11 }}>{label}: </span>
      <span style={{ fontWeight: 600, fontSize: 12 }}>{value}</span>
    </div>
  )
}
