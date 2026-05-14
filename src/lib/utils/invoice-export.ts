type DownloadFormat = 'pdf' | 'png'

export async function downloadInvoice(
  invoiceId: string,
  filename: string,
  format: DownloadFormat
): Promise<void> {
  return new Promise((resolve, reject) => {
    const iframe = document.createElement('iframe')
    iframe.style.position = 'fixed'
    iframe.style.left = '-9999px'
    iframe.style.top = '0'
    iframe.style.width = '794px'
    iframe.style.height = '1123px'
    iframe.style.border = 'none'
    document.body.appendChild(iframe)
    iframe.src = `/invoices/adjustment/${invoiceId}/print`

    iframe.onload = async () => {
      try {
        await new Promise((r) => setTimeout(r, 1500))
        const doc = iframe.contentDocument
        if (!doc) throw new Error('iframe document를 읽을 수 없음')

        const pages = doc.querySelectorAll<HTMLElement>('.a4-page')
        if (pages.length === 0) throw new Error('청구서 페이지를 찾을 수 없음')

        if (format === 'png') {
          const html2canvas = (await import('html2canvas')).default
          const canvas = await html2canvas(pages[0], {
            scale: 2,
            backgroundColor: '#ffffff',
            useCORS: true,
            logging: false,
          })
          const dataUrl = canvas.toDataURL('image/png')
          triggerDownload(dataUrl, `${filename}.png`)
        } else {
          const { exportPagesToPdf } = await import('./pdf-export')
          await exportPagesToPdf(Array.from(pages), { filename: `${filename}.pdf` })
        }
        resolve()
      } catch (err) {
        reject(err)
      } finally {
        setTimeout(() => {
          document.body.removeChild(iframe)
        }, 100)
      }
    }

    iframe.onerror = () => {
      document.body.removeChild(iframe)
      reject(new Error('인쇄 페이지 로드 실패'))
    }
  })
}

function triggerDownload(dataUrl: string, filename: string): void {
  const a = document.createElement('a')
  a.href = dataUrl
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
}

export async function downloadInvoicesBatch(
  invoices: Array<{ id: string; filename: string }>,
  format: DownloadFormat,
  onProgress?: (current: number, total: number) => void
): Promise<{ successCount: number; failedItems: Array<{ id: string; error: string }> }> {
  let successCount = 0
  const failedItems: Array<{ id: string; error: string }> = []

  for (let i = 0; i < invoices.length; i++) {
    const inv = invoices[i]
    onProgress?.(i + 1, invoices.length)
    try {
      await downloadInvoice(inv.id, inv.filename, format)
      await new Promise((r) => setTimeout(r, 800))
      successCount++
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err)
      failedItems.push({ id: inv.id, error: msg })
    }
  }

  return { successCount, failedItems }
}
