/**
 * Meilisearch 증분 동기화 스크립트
 * 실행: npm run meili:sync
 * GitHub Actions에서 1시간마다 자동 실행
 *
 * 환경변수 필요 (.env.local):
 *   SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY
 *   MEILISEARCH_HOST, MEILISEARCH_API_KEY
 */
import { config } from 'dotenv'
import { resolve } from 'path'

// 로컬 실행 시 .env.local 로드 (GitHub Actions는 이미 env 주입됨)
config({ path: resolve(process.cwd(), '.env.local') })

import { createClient } from '@supabase/supabase-js'
import { MeiliSearch } from 'meilisearch'

const SYNC_LOOKBACK_HOURS = 2  // 안전 여유를 위해 2시간 전부터

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const meili = new MeiliSearch({
  host: process.env.MEILISEARCH_HOST!,
  apiKey: process.env.MEILISEARCH_API_KEY!,
})

async function sync() {
  const since = new Date(Date.now() - SYNC_LOOKBACK_HOURS * 60 * 60 * 1000).toISOString()
  console.log(`🔄 Syncing products updated since ${since}`)

  const index = meili.index('products')

  const { data: updated, error } = await supabase
    .from('products')
    .select('id, name, company, functionality_tags, primary_functionality, shape, is_active')
    .gte('updated_at', since)

  if (error) throw error

  if (!updated || updated.length === 0) {
    console.log('✅ No updates found')
    return
  }

  // is_active=false → 인덱스에서 제거
  const toDelete = updated.filter((p) => !p.is_active).map((p) => p.id)
  const toUpsert = updated.filter((p) => p.is_active)

  if (toDelete.length > 0) {
    const task = await index.deleteDocuments(toDelete)
    await meili.tasks.waitForTask(task.taskUid)
    console.log(`  Deleted ${toDelete.length} inactive products`)
  }

  if (toUpsert.length > 0) {
    const task = await index.addDocuments(toUpsert, { primaryKey: 'id' })
    await meili.tasks.waitForTask(task.taskUid)
    console.log(`  Upserted ${toUpsert.length} products`)
  }

  console.log('✅ Sync complete')
}

sync().catch((err) => {
  console.error('❌ Sync failed:', err)
  process.exit(1)
})
