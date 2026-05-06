'use client'

import { X, FileDown, ImageIcon } from 'lucide-react'

type Props = {
  dbId: string
  clientName: string
  onClose: () => void
}

export default function InvoicePreviewModal({ dbId, clientName, onClose }: Props) {
  const printUrl = `/invoices/adjustment/${dbId}/print`

  function handlePDF() {
    window.open(`${printUrl}?auto=1`, '_blank')
  }

  function handlePNG() {
    alert('PNG 다운로드는 다음 업데이트에서 지원 예정입니다.\n현재는 PDF 다운로드를 사용해 주세요.')
  }

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg max-w-3xl w-full max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-lg font-bold">청구서 미리보기 — {clientName}</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <X size={20} />
          </button>
        </div>

        <div className="flex-1 overflow-auto p-4">
          <iframe
            src={printUrl}
            className="w-full border border-gray-200 rounded"
            style={{ height: '70vh' }}
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
            onClick={handlePDF}
            className="px-4 py-2 text-sm bg-red-600 text-white rounded hover:bg-red-700 inline-flex items-center gap-1"
          >
            <FileDown size={14} />
            PDF
          </button>
          <button
            onClick={handlePNG}
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
