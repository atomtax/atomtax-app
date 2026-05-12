/**
 * VWorld API 공통 fetch 래퍼 (서버 사이드 전용).
 * - 5초 타임아웃
 * - 24시간 캐시 (공시지가는 자주 안 바뀜)
 * - 실패 시 null (호출자는 폴백 처리)
 * - non-OK 응답 시 본문도 함께 로그 (디버그 강화)
 */

const TIMEOUT_MS = 5000

export async function vworldFetch(url: URL): Promise<unknown | null> {
  const safeUrl = url.toString().replace(/key=[^&]+/, 'key=***')
  try {
    const res = await fetch(url.toString(), {
      signal: AbortSignal.timeout(TIMEOUT_MS),
      next: { revalidate: 86_400 },
    })
    if (!res.ok) {
      const bodyText = await res.text().catch(() => '<no body>')
      console.error(
        `[vworld] non-OK response ${res.status} ${res.statusText}`,
      )
      console.error(`[vworld] response body: ${bodyText.slice(0, 500)}`)
      console.error(`[vworld] request url: ${safeUrl}`)
      return null
    }
    return await res.json()
  } catch (e) {
    console.error('[vworld] fetch failed', e, 'url:', safeUrl)
    return null
  }
}

/** VWorld 도메인 파라미터 (등록된 서비스 URL의 호스트) */
export function getVworldDomain(): string {
  return process.env.VWORLD_DOMAIN ?? 'atomtax-app.vercel.app'
}

