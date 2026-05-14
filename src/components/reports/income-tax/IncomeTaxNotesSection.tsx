'use client'

import {
  generateConclusionSections,
} from '@/lib/utils/conclusion-sections'
import type {
  ConclusionSection,
  IncomeStatementSummary,
  IncomeTaxReport,
} from '@/types/database'
import { ConclusionSectionsInput } from './ConclusionSectionsInput'

interface Props {
  data: IncomeTaxReport
  summary: IncomeStatementSummary | null
  isSincerefiling: boolean
  additionalNotes: string
  conclusionSections: ConclusionSection[]
  onSincereChange: (v: boolean) => void
  onAdditionalChange: (v: string) => void
  onConclusionSectionsChange: (sections: ConclusionSection[]) => void
}

export function IncomeTaxNotesSection({
  data,
  summary,
  isSincerefiling,
  additionalNotes,
  conclusionSections,
  onSincereChange,
  onAdditionalChange,
  onConclusionSectionsChange,
}: Props) {
  function handleAutoGenerate() {
    const hasContent = conclusionSections.some((s) => s.body.trim())
    if (hasContent) {
      const confirmed = confirm(
        '기존 결론 본문이 덮어쓰여집니다. 사용자 추가 섹션은 유지됩니다. 계속하시겠습니까?',
      )
      if (!confirmed) return
    }
    const generated = generateConclusionSections(data, summary, conclusionSections)
    onConclusionSectionsChange(generated)
  }

  return (
    <section className="space-y-5">
      <div className="bg-white border border-gray-200 rounded-lg p-6 space-y-5">
        <h3 className="text-lg font-bold text-gray-900">메모</h3>

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
          <label className="block text-sm font-medium text-gray-700 mb-1">
            추가 메모
          </label>
          <textarea
            value={additionalNotes}
            onChange={(e) => onAdditionalChange(e.target.value)}
            rows={3}
            placeholder="특이사항, 참고 내용 등..."
            className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:border-indigo-500 resize-none"
          />
        </div>
      </div>

      <ConclusionSectionsInput
        sections={conclusionSections}
        onChange={onConclusionSectionsChange}
        onAutoGenerate={handleAutoGenerate}
      />
    </section>
  )
}
