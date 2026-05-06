'use client'

import { X, FileDown, Image as ImageIcon } from 'lucide-react'
import type { RowState } from './AdjustmentInvoiceManager'

type Props = {
  row: RowState
  year: number
  onClose: () => void
  onDownloadPDF: (rowId: string) => Promise<void>
  onDownloadPNG: (rowId: string) => Promise<void>
}

export default function InvoicePreviewModal({ row, onClose, onDownloadPDF, onDownloadPNG }: Props) {
  const printUrl = `/invoices/adjustment/${row.dbId}/print`

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div
        className="bg-white rounded-lg flex flex-col"
        style={{ width: 'min(95vw, 1100px)', height: 'min(95vh, 900px)' }}
      >
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-lg font-bold">청구서 미리보기 — {row.clientName}</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <X size={20} />
          </button>
        </div>

        <div className="flex-1 overflow-auto bg-slate-100 p-4">
          <iframe
            src={printUrl}
            className="border border-gray-200 rounded bg-white block mx-auto"
            style={{ width: '794px', minHeight: '1100px', height: '100%' }}
          />
        </div>

        <div className="flex justify-end gap-2 p-4 border-t">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm border border-gray-300 rounded hover:bg-gray-50"
          >
            닫기
          </button>
          <button
            onClick={() => onDownloadPDF(row.rowId)}
            className="px-4 py-2 text-sm bg-red-600 text-white rounded hover:bg-red-700 inline-flex items-center gap-1"
          >
            <FileDown size={14} />
            PDF
          </button>
          <button
            onClick={() => onDownloadPNG(row.rowId)}
            className="px-4 py-2 text-sm bg-emerald-600 text-white rounded hover:bg-emerald-700 inline-flex items-center gap-1"
          >
            <ImageIcon size={14} />
            PNG
          </button>
        </div>
      </div>
    </div>
  )
}
