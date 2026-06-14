'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { detectClosingAction } from './actions'
import type { ClosingTaxType, DetectSummary } from '@/lib/closing/types'

export default function ClosingPasteForm() {
  const router = useRouter()
  const [taxType, setTaxType] = useState<ClosingTaxType>('income')
  const [jsonText, setJsonText] = useState('')
  const [summary, setSummary] = useState<DetectSummary | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  const handleSubmit = () => {
    setError(null)
    setSummary(null)
    if (!jsonText.trim()) {
      setError('마감현황 응답 JSON을 붙여넣어 주세요.')
      return
    }
    startTransition(async () => {
      const r = await detectClosingAction({ taxType, jsonText })
      if (r.ok && r.summary) {
        setSummary(r.summary)
        setJsonText('')
        router.refresh()
      } else {
        setError(r.error ?? '감지 실패')
      }
    })
  }

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-5">
      <h2 className="text-base font-bold text-gray-900 mb-1">마감현황 붙여넣기 (위하고)</h2>
      <p className="text-xs text-gray-500 leading-relaxed mb-4">
        위하고 전자신고 <b>마감현황</b> 화면에서 F12 → Network → <code>common/make/master</code>{' '}
        응답을 복사해 붙여넣으세요. 기장거래처의 마감 변화만 감지합니다.
      </p>

      <div className="flex items-center gap-2 mb-3">
        <label className="text-xs font-semibold text-gray-600">세목</label>
        <select
          value={taxType}
          onChange={(e) => setTaxType(e.target.value as ClosingTaxType)}
          className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand/40"
        >
          <option value="income">종합소득세 / 법인세</option>
          <option value="vat" disabled>
            부가가치세 (다음 단계)
          </option>
        </select>
      </div>

      <textarea
        value={jsonText}
        onChange={(e) => setJsonText(e.target.value)}
        placeholder='{ "result_data": [ ... ], "cno_list": [ ... ] }'
        rows={6}
        className="w-full px-3 py-2 text-xs border border-gray-300 rounded-lg font-mono focus:outline-none focus:ring-2 focus:ring-brand/40 resize-y"
      />

      <div className="flex items-center gap-3 mt-3">
        <button
          onClick={handleSubmit}
          disabled={isPending}
          className="px-5 py-2 bg-brand text-white text-sm font-bold rounded-lg hover:bg-brand-dark transition-colors disabled:opacity-50"
        >
          {isPending ? '감지 중…' : '감지 실행'}
        </button>
        {error && (
          <div className="flex-1 px-3 py-2 text-sm border border-red-300 bg-red-50 text-red-800 rounded-lg">
            ❌ {error}
          </div>
        )}
        {summary && (
          <div className="flex-1 px-3 py-2 text-sm border border-green-300 bg-green-50 text-green-800 rounded-lg">
            🆕 신규마감 {summary.newClosed} · 🔄 재마감 {summary.reClosed} · 변화없음{' '}
            {summary.unchanged} · 기장외 제외 {summary.excluded}
          </div>
        )}
      </div>
    </div>
  )
}
