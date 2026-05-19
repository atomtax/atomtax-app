'use client'

import { useState, useRef } from 'react'
import { FileSpreadsheet, RefreshCw } from 'lucide-react'
import { parseIncomeStatement, IncomeStatementParseError } from '@/lib/calculators/income-statement-parser'
import type { IncomeStatementSummary } from '@/types/database'

interface Props {
  currentFilename: string
  onParsed: (data: {
    filename: string
    period_label: string
    summary: IncomeStatementSummary
  }) => void
}

export function IncomeStatementUpload({ currentFilename, onParsed }: Props) {
  const [file, setFile] = useState<File | null>(null)
  const [isParsing, setIsParsing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0] ?? null
    setFile(f)
    setError(null)
  }

  async function handleParse() {
    if (!file) {
      setError('파일을 먼저 선택해주세요.')
      return
    }

    setIsParsing(true)
    setError(null)

    try {
      const buffer = await file.arrayBuffer()
      const result = parseIncomeStatement(buffer)
      onParsed({
        filename: file.name,
        period_label: result.period_label,
        summary: result.summary,
      })
    } catch (e) {
      setError(
        e instanceof IncomeStatementParseError
          ? e.message
          : '엑셀 파싱 중 오류가 발생했습니다.'
      )
    } finally {
      setIsParsing(false)
    }
  }

  return (
    <section className="bg-blue-50 border-2 border-blue-300 rounded-lg p-6">
      <div className="flex items-center gap-2 mb-4">
        <FileSpreadsheet size={20} className="text-blue-600" />
        <h3 className="font-bold text-blue-900">재무제표 업로드</h3>
      </div>

      <div className="space-y-3">
        <label className="block text-sm font-medium text-gray-700">손익계산서</label>

        <div className="flex items-center gap-2">
          <input
            ref={fileInputRef}
            type="file"
            accept=".xlsx,.xls"
            onChange={handleFileChange}
            className="hidden"
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="px-4 py-2 text-sm bg-white border border-gray-300 rounded-md hover:bg-gray-50"
          >
            파일 선택
          </button>
          <span className="text-sm text-gray-600 flex-1 truncate">
            {file?.name ?? (currentFilename || '선택된 파일 없음')}
          </span>
        </div>

        <p className="text-xs text-gray-500">위하고에서 다운받은 손익계산서 엑셀 (.xlsx, .xls)</p>

        <button
          type="button"
          onClick={handleParse}
          disabled={!file || isParsing}
          className="flex items-center gap-1.5 px-4 py-2 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
        >
          <RefreshCw size={15} className={isParsing ? 'animate-spin' : ''} />
          {isParsing ? '불러오는 중...' : '데이터 불러오기'}
        </button>

        {error && (
          <p className="text-sm text-red-700 bg-red-50 border border-red-200 rounded px-3 py-2">
            ⚠️ {error}
          </p>
        )}
      </div>
    </section>
  )
}
