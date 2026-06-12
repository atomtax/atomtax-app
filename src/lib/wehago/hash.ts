/**
 * 위하고 payload 정규화 직렬화 + content_hash (Phase 7 / 1단계)
 *
 * 객체 키를 재귀적으로 정렬해 직렬화(배열 순서는 유지)한 뒤 sha256.
 * 같은 데이터를 다시 붙여넣으면 동일 해시 → UNIQUE 충돌로 중복 인식.
 * 반드시 마스킹된 payload를 입력으로 받는다 (3절 → 4절 순서).
 */

import { createHash } from 'crypto'
import type { Json } from './types'

/** 객체 키를 재귀 정렬(배열 순서 유지)해 안정적인 JSON 문자열 생성 */
export function canonicalize(value: Json): string {
  if (Array.isArray(value)) {
    return `[${value.map(canonicalize).join(',')}]`
  }
  if (value !== null && typeof value === 'object') {
    const keys = Object.keys(value).sort()
    const entries = keys.map(
      (k) => `${JSON.stringify(k)}:${canonicalize(value[k])}`,
    )
    return `{${entries.join(',')}}`
  }
  return JSON.stringify(value)
}

export function contentHash(value: Json): string {
  return createHash('sha256').update(canonicalize(value)).digest('hex')
}
