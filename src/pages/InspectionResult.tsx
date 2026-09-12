import { Outlet, Inspector } from '../types'
import { CHECKLIST, DOC_CHECKLIST } from '../checklist'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'

interface Props {
  result: any
  outlet: Outlet
  inspector: Inspector
  answers: Record<string, boolean | null>
  comments: Record<string, string>
  docAnswers: Record<string, boolean | null>
  onBack: () => void
  readOnly?: boolean
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

export default function InspectionResult({ result, outlet, inspector, answers, comments, docAnswers, onBack, readOnly }: Props) {
  const violations = CHECKLIST.flatMap(block =>
    block.items
      .filter(item => answers[item.id] === false)
      .map(item => ({ block: block.title, item, comment: comments[item.id] ?? '' }))
  )

  function generatePDF() {
    const doc = new jsPDF()
    const date = new Date(result.created_at ?? new Date()).toLocaleDateString('ru')

    // Заголовок
    doc.setFillColor(255, 10, 126)
    doc.rect(0, 0, 210, 30, 'F')
    doc.setTextColor(255, 255, 255)
    doc.setFontSize(18)
    doc.setFont('helvetica', 'bold')
    doc.text("PON'S | CHECK", 14, 13)
    doc.setFontSize(11)
    doc.setFont('helvetica', 'normal')
    doc.text('Контрольный лист наблюдения', 14, 22)

    // Основная инфо
    doc.setTextColor(26, 26, 26)
    doc.setFontSize(14)
    doc.setFont('helvetica', 'bold')
    doc.text(outlet.name, 14, 42)
    doc.setFontSize(10)
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(100, 100, 100)
    doc.text(`${outlet.city} · ${outlet.address}`, 14, 50)
    if (outlet.legal_entity) doc.text(outlet.legal_entity, 14, 57)

    // Итог
    doc.setFontSize(28)
    doc.setFont('helvetica', 'bold')
    const scoreColor = result.total_score >= 80 ? [34, 197, 94] : result.total_score >= 60 ? [245, 158, 11] : [239, 68, 68]
    doc.setTextColor(scoreColor[0], scoreColor[1], scoreColor[2])
    doc.text(`${result.total_score}%`, 160, 50)
    doc.setFontSize(11)
    doc.text(getScoreLabel(result.total_score), 152, 58)

    // Инспектор и дата
    doc.setTextColor(26, 26, 26)
    doc.setFontSize(10)
    doc.setFont('helvetica', 'normal')
    doc.text(`Инспектор: ${inspector.name}`, 14, 68)
    doc.text(`Дата: ${date}`, 14, 75)

    // Линия
    doc.setDrawColor(239, 239, 239)
    doc.line(14, 80, 196, 80)

    // Баллы по блокам
    doc.setFontSize(12)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(26, 26, 26)
    doc.text('Результаты по блокам', 14, 90)

    autoTable(doc, {
      startY: 95,
      head: [['Блок', 'Балл', 'Макс', '%']],
      body: [
        ['ККО — Качество обслуживания', result.score_kko, 25, `${Math.round(result.score_kko / 25 * 100)}%`],
        ['КЧ — Контроль чистоты', result.score_kch, 25, `${Math.round(result.score_kch / 25 * 100)}%`],
        ['ККП — Качество продукции', result.score_kkp, 25, `${Math.round(result.score_kkp / 25 * 100)}%`],
        ['КИС — Исполнение стандартов', result.score_kis, 25, `${Math.round(result.score_kis / 25 * 100)}%`],
        ['ИТОГО', result.total_score, 100, `${result.total_score}%`],
      ],
      headStyles: { fillColor: [255, 10, 126], textColor: 255, fontStyle: 'bold' },
      footStyles: { fillColor: [245, 245, 245] },
      styles: { fontSize: 10 },
      columnStyles: { 0: { cellWidth: 100 }, 1: { halign: 'center' }, 2: { halign: 'center' }, 3: { halign: 'center' } },
    })

    // Нарушения / предписание
    if (violations.length > 0) {
      const afterTable = (doc as any).lastAutoTable.finalY + 10
      doc.setFontSize(12)
      doc.setFont('helvetica', 'bold')
      doc.setTextColor(239, 68, 68)
      doc.text(`Предписание (${violations.length} нарушений)`, 14, afterTable)

      autoTable(doc, {
        startY: afterTable + 5,
        head: [['Блок', 'Нарушение', 'Комментарий']],
        body: violations.map(v => [
          v.block.split(' — ')[0],
          v.item.text,
          v.comment || '—',
        ]),
        headStyles: { fillColor: [239, 68, 68], textColor: 255, fontStyle: 'bold' },
        styles: { fontSize: 9 },
        columnStyles: { 0: { cellWidth: 25 }, 1: { cellWidth: 90 }, 2: { cellWidth: 65 } },
      })
    }

    // Документы
    const docsY = (doc as any).lastAutoTable.finalY + 10
    doc.setFontSize(12)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(26, 26, 26)
    doc.text('Документы', 14, docsY)

    autoTable(doc, {
      startY: docsY + 5,
      head: [['Пункт', 'Статус']],
      body: DOC_CHECKLIST.map(item => [
        item.text,
        docAnswers[item.id] === true ? '✓' : '✗',
      ]),
      headStyles: { fillColor: [255, 10, 126], textColor: 255 },
      styles: { fontSize: 9 },
      columnStyles: {
        0: { cellWidth: 160 },
        1: { cellWidth: 20, halign: 'center' },
      },
    })

    // Подписи
    const sigY = (doc as any).lastAutoTable.finalY + 15
    doc.setFontSize(10)
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(100, 100, 100)
    doc.text('Подпись инспектора: _______________________', 14, sigY)
    doc.text('Подпись руководителя объекта: _______________________', 14, sigY + 10)
    doc.text(`Дата: ${date}`, 14, sigY + 20)

    doc.save(`inspection_${outlet.name}_${date}.pdf`)
  }

  return (
    <div style={{ minHeight: '100%', paddingBottom: 32 }}>
      <div style={{
        background: getScoreColor(result.total_score),
        padding: '24px 16px', color: '#fff', textAlign: 'center',
      }}>
        {readOnly && (
          <button
            onClick={onBack}
            style={{ background: 'none', color: '#fff', fontSize: 14, fontWeight: 600, display: 'block', marginBottom: 12 }}
          >← Назад</button>
        )}
        <p style={{ fontSize: 13, opacity: 0.9 }}>{outlet.name}</p>
        <div style={{ fontSize: 64, fontWeight: 800, lineHeight: 1.1, marginTop: 8 }}>
          {result.total_score}%
        </div>
        <p style={{ fontSize: 18, fontWeight: 700, marginTop: 4 }}>{getScoreLabel(result.total_score)}</p>
        <p style={{ fontSize: 12, opacity: 0.8, marginTop: 4 }}>
          {new Date(result.created_at ?? new Date()).toLocaleDateString('ru', { day: 'numeric', month: 'long', year: 'numeric' })}
        </p>
      </div>

      <div style={{ padding: '16px' }}>
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

        {violations.length > 0 && (
          <div style={{ background: '#FEF2F2', borderRadius: 14, padding: '14px', marginBottom: 16 }}>
            <p style={{ fontWeight: 700, fontSize: 15, marginBottom: 12, color: '#EF4444' }}>
              ⚠️ Предписание ({violations.length} нарушений)
            </p>
            {violations.map((v, i) => (
              <div key={i} style={{ borderLeft: '3px solid #EF4444', paddingLeft: 10, marginBottom: 10 }}>
                <p style={{ fontSize: 11, color: '#888', marginBottom: 2 }}>{v.block}</p>
                <p style={{ fontSize: 13, fontWeight: 600 }}>{v.item.text}</p>
                {v.comment && <p style={{ fontSize: 12, color: '#666', marginTop: 2 }}>💬 {v.comment}</p>}
              </div>
            ))}
          </div>
        )}

        <div style={{ background: 'var(--color-card)', borderRadius: 14, padding: '14px', marginBottom: 16 }}>
          <p style={{ fontWeight: 700, fontSize: 15, marginBottom: 10 }}>Документы</p>
          {DOC_CHECKLIST.map(item => (
            <div key={item.id} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
              <span>{docAnswers[item.id] === true ? '✅' : '❌'}</span>
              <span style={{ fontSize: 13 }}>{item.text}</span>
            </div>
          ))}
        </div>

        <div style={{
          background: 'var(--color-card)', borderRadius: 14, padding: '14px', marginBottom: 16,
          display: 'flex', justifyContent: 'space-between',
        }}>
          <div>
            <p style={{ fontSize: 11, color: 'var(--color-text-secondary)' }}>Инспектор</p>
            <p style={{ fontWeight: 700, fontSize: 14 }}>{inspector.name}</p>
          </div>
          <div style={{ textAlign: 'right' }}>
            <p style={{ fontSize: 11, color: 'var(--color-text-secondary)' }}>Дата</p>
            <p style={{ fontWeight: 700, fontSize: 14 }}>
              {new Date(result.created_at ?? new Date()).toLocaleDateString('ru')}
            </p>
          </div>
        </div>

        {/* PDF кнопка */}
        <button
          onClick={generatePDF}
          style={{
            width: '100%', padding: '16px', borderRadius: 14,
            background: '#1A1A1A', color: '#fff',
            fontWeight: 800, fontSize: 16, marginBottom: 12,
          }}
        >📄 Скачать PDF</button>

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
