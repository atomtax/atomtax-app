/**
 * 위하고 payload 민감정보 마스킹 (Phase 7 / 1단계)
 *
 * DB에 넣기 전에 서버에서 재귀적으로 주민번호를 마스킹한다.
 * - 항상 마스킹: no_social, no_ceosoc, no_mainsoc
 * - 조건부 마스킹: no_corpor (개인사업자면 주민번호가 들어옴 → 13자리 숫자일 때만)
 * - 처리: 7자리 이상 순수 숫자 문자열이면 앞 6자리(생년월일)만 남기고 나머지를 '*'
 *   예) "9906231820422" → "990623*******"
 *
 * 마스킹은 content_hash 계산보다 반드시 먼저 적용한다 (4절).
 */

import type { Json } from './types'

const ALWAYS_MASK_KEYS = new Set(['no_social', 'no_ceosoc', 'no_mainsoc'])

/** 7자리 이상 순수 숫자면 앞 6자리만 남기고 나머지를 '*'로 */
function maskDigits(value: string): string {
  return value.slice(0, 6) + '*'.repeat(value.length - 6)
}

function maskField(key: string, value: Json): Json {
  if (typeof value !== 'string') return value

  if (ALWAYS_MASK_KEYS.has(key) && /^\d{7,}$/.test(value)) {
    return maskDigits(value)
  }
  // no_corpor: 개인사업자의 주민번호(13자리)만 마스킹, 법인등록번호는 보존
  if (key === 'no_corpor' && /^\d{13}$/.test(value)) {
    return maskDigits(value)
  }
  return value
}

/** payload를 재귀적으로 순회하며 민감 키를 마스킹한 새 객체를 반환 */
export function sanitizeWehagoPayload(input: Json): Json {
  if (Array.isArray(input)) {
    return input.map((item) => sanitizeWehagoPayload(item))
  }
  if (input !== null && typeof input === 'object') {
    const out: { [key: string]: Json } = {}
    for (const [key, value] of Object.entries(input)) {
      // 먼저 키 기준 마스킹 시도, 통과하면 자식까지 재귀
      const masked = maskField(key, value)
      out[key] =
        masked === value ? sanitizeWehagoPayload(value) : masked
    }
    return out
  }
  return input
}
