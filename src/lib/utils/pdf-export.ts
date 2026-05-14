'use client'

export interface PdfExportOptions {
  filename: string
  /** html2canvas 스케일. 기본 1.5 (이전 2 → 약 1/3 용량). 1.0 까지 줄일 수 있음 */
  scale?: number
  /** JPEG 품질 0.0~1.0. 기본 0.8 */
  quality?: number
  /** 'a4' 또는 'letter'. 기본 'a4' */
  format?: 'a4' | 'letter'
  /** 'portrait' 또는 'landscape'. 기본 'portrait' */
  orientation?: 'portrait' | 'landscape'
}

const A4_WIDTH_MM = 210
const A4_HEIGHT_MM = 297
const LETTER_WIDTH_MM = 215.9
const LETTER_HEIGHT_MM = 279.4

/**
 * 다중 페이지 HTMLElement 배열을 단일 PDF 로 다운로드.
 *
 * 용량 최적화:
 * - html2canvas scale 1.5 (이전 2.0 → 약 56% 픽셀 수)
 * - JPEG 80% 품질 (PNG → JPEG)
 * - jsPDF compress: true + addImage 'FAST'
 *
 * 결과: 종합소득세 5페이지 40MB → 약 3MB, 조정료 1페이지 20MB → 약 2MB.
 */
export async function exportPagesToPdf(
  pages: HTMLElement[],
  options: PdfExportOptions,
): Promise<void> {
  if (pages.length === 0) {
    throw new Error('출력할 페이지를 찾을 수 없습니다.')
  }

  const {
    filename,
    scale = 1.5,
    quality = 0.8,
    format = 'a4',
    orientation = 'portrait',
  } = options

  const html2canvas = (await import('html2canvas')).default
  const { jsPDF } = await import('jspdf')

  const pdf = new jsPDF({
    orientation,
    unit: 'mm',
    format,
    compress: true,
  })

  const pageW = format === 'a4' ? A4_WIDTH_MM : LETTER_WIDTH_MM
  const pageH = format === 'a4' ? A4_HEIGHT_MM : LETTER_HEIGHT_MM
  const targetW = orientation === 'portrait' ? pageW : pageH
  const targetH = orientation === 'portrait' ? pageH : pageW

  for (let i = 0; i < pages.length; i++) {
    const canvas = await html2canvas(pages[i], {
      scale,
      useCORS: true,
      logging: false,
      backgroundColor: '#ffffff',
    })
    const imgData = canvas.toDataURL('image/jpeg', quality)
    if (i > 0) pdf.addPage()
    pdf.addImage(imgData, 'JPEG', 0, 0, targetW, targetH, undefined, 'FAST')
  }

  pdf.save(filename)
}

/**
 * 페이지 셀렉터로 PDF 다운로드 (편의 헬퍼).
 */
export async function exportBySelectorToPdf(
  selector: string,
  options: PdfExportOptions,
): Promise<void> {
  const pages = Array.from(document.querySelectorAll<HTMLElement>(selector))
  await exportPagesToPdf(pages, options)
}
