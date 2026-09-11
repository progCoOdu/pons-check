import { useEffect, useState } from 'react'
import { supabase } from '../supabase'
import { Inspector, Inspection } from '../types'
import { RadialBarChart, RadialBar, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip } from 'recharts'

interface Props {
  inspector: Inspector
  isMain: boolean
}

export default function Home({ inspector, isMain }: Props) {
  const [stats, setStats] = useState({ total: 0, thisMonth: 0, avgScore: 0, outlets: 0 })
  const [recent, setRecent] = useState<Inspection[]>([])
  const [chartData, setChartData] = useState<{ name: string; score: number }[]>([])

  useEffect(() => {
    loadStats()
  }, [])

  async function loadStats() {
    const now = new Date()
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString()

    const { data: all } = await supabase
      .from('inspections')
      .select('*, outlet:outlets(name, city)')
      .order('created_at', { ascending: false })
      .limit(50)

    if (!all) return

    const thisMonth = all.filter(i => i.created_at >= monthStart)
    const avgScore = all.length > 0
      ? Math.round(all.reduce((s, i) => s + i.total_score, 0) / all.length)
      : 0

    const outletIds = new Set(all.map(i => i.outlet_id))

    setStats({
      total: all.length,
      thisMonth: thisMonth.length,
      avgScore,
      outlets: outletIds.size,
    })
    setRecent(all.slice(0, 5))

    const last7 = all.slice(0, 7).reverse()
    setChartData(last7.map(i => ({
      name: new Date(i.created_at).toLocaleDateString('ru', { day: 'numeric', month: 'short' }),
      score: i.total_score,
    })))
  }

  const firstName = inspector.name.split(' ')[0]

  return (
    <div style={{ padding: '20px 16px', minHeight: '100%' }}>
      {/* Header */}
      <div style={{ marginBottom: 24 }}>
        <p style={{ color: 'var(--color-text-secondary)', fontSize: 13 }}>Добрый день,</p>
        <h1 style={{ fontSize: 24, fontWeight: 800, color: 'var(--color-text)' }}>
          Инспектор {firstName}! 🍩
        </h1>
      </div>

      {/* Stats cards */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 20 }}>
        <StatCard label="Всего проверок" value={stats.total} accent />
        <StatCard label="В этом месяце" value={stats.thisMonth} />
        <StatCard label="Средний балл" value={`${stats.avgScore}%`} />
        <StatCard label="Объектов охвачено" value={stats.outlets} />
      </div>

      {/* Score gauge */}
      {stats.avgScore > 0 && (
        <div style={{
          background: 'var(--color-card)', borderRadius: 16, padding: '16px',
          marginBottom: 20, textAlign: 'center',
        }}>
          <p style={{ fontWeight: 700, fontSize: 15, marginBottom: 12 }}>Средний балл по сети</p>
          <div style={{ height: 160 }}>
            <ResponsiveContainer width="100%" height="100%">
              <RadialBarChart
                innerRadius="60%" outerRadius="90%"
                data={[{ value: stats.avgScore, fill: getScoreColor(stats.avgScore) }]}
                startAngle={180} endAngle={0}
              >
                <RadialBar dataKey="value" cornerRadius={8} />
              </RadialBarChart>
            </ResponsiveContainer>
            <div style={{ marginTop: -60, fontWeight: 800, fontSize: 32, color: getScoreColor(stats.avgScore) }}>
              {stats.avgScore}%
            </div>
          </div>
        </div>
      )}

      {/* Chart */}
      {chartData.length > 0 && (
        <div style={{
          background: 'var(--color-card)', borderRadius: 16, padding: '16px',
          marginBottom: 20,
        }}>
          <p style={{ fontWeight: 700, fontSize: 15, marginBottom: 12 }}>Последние проверки</p>
          <div style={{ height: 140 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} barSize={28}>
                <XAxis dataKey="name" tick={{ fontSize: 10 }} axisLine={false} tickLine={false} />
                <YAxis domain={[0, 100]} hide />
                <Tooltip formatter={(v) => [`${v}%`, 'Балл']} />
                <Bar dataKey="score" fill="#FF0A7E" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Recent */}
      {recent.length > 0 && (
        <div>
          <p style={{ fontWeight: 700, fontSize: 15, marginBottom: 12 }}>Недавние проверки</p>
          {recent.map(ins => (
            <div key={ins.id} style={{
              background: 'var(--color-card)', borderRadius: 12, padding: '12px 14px',
              marginBottom: 8, display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            }}>
              <div>
                <p style={{ fontWeight: 600, fontSize: 13 }}>{(ins as any).outlet?.name ?? '—'}</p>
                <p style={{ color: 'var(--color-text-secondary)', fontSize: 11, marginTop: 2 }}>
                  {new Date(ins.created_at).toLocaleDateString('ru')}
                </p>
              </div>
              <span style={{
                fontWeight: 800, fontSize: 16,
                color: getScoreColor(ins.total_score),
              }}>{ins.total_score}%</span>
            </div>
          ))}
        </div>
      )}

      {recent.length === 0 && stats.total === 0 && (
        <div style={{ textAlign: 'center', marginTop: 60, color: 'var(--color-text-secondary)' }}>
          <p style={{ fontSize: 40 }}>📋</p>
          <p style={{ marginTop: 8, fontWeight: 600 }}>Проверок пока нет</p>
          <p style={{ fontSize: 13, marginTop: 4 }}>Перейди в Объекты и начни первую!</p>
        </div>
      )}
    </div>
  )
}

function StatCard({ label, value, accent }: { label: string; value: number | string; accent?: boolean }) {
  return (
    <div style={{
      background: accent ? 'var(--color-accent)' : 'var(--color-card)',
      borderRadius: 14, padding: '14px',
    }}>
      <p style={{ fontSize: 11, color: accent ? 'rgba(255,255,255,0.8)' : 'var(--color-text-secondary)', marginBottom: 4 }}>{label}</p>
      <p style={{ fontSize: 26, fontWeight: 800, color: accent ? '#fff' : 'var(--color-text)' }}>{value}</p>
    </div>
  )
}

function getScoreColor(score: number) {
  if (score >= 80) return '#22C55E'
  if (score >= 60) return '#F59E0B'
  return '#EF4444'
}
