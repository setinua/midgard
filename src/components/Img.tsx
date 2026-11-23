import type { Media } from '../payload-types'

type Size = 'thumb' | 'card' | 'lead'
const W = { thumb: 240, card: 640, lead: 1280 } as const

// Responsive image from Payload media sizes; neutral block when no photo.
export function Img({ media, size = 'card', className = '', sizes, priority = false }: { media: Media | null; size?: Size; className?: string; sizes?: string; priority?: boolean }) {
  if (!media?.url) return <div className={`ph ${className}`} aria-hidden="true" />
  const s = media.sizes || {}
  const set = (['thumb', 'card', 'lead'] as const)
    .filter((k) => s[k]?.url && W[k] <= W[size] * 2)
    .map((k) => `${s[k]!.url} ${W[k]}w`)
    .join(', ')
  return (
    <img
      className={`ph ${className}`}
      src={s[size]?.url || media.url}
      srcSet={set || undefined}
      sizes={sizes}
      alt={media.alt || ''}
      loading={priority ? 'eager' : 'lazy'}
      fetchPriority={priority ? 'high' : undefined}
      decoding="async"
      width={s[size]?.width || media.width || undefined}
      height={s[size]?.height || media.height || undefined}
    />
  )
}
