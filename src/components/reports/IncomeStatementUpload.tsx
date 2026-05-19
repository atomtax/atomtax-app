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

interface DebugInfo {
  /** 파서 호출 시점 (사용자에게 "정말 호출됐다" 시각화) */
  parsedAt: string
  operating_income: number
  pretax_income: number
  net_income: number
  /** 손실 라벨 감지된 키들 */
  lossDetected: string[]
}

export function IncomeStatementUpload({ currentFilename, onParsed }: Props) {
  const [file, setFile] = useState<File | null>(null)
  const [isParsing, setIsParsing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [debug, setDebug] = useState<DebugInfo | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0] ?? null
    setFile(f)
    setError(null)
  }

  async function handleParse() {
    console.log('[IncomeStatementUpload] handleParse clicked', {
      file: file?.name,
      size: file?.size,
    })
    if (!file) {
      setError('파일을 먼저 선택해주세요.')
      return
    }

    setIsParsing(true)
    setError(null)

    try {
      const buffer = await file.arrayBuffer()
      console.log('[IncomeStatementUpload] buffer ready, calling parser')
      const result = parseIncomeStatement(buffer)
      console.log('[IncomeStatementUpload] parser returned', {
        period_label: result.period_label,
        operating_income: result.summary.operating_income,
        pretax_income: result.summary.pretax_income,
        net_income: result.summary.net_income,
      })
      // 화면에 직접 표시되는 디버그 정보 (PR #105 — 콘솔 의존성 제거)
      const lossDetected: string[] = []
      if (result.summary.operating_income < 0) lossDetected.push('영업손실')
      if (result.summary.pretax_income < 0) lossDetected.push('차감전손실')
      if (result.summary.net_income < 0) lossDetected.push('당기순손실')
      setDebug({
        parsedAt: new Date().toLocaleTimeString('ko-KR'),
        operating_income: result.summary.operating_income,
        pretax_income: result.summary.pretax_income,
        net_income: result.summary.net_income,
        lossDetected,
      })
      onParsed({
        filename: file.name,
        period_label: result.period_label,
        summary: result.summary,
      })
    } catch (e) {
      console.error('[IncomeStatementUpload] parse error', e)
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

        {debug && (
          <div className="text-xs bg-yellow-50 border-2 border-yellow-400 rounded px-3 py-2 space-y-1">
            <div className="font-bold text-yellow-900">
              🔍 디버그 정보 (파서 결과) · 호출 시각: {debug.parsedAt}
            </div>
            <div className="grid grid-cols-3 gap-2 font-mono">
              <div>
                Ⅴ 영업이익/손실:{' '}
                <span
                  className={
                    debug.operating_income < 0
                      ? 'font-bold text-red-700'
                      : 'text-gray-800'
                  }
                >
                  {debug.operating_income.toLocaleString('ko-KR')}
                </span>
              </div>
              <div>
                Ⅷ 차감전 이익/손실:{' '}
                <span
                  className={
                    debug.pretax_income < 0
                      ? 'font-bold text-red-700'
                      : 'text-gray-800'
                  }
                >
                  {debug.pretax_income.toLocaleString('ko-KR')}
                </span>
              </div>
              <div>
                Ⅹ 당기순이익/손실:{' '}
                <span
                  className={
                    debug.net_income < 0 ? 'font-bold text-red-700' : 'text-gray-800'
                  }
                >
                  {debug.net_income.toLocaleString('ko-KR')}
                </span>
              </div>
            </div>
            <div className="text-yellow-800">
              {debug.lossDetected.length > 0
                ? `✅ 손실 감지: ${debug.lossDetected.join(', ')}`
                : '⚠️ 손실 감지 안 됨 — 파서가 "손실" 라벨을 못 잡았거나 모두 이익 케이스. 위 숫자가 양수인데 실제로 손실 케이스라면, 엑셀 파일을 그대로 공유 부탁드립니다.'}
            </div>
          </div>
        )}
      </div>
    </section>
  )
}
