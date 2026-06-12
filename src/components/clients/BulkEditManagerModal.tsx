'use client'

import { useEffect, useRef, useState } from 'react'
import Modal from '@/components/ui/Modal'
import Button from '@/components/ui/Button'

interface Props {
  isOpen: boolean
  onClose: () => void
  /** 선택된 고객 수. 0이면 모달이 열리지 않아야 함. */
  count: number
  /** 기존 담당자 distinct 목록 — 콤보 옵션. PR #116과 동일 소스. */
  managers: string[]
  /** 선택된 고객 전원에게 적용할 새 담당자 값. 빈 문자열이면 null로 저장(담당자 해제). */
  onApply: (manager: string | null) => Promise<void>
}

/**
 * 담당자 일괄수정 모달 (PR #131).
 * - input list + datalist 콤보박스로 드롭다운 + 직접 입력 둘 다 지원.
 * - 신규 직원 이름도 입력 가능. 빈 값으로 [적용] 시 담당자 해제(NULL) 모드 가능.
 */
export default function BulkEditManagerModal({
  isOpen,
  onClose,
  count,
  managers,
  onApply,
}: Props) {
  const [value, setValue] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (isOpen) {
      setValue('')
      setSubmitting(false)
      // 모달 열릴 때 자동 포커스
      requestAnimationFrame(() => inputRef.current?.focus())
    }
  }, [isOpen])

  const handleApply = async () => {
    const trimmed = value.trim()
    const newManager: string | null = trimmed === '' ? null : trimmed
    const label = newManager ?? '(담당자 없음)'
    if (!confirm(`${count}명의 담당자를 '${label}'(으)로 변경하시겠습니까?`)) return

    setSubmitting(true)
    try {
      await onApply(newManager)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="담당자 일괄수정" size="sm">
      <div className="space-y-4">
        <p className="text-sm text-gray-700">
          선택한 <strong className="text-indigo-700">{count}명</strong>의 담당자를
          변경합니다.
        </p>

        <div>
          <label htmlFor="bulk-manager-input" className="block text-sm font-medium text-gray-700 mb-1">
            담당자
          </label>
          <input
            id="bulk-manager-input"
            ref={inputRef}
            type="text"
            list="bulk-manager-options"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder="담당자 선택 또는 직접 입력 (빈 값 = 담당자 해제)"
            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:border-indigo-500"
            disabled={submitting}
          />
          <datalist id="bulk-manager-options">
            {managers.map((m) => (
              <option key={m} value={m} />
            ))}
          </datalist>
          <p className="mt-1 text-xs text-gray-500">
            기존 담당자 {managers.length}명 중 선택하거나, 신규 이름을 직접 입력하세요.
          </p>
        </div>

        <div className="flex justify-end gap-2 pt-2">
          <Button variant="secondary" onClick={onClose} disabled={submitting}>
            취소
          </Button>
          <Button onClick={handleApply} disabled={submitting}>
            {submitting ? '저장 중…' : '적용'}
          </Button>
        </div>
      </div>
    </Modal>
  )
}
