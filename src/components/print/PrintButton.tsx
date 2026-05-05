'use client'

import { Printer } from 'lucide-react'

export default function PrintButton({ label = '인쇄' }: { label?: string }) {
  return (
    <button
      type="button"
      onClick={() => window.print()}
      className="no-print inline-flex items-center gap-2 rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-slate-800 transition-colors"
    >
      <Printer size={16} />
      {label}
    </button>
  )
}
