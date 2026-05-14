import React from 'react'

const AMOUNT_PATTERN = /([\d,]+(?:\.\d+)?\s*[조억만천백]?원)/g

/**
 * 텍스트 내 금액+단위 패턴(예: "2.4억원", "1,940,000원", "7,058만원")을
 * 파란색 + 볼드 + 약간 큰 글자로 강조한 React 노드 배열로 반환.
 */
export function highlightAmounts(
  text: string,
  options?: { color?: string },
): React.ReactNode[] {
  const color = options?.color ?? '#1d4ed8'
  const parts: React.ReactNode[] = []
  let lastIndex = 0
  let match: RegExpExecArray | null

  AMOUNT_PATTERN.lastIndex = 0
  while ((match = AMOUNT_PATTERN.exec(text)) !== null) {
    if (match.index > lastIndex) {
      parts.push(text.substring(lastIndex, match.index))
    }
    parts.push(
      React.createElement(
        'strong',
        {
          key: match.index,
          style: {
            color,
            fontWeight: 700,
            fontSize: '1.1em',
          },
        },
        match[0],
      ),
    )
    lastIndex = match.index + match[0].length
  }

  if (lastIndex < text.length) {
    parts.push(text.substring(lastIndex))
  }

  return parts.length > 0 ? parts : [text]
}
