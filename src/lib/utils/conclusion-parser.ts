export interface ConclusionPoint {
  title: string
  body: string
}

/**
 * conclusion_notes 텍스트를 카드 배열로 파싱.
 * `## 제목` 줄을 카드 시작점으로, 그 아래 줄들을 본문으로.
 * `##` 없는 텍스트는 단일 카드 (제목 없음). 최대 4개.
 */
export function parseConclusion(text: string | null | undefined): ConclusionPoint[] {
  if (!text || !text.trim()) return []

  const lines = text.split('\n')
  const points: ConclusionPoint[] = []
  let current: ConclusionPoint | null = null

  for (const line of lines) {
    const trimmed = line.trim()
    if (trimmed.startsWith('## ')) {
      if (current) points.push(current)
      current = { title: trimmed.substring(3).trim(), body: '' }
    } else if (current) {
      current.body = (current.body ? current.body + ' ' : '') + trimmed
      current.body = current.body.trim()
    } else if (trimmed) {
      current = { title: '', body: trimmed }
    }
  }
  if (current) points.push(current)

  return points.filter((p) => p.title || p.body).slice(0, 4)
}
