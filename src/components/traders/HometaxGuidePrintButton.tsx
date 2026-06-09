'use client'

export function HometaxGuidePrintButton() {
  return (
    <button
      type="button"
      onClick={() => {
        if (typeof window !== 'undefined') window.print()
      }}
      className="px-3 py-1.5 text-xs border border-gray-300 rounded hover:bg-gray-50 text-gray-700"
    >
      인쇄
    </button>
  )
}
