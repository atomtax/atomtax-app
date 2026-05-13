'use client'

import { useRef, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Download, Loader2, Upload, X } from 'lucide-react'
import {
  bulkUploadTraderProperties,
  type BulkUploadResult,
} from '@/app/actions/trader-bulk-upload'

export function TraderBulkUpload() {
  const router = useRouter()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(false)
  const [result, setResult] = useState<BulkUploadResult | null>(null)
  const [, startTransition] = useTransition()

  async function handleDownload() {
    const { generateTraderTemplate } = await import(
      '@/lib/excel/trader-template'
    )
    const blob = generateTraderTemplate()
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = '매매사업자_업로드양식.xlsx'
    a.click()
    URL.revokeObjectURL(url)
  }

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    setUploading(true)
    try {
      const { parseTraderUploadExcel } = await import(
        '@/lib/excel/trader-upload-parser'
      )
      const parsed = await parseTraderUploadExcel(file)
      if (parsed.properties.length === 0) {
        alert(
          '"재고자산정리" 시트에서 유효한 행을 찾지 못했습니다. 사업자등록번호/물건명/취득일이 모두 있는지 확인하세요.',
        )
        return
      }
      const uploadResult = await bulkUploadTraderProperties({
        properties: parsed.properties,
        expenses: parsed.expenses,
      })
      setResult(uploadResult)
      if (uploadResult.registered > 0) {
        startTransition(() => router.refresh())
      }
    } catch (err) {
      console.error('[trader-bulk-upload]', err)
      alert(
        `업로드 실패: ${err instanceof Error ? err.message : String(err)}`,
      )
    } finally {
      setUploading(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  return (
    <>
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={handleDownload}
          className="px-3 py-1.5 border border-gray-200 rounded text-sm inline-flex items-center gap-1.5 text-gray-700 hover:bg-gray-50"
        >
          <Download size={14} /> 양식 다운로드
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept=".xlsx,.xls"
          onChange={handleFile}
          className="hidden"
        />
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
          className="px-3 py-1.5 bg-indigo-600 text-white rounded text-sm inline-flex items-center gap-1.5 hover:bg-indigo-700 disabled:opacity-50"
        >
          {uploading ? (
            <>
              <Loader2 size={14} className="animate-spin" /> 처리 중...
            </>
          ) : (
            <>
              <Upload size={14} /> 일괄 업로드
            </>
          )}
        </button>
      </div>

      {result && <UploadResultModal result={result} onClose={() => setResult(null)} />}
    </>
  )
}

function UploadResultModal({
  result,
  onClose,
}: {
  result: BulkUploadResult
  onClose: () => void
}) {
  return (
    <div
      className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-xl p-6 max-w-2xl w-full max-h-[85vh] overflow-y-auto shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold">📊 업로드 결과</h2>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-100 rounded"
            aria-label="닫기"
          >
            <X size={18} />
          </button>
        </div>

        <div className="space-y-3">
          <ResultBox
            tone="green"
            title="✅ 등록 완료"
            text={`${result.registered}건의 물건이 새로 등록되었습니다.`}
          />

          {result.skipped_duplicates > 0 && (
            <ResultBox
              tone="blue"
              title="⏭️ 중복 스킵"
              text={`${result.skipped_duplicates}건은 같은 거래처에 같은 취득일의 물건이 이미 있어 스킵되었습니다.`}
            />
          )}

          {result.non_trader_clients.length > 0 && (
            <ResultBox
              tone="amber"
              title={`⚠️ 매매사업자 아님 스킵 (${result.non_trader_clients.length}건)`}
              list={result.non_trader_clients}
              hint="업종코드가 703011/703012 가 아닌 거래처는 처리되지 않습니다."
            />
          )}

          {result.terminated_clients.length > 0 && (
            <ResultBox
              tone="amber"
              title={`⚠️ 해지 고객 스킵 (${result.terminated_clients.length}건)`}
              list={result.terminated_clients}
            />
          )}

          {result.unmatched_business_numbers.length > 0 && (
            <ResultBox
              tone="red"
              title={`❌ 매칭 안 된 사업자등록번호 (${result.unmatched_business_numbers.length}건)`}
              list={result.unmatched_business_numbers}
              hint="고객 관리 메뉴에서 해당 거래처를 먼저 등록 후 다시 업로드하세요."
            />
          )}

          {result.errors.length > 0 && (
            <ResultBox
              tone="red"
              title={`⚠️ 오류 (${result.errors.length}건)`}
              list={result.errors}
            />
          )}
        </div>

        <div className="mt-6 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700"
          >
            닫기
          </button>
        </div>
      </div>
    </div>
  )
}

type Tone = 'green' | 'blue' | 'amber' | 'red'

const TONE_STYLES: Record<Tone, { box: string; title: string; body: string }> = {
  green: {
    box: 'bg-green-50 border-green-200',
    title: 'text-green-800',
    body: 'text-green-700',
  },
  blue: {
    box: 'bg-blue-50 border-blue-200',
    title: 'text-blue-800',
    body: 'text-blue-700',
  },
  amber: {
    box: 'bg-amber-50 border-amber-200',
    title: 'text-amber-800',
    body: 'text-amber-700',
  },
  red: {
    box: 'bg-red-50 border-red-200',
    title: 'text-red-800',
    body: 'text-red-700',
  },
}

function ResultBox({
  tone,
  title,
  text,
  list,
  hint,
}: {
  tone: Tone
  title: string
  text?: string
  list?: string[]
  hint?: string
}) {
  const s = TONE_STYLES[tone]
  return (
    <div className={`border rounded-lg p-3 ${s.box}`}>
      <div className={`font-semibold text-sm ${s.title}`}>{title}</div>
      {text && <div className={`mt-1 text-sm ${s.body}`}>{text}</div>}
      {list && list.length > 0 && (
        <ul className={`mt-1 text-xs max-h-32 overflow-y-auto ${s.body}`}>
          {list.map((item, i) => (
            <li key={i}>• {item}</li>
          ))}
        </ul>
      )}
      {hint && (
        <p className={`mt-2 text-xs italic ${s.body}`}>💡 {hint}</p>
      )}
    </div>
  )
}
