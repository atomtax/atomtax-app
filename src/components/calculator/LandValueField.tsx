'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { RefreshCw, Search } from 'lucide-react'
import { AutoLookupBadge, type AutoLookupStatus } from './AutoLookupBadge'
import {
  geocodeAddress,
  getLandValueByPoint,
} from '@/lib/api/vworld/browser'
import {
  formatNumberWithCommas,
  parseNumberFromCommas,
} from '@/lib/utils/format-number'

interface Props {
  value: number
  onChange: (value: number) => void
  /** 도로명/지번 주소 — 변경 시 자동 조회 트리거 */
  address: string
  onAutoLookupDone?: (landValuePerSqm: number) => void
  /** PNU(19자리)가 확인되면 호출 — 부모에서 건물면적 자동 조회용 */
  onPnuResolved?: (pnu: string) => void
}

export function LandValueField({
  value,
  onChange,
  address,
  onAutoLookupDone,
  onPnuResolved,
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
        const geo = await geocodeAddress(trimmed)
        if (!geo) {
          setStatus('failed')
          return
        }
        const land = await getLandValueByPoint(geo.x, geo.y)
        if (!land) {
          setStatus('failed')
          return
        }
        onChange(land.landValuePerSqm)
        setFiscalYear(land.fiscalYear)
        setNoticeDate(land.noticeDate)
        setStatus('success')
        onAutoLookupDone?.(land.landValuePerSqm)
        if (land.pnu) onPnuResolved?.(land.pnu)
      } catch (e) {
        console.error('[land-value lookup]', e)
        setStatus('failed')
      }
    },
    [address, onChange, onAutoLookupDone, onPnuResolved, status],
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
        {status === 'success' && fiscalYear ? (
          <>
            {fiscalYear}년 공시 ({noticeDate ?? '공시일자 미상'}) — VWorld API 자동 조회.{' '}
            실제 최신값은{' '}
            <RealtyPriceLink />
            에서 비교하세요.
          </>
        ) : status === 'failed' ? (
          <>
            자동 조회에 실패했습니다. 직접 입력하거나{' '}
            <RealtyPriceLink />
            에서 확인하세요.
          </>
        ) : (
          <>
            주소 검색 시 자동 조회됩니다. 실제 최신값은{' '}
            <RealtyPriceLink />
            에서 확인 가능합니다.
          </>
        )}
      </p>
    </div>
  )
}

function RealtyPriceLink() {
  return (
    <a
      href="https://www.realtyprice.kr/notice/gsindividual/search.htm"
      target="_blank"
      rel="noopener noreferrer"
      className="text-indigo-600 hover:text-indigo-700 underline"
    >
      개별공시지가 조회
    </a>
  )
}
