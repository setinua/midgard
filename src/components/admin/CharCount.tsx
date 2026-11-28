'use client'
import { useField } from '@payloadcms/ui'

/** Character counter under SEO fields: a hint, never a block (green — fits, amber — short, red — Google will cut it). */
export function CharCount({ path, min = 0, max }: { path: string; min?: number; max: number }) {
  const { value } = useField<string>({ path })
  const n = (value || '').trim().length
  if (!n) return <div style={{ fontSize: 12, color: '#6b7685', marginTop: 4 }}>Порожньо — сайт підставить шаблон. Рекомендовано {min ? `${min}–` : 'до '}{max} символів.</div>
  const color = n > max ? '#b42318' : n < min ? '#b26b00' : '#1a7f37'
  const note = n > max ? 'задовго — Google обріже' : n < min ? 'закоротко' : 'добре'
  return (
    <div style={{ fontSize: 12, color, marginTop: 4 }}>
      {n} / {min ? `${min}–` : ''}{max} символів — {note}
    </div>
  )
}
