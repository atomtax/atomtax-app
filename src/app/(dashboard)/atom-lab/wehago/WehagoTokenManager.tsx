'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Copy, Check, KeyRound } from 'lucide-react'
import {
  issueWehagoTokenAction,
  deactivateWehagoTokenAction,
} from './token-actions'
import type { WehagoTokenView } from '@/lib/db/wehago-tokens'

function formatDateTime(iso: string | null): string {
  if (!iso) return '—'
  return new Date(iso).toLocaleString('ko-KR', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export default function WehagoTokenManager({
  tokens,
}: {
  tokens: WehagoTokenView[]
}) {
  const router = useRouter()
  const [label, setLabel] = useState('')
  const [issued, setIssued] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  const handleIssue = () => {
    setError(null)
    startTransition(async () => {
      const r = await issueWehagoTokenAction(label)
      if (r.ok && r.token) {
        setIssued(r.token)
        setCopied(false)
        setLabel('')
        router.refresh()
      } else {
        setError(r.error ?? '발급 실패')
      }
    })
  }

  const handleCopy = async () => {
    if (!issued) return
    await navigator.clipboard.writeText(issued)
    setCopied(true)
  }

  const handleDeactivate = (id: string) => {
    startTransition(async () => {
      await deactivateWehagoTokenAction(id)
      router.refresh()
    })
  }

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-5">
      <div className="flex items-center gap-2 mb-1">
        <KeyRound size={18} className="text-brand" />
        <h2 className="text-base font-bold text-gray-900">수집 토큰 관리</h2>
      </div>
      <p className="text-xs text-gray-500 mb-4">
        직원 PC의 크롬 확장에 입력할 토큰입니다. 직원마다 별도 발급하면 출처 추적과
        개별 폐기가 가능합니다.
      </p>

      {/* 발급 폼 */}
      <div className="flex flex-wrap items-center gap-2 mb-2">
        <input
          type="text"
          value={label}
          onChange={(e) => setLabel(e.target.value)}
          placeholder="라벨 (예: 김이영-사무실PC)"
          className="flex-1 min-w-[200px] px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand/40"
        />
        <button
          onClick={handleIssue}
          disabled={isPending}
          className="px-4 py-2 bg-brand text-white text-sm font-bold rounded-lg hover:bg-brand-dark transition-colors disabled:opacity-50"
        >
          토큰 발급
        </button>
      </div>
      {error && <p className="text-sm text-red-600 mb-2">❌ {error}</p>}

      {/* 발급된 토큰 1회 노출 */}
      {issued && (
        <div className="bg-amber-50 border border-amber-300 rounded-lg p-4 mb-4">
          <div className="text-xs font-bold text-amber-800 mb-2">
            ⚠️ 이 토큰은 다시 볼 수 없습니다. 직원 확장에 입력 후 이 창을 닫으세요.
          </div>
          <div className="flex items-center gap-2">
            <code className="flex-1 px-3 py-2 bg-white border border-amber-200 rounded font-mono text-sm break-all">
              {issued}
            </code>
            <button
              onClick={handleCopy}
              className="shrink-0 flex items-center gap-1 px-3 py-2 bg-amber-600 text-white text-sm font-semibold rounded-lg hover:bg-amber-700 transition-colors"
            >
              {copied ? <Check size={14} /> : <Copy size={14} />}
              {copied ? '복사됨' : '복사'}
            </button>
          </div>
        </div>
      )}

      {/* 토큰 목록 */}
      {tokens.length === 0 ? (
        <p className="text-sm text-gray-400 py-4 text-center">
          발급된 토큰이 없습니다.
        </p>
      ) : (
        <table className="w-full text-sm">
          <thead>
            <tr className="text-xs text-gray-500 border-b border-gray-200">
              <th className="text-left font-semibold py-2">라벨</th>
              <th className="text-center font-semibold py-2">상태</th>
              <th className="text-left font-semibold py-2">마지막 사용</th>
              <th className="text-right font-semibold py-2"></th>
            </tr>
          </thead>
          <tbody>
            {tokens.map((t) => (
              <tr key={t.id} className="border-b border-gray-50">
                <td className="py-2 font-medium text-gray-800">{t.label}</td>
                <td className="py-2 text-center">
                  {t.is_active ? (
                    <span className="px-2 py-0.5 rounded-full bg-green-50 text-green-700 text-xs font-bold">
                      활성
                    </span>
                  ) : (
                    <span className="px-2 py-0.5 rounded-full bg-gray-100 text-gray-500 text-xs font-bold">
                      비활성
                    </span>
                  )}
                </td>
                <td className="py-2 text-gray-600 tabular-nums text-xs">
                  {formatDateTime(t.last_used_at)}
                </td>
                <td className="py-2 text-right">
                  {t.is_active && (
                    <button
                      onClick={() => handleDeactivate(t.id)}
                      disabled={isPending}
                      className="px-2.5 py-1 text-xs font-semibold text-red-600 border border-red-200 rounded-lg hover:bg-red-50 transition-colors disabled:opacity-50"
                    >
                      비활성화
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  )
}
