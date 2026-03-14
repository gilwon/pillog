/**
 * Meilisearch 초기 데이터 적재 스크립트
 * 실행: npm run meili:seed
 *
 * 환경변수 필요 (.env.local):
 *   SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY
 *   MEILISEARCH_HOST, MEILISEARCH_API_KEY
 */
import { config } from 'dotenv'
import { resolve } from 'path'

// 루트 .env.local 로드
config({ path: resolve(process.cwd(), '.env.local') })

import { createClient } from '@supabase/supabase-js'
import { MeiliSearch } from 'meilisearch'
import indexSettings from '../../meilisearch/index-settings.json'
import synonyms from '../../meilisearch/synonyms.json'

const BATCH_SIZE = 1000

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const meili = new MeiliSearch({
  host: process.env.MEILISEARCH_HOST!,
  apiKey: process.env.MEILISEARCH_API_KEY!,
})

async function seed() {
  console.log('🌱 Meilisearch seeding started...')

  const index = meili.index('products')

  // 인덱스 설정 + 동의어 적용
  const settingsTask = await index.updateSettings({
    ...indexSettings,
    synonyms,
  })
  await meili.tasks.waitForTask(settingsTask.taskUid)
  console.log('✅ Index settings applied')

  // 전체 products 배치 적재
  let offset = 0
  let totalIndexed = 0

  while (true) {
    const { data, error } = await supabase
      .from('products')
      .select('id, name, company, functionality_tags, primary_functionality, shape, is_active')
      .range(offset, offset + BATCH_SIZE - 1)

    if (error) throw error
    if (!data || data.length === 0) break

    const task = await index.addDocuments(data, { primaryKey: 'id' })
    await meili.tasks.waitForTask(task.taskUid)

    totalIndexed += data.length
    console.log(`  Indexed ${totalIndexed} products...`)

    if (data.length < BATCH_SIZE) break
    offset += BATCH_SIZE
  }

  console.log(`✅ Seeding complete: ${totalIndexed} products indexed`)
}

seed().catch((err) => {
  console.error('❌ Seed failed:', err)
  process.exit(1)
})
