'use client'

import { Plus, Sparkles, Trash2 } from 'lucide-react'
import type { ConclusionSection } from '@/types/database'

function uid(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID()
  }
  return `s-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
}

interface Props {
  sections: ConclusionSection[]
  onChange: (sections: ConclusionSection[]) => void
  onAutoGenerate: () => void
}

export function ConclusionSectionsInput({
  sections,
  onChange,
  onAutoGenerate,
}: Props) {
  function update(id: string, patch: Partial<ConclusionSection>) {
    onChange(sections.map((s) => (s.id === id ? { ...s, ...patch } : s)))
  }

  function add() {
    const next: ConclusionSection = {
      id: uid(),
      header: '새 섹션',
      body: '',
      order: sections.length,
      is_visible: true,
      is_user_defined: true,
    }
    onChange([...sections, next])
  }

  function remove(id: string) {
    if (!confirm('이 섹션을 삭제하시겠습니까?')) return
    const next = sections
      .filter((s) => s.id !== id)
      .map((s, idx) => ({ ...s, order: idx }))
    onChange(next)
  }

  const sorted = [...sections].sort((a, b) => a.order - b.order)

  return (
    <section className="bg-white border border-gray-200 rounded-lg p-4 space-y-3">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">결론 / 의견</h3>
          <p className="text-xs text-gray-500 mt-0.5">
            섹션별로 카드를 편집하세요. 표시 체크 해제 시 PDF 에서 제외됩니다.
            본문 줄바꿈은 그대로 출력됩니다.
          </p>
        </div>
        <button
          type="button"
          onClick={onAutoGenerate}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 text-white text-sm rounded hover:bg-indigo-700"
        >
          <Sparkles size={14} /> 자동 생성
        </button>
      </div>

      <div className="space-y-2">
        {sorted.map((section) => (
          <div
            key={section.id}
            className={`border rounded-lg p-3 ${
              section.is_visible
                ? 'bg-white border-gray-200'
                : 'bg-gray-50 border-gray-100 opacity-60'
            }`}
          >
            <div className="flex items-center gap-2 mb-2">
              <input
                type="text"
                value={section.header}
                onChange={(e) => update(section.id, { header: e.target.value })}
                className="flex-1 px-2 py-1 text-sm font-semibold border-b border-transparent hover:border-gray-200 focus:border-indigo-500 focus:outline-none bg-transparent text-indigo-700"
                placeholder="섹션 제목"
              />
              <label className="flex items-center gap-1 text-xs text-gray-600 cursor-pointer select-none whitespace-nowrap">
                <input
                  type="checkbox"
                  checked={section.is_visible}
                  onChange={(e) =>
                    update(section.id, { is_visible: e.target.checked })
                  }
                  className="rounded"
                />
                표시
              </label>
              {section.is_user_defined && (
                <button
                  type="button"
                  onClick={() => remove(section.id)}
                  className="p-1 text-red-500 hover:bg-red-50 rounded"
                  title="섹션 삭제"
                >
                  <Trash2 size={14} />
                </button>
              )}
            </div>
            <textarea
              value={section.body}
              onChange={(e) => update(section.id, { body: e.target.value })}
              rows={Math.max(2, section.body.split('\n').length)}
              className="w-full px-2 py-1.5 border border-gray-200 rounded text-sm leading-relaxed focus:outline-none focus:border-indigo-500"
              placeholder="내용을 입력하세요. 엔터 = 줄바꿈."
            />
          </div>
        ))}
      </div>

      <button
        type="button"
        onClick={add}
        className="w-full py-2 border-2 border-dashed border-gray-300 rounded text-sm text-gray-500 hover:border-indigo-500 hover:text-indigo-600 transition-colors inline-flex items-center justify-center gap-1"
      >
        <Plus size={14} /> 섹션 추가
      </button>
    </section>
  )
}
