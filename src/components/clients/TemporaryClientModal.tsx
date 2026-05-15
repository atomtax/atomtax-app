'use client'

import { useEffect, useState, type FormEvent } from 'react'
import { useRouter } from 'next/navigation'
import { addTemporaryClient, getManagerList } from '@/lib/db/clients'

interface Props {
  onClose: () => void
  /** 추가 후 자동 이동할 URL 빌더. 미지정 시 router.refresh() 만 수행 */
  buildRedirectUrl?: (client: { id: string; company_name: string }) => string
}

export function TemporaryClientModal({ onClose, buildRedirectUrl }: Props) {
  const router = useRouter()
  const [companyName, setCompanyName] = useState('')
  const [businessNumber, setBusinessNumber] = useState('')
  const [businessType, setBusinessType] = useState<'개인' | '법인'>('개인')
  const [manager, setManager] = useState('')
  const [managerList, setManagerList] = useState<string[]>([])
  const [managerMode, setManagerMode] = useState<'select' | 'direct'>('select')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    let alive = true
    getManagerList().then((list) => {
      if (alive) setManagerList(list)
    })
    return () => {
      alive = false
    }
  }, [])

  function handleManagerSelect(value: string) {
    if (value === '__direct__') {
      setManagerMode('direct')
      setManager('')
    } else {
      setManagerMode('select')
      setManager(value)
    }
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!companyName.trim()) {
      alert('회사명은 필수입니다.')
      return
    }
    setSaving(true)
    try {
      const result = await addTemporaryClient({
        company_name: companyName.trim(),
        business_number: businessNumber.trim() || undefined,
        business_type_category: businessType,
        manager: manager.trim() || undefined,
      })
      if (buildRedirectUrl) {
        router.push(buildRedirectUrl(result))
      } else {
        router.refresh()
      }
      onClose()
    } catch (error) {
      alert(error instanceof Error ? error.message : '추가 실패')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-lg p-6 w-full max-w-md mx-4 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-xl font-bold mb-1">일회성 고객 추가</h2>
        <p className="text-sm text-gray-500 mb-4">
          정식 고객 목록에는 표시되지 않습니다. 보고서 작성용으로만 사용됩니다.
        </p>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="block text-sm font-medium mb-1">
              회사명/대표자명 <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:border-indigo-500"
              required
              autoFocus
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">사업자등록번호</label>
            <input
              type="text"
              value={businessNumber}
              onChange={(e) => setBusinessNumber(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:border-indigo-500"
              placeholder="000-00-00000"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">사업자 구분</label>
            <select
              value={businessType}
              onChange={(e) => setBusinessType(e.target.value as '개인' | '법인')}
              className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:border-indigo-500"
            >
              <option value="개인">개인</option>
              <option value="법인">법인</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">담당자</label>
            {managerMode === 'select' ? (
              <select
                value={manager}
                onChange={(e) => handleManagerSelect(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:border-indigo-500"
              >
                <option value="">담당자 선택</option>
                {managerList.map((m) => (
                  <option key={m} value={m}>
                    {m}
                  </option>
                ))}
                <option value="__direct__">+ 직접 입력...</option>
              </select>
            ) : (
              <div className="flex gap-2">
                <input
                  type="text"
                  value={manager}
                  onChange={(e) => setManager(e.target.value)}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded focus:outline-none focus:border-indigo-500"
                  placeholder="담당자명 입력"
                  autoFocus
                />
                <button
                  type="button"
                  onClick={() => {
                    setManagerMode('select')
                    setManager('')
                  }}
                  className="px-3 py-2 text-sm border border-gray-300 rounded hover:bg-gray-50 whitespace-nowrap"
                >
                  ← 목록 선택
                </button>
              </div>
            )}
          </div>
          <div className="flex justify-end gap-2 mt-6">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded hover:bg-gray-50"
              disabled={saving}
            >
              취소
            </button>
            <button
              type="submit"
              disabled={saving || !companyName.trim()}
              className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50"
            >
              {saving ? '추가 중...' : '추가하고 선택'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
