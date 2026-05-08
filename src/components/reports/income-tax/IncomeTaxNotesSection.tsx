'use client'

import { Sparkles } from 'lucide-react'
import { generateIncomeTaxConclusion } from '@/lib/utils/income-tax-conclusion-generator'
import type { IncomeTaxReport, IncomeStatementSummary } from '@/types/database'

interface Props {
  data: IncomeTaxReport
  summary: IncomeStatementSummary | null
  isSincerefiling: boolean
  additionalNotes: string
  conclusionNotes: string
  onSincereChange: (v: boolean) => void
  onAdditionalChange: (v: string) => void
  onConclusionChange: (v: string) => void
}

export function IncomeTaxNotesSection({
  data,
  summary,
  isSincerefiling,
  additionalNotes,
  conclusionNotes,
  onSincereChange,
  onAdditionalChange,
  onConclusionChange,
}: Props) {
  function handleAutoGenerate() {
    if (conclusionNotes && conclusionNotes.trim() !== '') {
      const confirmed = confirm('기존에 입력된 결론/의견이 덮어쓰기됩니다. 계속하시겠습니까?')
      if (!confirmed) return
    }
    const generated = generateIncomeTaxConclusion(data, summary)
    onConclusionChange(generated)
  }

  return (
    <section className="bg-white border border-gray-200 rounded-lg p-6 space-y-5">
      <h3 className="text-lg font-bold text-gray-900">메모 / 의견</h3>

      <label className="flex items-center gap-2 cursor-pointer">
        <input
          type="checkbox"
          checked={isSincerefiling}
          onChange={(e) => onSincereChange(e.target.checked)}
          className="w-4 h-4 accent-indigo-600"
        />
        <span className="text-sm text-gray-700">성실신고 확인 대상</span>
      </label>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">추가 메모</label>
        <textarea
          value={additionalNotes}
          onChange={(e) => onAdditionalChange(e.target.value)}
          rows={3}
          placeholder="특이사항, 참고 내용 등..."
          className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:border-indigo-500 resize-none"
        />
      </div>

      <div>
        <div className="flex items-center justify-between mb-1">
          <label className="text-sm font-medium text-gray-700">결론 / 의견</label>
          <button
            type="button"
            onClick={handleAutoGenerate}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-700 text-white rounded text-xs font-medium hover:bg-blue-800"
          >
            <Sparkles size={13} />
            자동 생성
          </button>
        </div>
        <textarea
          value={conclusionNotes}
          onChange={(e) => onConclusionChange(e.target.value)}
          rows={12}
          placeholder={`자동 생성 버튼을 눌러 결론을 작성하거나 직접 입력하세요.\n\n## 섹션 제목\n섹션 본문... (최대 4개 카드)`}
          className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm font-mono focus:outline-none focus:border-indigo-500 resize-y"
        />
      </div>
    </section>
  )
}
