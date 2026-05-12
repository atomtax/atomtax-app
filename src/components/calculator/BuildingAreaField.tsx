'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import {
  AlertCircle,
  CheckCircle2,
  Loader2,
  RefreshCw,
  Search,
} from 'lucide-react'
import { DecimalInput } from './NumberInput'

type Status = 'idle' | 'looking' | 'success' | 'failed' | 'needDongHo'

interface SuccessInfo {
  mode: 'title' | 'exposPubuse'
  buildingType?: string
  buildingName?: string
  isCollective?: boolean
  exposArea?: number
  pubuseArea?: number
  dongNm?: string
  hoNm?: string
}

interface LookupResponseSuccess extends SuccessInfo {
  ok: true
  totalArea: number
}
interface LookupResponseFailure {
  ok: false
  reason: string
  message?: string
}
type LookupResponse = LookupResponseSuccess | LookupResponseFailure

interface Props {
  value: number
  onChange: (v: number) => void
  /** VWorld 자동조회로 얻은 PNU (없으면 자동조회 안 함) */
  pnu: string
  /** "상세 위치" 입력 — "302동 407호" 등 */
  detailLocation: string
}

export function BuildingAreaField({
  value,
  onChange,
  pnu,
  detailLocation,
}: Props) {
  const [status, setStatus] = useState<Status>('idle')
  const [info, setInfo] = useState<SuccessInfo | null>(null)
  const [needDongHoMessage, setNeedDongHoMessage] = useState<string | null>(null)
  const lastKeyRef = useRef<string>('')

  const triggerLookup = useCallback(
    async (force = false) => {
      console.log('[building-area] triggerLookup called', {
        pnu,
        detailLocation,
        force,
      })
      if (!pnu) {
        console.log('[building-area] no pnu, skip')
        setStatus('idle')
        return
      }
      const key = `${pnu}|${detailLocation}`
      if (!force && lastKeyRef.current === key) return
      lastKeyRef.current = key

      setStatus('looking')
      try {
        const res = await fetch('/api/calculator/lookup-building-area', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ pnu, detailLocation }),
        })
        const json = (await res.json()) as LookupResponse
        console.log('[building-area] response:', json)
        if (json.ok) {
          onChange(json.totalArea)
          setInfo({
            mode: json.mode,
            buildingType: json.buildingType,
            buildingName: json.buildingName,
            isCollective: json.isCollective,
            exposArea: json.exposArea,
            pubuseArea: json.pubuseArea,
            dongNm: json.dongNm,
            hoNm: json.hoNm,
          })
          setNeedDongHoMessage(null)
          setStatus('success')
        } else if (json.reason === 'NO_DONG_HO_FOR_COLLECTIVE') {
          setNeedDongHoMessage(json.message ?? '집합건물입니다. 동/호수를 입력하세요.')
          setInfo(null)
          setStatus('needDongHo')
        } else {
          setInfo(null)
          setStatus('failed')
        }
      } catch (e) {
        console.error('[building-area lookup]', e)
        setStatus('failed')
      }
    },
    [pnu, detailLocation, onChange],
  )

  // PNU 또는 detailLocation 변경 시 자동 트리거
  useEffect(() => {
    console.log('[building-area] useEffect fired', {
      pnu,
      detailLocation,
      status,
    })
    if (!pnu) return
    const key = `${pnu}|${detailLocation}`
    if (lastKeyRef.current === key) return
    triggerLookup(false)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pnu, detailLocation])

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between gap-2">
        <label className="block text-sm font-medium text-gray-700">
          건물 면적(㎡) <span className="text-red-500">*</span>
        </label>
        <div className="flex items-center gap-2">
          <StatusBadge status={status} />
          {status !== 'looking' && (
            <button
              type="button"
              onClick={() => {
                if (!pnu) {
                  alert(
                    '먼저 주소를 검색해주세요. 토지공시지가 자동조회가 완료되면 건물면적도 조회됩니다.',
                  )
                  return
                }
                triggerLookup(true)
              }}
              className="text-xs px-2 py-1 border border-gray-200 rounded hover:bg-gray-50 inline-flex items-center gap-1"
              title={
                pnu ? '건축물대장에서 다시 조회' : '먼저 주소를 검색하세요'
              }
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

      <DecimalInput
        value={value}
        onChange={(v) => {
          onChange(v)
          if (status === 'success') {
            setStatus('idle')
            setInfo(null)
          }
        }}
        placeholder="예: 242.8263"
      />

      <p className="text-xs text-gray-500">
        {status === 'success' && info?.mode === 'exposPubuse' ? (
          <>
            <strong>
              {info.dongNm ? `${info.dongNm}동 ` : ''}
              {info.hoNm}
            </strong>
            의 전유 {info.exposArea?.toFixed(2)}㎡ + 공용{' '}
            {info.pubuseArea?.toFixed(2)}㎡ ={' '}
            {((info.exposArea ?? 0) + (info.pubuseArea ?? 0)).toFixed(2)}㎡ 자동
            합산.
            <span className="text-amber-700 ml-1">
              ⚠️ 건축물대장 상 면적과 비교 필수.
            </span>
          </>
        ) : status === 'success' && info?.mode === 'title' ? (
          <>
            건축물대장 표제부 연면적 자동 조회
            {info.buildingType ? ` (${info.buildingType})` : ''}.
            <span className="text-amber-700 ml-1">
              ⚠️ 건축물대장 상 면적과 비교 필수.
            </span>
          </>
        ) : status === 'needDongHo' ? (
          <span className="text-orange-700">
            ⚠️{' '}
            {needDongHoMessage ??
              '집합건물입니다. 상세 위치란에 "동/호수"를 입력하면 자동 조회됩니다 (예: 302동 407호).'}
          </span>
        ) : status === 'failed' ? (
          '자동 조회에 실패했습니다. 직접 입력하거나 자동계산 모달에서 건축물대장 PDF 업로드를 사용하세요.'
        ) : (
          '공용부 + 전유부 모두 포함합니다. 주소 검색 시 자동 조회됩니다.'
        )}
      </p>
    </div>
  )
}

function StatusBadge({ status }: { status: Status }) {
  if (status === 'idle') return null
  if (status === 'looking') {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs bg-gray-100 text-gray-600">
        <Loader2 size={11} className="animate-spin" /> 조회 중...
      </span>
    )
  }
  if (status === 'success') {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs bg-green-100 text-green-700">
        <CheckCircle2 size={11} /> 자동 조회됨
      </span>
    )
  }
  if (status === 'needDongHo') {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs bg-orange-100 text-orange-700">
        <AlertCircle size={11} /> 동/호수 필요
      </span>
    )
  }
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs bg-orange-100 text-orange-700">
      <AlertCircle size={11} /> 자동 조회 실패
    </span>
  )
}
