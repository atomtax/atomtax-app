'use client'

import { useCallback, useRef, useState } from 'react'
import {
  AlertCircle,
  AlertTriangle,
  CheckCircle2,
  FileUp,
  Loader2,
  RefreshCw,
  Search,
} from 'lucide-react'
import { AreaInput } from './AreaInput'

type Status = 'idle' | 'looking' | 'success' | 'pdf' | 'failed' | 'needDongHo'

interface SuccessInfo {
  mode: 'title' | 'exposPubuse'
  buildingType?: string
  buildingName?: string
  isCollective?: boolean
  exposArea?: number
  pubuseArea?: number
  dongNm?: string
  hoNm?: string
  completionYear?: number
  structure?: string
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

interface PdfParseSuccess {
  ok: true
  totalArea: number
  exclusiveArea?: number
  commonArea?: number
  totalFloorArea?: number
  buildingType: 'collective' | 'general' | 'unknown'
}
interface PdfParseFailure {
  ok: false
  reason: string
}
type PdfParseResponse = PdfParseSuccess | PdfParseFailure

interface PdfInfo {
  buildingType: 'collective' | 'general' | 'unknown'
  exclusiveArea?: number
  commonArea?: number
  totalFloorArea?: number
  totalArea: number
}

export interface AutoLookupMeta {
  totalArea: number
  completionYear?: number
  structure?: string
  buildingType?: string
}

interface Props {
  value: number
  onChange: (v: number) => void
  /** VWorld 자동조회로 얻은 PNU (없으면 자동조회 안 함) */
  pnu: string
  dongInput: string
  hoInput: string
  isBasement: boolean
  /** 자동조회 성공 시 호출 — 신축연도/구조 등 메타데이터 부모 폼 자동 채움용 */
  onAutoLookupDone?: (info: AutoLookupMeta) => void
}

export function BuildingAreaField({
  value,
  onChange,
  pnu,
  dongInput,
  hoInput,
  isBasement,
  onAutoLookupDone,
}: Props) {
  const [status, setStatus] = useState<Status>('idle')
  const [info, setInfo] = useState<SuccessInfo | null>(null)
  const [pdfInfo, setPdfInfo] = useState<PdfInfo | null>(null)
  const [needDongHoMessage, setNeedDongHoMessage] = useState<string | null>(
    null,
  )
  const [failedMessage, setFailedMessage] = useState<string | null>(null)
  const lastKeyRef = useRef<string>('')
  const fileInputRef = useRef<HTMLInputElement>(null)

  const triggerLookup = useCallback(
    async (force = false) => {
      if (!pnu) {
        setStatus('idle')
        return
      }
      const key = `${pnu}|${dongInput}|${hoInput}|${isBasement}`
      if (!force && lastKeyRef.current === key) return
      lastKeyRef.current = key

      setStatus('looking')
      try {
        const res = await fetch('/api/calculator/lookup-building-area', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ pnu, dongInput, hoInput, isBasement }),
        })
        const json = (await res.json()) as LookupResponse
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
            completionYear: json.completionYear,
            structure: json.structure,
          })
          setPdfInfo(null)
          setNeedDongHoMessage(null)
          setFailedMessage(null)
          setStatus('success')
          onAutoLookupDone?.({
            totalArea: json.totalArea,
            completionYear: json.completionYear,
            structure: json.structure,
            buildingType: json.buildingType,
          })
        } else if (json.reason === 'NO_DONG_HO_FOR_COLLECTIVE') {
          setNeedDongHoMessage(
            json.message ?? '집합건물입니다. 동/호수를 입력하세요.',
          )
          setFailedMessage(null)
          setInfo(null)
          setStatus('needDongHo')
        } else {
          setFailedMessage(json.message ?? null)
          setInfo(null)
          setStatus('failed')
        }
      } catch (e) {
        console.error('[building-area lookup]', e)
        setStatus('failed')
      }
    },
    [pnu, dongInput, hoInput, isBasement, onChange, onAutoLookupDone],
  )

  const handlePdfUpload = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0]
      if (!file) return

      setStatus('looking')
      try {
        const fd = new FormData()
        fd.append('file', file)
        const res = await fetch('/api/calculator/parse-building-cert', {
          method: 'POST',
          body: fd,
        })
        const json = (await res.json()) as PdfParseResponse
        if (json.ok) {
          onChange(json.totalArea)
          setPdfInfo({
            buildingType: json.buildingType,
            exclusiveArea: json.exclusiveArea,
            commonArea: json.commonArea,
            totalFloorArea: json.totalFloorArea,
            totalArea: json.totalArea,
          })
          setInfo(null)
          setFailedMessage(null)
          setStatus('pdf')
        } else {
          const messages: Record<string, string> = {
            NO_FILE: '파일을 선택해주세요.',
            NOT_PDF: 'PDF 파일만 업로드 가능합니다.',
            TOO_LARGE: '파일이 10MB를 초과합니다.',
            PARSE_FAILED:
              '면적을 자동 추출하지 못했습니다. 직접 입력해주세요.',
            INTERNAL_ERROR: '서버 오류가 발생했습니다.',
          }
          setFailedMessage(messages[json.reason] ?? '추출 실패')
          setStatus('failed')
        }
      } catch (err) {
        console.error('[pdf-upload]', err)
        setFailedMessage('업로드 실패')
        setStatus('failed')
      } finally {
        if (fileInputRef.current) fileInputRef.current.value = ''
      }
    },
    [onChange],
  )

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between gap-2">
        <label className="block text-sm font-medium text-gray-700">
          건물 면적(㎡) <span className="text-red-500">*</span>
        </label>
        <div className="flex items-center gap-2">
          <StatusBadge status={status} />
          {status !== 'looking' && (
            <>
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
              <input
                type="file"
                accept=".pdf,application/pdf"
                onChange={handlePdfUpload}
                ref={fileInputRef}
                className="hidden"
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="text-xs px-2 py-1 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 rounded inline-flex items-center gap-1"
                title="건축물대장 PDF에서 면적을 자동 추출합니다"
              >
                <FileUp size={11} /> PDF 업로드
              </button>
            </>
          )}
        </div>
      </div>

      <AreaInput
        value={value}
        onChange={(v) => {
          onChange(v)
          if (status === 'success' || status === 'pdf') {
            setStatus('idle')
            setInfo(null)
            setPdfInfo(null)
          }
        }}
        placeholder="예: 242.83"
      />

      <div className="text-xs text-gray-500">
        {status === 'success' && info?.mode === 'exposPubuse' ? (
          <p>
            <span className="inline-block px-2 py-0.5 rounded bg-blue-100 text-blue-700 font-semibold mr-1.5">
              ✓ 자동조회 완료
            </span>
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
          </p>
        ) : status === 'success' && info?.mode === 'title' ? (
          <p>
            <span className="inline-block px-2 py-0.5 rounded bg-blue-100 text-blue-700 font-semibold mr-1.5">
              ✓ 자동조회 완료
            </span>
            건축물대장 표제부 연면적 자동 조회
            {info.buildingType ? ` (${info.buildingType})` : ''}.
            <span className="text-amber-700 ml-1">
              ⚠️ 건축물대장 상 면적과 비교 필수.
            </span>
          </p>
        ) : status === 'pdf' && pdfInfo ? (
          <div className="space-y-1">
            <p>
              <span className="inline-block px-2 py-0.5 rounded bg-blue-100 text-blue-700 font-semibold mr-1.5">
                ✓ PDF에서 자동 추출
              </span>
              {pdfInfo.buildingType === 'collective' ? (
                <>
                  전유 {pdfInfo.exclusiveArea?.toLocaleString('ko-KR')}㎡ + 공용{' '}
                  {pdfInfo.commonArea?.toLocaleString('ko-KR')}㎡ ={' '}
                  {pdfInfo.totalArea.toLocaleString('ko-KR')}㎡
                </>
              ) : pdfInfo.buildingType === 'general' ? (
                <>연면적 {pdfInfo.totalFloorArea?.toLocaleString('ko-KR')}㎡</>
              ) : (
                <>면적 {pdfInfo.totalArea.toLocaleString('ko-KR')}㎡</>
              )}
            </p>
            <p className="text-amber-700 inline-flex items-center gap-1">
              <AlertTriangle size={11} /> PDF 자동 추출이 잘못 인식할 수 있으니
              원본과 비교하세요.
            </p>
          </div>
        ) : status === 'needDongHo' ? (
          <span className="text-orange-700">
            ⚠️{' '}
            {needDongHoMessage ??
              '집합건물입니다. 상세 위치란에 "동/호수"를 입력하면 자동 조회됩니다 (예: 302동 407호).'}
          </span>
        ) : status === 'failed' ? (
          <span className="text-orange-700">
            ⚠️{' '}
            {failedMessage ??
              '자동 조회에 실패했습니다. 직접 입력하거나 [PDF 업로드]를 사용하세요.'}
          </span>
        ) : (
          '공용부 + 전유부 모두 포함합니다. [자동 조회] 또는 [PDF 업로드] 를 사용하세요.'
        )}
      </div>
    </div>
  )
}

function StatusBadge({ status }: { status: Status }) {
  if (status === 'idle') return null
  if (status === 'looking') {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs bg-gray-100 text-gray-600">
        <Loader2 size={11} className="animate-spin" /> 처리 중...
      </span>
    )
  }
  if (status === 'success') {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs bg-blue-100 text-blue-700">
        <CheckCircle2 size={11} /> 자동 조회됨
      </span>
    )
  }
  if (status === 'pdf') {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs bg-blue-100 text-blue-700">
        <CheckCircle2 size={11} /> PDF 추출됨
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
