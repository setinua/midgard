import { postgresAdapter } from '@payloadcms/db-postgres'
import { resendAdapter } from '@payloadcms/email-resend'
import { BlocksFeature, FixedToolbarFeature, HeadingFeature, lexicalEditor } from '@payloadcms/richtext-lexical'
import { s3Storage } from '@payloadcms/storage-s3'
import { uk } from '@payloadcms/translations/languages/uk'
import path from 'path'
import { buildConfig } from 'payload'
import sharp from 'sharp'
import { fileURLToPath } from 'url'

import { Articles } from './collections/Articles'
import { Authors } from './collections/Authors'
import { Media } from './collections/Media'
import { Pages } from './collections/Pages'
import { Epochs, Regions, Tags } from './collections/Taxonomies'
import { Users } from './collections/Users'
import { Homepage } from './globals/Homepage'
import { Settings } from './globals/Settings'
import { migrations } from './migrations'
import { seedBase } from './seed/base'
import { demoSeed } from './seed/demo'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)
const env = process.env

export default buildConfig({
  serverURL: env.SERVER_URL || '',
  admin: {
    user: Users.slug,
    meta: { titleSuffix: ' — Мідгард' },
    importMap: { baseDir: path.resolve(dirname) },
  },
  i18n: { supportedLanguages: { uk }, fallbackLanguage: 'uk' },
  collections: [Articles, Pages, Authors, Media, Regions, Epochs, Tags, Users],
  globals: [Homepage, Settings],
  editor: lexicalEditor({
    // Always-visible toolbar above the text (bold, link, quote, lists, headings, upload)
    // H1 is the article title, so the body only gets H2–H4; rarely needed tools are removed.
    features: ({ defaultFeatures }) => [
      ...defaultFeatures.filter(
        (f) => !['heading', 'relationship', 'checklist', 'subscript', 'superscript', 'inlineCode'].includes(f.key),
      ),
      HeadingFeature({ enabledHeadingSizes: ['h2', 'h3', 'h4'] }),
      // Raw HTML block for embeds (YouTube, maps, tables, social posts) — inserted via «+» → «HTML-код»
      BlocksFeature({
        blocks: [
          {
            slug: 'html',
            labels: { singular: 'HTML-код', plural: 'HTML-код' },
            fields: [
              {
                name: 'html',
                type: 'code',
                label: 'HTML-код',
                required: true,
                admin: {
                  language: 'html',
                  description: 'Вставте код вбудовування (YouTube, Google Maps, Instagram, X, таблиця тощо). На сайті він покажеться як є.',
                },
              },
            ],
          },
        ],
      }),
      FixedToolbarFeature(),
    ],
  }),
  secret: env.PAYLOAD_SECRET || '',
  typescript: { outputFile: path.resolve(dirname, 'payload-types.ts') },
  db: postgresAdapter({
    pool: { connectionString: env.DATABASE_URL || '' },
    prodMigrations: migrations,
    push: false,
  }),
  sharp,
  // Scheduled publishing runs through the jobs queue.
  jobs: { autoRun: [{ cron: '* * * * *', queue: 'default' }] },
  email: env.RESEND_API_KEY
    ? resendAdapter({ apiKey: env.RESEND_API_KEY, defaultFromAddress: env.EMAIL_FROM || 'noreply@example.com', defaultFromName: 'Мідгард' })
    : undefined,
  plugins: [
    s3Storage({
      enabled: Boolean(env.S3_BUCKET),
      collections: { media: true },
      bucket: env.S3_BUCKET || '',
      config: {
        endpoint: env.S3_ENDPOINT,
        region: env.S3_REGION || 'auto',
        forcePathStyle: true,
        credentials: { accessKeyId: env.S3_ACCESS_KEY_ID || '', secretAccessKey: env.S3_SECRET_ACCESS_KEY || '' },
      },
    }),
  ],
  onInit: async (payload) => {
    await seedBase(payload)
    // Safety net: if no administrator exists, promote the oldest account.
    const admins = await payload.count({ collection: 'users', where: { role: { equals: 'admin' } } })
    if (admins.totalDocs === 0) {
      const first = (await payload.find({ collection: 'users', sort: 'createdAt', limit: 1, depth: 0 })).docs[0]
      if (first) {
        await payload.update({ collection: 'users', id: first.id, data: { role: 'admin' } })
        payload.logger.info(`Promoted ${first.email} to admin (no admin existed)`)
      }
    }
    const demo = process.env.SEED_DEMO
    if (demo === '1' || demo === 'remove') {
      demoSeed(payload, demo === 'remove').catch((e) => payload.logger.error(e))
    }
  },
})
