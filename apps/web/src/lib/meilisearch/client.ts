import { MeiliSearch } from 'meilisearch'

const host = process.env.MEILISEARCH_HOST
const apiKey = process.env.MEILISEARCH_API_KEY

if (!host || !apiKey) {
  console.warn('[Meilisearch] MEILISEARCH_HOST or MEILISEARCH_API_KEY not set — fallback to pg_trgm')
}

export const meiliClient = host && apiKey
  ? new MeiliSearch({ host, apiKey })
  : null

export const PRODUCTS_INDEX = 'products'
