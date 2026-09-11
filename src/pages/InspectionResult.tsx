import { Outlet, Inspector } from '../types'
import { CHECKLIST, DOC_CHECKLIST } from '../checklist'

interface Props {
  result: any
  outlet: Outlet
  inspector: Inspector
  answers: Record<string, boolean | null>
  comments: Record<string, string>
  docAnswers: Record<string, boolean | null>
  onBack: () => void
}

function getScoreColor(score: number) {
  if (score >= 80) return '#22C55E'
  if (score >= 60) return '#F59E0B'
  return '#EF4444'
}

function getScoreLabel(score: number) {
  if (score >= 80) return 'Отлично'
  if (score >= 60) return 'Удовлетворительно'
  return 'Требует внимания'
}

export default function InspectionResult({ result, outlet, inspector, answers, comments, docAnswers, onBack }: Props) {
  const violations = CHECKLIST.flatMap(block =>
    block.items
      .filter(item => answers[item.id] === false)
      .map(item => ({ block: block.title, item, comment: comments[item.id] ?? '' }))
  )

  return (
    <div style={{ minHeight: '100%', paddingBottom: 32 }}>
      {/* Header */}
      <div style={{
        background: getScoreColor(result.total_score),
        padding: '24px 16px', color: '#fff', textAlign: 'center',
      }}>
        <p style={{ fontSize: 13, opacity: 0.9 }}>{outlet.name}</p>
        <div style={{ fontSize: 64, fontWeight: 800, lineHeight: 1.1, marginTop: 8 }}>
          {result.total_score}%
        </div>
        <p style={{ fontSize: 18, fontWeight: 700, marginTop: 4 }}>{getScoreLabel(result.total_score)}</p>
        <p style={{ fontSize: 12, opacity: 0.8, marginTop: 4 }}>
          {new Date().toLocaleDateString('ru', { day: 'numeric', month: 'long', year: 'numeric' })}
        </p>
      </div>

      <div style={{ padding: '16px' }}>
        {/* Block scores */}
        <div style={{ background: 'var(--color-card)', borderRadius: 14, padding: '14px', marginBottom: 16 }}>
          <p style={{ fontWeight: 700, fontSize: 15, marginBottom: 12 }}>По блокам</p>
          {[
            { label: 'ККО — Обслуживание', score: result.score_kko, max: 25 },
            { label: 'КЧ — Чистота', score: result.score_kch, max: 25 },
            { label: 'ККП — Продукция', score: result.score_kkp, max: 25 },
            { label: 'КИС — Стандарты', score: result.score_kis, max: 25 },
          ].map(b => (
            <div key={b.label} style={{ marginBottom: 10 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                <span style={{ fontSize: 13 }}>{b.label}</span>
                <span style={{ fontWeight: 700, fontSize: 13 }}>{b.score}/{b.max}</span>
              </div>
              <div style={{ background: '#E5E7EB', borderRadius: 4, height: 6 }}>
                <div style={{
                  width: `${(b.score / b.max) * 100}%`,
                  background: getScoreColor((b.score / b.max) * 100),
                  borderRadius: 4, height: '100%', transition: 'width 0.5s',
                }} />
              </div>
            </div>
          ))}
        </div>

        {/* Violations / Prescription */}
        {violations.length > 0 && (
          <div style={{ background: '#FEF2F2', borderRadius: 14, padding: '14px', marginBottom: 16 }}>
            <p style={{ fontWeight: 700, fontSize: 15, marginBottom: 12, color: '#EF4444' }}>
              ⚠️ Предписание ({violations.length} нарушений)
            </p>
            {violations.map((v, i) => (
              <div key={i} style={{
                borderLeft: '3px solid #EF4444', paddingLeft: 10, marginBottom: 10,
              }}>
                <p style={{ fontSize: 11, color: '#888', marginBottom: 2 }}>{v.block}</p>
                <p style={{ fontSize: 13, fontWeight: 600 }}>{v.item.text}</p>
                {v.comment && <p style={{ fontSize: 12, color: '#666', marginTop: 2 }}>💬 {v.comment}</p>}
              </div>
            ))}
          </div>
        )}

        {/* Docs */}
        <div style={{ background: 'var(--color-card)', borderRadius: 14, padding: '14px', marginBottom: 16 }}>
          <p style={{ fontWeight: 700, fontSize: 15, marginBottom: 10 }}>Документы</p>
          {DOC_CHECKLIST.map(item => (
            <div key={item.id} style={{
              display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6,
            }}>
              <span>{docAnswers[item.id] === true ? '✅' : '❌'}</span>
              <span style={{ fontSize: 13 }}>{item.text}</span>
            </div>
          ))}
        </div>

        {/* Inspector */}
        <div style={{
          background: 'var(--color-card)', borderRadius: 14, padding: '14px', marginBottom: 20,
          display: 'flex', justifyContent: 'space-between',
        }}>
          <div>
            <p style={{ fontSize: 11, color: 'var(--color-text-secondary)' }}>Инспектор</p>
            <p style={{ fontWeight: 700, fontSize: 14 }}>{inspector.name}</p>
          </div>
          <div style={{ textAlign: 'right' }}>
            <p style={{ fontSize: 11, color: 'var(--color-text-secondary)' }}>Дата</p>
            <p style={{ fontWeight: 700, fontSize: 14 }}>
              {new Date().toLocaleDateString('ru')}
            </p>
          </div>
        </div>

        <button
          onClick={onBack}
          style={{
            width: '100%', padding: '16px', borderRadius: 14,
            background: 'var(--color-accent)', color: '#fff',
            fontWeight: 800, fontSize: 16,
          }}
        >← К объекту</button>
      </div>
    </div>
  )
}
