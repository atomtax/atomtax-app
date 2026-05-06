'use client'

import { X, FileDown, Image as ImageIcon } from 'lucide-react'

type Props = {
  selectedCount: number
  onClose: () => void
  onSelect: (format: 'pdf' | 'png') => void
  isExporting: boolean
  progress?: { current: number; total: number }
}

export default function BatchExportModal({
  selectedCount,
  onClose,
  onSelect,
  isExporting,
  progress,
}: Props) {
  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg max-w-md w-full">
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-lg font-bold">일괄 출력</h2>
          {!isExporting && (
            <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
              <X size={20} />
            </button>
          )}
        </div>
        <div className="p-6">
          {!isExporting ? (
            <>
              <p className="text-sm text-gray-600 mb-4">
                선택된 <strong>{selectedCount}건</strong>의 청구서를 어떤 형식으로 다운로드할까요?
                <br />각 청구서가 별도 파일로 다운로드 폴더에 저장됩니다.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => onSelect('pdf')}
                  className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-3 bg-red-600 text-white rounded hover:bg-red-700"
                >
                  <FileDown size={18} />
                  PDF 다운로드
                </button>
                <button
                  onClick={() => onSelect('png')}
                  className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-3 bg-emerald-600 text-white rounded hover:bg-emerald-700"
                >
                  <ImageIcon size={18} />
                  PNG 다운로드
                </button>
              </div>
            </>
          ) : (
            <div>
              <p className="text-sm text-gray-700 mb-3">
                다운로드 진행 중… ({progress?.current ?? 0} / {progress?.total ?? 0})
              </p>
              <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                <div
                  className="bg-blue-600 h-2 transition-all duration-300"
                  style={{
                    width: `${progress ? (progress.current / progress.total) * 100 : 0}%`,
                  }}
                />
              </div>
              <p className="text-xs text-gray-500 mt-3">
                ※ 브라우저가 &quot;여러 파일 다운로드 허용&quot; 알림을 띄우면 허용해 주세요.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
