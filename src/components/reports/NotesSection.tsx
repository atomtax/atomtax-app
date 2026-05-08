interface Props {
  isSincerefiling: boolean
  additionalNotes: string
  conclusionNotes: string
  onSincereChange: (v: boolean) => void
  onAdditionalChange: (v: string) => void
  onConclusionChange: (v: string) => void
}

export function NotesSection({
  isSincerefiling,
  additionalNotes,
  conclusionNotes,
  onSincereChange,
  onAdditionalChange,
  onConclusionChange,
}: Props) {
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
        <label className="block text-sm font-medium text-gray-700 mb-1">결론 / 의견</label>
        <textarea
          value={conclusionNotes}
          onChange={(e) => onConclusionChange(e.target.value)}
          rows={3}
          placeholder={`## 제목\n본문 내용...\n\n## 다른 제목\n내용... (최대 4개 카드)`}
          className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:border-indigo-500 resize-none"
        />
      </div>
    </section>
  )
}
