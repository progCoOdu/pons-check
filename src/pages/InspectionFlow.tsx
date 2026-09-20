import { useState } from 'react'
import { supabase } from '../supabase'
import { Outlet, Inspector, BlockKey } from '../types'
import { CHECKLIST, DOC_CHECKLIST } from '../checklist'
import InspectionResult from './InspectionResult'

interface Props {
  outlet: Outlet
  inspector: Inspector
  onBack: () => void
}

type Answers = Record<string, boolean | null>
type Comments = Record<string, string>
type Photos = Record<string, string>

export default function InspectionFlow({ outlet, inspector, onBack }: Props) {
  const [blockIndex, setBlockIndex] = useState(0)
  const [answers, setAnswers] = useState<Answers>({})
  const [comments, setComments] = useState<Comments>({})
  const [photos, setPhotos] = useState<Photos>({})
  const [docAnswers, setDocAnswers] = useState<Answers>({})
  const [showDocs, setShowDocs] = useState(false)
  const [result, setResult] = useState<any>(null)
  const [saving, setSaving] = useState(false)

  const currentBlock = CHECKLIST[blockIndex]
  const totalBlocks = CHECKLIST.length

  const blockComplete = currentBlock.items.every(item => answers[item.id] !== undefined && answers[item.id] !== null)
  const docsComplete = DOC_CHECKLIST.every(item => docAnswers[item.id] !== undefined && docAnswers[item.id] !== null)

  function calcScore(key: BlockKey) {
    const block = CHECKLIST.find(b => b.key === key)!
    const items = block.items
    const passed = items.filter(i => answers[i.id] === true).length
    return Math.round((passed / items.length) * block.weight)
  }

  async function uploadPhoto(itemId: string, file: File): Promise<string | null> {
    const ext = file.name.split('.').pop()
    const path = `${outlet.id}/${Date.now()}_${itemId}.${ext}`
    const { error } = await supabase.storage.from('inspections').upload(path, file)
    if (error) {
      console.error('Upload error:', error)
      return null
    }
    const { data } = supabase.storage.from('inspections').getPublicUrl(path)
    console.log('Photo URL:', data.publicUrl)
    return data.publicUrl
  }

  async function finish() {
    setSaving(true)
    const score_kko = calcScore('kko')
    const score_kch = calcScore('kch')
    const score_kkp = calcScore('kkp')
    const score_kis = calcScore('kis')
    const total_score = score_kko + score_kch + score_kkp + score_kis

    const { data } = await supabase.from('inspections').insert({
      outlet_id: outlet.id,
      inspector_id: inspector.id,
      score_kko, score_kch, score_kkp, score_kis, total_score,
      answers, comments, doc_answers: docAnswers, photos,
    }).select().single()

    setSaving(false)
    setResult({ ...data, score_kko, score_kch, score_kkp, score_kis, total_score })
  }

  if (result) {
    return <InspectionResult result={result} outlet={outlet} inspector={inspector} answers={answers} comments={comments} docAnswers={docAnswers} photos={photos} onBack={onBack} />
  }

  if (showDocs) {
    return (
      <div style={{ minHeight: '100%' }}>
        <div style={{ background: 'var(--color-accent)', padding: '16px', color: '#fff' }}>
          <button onClick={() => setShowDocs(false)} style={{ background: 'none', color: '#fff', fontSize: 14, fontWeight: 600, marginBottom: 12 }}>← Назад</button>
          <h2 style={{ fontWeight: 800, fontSize: 18 }}>Документы</h2>
          <p style={{ opacity: 0.85, fontSize: 13 }}>Вне общего балла</p>
        </div>
        <div style={{ padding: '16px' }}>
          {DOC_CHECKLIST.map(item => (
            <CheckItem
              key={item.id}
              item={item}
              value={docAnswers[item.id] ?? null}
              comment={comments[item.id] ?? ''}
              photo={photos[item.id] ?? ''}
              onChange={v => setDocAnswers(p => ({ ...p, [item.id]: v }))}
              onComment={c => setComments(p => ({ ...p, [item.id]: c }))}
              onPhoto={async (file) => {
                const url = await uploadPhoto(item.id, file)
                if (url) setPhotos(p => ({ ...p, [item.id]: url }))
              }}
            />
          ))}
          <button
            onClick={finish}
            disabled={!docsComplete || saving}
            style={{
              width: '100%', padding: '16px', borderRadius: 14, marginTop: 8,
              background: docsComplete ? 'var(--color-accent)' : '#ccc',
              color: '#fff', fontWeight: 800, fontSize: 16,
            }}
          >{saving ? 'Сохранение...' : '✅ Завершить проверку'}</button>
        </div>
      </div>
    )
  }

  const progress = (blockIndex / totalBlocks) * 100

  return (
    <div style={{ minHeight: '100%' }}>
      <div style={{ background: 'var(--color-accent)', padding: '16px', color: '#fff' }}>
        <button onClick={onBack} style={{ background: 'none', color: '#fff', fontSize: 14, fontWeight: 600, marginBottom: 8 }}>← Отмена</button>
        <p style={{ opacity: 0.85, fontSize: 12, marginBottom: 4 }}>{outlet.name}</p>
        <h2 style={{ fontWeight: 800, fontSize: 17 }}>{currentBlock.title}</h2>
        <p style={{ opacity: 0.8, fontSize: 12, marginTop: 2 }}>Блок {blockIndex + 1} из {totalBlocks}</p>
        <div style={{ marginTop: 12, background: 'rgba(255,255,255,0.3)', borderRadius: 4, height: 4 }}>
          <div style={{ width: `${progress}%`, background: '#fff', borderRadius: 4, height: '100%', transition: 'width 0.3s' }} />
        </div>
      </div>

      <div style={{ padding: '16px' }}>
        {currentBlock.items.map(item => (
          <CheckItem
            key={item.id}
            item={item}
            value={answers[item.id] ?? null}
            comment={comments[item.id] ?? ''}
            photo={photos[item.id] ?? ''}
            onChange={v => setAnswers(p => ({ ...p, [item.id]: v }))}
            onComment={c => setComments(p => ({ ...p, [item.id]: c }))}
            onPhoto={async (file) => {
              const url = await uploadPhoto(item.id, file)
              if (url) setPhotos(p => ({ ...p, [item.id]: url }))
            }}
          />
        ))}

        <button
          onClick={() => {
            if (blockIndex < totalBlocks - 1) setBlockIndex(i => i + 1)
            else setShowDocs(true)
          }}
          disabled={!blockComplete}
          style={{
            width: '100%', padding: '16px', borderRadius: 14, marginTop: 8,
            background: blockComplete ? 'var(--color-accent)' : '#ccc',
            color: '#fff', fontWeight: 800, fontSize: 16, transition: 'background 0.2s',
          }}
        >
          {blockIndex < totalBlocks - 1 ? 'Следующий раздел →' : 'Документы →'}
        </button>
      </div>
    </div>
  )
}

function CheckItem({ item, value, comment, photo, onChange, onComment, onPhoto }: {
  item: { id: string; text: string }
  value: boolean | null
  comment: string
  photo: string
  onChange: (v: boolean) => void
  onComment: (c: string) => void
  onPhoto: (file: File) => Promise<void>
}) {
  const [uploading, setUploading] = useState(false)

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    await onPhoto(file)
    setUploading(false)
  }

  return (
    <div style={{
      background: 'var(--color-card)', borderRadius: 14,
      padding: '14px', marginBottom: 10,
    }}>
      <p style={{ fontWeight: 600, fontSize: 14, marginBottom: 12, lineHeight: 1.4 }}>{item.text}</p>
      <div style={{ display: 'flex', gap: 8 }}>
        <button
          onClick={() => onChange(true)}
          style={{
            flex: 1, padding: '12px 0', borderRadius: 10, fontWeight: 700, fontSize: 14,
            border: `2px solid ${value === true ? 'var(--color-success)' : 'var(--color-border)'}`,
            background: value === true ? 'var(--color-success-light)' : '#fff',
            color: value === true ? 'var(--color-success)' : 'var(--color-text-secondary)',
          }}
        >✅ Да</button>
        <button
          onClick={() => onChange(false)}
          style={{
            flex: 1, padding: '12px 0', borderRadius: 10, fontWeight: 700, fontSize: 14,
            border: `2px solid ${value === false ? 'var(--color-danger)' : 'var(--color-border)'}`,
            background: value === false ? 'var(--color-danger-light)' : '#fff',
            color: value === false ? 'var(--color-danger)' : 'var(--color-text-secondary)',
          }}
        >❌ Нет</button>
      </div>

      {value === false && (
        <div style={{ marginTop: 10 }}>
          <textarea
            value={comment}
            onChange={e => onComment(e.target.value)}
            placeholder="Комментарий (необязательно)..."
            rows={2}
            style={{
              width: '100%', padding: '10px 12px',
              borderRadius: 10, border: '1.5px solid var(--color-border)',
              fontSize: 13, resize: 'none', background: '#fff',
              marginBottom: 8,
            }}
          />

          {/* Фото */}
          {photo ? (
            <div style={{ position: 'relative' }}>
              <img src={photo} alt="фото" style={{ width: '100%', borderRadius: 10, maxHeight: 200, objectFit: 'cover' }} />
              <p style={{ fontSize: 11, color: 'var(--color-success)', marginTop: 4 }}>✅ Фото прикреплено</p>
            </div>
          ) : (
            <label style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              gap: 8, padding: '10px', borderRadius: 10,
              border: '1.5px dashed var(--color-border)',
              cursor: 'pointer', fontSize: 13, color: 'var(--color-text-secondary)',
              background: '#fff',
            }}>
              {uploading ? '⏳ Загрузка...' : '📷 Прикрепить фото'}
              <input
                type="file"
                accept="image/*"
                capture="environment"
                onChange={handleFileChange}
                style={{ display: 'none' }}
              />
            </label>
          )}
        </div>
      )}
    </div>
  )
}
