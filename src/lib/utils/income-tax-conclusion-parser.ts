export interface IncomeTaxConclusionPoint {
  title: string
  body: string
}

export interface ParsedIncomeTaxConclusion {
  cards: IncomeTaxConclusionPoint[]
  closing: string | null
}

/**
 * conclusion_notes 텍스트를 카드 배열과 마무리 인사로 분리.
 * "## 마무리 인사" 섹션은 PDF 진파랑 박스에 삽입되므로 카드에서 제외.
 * 카드는 최대 4개.
 */
export function parseIncomeTaxConclusion(text: string | null | undefined): ParsedIncomeTaxConclusion {
  if (!text || !text.trim()) return { cards: [], closing: null }

  const lines = text.split('\n')
  const sections: IncomeTaxConclusionPoint[] = []
  let current: IncomeTaxConclusionPoint | null = null

  for (const line of lines) {
    const trimmed = line.trim()
    if (trimmed.startsWith('## ')) {
      if (current) sections.push(current)
      current = { title: trimmed.substring(3).trim(), body: '' }
    } else if (current) {
      current.body = (current.body ? current.body + ' ' : '') + trimmed
      current.body = current.body.trim()
    } else if (trimmed) {
      current = { title: '', body: trimmed }
    }
  }
  if (current) sections.push(current)

  let closing: string | null = null
  const cards: IncomeTaxConclusionPoint[] = []

  for (const section of sections.filter((s) => s.title || s.body)) {
    if (section.title === '마무리 인사') {
      closing = section.body
    } else {
      cards.push(section)
    }
  }

  return { cards: cards.slice(0, 4), closing }
}
