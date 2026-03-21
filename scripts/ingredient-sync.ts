#!/usr/bin/env npx tsx
/**
 * Pillog Ingredient Sync CLI
 *
 * Usage:
 *   npx tsx scripts/ingredient-sync.ts
 *   npx tsx scripts/ingredient-sync.ts --since 2026-03-01
 *   npx tsx scripts/ingredient-sync.ts --dry-run
 */
import { config } from 'dotenv'
import { resolve } from 'path'

// 루트 .env.local 로드
config({ path: resolve(process.cwd(), '.env.local') })

import { createClient } from '@supabase/supabase-js'
import { runIngredientSync } from '../apps/web/src/lib/admin/ingredient-sync'

// ── CLI args ──────────────────────────────────────────────
const args = process.argv.slice(2)
const dryRun = args.includes('--dry-run')
const sinceIdx = args.indexOf('--since')
const since = sinceIdx !== -1 ? args[sinceIdx + 1] ?? null : null

if (sinceIdx !== -1 && !since) {
  console.error('Error: --since requires a YYYY-MM-DD value')
  process.exit(1)
}

// ── Env check ─────────────────────────────────────────────
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error(
    'Error: NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set in .env.local'
  )
  process.exit(1)
}

// ── Dry-run mode ──────────────────────────────────────────
if (dryRun) {
  console.log('[dry-run] Would run ingredient sync with the following options:')
  console.log(`  since: ${since ?? '(full sync)'}`)
  console.log(`  supabase url: ${supabaseUrl}`)
  console.log('[dry-run] No changes were made.')
  process.exit(0)
}

// ── Run sync ──────────────────────────────────────────────
const supabase = createClient(supabaseUrl, supabaseKey)

const writer = (msg: object) => {
  console.log(JSON.stringify(msg))
}

const messageTypes = {
  start: 'start',
  progress: 'progress',
  done: 'done',
  error: 'error',
}

async function main() {
  console.log(`Ingredient sync started${since ? ` (since ${since})` : ' (full)'}`)
  const result = await runIngredientSync(supabase, writer, messageTypes, since)
  console.log(
    `\nDone: ${result.matchedProducts.toLocaleString()} products matched, ${result.totalLinked.toLocaleString()} links created (${result.total.toLocaleString()} total products)`
  )
}

main().catch((err) => {
  console.error('Ingredient sync failed:', err)
  process.exit(1)
})
