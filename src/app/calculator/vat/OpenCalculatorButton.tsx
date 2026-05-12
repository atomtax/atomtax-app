'use client'

import { ExternalLink } from 'lucide-react'

export function OpenCalculatorButton() {
  function handleOpen() {
    window.open(
      '/calculator/vat/calc',
      '_blank',
      'width=1000,height=900,noopener,noreferrer',
    )
  }

  return (
    <button
      type="button"
      onClick={handleOpen}
      className="inline-flex items-center gap-2 px-6 py-3 rounded-lg text-white font-medium text-sm shadow hover:shadow-md transition-shadow"
      style={{
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      }}
    >
      <ExternalLink size={16} /> 계산기 열기 (새 창)
    </button>
  )
}
