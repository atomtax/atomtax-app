/**
 * 위하고(Smart A 10) 수집 — 공용 타입 (Phase 7 / 1단계)
 *
 * 화면코드 5종: sabc0102(기본정보) / sacl0106(손익) / swsa0105(급여) /
 *               saas0106(고정자산) / swbu0111(사업소득 3.3%)
 */

/** 재귀 마스킹/직렬화에 쓰는 JSON 값 타입 (any 금지) */
export type Json =
  | string
  | number
  | boolean
  | null
  | Json[]
  | { [key: string]: Json }

/** 위하고 화면코드 */
export const WEHAGO_SCREEN = {
  COMPANY: 'sabc0102',
  INCOME_STATEMENT: 'sacl0106',
  PAYROLL: 'swsa0105',
  FIXED_ASSET: 'saas0106',
  BUSINESS_INCOME: 'swbu0111',
} as const

/** 검토 화면에서 사람이 읽을 화면 라벨 */
export const SCREEN_LABEL: Record<string, string> = {
  sabc0102: '수임처 기본정보',
  sacl0106: '손익계산서',
  swsa0105: '급여대장',
  saas0106: '고정자산',
  swbu0111: '사업소득(3.3%)',
}

// ─── sacl0106 손익계산서 행 ───────────────────────────────
export interface IncomeStatementRow {
  nm_acctit_cd?: string
  nm_acctit?: string
  cd_acctit?: string
  mn_total1?: number // 당기 (계정 행)
  mn_total2?: number // 당기 (섹션 행)
  mn_btotal1?: number // 전기 (계정 행)
  mn_btotal2?: number // 전기 (섹션 행)
  mn_variation_amount?: number
}

// ─── swsa0105 급여대장 행 ─────────────────────────────────
export interface PayrollRow {
  nm_krname?: string
  total_ji?: number
  retire_color?: number
}

// ─── saas0106 고정자산 행 (payload = { g_gubun, g_data: [] }) ─
export interface FixedAssetRow {
  subhap?: string // '0' 자산행 / '1' 소계 / '2' 전체합계
  nm_fixast?: string
  cd_acctit?: string
  mn_cdep?: number // 당기상각비
}
export interface FixedAssetPayload {
  g_gubun?: string
  g_data?: FixedAssetRow[]
}

// ─── swbu0111 사업소득 (payload = { grp_1, grp_2, grp_3, grp_4 }) ─
export interface BusinessIncomeRow {
  nm_krname?: string
  am_pay?: number
}
export interface BusinessIncomePayload {
  grp_1?: BusinessIncomeRow[]
}
