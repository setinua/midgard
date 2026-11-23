// @ts-nocheck
// Local: npx payload run src/seed/demo-cli.ts (SEED_DEMO=remove to delete)
import { getPayload } from 'payload'
import config from '../payload.config'
import { demoSeed } from './demo'

const payload = await getPayload({ config })
await demoSeed(payload, process.argv.includes('--remove') || process.env.SEED_DEMO === 'remove')
process.exit(0)
