'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { collectWehagoAction } from './actions'
import type { IngestResult } from '@/lib/wehago/ingest'

type Feedback = {
  kind: 'success' | 'info' | 'warning' | 'error'
  text: string
}

const KIND_STYLE: Record<Feedback['kind'], string> = {
  success: 'bg-green-50 border-green-300 text-green-800',
  info: 'bg-gray-50 border-gray-300 text-gray-700',
  warning: 'bg-amber-50 border-amber-300 text-amber-800',
  error: 'bg-red-50 border-red-300 text-red-800',
}

const KIND_ICON: Record<Feedback['kind'], string> = {
  success: '✅',
  info: 'ℹ️',
  warning: '⚠️',
  error: '❌',
}

function toFeedback(r: IngestResult): Feedback {
  if (!r.ok) return { kind: 'error', text: r.error ?? '저장 실패' }

  // 회사정보 갱신 — 매칭 결과를 함께 안내
  if (r.result === '회사정보 갱신') {
    const name = r.companyName ? `${r.companyName} ` : ''
    if (r.matchedClientName) {
      return {
        kind: 'success',
        text: `회사정보 갱신: ${name}→ 거래처 "${r.matchedClientName}" 자동 매칭`,
      }
    }
    return {
      kind: 'warning',
      text: `회사정보 갱신: ${name}— ${r.warning ?? '거래처 미매칭'}`,
    }
  }

  if (r.result === '변경 없음') {
    return { kind: 'info', text: '변경 없음 — 동일 데이터가 이미 저장되어 있습니다' }
  }
  return { kind: 'success', text: '신규 저장 완료' }
}

export default function WehagoCollectForm() {
  const router = useRouter()
  const [url, setUrl] = useState('')
  const [jsonText, setJsonText] = useState('')
  const [feedback, setFeedback] = useState<Feedback | null>(null)
  const [isPending, startTransition] = useTransition()

  const handleSubmit = () => {
    if (!url.trim() || !jsonText.trim()) {
      setFeedback({ kind: 'error', text: 'Request URL과 Response JSON을 모두 입력해 주세요' })
      return
    }
    startTransition(async () => {
      const result = await collectWehagoAction({ url, jsonText })
      const fb = toFeedback(result)
      setFeedback(fb)
      if (result.ok && result.result !== '변경 없음') {
        // 입력칸 비우고 목록 갱신 (성공 시 1회)
        setUrl('')
        setJsonText('')
        router.refresh()
      }
    })
  }

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-5">
      <h2 className="text-base font-bold text-gray-900 mb-1">데이터 붙여넣기</h2>
      <p className="text-xs text-gray-500 leading-relaxed mb-4">
        위하고 화면에서 <span className="font-semibold">F12 → Network</span> → 해당 요청의{' '}
        <span className="font-semibold">Request URL</span>과{' '}
        <span className="font-semibold">Response</span>를 복사해 붙여넣으세요. 수임처
        기본정보(sabc0102)를 먼저 등록하면 거래처가 자동 매칭됩니다.
      </p>

      <label className="block text-xs font-semibold text-gray-600 mb-1">Request URL</label>
      <input
        type="text"
        value={url}
        onChange={(e) => setUrl(e.target.value)}
        placeholder="https://api.wehago.com/smarta/..."
        className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg font-mono focus:outline-none focus:ring-2 focus:ring-brand/40 mb-3"
      />

      <label className="block text-xs font-semibold text-gray-600 mb-1">Response JSON</label>
      <textarea
        value={jsonText}
        onChange={(e) => setJsonText(e.target.value)}
        placeholder="[ { ... } ]"
        rows={6}
        className="w-full px-3 py-2 text-xs border border-gray-300 rounded-lg font-mono focus:outline-none focus:ring-2 focus:ring-brand/40 resize-y"
      />

      <div className="flex items-center gap-3 mt-3">
        <button
          onClick={handleSubmit}
          disabled={isPending}
          className="px-5 py-2 bg-brand text-white text-sm font-bold rounded-lg hover:bg-brand-dark transition-colors disabled:opacity-50"
        >
          {isPending ? '저장 중…' : '저장'}
        </button>
        {feedback && (
          <div
            className={`flex-1 px-3 py-2 text-sm border rounded-lg ${KIND_STYLE[feedback.kind]}`}
          >
            {KIND_ICON[feedback.kind]} {feedback.text}
          </div>
        )}
      </div>
    </div>
  )
}
