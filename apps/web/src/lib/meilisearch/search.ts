import { meiliClient, PRODUCTS_INDEX } from './client'
import type { ProductSearchResult } from '@/types/database'

interface MeiliSearchOptions {
  query: string
  limit: number
  offset: number
  category?: string
  match?: 'all' | 'any'  // Meilisearch는 자체 relevancy 처리 (pg_trgm fallback과 인터페이스 일치용)
}

interface MeiliSearchReturn {
  data: ProductSearchResult[]
  total: number
}

export async function searchWithMeilisearch({
  query,
  limit,
  offset,
  category,
}: MeiliSearchOptions): Promise<MeiliSearchReturn> {
  if (!meiliClient) throw new Error('Meilisearch not configured')

  const index = meiliClient.index(PRODUCTS_INDEX)

  const filterParts: string[] = ['is_active = true']
  if (category && category.trim().length > 0) {
    filterParts.push(`functionality_tags = "${category.trim()}"`)
  }

  const result = await index.search(query, {
    limit,
    offset,
    filter: filterParts.join(' AND '),
    attributesToRetrieve: ['id', 'name', 'company', 'functionality_tags', 'shape'],
  })

  return {
    data: result.hits.map((hit) => ({
      id: hit.id as string,
      name: hit.name as string,
      company: hit.company as string,
      functionality_tags: (hit.functionality_tags as string[]) || [],
      shape: (hit.shape as string | null) ?? null,
      similarity_score: 1.0,
    })),
    total: result.estimatedTotalHits ?? result.hits.length,
  }
}
