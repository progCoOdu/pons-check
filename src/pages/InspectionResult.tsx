import { useRef } from 'react'
import { Outlet, Inspector } from '../types'
import { CHECKLIST, DOC_CHECKLIST } from '../checklist'
import jsPDF from 'jspdf'
import html2canvas from 'html2canvas'

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
  const pdfRef = useRef<HTMLDivElement>(null)

  const violations = CHECKLIST.flatMap(block =>
    block.items
      .filter(item => answers[item.id] === false)
      .map(item => ({ block: block.title, item, comment: comments[item.id] ?? '' }))
  )

  async function generatePDF() {
    if (!pdfRef.current) return
    const canvas = await html2canvas(pdfRef.current, { scale: 2, useCORS: true })
    const imgData = canvas.toDataURL('image/png')
    const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })
    const pageWidth = pdf.internal.pageSize.getWidth()
    const pageHeight = pdf.internal.pageSize.getHeight()
    const imgWidth = pageWidth
    const imgHeight = (canvas.height * imgWidth) / canvas.width

    let heightLeft = imgHeight
    let position = 0

    pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight)
    heightLeft -= pageHeight

    while (heightLeft > 0) {
      position = heightLeft - imgHeight
      pdf.addPage()
      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight)
      heightLeft -= pageHeight
    }

    const date = new Date(result.created_at ?? new Date()).toLocaleDateString('ru')
    pdf.save(`inspection_${outlet.name}_${date}.pdf`)
  }

  const date = new Date(result.created_at ?? new Date())

  return (
    <div style={{ minHeight: '100%', paddingBottom: 32 }}>
      {/* Кнопка назад вне PDF */}
      {readOnly && (
        <div style={{ padding: '12px 16px', background: getScoreColor(result.total_score) }}>
          <button
            onClick={onBack}
            style={{ background: 'none', color: '#fff', fontSize: 14, fontWeight: 600 }}
          >← Назад</button>
        </div>
      )}

      {/* PDF контент */}
      <div ref={pdfRef} style={{ background: '#fff', padding: '0 0 24px 0' }}>

        {/* Шапка */}
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
            {date.toLocaleDateString('ru', { day: 'numeric', month: 'long', year: 'numeric' })}
          </p>
        </div>

        <div style={{ padding: '16px' }}>

          {/* Инфо об объекте */}
          <div style={{ background: '#F7F7F7', borderRadius: 14, padding: '14px', marginBottom: 16 }}>
            <p style={{ fontWeight: 700, fontSize: 15, marginBottom: 8 }}>Объект</p>
            <p style={{ fontSize: 13 }}><b>Адрес:</b> {outlet.address}</p>
            {outlet.legal_entity && <p style={{ fontSize: 13, marginTop: 4 }}><b>Юр. лицо:</b> {outlet.legal_entity}</p>}
            {outlet.manager_name && <p style={{ fontSize: 13, marginTop: 4 }}><b>Руководитель:</b> {outlet.manager_name}</p>}
          </div>

          {/* Баллы по блокам */}
          <div style={{ background: '#F7F7F7', borderRadius: 14, padding: '14px', marginBottom: 16 }}>
            <p style={{ fontWeight: 700, fontSize: 15, marginBottom: 12 }}>По блокам</p>
            {[
              { label: 'ККО — Качество обслуживания', score: result.score_kko, max: 25 },
              { label: 'КЧ — Контроль чистоты', score: result.score_kch, max: 25 },
              { label: 'ККП — Качество продукции', score: result.score_kkp, max: 25 },
              { label: 'КИС — Исполнение стандартов', score: result.score_kis, max: 25 },
            ].map(b => (
              <div key={b.label} style={{ marginBottom: 10 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                  <span style={{ fontSize: 13 }}>{b.label}</span>
                  <span style={{ fontWeight: 700, fontSize: 13, color: getScoreColor((b.score / b.max) * 100) }}>{b.score}/{b.max}</span>
                </div>
                <div style={{ background: '#E5E7EB', borderRadius: 4, height: 8 }}>
                  <div style={{
                    width: `${(b.score / b.max) * 100}%`,
                    background: getScoreColor((b.score / b.max) * 100),
                    borderRadius: 4, height: '100%',
                  }} />
                </div>
              </div>
            ))}
          </div>

          {/* Нарушения */}
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

          {/* Документы */}
          <div style={{ background: '#F7F7F7', borderRadius: 14, padding: '14px', marginBottom: 16 }}>
            <p style={{ fontWeight: 700, fontSize: 15, marginBottom: 10 }}>Документы</p>
            {DOC_CHECKLIST.map(item => (
              <div key={item.id} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                <span style={{ color: docAnswers[item.id] === true ? '#22C55E' : '#EF4444', fontWeight: 700 }}>
                  {docAnswers[item.id] === true ? '✓' : '✗'}
                </span>
                <span style={{ fontSize: 13 }}>{item.text}</span>
              </div>
            ))}
          </div>

          {/* Инспектор и подписи */}
          <div style={{ background: '#F7F7F7', borderRadius: 14, padding: '14px', marginBottom: 16 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
              <div>
                <p style={{ fontSize: 11, color: '#888' }}>Инспектор</p>
                <p style={{ fontWeight: 700, fontSize: 14 }}>{inspector.name}</p>
              </div>
              <div style={{ textAlign: 'right' }}>
                <p style={{ fontSize: 11, color: '#888' }}>Дата</p>
                <p style={{ fontWeight: 700, fontSize: 14 }}>{date.toLocaleDateString('ru')}</p>
              </div>
            </div>
            <div style={{ borderTop: '1px solid #E5E7EB', paddingTop: 12 }}>
              <p style={{ fontSize: 12, color: '#888', marginBottom: 16 }}>
                Подпись инспектора: _______________________
              </p>
              <p style={{ fontSize: 12, color: '#888' }}>
                Подпись руководителя объекта: _______________________
              </p>
            </div>
          </div>

        </div>
      </div>

      {/* Кнопки */}
      <div style={{ padding: '0 16px' }}>
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
            background: '#FF0A7E', color: '#fff',
            fontWeight: 800, fontSize: 16,
          }}
        >← К объекту</button>
      </div>
    </div>
  )
}
