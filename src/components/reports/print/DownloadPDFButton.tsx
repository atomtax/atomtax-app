'use client'

import { useState } from 'react'
import { Download } from 'lucide-react'
import { exportCorporateTaxReportToPDF } from '@/lib/utils/corporate-tax-pdf-export'

interface Props {
  companyName: string
  reportYear: number
}

export function DownloadPDFButton({ companyName, reportYear }: Props) {
  const [isExporting, setIsExporting] = useState(false)

  async function handleDownload() {
    setIsExporting(true)
    try {
      const safeName = companyName.replace(/[\\/:*?"<>|]/g, '')
      const filename = `법인세보고서_${reportYear}년도_${safeName}.pdf`
      await exportCorporateTaxReportToPDF({ filename })
    } catch (e) {
      console.error('PDF 다운로드 실패:', e)
      alert('PDF 다운로드에 실패했습니다. 다시 시도해주세요.')
    } finally {
      setIsExporting(false)
    }
  }

  return (
    <button
      onClick={handleDownload}
      disabled={isExporting}
      style={{
        padding: '8px 14px',
        background: '#1e40af',
        color: 'white',
        border: 'none',
        borderRadius: '6px',
        fontSize: '13px',
        fontWeight: 500,
        cursor: isExporting ? 'wait' : 'pointer',
        display: 'flex',
        alignItems: 'center',
        gap: '6px',
        opacity: isExporting ? 0.7 : 1,
      }}
    >
      <Download size={16} />
      {isExporting ? 'PDF 생성 중...' : 'PDF 다운로드'}
    </button>
  )
}
