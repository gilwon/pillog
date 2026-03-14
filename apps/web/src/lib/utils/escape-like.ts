/** Postgres LIKE/ILIKE 와일드카드(%, _, \)를 이스케이프합니다. */
export function escapeLike(s: string): string {
  return s.replace(/[%_\\]/g, '\\$&')
}
