/**
 * 위하고 검토 룰 엔진 (Phase 7 / 1단계)
 *
 * 손익(sacl0106) / 급여(swsa0105) / 고정자산(saas0106) / 사업소득(swbu0111)
 * 스냅샷 payload를 받아 인건비·감가상각 대조 결과를 계산한다.
 *
 * 근거 등식 (부록 A 실데이터, 1원까지 검증):
 *  - 급여 total_ji 합계 = 손익 [802]+[803]+[805] mn_total1
 *  - 고정자산 합계행(subhap='2') mn_cdep = 손익 [818] mn_total1
 */

import type {
  Json,
  IncomeStatementRow,
  PayrollRow,
  FixedAssetRow,
  FixedAssetPayload,
  BusinessIncomeRow,
  BusinessIncomePayload,
} from './types'

function num(value: unknown): number {
  return typeof value === 'number' && Number.isFinite(value) ? value : 0
}

// ─── payload 추출기 (unknown Json → 타입 배열) ─────────────
export function extractIncomeStatementRows(payload: Json): IncomeStatementRow[] {
  return Array.isArray(payload) ? (payload as IncomeStatementRow[]) : []
}

export function extractPayrollRows(payload: Json): PayrollRow[] {
  return Array.isArray(payload) ? (payload as PayrollRow[]) : []
}

export function extractFixedAssetRows(payload: Json): FixedAssetRow[] {
  if (payload && typeof payload === 'object' && !Array.isArray(payload)) {
    const data = (payload as FixedAssetPayload).g_data
    if (Array.isArray(data)) return data
  }
  return []
}

export function extractBusinessIncomeRows(payload: Json): BusinessIncomeRow[] {
  if (payload && typeof payload === 'object' && !Array.isArray(payload)) {
    const grp = (payload as BusinessIncomePayload).grp_1
    if (Array.isArray(grp)) return grp
  }
  return []
}

// ─── 집계 ────────────────────────────────────────────────
/** 급여대장 전 직원 total_ji 합계 (A) */
export function payrollTotal(rows: PayrollRow[]): number {
  return rows.reduce((sum, r) => sum + num(r.total_ji), 0)
}

/** 손익 인건비 = cd_acctit 802/803/805 의 mn_total1 합 (B) */
const LABOR_CODES = new Set(['802', '803', '805'])
export function incomeLaborTotal(rows: IncomeStatementRow[]): number {
  return rows
    .filter((r) => r.cd_acctit != null && LABOR_CODES.has(r.cd_acctit))
    .reduce((sum, r) => sum + num(r.mn_total1), 0)
}

/** 고정자산 당기상각비 = subhap='2' 합계행 mn_cdep, 없으면 subhap='0' 행 합 (A) */
export function fixedAssetDepreciation(rows: FixedAssetRow[]): number {
  const totalRow = rows.find((r) => r.subhap === '2')
  if (totalRow) return num(totalRow.mn_cdep)
  return rows
    .filter((r) => r.subhap === '0')
    .reduce((sum, r) => sum + num(r.mn_cdep), 0)
}

/** 손익 [818] 감가상각비 mn_total1 (없으면 0) (B) */
export function incomeDepreciation(rows: IncomeStatementRow[]): number {
  const row = rows.find((r) => r.cd_acctit === '818')
  return row ? num(row.mn_total1) : 0
}

/** 사업소득 grp_1 am_pay 합계 (정보성) */
export function businessIncomeTotal(rows: BusinessIncomeRow[]): number {
  return rows.reduce((sum, r) => sum + num(r.am_pay), 0)
}

// ─── 룰 결과 ─────────────────────────────────────────────
export type RuleStatus = 'ok' | 'mismatch' | 'critical' | 'missing'

export interface LaborRuleResult {
  status: RuleStatus
  payrollTotal: number // A
  incomeLaborTotal: number // B
  diff: number // A − B
  periodMismatch: boolean
}

export interface DepreciationRuleResult {
  status: RuleStatus
  fixedAssetDep: number // A
  incomeDep: number // B
  diff: number // A − B
}

export function computeLaborRule(args: {
  hasPayroll: boolean
  payrollTotal: number
  incomeLaborTotal: number
  payrollPeriodTo: string | null
  incomePeriodTo: string | null
}): LaborRuleResult {
  const diff = args.payrollTotal - args.incomeLaborTotal
  const periodMismatch =
    args.payrollPeriodTo != null &&
    args.incomePeriodTo != null &&
    args.payrollPeriodTo !== args.incomePeriodTo

  if (!args.hasPayroll) {
    return {
      status: 'missing',
      payrollTotal: args.payrollTotal,
      incomeLaborTotal: args.incomeLaborTotal,
      diff,
      periodMismatch,
    }
  }
  return {
    status: diff === 0 ? 'ok' : 'mismatch',
    payrollTotal: args.payrollTotal,
    incomeLaborTotal: args.incomeLaborTotal,
    diff,
    periodMismatch,
  }
}

export function computeDepreciationRule(args: {
  hasFixedAsset: boolean
  fixedAssetDep: number
  incomeDep: number
}): DepreciationRuleResult {
  const diff = args.fixedAssetDep - args.incomeDep
  if (!args.hasFixedAsset) {
    return {
      status: 'missing',
      fixedAssetDep: args.fixedAssetDep,
      incomeDep: args.incomeDep,
      diff,
    }
  }
  let status: RuleStatus
  if (diff === 0) status = 'ok'
  else if (args.fixedAssetDep > 0 && args.incomeDep === 0) status = 'critical'
  else status = 'mismatch'
  return {
    status,
    fixedAssetDep: args.fixedAssetDep,
    incomeDep: args.incomeDep,
    diff,
  }
}
