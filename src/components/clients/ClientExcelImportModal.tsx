'use client'

import { useState, useRef, useTransition } from 'react'
import * as XLSX from 'xlsx'
import { X, Upload } from 'lucide-react'
import type { Client, ClientInsert } from '@/types/database'
import { saveClientsBatchAction } from '@/app/(dashboard)/clients/actions'

type Props = {
  existingClients: Client[]
  onClose: () => void
  onImported: (created: number, updated: number) => void
}

export default function ClientExcelImportModal({ existingClients, onClose, onImported }: Props) {
  const fileRef = useRef<HTMLInputElement>(null)
  const [preview, setPreview] = useState<string[][]>([])
  const [parsed, setParsed] = useState<Array<Partial<ClientInsert> & { id?: string }>>([])
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState('')

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    setError('')
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (ev) => {
      try {
        const wb = XLSX.read(ev.target?.result, { type: 'array' })
        const ws = wb.Sheets[wb.SheetNames[0]]
        const rows: string[][] = XLSX.utils.sheet_to_json(ws, { header: 1, defval: '' })
        if (rows.length < 2) { setError('데이터가 없습니다.'); return }
        setPreview(rows.slice(0, 6))
        const [, ...dataRows] = rows
        const result: Array<Partial<ClientInsert> & { id?: string }> = []
        for (const r of dataRows) {
          const businessNumber = String(r[8] ?? '').trim()
          const existing = businessNumber
            ? existingClients.find((c) => c.business_number === businessNumber)
            : undefined
          const row: Partial<ClientInsert> & { id?: string } = {
            ...(existing ? { id: existing.id } : {}),
            number: String(r[0] ?? '').trim() || undefined,
            company_name: String(r[1] ?? '').trim(),
            manager: String(r[2] ?? '').trim() || null,
            representative: String(r[3] ?? '').trim() || null,
            phone: String(r[4] ?? '').trim() || null,
            email: String(r[5] ?? '').trim() || null,
            google_drive_folder_url: String(r[6] ?? '').trim() || null,
            trader_drive_folder_url: String(r[7] ?? '').trim() || null,
            business_number: businessNumber || null,
            business_type_category: String(r[9] ?? '') === '법인' ? '법인' : '개인',
            resident_number: String(r[10] ?? '').trim() || null,
            corporate_number: String(r[11] ?? '').trim() || null,
            business_type: String(r[12] ?? '').trim() || null,
            business_item: String(r[13] ?? '').trim() || null,
            business_category_code: String(r[14] ?? '').trim() || null,
            postal_code: String(r[15] ?? '').trim() || null,
            address: String(r[16] ?? '').trim() || null,
            supply_value: parseInt(String(r[17] ?? '').replace(/,/g, '')) || 0,
            tax_value: parseInt(String(r[18] ?? '').replace(/,/g, '')) || 0,
            initial_billing_month: String(r[19] ?? '').trim() || null,
            hometax_id: String(r[20] ?? '').trim() || null,
            hometax_password: String(r[21] ?? '').trim() || null,
            is_terminated: false,
            termination_date: null,
            notes: null,
            start_date: null,
            end_date: null,
            contract_amount: null,
            supply_amount: null,
            tax_amount: null,
          }
          if (row.company_name) result.push(row)
        }
        setParsed(result)
      } catch {
        setError('파일 파싱 중 오류가 발생했습니다.')
      }
    }
    reader.readAsArrayBuffer(file)
  }

  const handleImport = () => {
    if (parsed.length === 0) return
    startTransition(async () => {
      try {
        const { created, updated } = await saveClientsBatchAction(parsed)
        onImported(created, updated)
      } catch (err) {
        setError(err instanceof Error ? err.message : '업로드 실패')
      }
    })
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">엑셀 업로드</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X size={20} /></button>
        </div>

        <div className="p-6">
          <p className="text-sm text-gray-500 mb-4">
            템플릿 형식의 엑셀 파일을 선택하세요. 사업자번호가 같은 고객은 <strong>덮어씁니다</strong>.
          </p>

          <div
            className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center cursor-pointer hover:border-indigo-400 transition-colors"
            onClick={() => fileRef.current?.click()}
          >
            <Upload size={32} className="mx-auto mb-2 text-gray-400" />
            <p className="text-sm text-gray-500">클릭하여 파일 선택</p>
            <input ref={fileRef} type="file" accept=".xlsx,.xls" className="hidden" onChange={handleFile} />
          </div>

          {preview.length > 0 && (
            <div className="mt-4 overflow-x-auto">
              <p className="text-xs text-gray-500 mb-1">미리보기 (처음 5행)</p>
              <table className="text-xs w-full border-collapse">
                {preview.map((row, i) => (
                  <tr key={i} className={i === 0 ? 'bg-gray-100 font-medium' : ''}>
                    {row.slice(0, 8).map((cell, j) => (
                      <td key={j} className="border border-gray-200 px-2 py-1 max-w-[100px] truncate">
                        {cell}
                      </td>
                    ))}
                  </tr>
                ))}
              </table>
              <p className="text-xs text-indigo-600 mt-1 font-medium">
                {parsed.length}건 인식됨
                {' '}({parsed.filter((r) => r.id).length}건 갱신, {parsed.filter((r) => !r.id).length}건 신규)
              </p>
            </div>
          )}

          {error && (
            <p className="mt-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded px-3 py-2">{error}</p>
          )}
        </div>

        <div className="flex justify-end gap-2 px-6 py-4 border-t border-gray-200">
          <button onClick={onClose} className="px-4 py-2 text-sm border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50">
            취소
          </button>
          <button
            onClick={handleImport}
            disabled={parsed.length === 0 || isPending}
            className="px-5 py-2 text-sm bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-40"
          >
            {isPending ? '업로드 중…' : `업로드 (${parsed.length}건)`}
          </button>
        </div>
      </div>
    </div>
  )
}
