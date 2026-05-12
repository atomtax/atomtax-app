/**
 * VWorld API 공통 fetch 래퍼 (서버 사이드 전용).
 * - 5초 타임아웃
 * - 24시간 캐시 (공시지가는 자주 안 바뀜)
 * - 실패 시 null (호출자는 폴백 처리)
 */

const TIMEOUT_MS = 5000

export async function vworldFetch(url: URL): Promise<unknown | null> {
  try {
    const res = await fetch(url.toString(), {
      signal: AbortSignal.timeout(TIMEOUT_MS),
      next: { revalidate: 86_400 },
    })
    if (!res.ok) {
      console.error('[vworld] non-OK response', res.status, res.statusText)
      return null
    }
    return await res.json()
  } catch (e) {
    console.error('[vworld] fetch failed', e)
    return null
  }
}
