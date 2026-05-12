'use client'

import { useState } from 'react'
import { Search, X } from 'lucide-react'
import DaumPostcode, { type Address } from 'react-daum-postcode'

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

export function AddressSearchInput({ value, onChange, onSelect }: Props) {
  const [open, setOpen] = useState(false)

  function handleComplete(data: Address) {
    onSelect({
      roadAddress: data.roadAddress ?? '',
      jibunAddress: data.jibunAddress ?? '',
      zipCode: data.zonecode ?? '',
    })
    setOpen(false)
  }

  return (
    <>
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
          onClick={() => setOpen(true)}
          className="px-4 py-2 bg-indigo-600 text-white text-sm rounded-lg hover:bg-indigo-700 flex items-center gap-1"
        >
          <Search size={14} /> 주소검색
        </button>
      </div>

      {open && (
        <div
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
          onClick={() => setOpen(false)}
        >
          <div
            className="bg-white rounded-lg shadow-2xl overflow-hidden w-full max-w-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-4 py-2 border-b border-gray-200">
              <h3 className="text-sm font-bold text-gray-800">주소 검색</h3>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="text-gray-400 hover:text-gray-700"
              >
                <X size={18} />
              </button>
            </div>
            <DaumPostcode
              onComplete={handleComplete}
              style={{ height: 480 }}
              autoClose={false}
            />
          </div>
        </div>
      )}
    </>
  )
}
