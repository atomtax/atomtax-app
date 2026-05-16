'use client'

import { useState } from 'react'
import { Factory, Upload, X } from 'lucide-react'
import { bulkUpsertIndustryCodes, type IndustryCodeRow } from '@/lib/db/industry-codes'

interface Props {
  onClose: () => void
  onDone: () => void
}

interface UploadResult {
  processed: number
  duplicates: number
  failed: number
  errors: string[]
}

const HEADER_ROWS = 4 // 4행이 헤더, 5행부터 데이터

export function BulkIndustryCodeUpload({ onClose, onDone }: Props) {
  const [file, setFile] = useState<File | null>(null)
  const [preview, setPreview] = useState<IndustryCodeRow[]>([])
  const [totalCount, setTotalCount] = useState(0)
  const [parseError, setParseError] = useState<string | null>(null)
  const [result, setResult] = useState<UploadResult | null>(null)
  const [loading, setLoading] = useState(false)
  const [progress, setProgress] = useState(0)

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0] ?? null
    setFile(f)
    setPreview([])
    setTotalCount(0)
    setParseError(null)
    setResult(null)
    if (!f) return

    try {
      const parsed = await parseExcel(f)
      if (parsed.length === 0) {
        setParseError(
          '엑셀에서 업종코드 데이터를 찾을 수 없습니다.\n' +
            '4행 헤더, 5행부터 데이터, B열(업종코드) 필수.',
        )
        return
      }
      setTotalCount(parsed.length)
      setPreview(parsed.slice(0, 5))
    } catch (err) {
      setParseError(err instanceof Error ? err.message : '엑셀 파싱 실패')
    }
  }

  async function handleUpload() {
    if (!file) return
    setLoading(true)
    setProgress(10)
    try {
      const parsed = await parseExcel(file)
      setProgress(30)
      const res = await bulkUpsertIndustryCodes(parsed)
      setProgress(100)
      setResult(res)
    } catch (err) {
      alert(err instanceof Error ? err.message : '업로드 실패')
    } finally {
      setLoading(false)
    }
  }

  function handleDoneAndClose() {
    onDone()
    onClose()
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-lg p-6 w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-xl font-bold flex items-center gap-2">
            <Factory size={22} className="text-purple-600" />
            업종코드 마스터 업로드
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
            aria-label="닫기"
          >
            <X size={20} />
          </button>
        </div>

        <div className="text-sm text-gray-600 mb-4 bg-purple-50 border border-purple-200 rounded p-3">
          <p className="mb-1 font-semibold">엑셀 형식 (창감.xlsx 호환)</p>
          <ul className="list-disc list-inside space-y-0.5">
            <li>4행 헤더, 5행부터 데이터</li>
            <li>B열: 업종코드 (필수)</li>
            <li>Z/AA: 중특 O/X + 비고</li>
            <li>AB~AD: 창감 O/X + 시작연월일 + 비고</li>
            <li>AE~AG: 중기업 기준 + 최소고용인원</li>
            <li>AH/AI: 중특분류 + 소기업감면율</li>
            <li>같은 업종코드 재업로드 시 UPDATE (UPSERT)</li>
          </ul>
        </div>

        <input
          type="file"
          accept=".xlsx,.xls"
          onChange={handleFileChange}
          className="block w-full text-sm text-gray-700 mb-3
            file:mr-4 file:py-2 file:px-4 file:rounded file:border-0
            file:text-sm file:font-semibold file:bg-purple-50 file:text-purple-700
            hover:file:bg-purple-100"
        />

        {parseError && (
          <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded mb-3 whitespace-pre-line">
            {parseError}
          </p>
        )}

        {totalCount > 0 && !result && (
          <div className="mb-4">
            <p className="text-sm font-semibold mb-2">
              인식된 항목 {totalCount.toLocaleString('ko-KR')}건 (미리보기 5건)
            </p>
            <div className="max-h-60 overflow-y-auto border border-gray-200 rounded">
              <table className="w-full text-xs">
                <thead className="bg-gray-50 text-gray-600">
                  <tr>
                    <th className="px-2 py-1 text-left">업종코드</th>
                    <th className="px-2 py-1 text-center">중특</th>
                    <th className="px-2 py-1 text-center">창감</th>
                    <th className="px-2 py-1 text-right">감면율</th>
                    <th className="px-2 py-1 text-left">업종</th>
                  </tr>
                </thead>
                <tbody>
                  {preview.map((p) => (
                    <tr key={p.industry_code} className="border-t border-gray-100">
                      <td className="px-2 py-1 font-mono">{p.industry_code}</td>
                      <td className="px-2 py-1 text-center">{p.mid_special_eligible ?? '-'}</td>
                      <td className="px-2 py-1 text-center">{p.startup_eligible ?? '-'}</td>
                      <td className="px-2 py-1 text-right">{p.small_biz_reduction_rate ?? '-'}</td>
                      <td className="px-2 py-1 text-gray-500 truncate max-w-[200px]">
                        {p.business_description ?? '-'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {loading && (
          <div className="mb-3">
            <div className="text-xs text-gray-600 mb-1">업로드 중... {progress}%</div>
            <div className="h-2 bg-gray-200 rounded">
              <div
                className="h-full bg-purple-600 rounded transition-all"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        )}

        {result && (
          <div className="mb-4 p-3 bg-white border border-gray-200 rounded">
            <p className="text-green-700 font-semibold">
              ✅ {result.processed.toLocaleString('ko-KR')}건 처리 완료
              {result.duplicates > 0 && (
                <span className="ml-2 text-sm font-normal text-gray-600">
                  (엑셀 중복 {result.duplicates.toLocaleString('ko-KR')}건 제거)
                </span>
              )}
            </p>
            {result.failed > 0 && (
              <p className="text-red-600 mt-1">❌ {result.failed.toLocaleString('ko-KR')}건 실패</p>
            )}
            {result.errors.length > 0 && (
              <details className="mt-2">
                <summary className="cursor-pointer text-orange-600 text-sm">
                  ⚠️ 에러 상세 ({result.errors.length}건)
                </summary>
                <ul className="mt-1 text-xs text-gray-600 space-y-0.5 max-h-40 overflow-y-auto">
                  {result.errors.map((err, i) => (
                    <li key={i}>• {err}</li>
                  ))}
                </ul>
              </details>
            )}
          </div>
        )}

        <div className="flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 border border-gray-300 rounded hover:bg-gray-50 text-sm"
            disabled={loading}
          >
            {result ? '닫기' : '취소'}
          </button>
          {!result && (
            <button
              type="button"
              onClick={handleUpload}
              disabled={totalCount === 0 || loading}
              className="flex items-center gap-1.5 px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700 disabled:opacity-50 text-sm font-medium"
            >
              <Upload size={15} />
              {loading ? '업로드 중...' : `${totalCount.toLocaleString('ko-KR')}건 업로드`}
            </button>
          )}
          {result && (
            <button
              type="button"
              onClick={handleDoneAndClose}
              className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 text-sm font-medium"
            >
              완료
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

async function parseExcel(file: File): Promise<IndustryCodeRow[]> {
  const XLSX = await import('xlsx')
  const buffer = await file.arrayBuffer()
  const workbook = XLSX.read(buffer, { type: 'array' })
  const sheet = workbook.Sheets[workbook.SheetNames[0]]
  const rows = XLSX.utils.sheet_to_json<unknown[]>(sheet, {
    header: 1,
    defval: null,
  })

  // 인덱스 4(5번째 행)부터 데이터, B열(인덱스 1)에 업종코드 있는 행만
  const dataRows = rows.slice(HEADER_ROWS).filter((r) => r && r[1] != null && String(r[1]).trim())

  return dataRows.map((r) => ({
    industry_code: String(r[1] ?? '').trim(),
    mid_special_eligible: parseOX(r[25]), // Z
    mid_special_note: toText(r[26]),       // AA
    startup_eligible: parseOX(r[27]),      // AB
    startup_start_date: parseDate(r[28]),  // AC
    startup_note: toText(r[29]),           // AD
    threshold_exceeded: parseNum(r[30]),   // AE
    threshold_below: parseNum(r[31]),      // AF
    min_employment: parseIntOrNull(r[32]), // AG
    mid_special_category: toText(r[33]),   // AH
    small_biz_reduction_rate: parseNum(r[34]), // AI
    category_major: toText(r[2]),          // C
    category_major_name: toText(r[3]),     // D
    business_description: toText(r[10]),   // K
  }))
}

function parseOX(value: unknown): 'O' | 'X' | null {
  if (value == null) return null
  const s = String(value).trim().toUpperCase()
  if (s === 'O') return 'O'
  if (s === 'X') return 'X'
  return null
}

function parseNum(value: unknown): number | null {
  if (value == null || value === '') return null
  const n = Number(value)
  return Number.isNaN(n) ? null : n
}

function parseIntOrNull(value: unknown): number | null {
  if (value == null || value === '') return null
  const n = parseInt(String(value), 10)
  return Number.isNaN(n) ? null : n
}

function toText(value: unknown): string | null {
  if (value == null) return null
  const s = String(value).trim()
  return s === '' ? null : s
}

function parseDate(value: unknown): string | null {
  if (value == null) return null

  // Excel Date 객체
  if (value instanceof Date) {
    return formatYmd(value)
  }

  // Excel serial number
  if (typeof value === 'number') {
    const d = new Date(Date.UTC(1899, 11, 30) + value * 86400000)
    return Number.isNaN(d.getTime()) ? null : formatYmd(d)
  }

  const str = String(value).trim()
  if (/^\d{8}$/.test(str)) {
    return `${str.slice(0, 4)}-${str.slice(4, 6)}-${str.slice(6, 8)}`
  }
  if (/^\d{4}-\d{2}-\d{2}/.test(str)) {
    return str.slice(0, 10)
  }
  if (/^\d{4}\.\d{1,2}\.\d{1,2}$/.test(str)) {
    const [y, m, d] = str.split('.')
    return `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`
  }
  return null
}

function formatYmd(d: Date): string {
  const y = d.getUTCFullYear()
  const m = String(d.getUTCMonth() + 1).padStart(2, '0')
  const day = String(d.getUTCDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}
