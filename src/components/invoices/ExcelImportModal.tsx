'use client'

import { useState } from 'react'
import * as XLSX from 'xlsx'
import { X } from 'lucide-react'
import type { Client } from '@/types/database'
import { calculateInvoiceRow } from '@/lib/calculators/fee-schedule'
import type { RowState } from './AdjustmentInvoiceManager'

type Props = {
  year: number
  businessType: 'corporate' | 'individual'
  existingClients: Client[]
  onClose: () => void
  onImported: (newRows: RowState[]) => void
}

export default function ExcelImportModal({
  year: _year,
  businessType,
  existingClients,
  onClose,
  onImported,
}: Props) {
  const [error, setError] = useState<string | null>(null)
  const [parsing, setParsing] = useState(false)

  async function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    setParsing(true)
    setError(null)
    try {
      const buffer = await file.arrayBuffer()
      const wb = XLSX.read(buffer)
      const ws = wb.Sheets[wb.SheetNames[0]]
      const json = XLSX.utils.sheet_to_json<Record<string, unknown>>(ws)

      if (json.length === 0) throw new Error('엑셀 파일이 비어있습니다.')

      const required = ['고객사명', '사업자번호', '매출액']
      for (const col of required) {
        if (!(col in json[0])) {
          throw new Error(`필수 컬럼 누락: "${col}". [엑셀 다운로드]로 받은 형식을 사용해주세요.`)
        }
      }

      const newRows: RowState[] = json.map((r, i) => {
        const businessNumber = String(r['사업자번호'] ?? '')
        const matched = existingClients.find((c) => c.business_number === businessNumber)
        const revenue = Number(r['매출액'] ?? 0)
        const taxCreditAdditional = Number(r['세액공제'] ?? 0)
        const faithfulReportFee = Number(r['성실신고'] ?? 0)
        const discount = Number(r['할인'] ?? 0)
        const calc = calculateInvoiceRow({
          revenue,
          businessType,
          taxCreditAdditional,
          faithfulReportFee,
          discount,
        })
        const pm = String(r['납부방법'] ?? '미확인')
        return {
          rowId: `excel-${Date.now()}-${i}`,
          dbId: null,
          businessNumber,
          clientId: matched?.id ?? null,
          clientName: String(r['고객사명'] ?? matched?.company_name ?? ''),
          manager: matched?.manager ?? null,
          revenue,
          settlementFee: calc.settlementFee,
          adjustmentFee: calc.adjustmentFee,
          taxCreditAdditional,
          faithfulReportFee,
          discount,
          supplyAmount: calc.supplyAmount,
          vatAmount: calc.vatAmount,
          totalAmount: calc.totalAmount,
          paymentMethod: (pm === '자동이체' || pm === '직접입금' ? pm : '미확인') as RowState['paymentMethod'],
          isPaid: r['납부여부'] === '완료',
          isDirty: true,
          isDeleted: false,
          selected: false,
        }
      })

      onImported(newRows)
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err))
    } finally {
      setParsing(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg max-w-md w-full">
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-lg font-bold">엑셀 업로드</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <X size={20} />
          </button>
        </div>
        <div className="p-6">
          <p className="text-sm text-gray-600 mb-4">
            [엑셀 다운로드]로 받은 형식의 파일을 업로드하세요.
            사업자번호로 식별하여 추가됩니다.
          </p>
          <input
            type="file"
            accept=".xlsx,.xls"
            onChange={handleFileSelect}
            disabled={parsing}
            className="w-full text-sm"
          />
          {parsing && <p className="mt-3 text-sm text-blue-600">파일 분석 중…</p>}
          {error && (
            <p className="mt-3 text-sm text-red-600 bg-red-50 border border-red-200 p-2 rounded">
              {error}
            </p>
          )}
        </div>
      </div>
    </div>
  )
}
