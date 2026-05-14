'use client'

import { exportBySelectorToPdf } from './pdf-export'

interface ExportOptions {
  filename: string
  pageSelector?: string
}

/**
 * 종합소득세/법인세 보고서 PDF 다운로드.
 * 공통 pdf-export 유틸 (JPEG + scale 1.5 + 압축) 위임.
 */
export async function exportCorporateTaxReportToPDF(
  options: ExportOptions,
): Promise<void> {
  await exportBySelectorToPdf(options.pageSelector ?? '.page-container', {
    filename: options.filename,
  })
}
