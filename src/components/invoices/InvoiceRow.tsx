'use client'

import { Printer, Trash2 } from 'lucide-react'
import { formatCurrency, parseNumberInput } from '@/lib/utils/format'
import type { RowState } from './AdjustmentInvoiceManager'

type Props = {
  row: RowState
  onChangeCell: (rowId: string, field: keyof RowState, value: RowState[keyof RowState]) => void
  onPrint: (rowId: string) => void
  onDelete: (rowId: string) => void
}

export default function InvoiceRow({ row, onChangeCell, onPrint, onDelete }: Props) {
  return (
    <tr className={`border-b border-gray-100 hover:bg-gray-50 ${row.isDirty ? 'bg-yellow-50' : ''}`}>
      <td className="p-2 text-center">
        <input
          type="checkbox"
          checked={row.selected}
          onChange={(e) => onChangeCell(row.rowId, 'selected', e.target.checked)}
        />
      </td>
      <td className="p-1 min-w-[120px]">
        <input
          type="text"
          value={row.clientName}
          onChange={(e) => onChangeCell(row.rowId, 'clientName', e.target.value)}
          className="w-full px-2 py-1 border border-gray-200 rounded bg-white text-sm"
        />
      </td>
      <NumberCell value={row.revenue} rowId={row.rowId} field="revenue" onChange={onChangeCell} />
      <ReadonlyCell value={row.adjustmentFee} />
      <NumberCell value={row.taxCreditAdditional} rowId={row.rowId} field="taxCreditAdditional" onChange={onChangeCell} />
      <NumberCell value={row.faithfulReportFee} rowId={row.rowId} field="faithfulReportFee" onChange={onChangeCell} />
      <NumberCell value={row.discount} rowId={row.rowId} field="discount" onChange={onChangeCell} />
      <ReadonlyCell value={row.supplyAmount} highlight />
      <ReadonlyCell value={row.vatAmount} highlight />
      <ReadonlyCell value={row.totalAmount} highlight bold />
      <td className="p-1 text-center">
        <select
          value={row.paymentMethod}
          onChange={(e) => onChangeCell(row.rowId, 'paymentMethod', e.target.value as RowState['paymentMethod'])}
          className="px-1 py-1 text-xs border border-gray-200 rounded bg-white"
        >
          <option value="미확인">미확인</option>
          <option value="자동이체">자동이체</option>
          <option value="직접입금">직접입금</option>
        </select>
      </td>
      <td className="p-2 text-center">
        <input
          type="checkbox"
          checked={row.isPaid}
          onChange={(e) => onChangeCell(row.rowId, 'isPaid', e.target.checked)}
        />
      </td>
      <td className="p-1 text-center whitespace-nowrap">
        <button
          onClick={() => onPrint(row.rowId)}
          className="p-1.5 bg-blue-600 text-white rounded hover:bg-blue-700"
          title="청구서 미리보기 / 인쇄"
        >
          <Printer size={13} />
        </button>
        <button
          onClick={() => onDelete(row.rowId)}
          className="p-1.5 ml-1 bg-red-500 text-white rounded hover:bg-red-600"
          title="행 삭제"
        >
          <Trash2 size={13} />
        </button>
      </td>
    </tr>
  )
}

function NumberCell({
  value,
  rowId,
  field,
  onChange,
}: {
  value: number
  rowId: string
  field: keyof RowState
  onChange: (rowId: string, field: keyof RowState, value: number) => void
}) {
  return (
    <td className="p-1">
      <input
        type="text"
        inputMode="numeric"
        value={value === 0 ? '' : value.toLocaleString('ko-KR')}
        onChange={(e) => onChange(rowId, field, parseNumberInput(e.target.value))}
        className="w-full min-w-[80px] px-2 py-1 text-right border border-gray-200 rounded bg-white text-sm tabular-nums"
        placeholder="0"
      />
    </td>
  )
}

function ReadonlyCell({
  value,
  highlight,
  bold,
}: {
  value: number
  highlight?: boolean
  bold?: boolean
}) {
  return (
    <td
      className={`p-2 text-right text-sm tabular-nums whitespace-nowrap ${highlight ? 'bg-blue-50' : ''} ${bold ? 'font-semibold' : ''}`}
    >
      {value === 0 ? '-' : formatCurrency(value)}
    </td>
  )
}
