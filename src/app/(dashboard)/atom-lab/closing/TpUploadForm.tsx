'use client'

import { useRef, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { uploadTpSalesAction } from './actions'

export interface ClientOption {
  id: string
  company_name: string
  business_number: string | null
}

export default function TpUploadForm({ clients }: { clients: ClientOption[] }) {
  const router = useRouter()
  const formRef = useRef<HTMLFormElement>(null)
  const [feedback, setFeedback] = useState<
    { kind: 'ok' | 'error'; text: string } | null
  >(null)
  const [isPending, startTransition] = useTransition()

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setFeedback(null)
    const formData = new FormData(e.currentTarget)
    startTransition(async () => {
      const r = await uploadTpSalesAction(formData)
      if (r.ok) {
        setFeedback({
          kind: 'ok',
          text: `${r.companyName ?? ''} 신고매출 ${(r.salesTotal ?? 0).toLocaleString('ko-KR')}원 저장`,
        })
        formRef.current?.reset()
        router.refresh()
      } else {
        setFeedback({ kind: 'error', text: r.error ?? '업로드 실패' })
      }
    })
  }

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-5">
      <h2 className="text-base font-bold text-gray-900 mb-1">TP 매출 합계표 업로드</h2>
      <p className="text-xs text-gray-500 leading-relaxed mb-4">
        홈택스에서 받은 부가세 합계표(.xlsx)를 거래처를 선택해 업로드하면 신고매출이
        집계됩니다. (파일에 사업자번호가 없어 거래처 선택이 필요합니다)
      </p>

      <form ref={formRef} onSubmit={handleSubmit} className="space-y-3">
        <div>
          <label className="block text-xs font-semibold text-gray-600 mb-1">거래처</label>
          <select
            name="clientId"
            required
            defaultValue=""
            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand/40"
          >
            <option value="" disabled>
              거래처 선택…
            </option>
            {clients.map((c) => (
              <option key={c.id} value={c.id}>
                {c.company_name}
                {c.business_number ? ` (${c.business_number})` : ''}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-xs font-semibold text-gray-600 mb-1">엑셀 파일</label>
          <input
            type="file"
            name="file"
            accept=".xlsx,.xls"
            required
            className="w-full text-sm file:mr-3 file:px-3 file:py-1.5 file:rounded-lg file:border-0 file:bg-brand file:text-white file:font-semibold file:cursor-pointer"
          />
        </div>

        <div className="flex items-center gap-3">
          <button
            type="submit"
            disabled={isPending}
            className="px-5 py-2 bg-brand text-white text-sm font-bold rounded-lg hover:bg-brand-dark transition-colors disabled:opacity-50"
          >
            {isPending ? '업로드 중…' : '업로드'}
          </button>
          {feedback && (
            <div
              className={`flex-1 px-3 py-2 text-sm border rounded-lg ${
                feedback.kind === 'ok'
                  ? 'border-green-300 bg-green-50 text-green-800'
                  : 'border-red-300 bg-red-50 text-red-800'
              }`}
            >
              {feedback.kind === 'ok' ? '✅' : '❌'} {feedback.text}
            </div>
          )}
        </div>
      </form>
    </div>
  )
}
