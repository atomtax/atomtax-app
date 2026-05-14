'use client'

import {
  DndContext,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core'
import {
  SortableContext,
  arrayMove,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import {
  ChevronDown,
  ChevronUp,
  GripVertical,
  Plus,
  Sparkles,
  Trash2,
} from 'lucide-react'
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
  const sorted = [...sections].sort((a, b) => a.order - b.order)

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
  )

  function update(id: string, patch: Partial<ConclusionSection>) {
    onChange(sorted.map((s) => (s.id === id ? { ...s, ...patch } : s)))
  }

  function add() {
    const next: ConclusionSection = {
      id: uid(),
      header: '새 섹션',
      body: '',
      order: 0,
      is_visible: true,
      is_user_defined: true,
    }
    // 마무리 인사 (closing) 바로 앞에 삽입
    const closingIdx = sorted.findIndex(
      (s) => s.section_key === 'closing' || s.header.includes('마무리 인사'),
    )
    const inserted =
      closingIdx === -1
        ? [...sorted, next]
        : [...sorted.slice(0, closingIdx), next, ...sorted.slice(closingIdx)]
    inserted.forEach((s, idx) => {
      s.order = idx
    })
    onChange(inserted)
  }

  function remove(id: string) {
    if (!confirm('이 섹션을 삭제하시겠습니까?')) return
    const next = sorted
      .filter((s) => s.id !== id)
      .map((s, idx) => ({ ...s, order: idx }))
    onChange(next)
  }

  function move(id: string, delta: -1 | 1) {
    const idx = sorted.findIndex((s) => s.id === id)
    const newIdx = idx + delta
    if (idx < 0 || newIdx < 0 || newIdx >= sorted.length) return
    const moved = arrayMove(sorted, idx, newIdx).map((s, i) => ({
      ...s,
      order: i,
    }))
    onChange(moved)
  }

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event
    if (!over || active.id === over.id) return
    const oldIdx = sorted.findIndex((s) => s.id === active.id)
    const newIdx = sorted.findIndex((s) => s.id === over.id)
    if (oldIdx === -1 || newIdx === -1) return
    const reordered = arrayMove(sorted, oldIdx, newIdx).map((s, i) => ({
      ...s,
      order: i,
    }))
    onChange(reordered)
  }

  return (
    <section className="bg-white border border-gray-200 rounded-lg p-4 space-y-3">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">결론 / 의견</h3>
          <p className="text-xs text-gray-500 mt-0.5">
            드래그 핸들 또는 화살표로 순서 이동. 표시 해제 시 PDF 에서 제외.
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

      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <SortableContext
          items={sorted.map((s) => s.id)}
          strategy={verticalListSortingStrategy}
        >
          <div className="space-y-2">
            {sorted.map((section, idx) => (
              <SortableSectionCard
                key={section.id}
                section={section}
                isFirst={idx === 0}
                isLast={idx === sorted.length - 1}
                onUpdate={(patch) => update(section.id, patch)}
                onRemove={() => remove(section.id)}
                onMoveUp={() => move(section.id, -1)}
                onMoveDown={() => move(section.id, 1)}
              />
            ))}
          </div>
        </SortableContext>
      </DndContext>

      <button
        type="button"
        onClick={add}
        className="w-full py-2 border-2 border-dashed border-gray-300 rounded text-sm text-gray-500 hover:border-indigo-500 hover:text-indigo-600 transition-colors inline-flex items-center justify-center gap-1"
      >
        <Plus size={14} /> 섹션 추가 (마무리 인사 앞에 삽입됨)
      </button>
    </section>
  )
}

interface CardProps {
  section: ConclusionSection
  isFirst: boolean
  isLast: boolean
  onUpdate: (patch: Partial<ConclusionSection>) => void
  onRemove: () => void
  onMoveUp: () => void
  onMoveDown: () => void
}

function SortableSectionCard({
  section,
  isFirst,
  isLast,
  onUpdate,
  onRemove,
  onMoveUp,
  onMoveDown,
}: CardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: section.id })

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.6 : 1,
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`border rounded-lg p-3 ${
        section.is_visible
          ? 'bg-white border-gray-200'
          : 'bg-gray-50 border-gray-100 opacity-60'
      }`}
    >
      <div className="flex items-center gap-2 mb-2">
        <button
          type="button"
          {...attributes}
          {...listeners}
          className="cursor-grab active:cursor-grabbing p-1 text-gray-400 hover:text-gray-600"
          title="드래그하여 이동"
          aria-label="드래그 핸들"
        >
          <GripVertical size={16} />
        </button>
        <div className="flex flex-col">
          <button
            type="button"
            onClick={onMoveUp}
            disabled={isFirst}
            className="p-0.5 text-gray-500 hover:text-indigo-600 disabled:opacity-30 disabled:hover:text-gray-500"
            title="위로 이동"
          >
            <ChevronUp size={12} />
          </button>
          <button
            type="button"
            onClick={onMoveDown}
            disabled={isLast}
            className="p-0.5 text-gray-500 hover:text-indigo-600 disabled:opacity-30 disabled:hover:text-gray-500"
            title="아래로 이동"
          >
            <ChevronDown size={12} />
          </button>
        </div>
        <input
          type="text"
          value={section.header}
          onChange={(e) => onUpdate({ header: e.target.value })}
          className="flex-1 px-2 py-1 text-sm font-semibold border-b border-transparent hover:border-gray-200 focus:border-indigo-500 focus:outline-none bg-transparent text-indigo-700"
          placeholder="섹션 제목"
        />
        <label className="flex items-center gap-1 text-xs text-gray-600 cursor-pointer select-none whitespace-nowrap">
          <input
            type="checkbox"
            checked={section.is_visible}
            onChange={(e) => onUpdate({ is_visible: e.target.checked })}
            className="rounded"
          />
          표시
        </label>
        {section.is_user_defined && (
          <button
            type="button"
            onClick={onRemove}
            className="p-1 text-red-500 hover:bg-red-50 rounded"
            title="섹션 삭제"
          >
            <Trash2 size={14} />
          </button>
        )}
      </div>
      <textarea
        value={section.body}
        onChange={(e) => onUpdate({ body: e.target.value })}
        rows={Math.max(2, section.body.split('\n').length)}
        className="w-full px-2 py-1.5 border border-gray-200 rounded text-sm leading-relaxed focus:outline-none focus:border-indigo-500"
        placeholder="내용을 입력하세요. 엔터 = 줄바꿈."
      />
    </div>
  )
}
