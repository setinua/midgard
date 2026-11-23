import { revalidateTag } from 'next/cache'
import type { CollectionConfig, GlobalConfig } from 'payload'

// Drops the cached site content (lib/data.ts) after any change in the admin.
// Outside the Next server (seed scripts, migrations) there is no cache to drop.
const purge = () => {
  try {
    revalidateTag('content', { expire: 0 })
  } catch {}
}

export const purgeOnChange = (c: CollectionConfig): CollectionConfig => ({
  ...c,
  hooks: {
    ...c.hooks,
    afterChange: [...(c.hooks?.afterChange || []), ({ doc }) => (purge(), doc)],
    afterDelete: [...(c.hooks?.afterDelete || []), ({ doc }) => (purge(), doc)],
  },
})

export const purgeOnGlobalChange = (g: GlobalConfig): GlobalConfig => ({
  ...g,
  hooks: { ...g.hooks, afterChange: [...(g.hooks?.afterChange || []), ({ doc }) => (purge(), doc)] },
})
