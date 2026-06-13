/**
 * 위하고 확장 수신 토큰 — 생성/해시 (Phase 7 / 2단계-A)
 *
 * 토큰 원문은 발급 시 한 번만 노출하고 DB에는 sha256 해시만 저장한다.
 * (비밀번호 저장과 동일 원칙)
 */

import { createHash, randomBytes } from 'crypto'

/** URL-safe 랜덤 토큰 (32바이트 → base64url) */
export function generateToken(): string {
  return randomBytes(32).toString('base64url')
}

/** 토큰 원문 → sha256 hex (DB 저장/조회 키) */
export function hashToken(token: string): string {
  return createHash('sha256').update(token).digest('hex')
}
