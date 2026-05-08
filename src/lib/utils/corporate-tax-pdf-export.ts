'use client'

interface ExportOptions {
  filename: string
  pageSelector?: string
}

export async function exportCorporateTaxReportToPDF(options: ExportOptions): Promise<void> {
  const selector = options.pageSelector ?? '.page-container'
  const pages = document.querySelectorAll<HTMLElement>(selector)

  if (pages.length === 0) {
    throw new Error('출력할 페이지를 찾을 수 없습니다.')
  }

  const html2canvas = (await import('html2canvas')).default
  const { jsPDF } = await import('jspdf')

  const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })

  for (let i = 0; i < pages.length; i++) {
    const canvas = await html2canvas(pages[i], {
      scale: 2,
      useCORS: true,
      logging: false,
      backgroundColor: '#ffffff',
    })
    const imgData = canvas.toDataURL('image/png')
    if (i > 0) pdf.addPage()
    pdf.addImage(imgData, 'PNG', 0, 0, 210, 297)
  }

  pdf.save(options.filename)
}
