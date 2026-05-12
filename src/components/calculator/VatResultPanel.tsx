'use client'

import { CheckCircle2, AlertTriangle, Sparkles } from 'lucide-react'
import type { VatAllocationResult } from '@/lib/calculators/vat-allocation'

interface Props {
  result: VatAllocationResult
  sellingPrice: number
}

function formatWon(value: number): string {
  return `${Math.round(value).toLocaleString('ko-KR')} 원`
}

export function VatResultPanel({ result, sellingPrice }: Props) {
  return (
    <section
      className="rounded-2xl text-white p-6 shadow-lg"
      style={{
        background: 'linear-gradient(135deg, #1e3a8a 0%, #1e40af 100%)',
      }}
    >
      <h2 className="text-sm font-bold flex items-center gap-2 mb-4 opacity-95">
        <Sparkles size={16} /> 계산 결과
      </h2>

      <div className="space-y-2.5">
        <ResultRow label="부가가치세 시가 (정상가)" value={result.vatMarket} />
        <ResultRow
          label="부가가치세 최저가 (70%)"
          value={result.vatLow}
          highlight
        />
      </div>

      <div className="my-4 border-t border-white/20" />

      <div className="space-y-2.5">
        <ResultRow label="토지가액 (분배 후)" value={result.allocatedLand} />
        <ResultRow label="건물가액 (분배 후)" value={result.allocatedBuilding} />
        <ResultRow
          label="부가가치세 최저가"
          value={result.vatLow}
          highlight
        />
      </div>

      <div className="my-4 border-t border-white/20" />

      <div
        className={`rounded-lg px-4 py-3 flex items-center justify-between gap-3 ${
          result.isValid ? 'bg-white/10' : 'bg-red-500/30'
        }`}
      >
        <div className="flex items-center gap-2 text-sm">
          {result.isValid ? (
            <CheckCircle2 size={16} className="text-emerald-300" />
          ) : (
            <AlertTriangle size={16} className="text-amber-300" />
          )}
          <span className="opacity-90">
            합계(검증) ={' '}
            <span className="tabular-nums font-medium">
              {formatWon(result.verifyTotal)}
            </span>
          </span>
        </div>
        <span className="text-xs opacity-80 tabular-nums">
          매도예상가 {formatWon(sellingPrice)}{' '}
          {result.isValid ? '✓' : '⚠'}
        </span>
      </div>
    </section>
  )
}

function ResultRow({
  label,
  value,
  highlight = false,
}: {
  label: string
  value: number
  highlight?: boolean
}) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className={`text-sm ${highlight ? 'font-bold' : 'opacity-90'}`}>
        {label}
      </span>
      <span
        className={`tabular-nums ${
          highlight ? 'text-lg font-bold text-amber-200' : 'text-base font-medium'
        }`}
      >
        {formatWon(value)}
      </span>
    </div>
  )
}
