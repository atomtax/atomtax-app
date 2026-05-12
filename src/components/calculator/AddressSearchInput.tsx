'use client'

import { Search } from 'lucide-react'

export interface AddressSelection {
  roadAddress: string
  jibunAddress: string
  zipCode: string
}

interface Props {
  value: string
  onChange: (value: string) => void
  onSelect: (selection: AddressSelection) => void
}

/** 1단계 placeholder — Step 4에서 Daum Postcode 통합 */
export function AddressSearchInput({ value, onChange, onSelect: _onSelect }: Props) {
  return (
    <div className="flex gap-2">
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="주소를 검색하세요"
        className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-sm focus:border-indigo-500 focus:outline-none"
      />
      <button
        type="button"
        disabled
        title="Step 4에서 활성화"
        className="px-4 py-2 bg-indigo-100 text-indigo-700 text-sm rounded-lg flex items-center gap-1 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <Search size={14} /> 주소검색
      </button>
    </div>
  )
}
