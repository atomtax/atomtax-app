'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { RefreshCw, Search } from 'lucide-react'
import { AutoLookupBadge, type AutoLookupStatus } from './AutoLookupBadge'
import {
  formatNumberWithCommas,
  parseNumberFromCommas,
} from '@/lib/utils/format-number'

interface LookupSuccess {
  ok: true
  landValuePerSqm: number
  pnu: string
  fiscalYear?: number
  noticeDate?: string
}
interface LookupFailure {
  ok: false
  reason: string
}
type LookupResponse = LookupSuccess | LookupFailure

interface Props {
  value: number
  onChange: (value: number) => void
  /** 도로명/지번 주소 — 변경 시 자동 조회 트리거 */
  address: string
  onAutoLookupDone?: (landValuePerSqm: number) => void
}

export function LandValueField({
  value,
  onChange,
  address,
  onAutoLookupDone,
}: Props) {
  const [status, setStatus] = useState<AutoLookupStatus>('idle')
  const [fiscalYear, setFiscalYear] = useState<number | undefined>()
  const [noticeDate, setNoticeDate] = useState<string | undefined>()
  const lastLookedUpRef = useRef<string>('')

  const triggerLookup = useCallback(
    async (force = false) => {
      const trimmed = address.trim()
      if (!trimmed) {
        setStatus('failed')
        return
      }
      if (!force && lastLookedUpRef.current === trimmed && status !== 'idle') {
        return
      }
      lastLookedUpRef.current = trimmed
      setStatus('looking')
      try {
        const res = await fetch('/api/calculator/lookup-land-value', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ address: trimmed }),
        })
        const json = (await res.json()) as LookupResponse
        if (json.ok) {
          onChange(json.landValuePerSqm)
          setFiscalYear(json.fiscalYear)
          setNoticeDate(json.noticeDate)
          setStatus('success')
          onAutoLookupDone?.(json.landValuePerSqm)
        } else {
          setStatus('failed')
        }
      } catch (e) {
        console.error('[land-value lookup]', e)
        setStatus('failed')
      }
    },
    [address, onChange, onAutoLookupDone, status],
  )

  // 주소가 새로 들어오면 자동 트리거 (한 주소당 1회)
  useEffect(() => {
    const trimmed = address.trim()
    if (!trimmed) return
    if (lastLookedUpRef.current === trimmed) return
    triggerLookup(false)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [address])

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between gap-2">
        <label className="block text-sm font-medium text-gray-700">
          토지공시지가(원/㎡) <span className="text-red-500">*</span>
        </label>
        <div className="flex items-center gap-2">
          <AutoLookupBadge status={status} />
          {address && status !== 'looking' && (
            <button
              type="button"
              onClick={() => triggerLookup(true)}
              className="text-xs px-2 py-1 border border-gray-200 rounded hover:bg-gray-50 inline-flex items-center gap-1"
              title="VWorld API에서 다시 조회"
            >
              {status === 'success' ? (
                <>
                  <RefreshCw size={11} /> 다시 조회
                </>
              ) : (
                <>
                  <Search size={11} /> 자동 조회
                </>
              )}
            </button>
          )}
        </div>
      </div>

      <input
        type="text"
        inputMode="numeric"
        value={formatNumberWithCommas(value)}
        onChange={(e) => {
          onChange(parseNumberFromCommas(e.target.value))
          if (status === 'success') {
            setStatus('idle')
            setFiscalYear(undefined)
            setNoticeDate(undefined)
          }
        }}
        placeholder="예: 3,553,000"
        className="w-full px-3 py-2 border border-gray-200 rounded-lg text-right tabular-nums focus:border-indigo-500 focus:outline-none text-sm"
      />

      <p className="text-xs text-gray-500">
        {status === 'success' && fiscalYear
          ? `${fiscalYear}년 공시 (${noticeDate ?? '공시일자 미상'}) — VWorld API 자동 조회`
          : status === 'failed'
            ? '자동 조회에 실패했습니다. 직접 입력하거나 다시 시도하세요.'
            : 'realtyprice.kr에서 개별공시지가 최근자 확인 가능 (주소 검색 시 자동 조회됩니다)'}
      </p>
    </div>
  )
}
