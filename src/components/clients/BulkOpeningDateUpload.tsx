'use client'

import { useState } from 'react'
import { CalendarPlus, Upload, X } from 'lucide-react'
import { bulkUpdateOpeningDates } from '@/lib/db/clients'

interface Props {
  onClose: () => void
  onDone: () => void
}

interface ParsedRow {
  business_number: string
  opening_date: string
  raw_company?: string
}

interface UploadResult {
  updated: number
  notFound: string[]
}

export function BulkOpeningDateUpload({ onClose, onDone }: Props) {
  const [file, setFile] = useState<File | null>(null)
  const [parsed, setParsed] = useState<ParsedRow[]>([])
  const [parseError, setParseError] = useState<string | null>(null)
  const [result, setResult] = useState<UploadResult | null>(null)
  const [loading, setLoading] = useState(false)

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0] ?? null
    setFile(f)
    setParsed([])
    setParseError(null)
    setResult(null)
    if (!f) return

    try {
      const XLSX = await import('xlsx')
      const buffer = await f.arrayBuffer()
      const workbook = XLSX.read(buffer, { type: 'array' })
      const sheet = workbook.Sheets[workbook.SheetNames[0]]
      const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, { defval: null })

      const list: ParsedRow[] = []
      for (const row of rows) {
        const bn = pickField(row, ['사업자등록번호', '사업자번호', 'business_number'])
        const od = pickField(row, ['개업일', '개업연월일', 'opening_date'])
        const company = pickField(row, ['상호', '거래처명', '상호명', 'company_name'])

        if (!bn || !od) continue
        const date = parseDate(od)
        if (!date) continue
        list.push({
          business_number: String(bn).trim(),
          opening_date: date,
          raw_company: company ? String(company).trim() : undefined,
        })
      }

      if (list.length === 0) {
        setParseError(
          '엑셀에서 사업자등록번호 + 개업일 컬럼을 찾을 수 없습니다.\n' +
            '컬럼명이 "사업자등록번호" / "개업일" 인지 확인해주세요.',
        )
        return
      }
      setParsed(list)
    } catch (err) {
      setParseError(err instanceof Error ? err.message : '엑셀 파싱 실패')
    }
  }

  async function handleUpload() {
    if (parsed.length === 0) return
    setLoading(true)
    try {
      const res = await bulkUpdateOpeningDates(parsed)
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
            <CalendarPlus size={22} className="text-indigo-600" />
            개업일 일괄 업로드
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

        <div className="text-sm text-gray-600 mb-4 bg-blue-50 border border-blue-200 rounded p-3">
          <p className="mb-1 font-semibold">엑셀 컬럼 인식</p>
          <ul className="list-disc list-inside space-y-0.5">
            <li>사업자등록번호 (필수): <code>사업자등록번호</code> / <code>사업자번호</code></li>
            <li>개업일 (필수): <code>개업일</code> / <code>개업연월일</code> — YYYYMMDD 또는 YYYY-MM-DD</li>
            <li>임시 고객은 자동 제외</li>
          </ul>
        </div>

        <input
          type="file"
          accept=".xlsx,.xls"
          onChange={handleFileChange}
          className="block w-full text-sm text-gray-700 mb-3
            file:mr-4 file:py-2 file:px-4 file:rounded file:border-0
            file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700
            hover:file:bg-indigo-100"
        />

        {parseError && (
          <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded mb-3 whitespace-pre-line">
            {parseError}
          </p>
        )}

        {parsed.length > 0 && !result && (
          <div className="mb-4">
            <p className="text-sm font-semibold mb-2">
              인식된 항목 {parsed.length}건
            </p>
            <div className="max-h-60 overflow-y-auto border border-gray-200 rounded">
              <table className="w-full text-xs">
                <thead className="bg-gray-50 text-gray-600">
                  <tr>
                    <th className="px-2 py-1 text-left">사업자번호</th>
                    <th className="px-2 py-1 text-left">개업일</th>
                    <th className="px-2 py-1 text-left">상호</th>
                  </tr>
                </thead>
                <tbody>
                  {parsed.map((r, i) => (
                    <tr key={i} className="border-t border-gray-100">
                      <td className="px-2 py-1 font-mono">{r.business_number}</td>
                      <td className="px-2 py-1">{r.opening_date}</td>
                      <td className="px-2 py-1 text-gray-500">{r.raw_company ?? '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {result && (
          <div className="mb-4 p-3 bg-white border border-gray-200 rounded">
            <p className="text-green-700 font-semibold">
              ✅ {result.updated}건 업데이트 완료
            </p>
            {result.notFound.length > 0 && (
              <details className="mt-2">
                <summary className="cursor-pointer text-orange-600 text-sm">
                  ⚠️ 매칭 실패 {result.notFound.length}건 (펼치기)
                </summary>
                <ul className="mt-1 text-xs text-gray-600 space-y-0.5 max-h-40 overflow-y-auto">
                  {result.notFound.map((bn) => (
                    <li key={bn}>• {bn}</li>
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
              disabled={parsed.length === 0 || loading}
              className="flex items-center gap-1.5 px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700 disabled:opacity-50 text-sm font-medium"
            >
              <Upload size={15} />
              {loading ? '업로드 중...' : `${parsed.length}건 업로드`}
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

function pickField(row: Record<string, unknown>, names: string[]): unknown {
  for (const n of names) {
    if (row[n] != null && row[n] !== '') return row[n]
  }
  return null
}

/** 20231023 / 2023-10-23 / Date 객체 / 엑셀 시리얼 → YYYY-MM-DD */
function parseDate(value: unknown): string | null {
  if (value == null) return null

  if (value instanceof Date) {
    return formatDate(value)
  }

  if (typeof value === 'number') {
    // 엑셀 시리얼 날짜 (1900-01-01 base)
    const date = new Date(Date.UTC(1899, 11, 30) + value * 86400000)
    if (Number.isNaN(date.getTime())) return null
    return formatDate(date)
  }

  const str = String(value).trim()
  if (/^\d{8}$/.test(str)) {
    return `${str.slice(0, 4)}-${str.slice(4, 6)}-${str.slice(6, 8)}`
  }
  if (/^\d{4}-\d{2}-\d{2}$/.test(str)) return str
  if (/^\d{4}\.\d{1,2}\.\d{1,2}$/.test(str)) {
    const [y, m, d] = str.split('.')
    return `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`
  }
  if (/^\d{4}\/\d{1,2}\/\d{1,2}$/.test(str)) {
    const [y, m, d] = str.split('/')
    return `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`
  }
  return null
}

function formatDate(d: Date): string {
  const y = d.getUTCFullYear()
  const m = String(d.getUTCMonth() + 1).padStart(2, '0')
  const day = String(d.getUTCDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}
