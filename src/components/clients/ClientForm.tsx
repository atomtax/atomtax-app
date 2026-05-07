'use client'

import { useState, useTransition } from 'react'
import type { Client, ClientInsert, ClientUpdate, BusinessTypeCategory } from '@/types/database'
import { createClientAction, updateClientAction } from '@/app/(dashboard)/clients/actions'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import Select from '@/components/ui/Select'

interface ClientFormProps {
  client?: Client
  onSuccess: () => void
  onCancel: () => void
}

export default function ClientForm({ client, onSuccess, onCancel }: ClientFormProps) {
  const isEdit = !!client
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState('')

  const [form, setForm] = useState<ClientInsert>({
    number: client?.number ?? '',
    company_name: client?.company_name ?? '',
    business_number: client?.business_number ?? '',
    corporate_number: client?.corporate_number ?? '',
    representative: client?.representative ?? '',
    manager: client?.manager ?? '',
    phone: client?.phone ?? '',
    address: client?.address ?? '',
    business_type: client?.business_type ?? '',
    business_item: client?.business_item ?? '',
    business_type_category: (client?.business_type_category ?? '개인') as BusinessTypeCategory,
    start_date: client?.start_date ?? '',
    end_date: client?.end_date ?? '',
    contract_amount: client?.contract_amount ?? null,
    supply_amount: client?.supply_amount ?? null,
    tax_amount: client?.tax_amount ?? null,
    is_terminated: client?.is_terminated ?? false,
    termination_date: client?.termination_date ?? null,
    notes: client?.notes ?? '',
    email: client?.email ?? null,
    google_drive_folder_url: client?.google_drive_folder_url ?? null,
    trader_drive_folder_url: client?.trader_drive_folder_url ?? null,
    resident_number: client?.resident_number ?? null,
    business_category_code: client?.business_category_code ?? null,
    postal_code: client?.postal_code ?? null,
    supply_value: client?.supply_value ?? 0,
    tax_value: client?.tax_value ?? 0,
    initial_billing_month: client?.initial_billing_month ?? null,
    hometax_id: client?.hometax_id ?? null,
    hometax_password: client?.hometax_password ?? null,
  })

  const set = (key: keyof ClientInsert, value: string | number | boolean | null) => {
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!form.company_name.trim()) {
      setError('상호명은 필수입니다.')
      return
    }

    const payload: ClientInsert = {
      ...form,
      contract_amount: form.contract_amount ? Number(form.contract_amount) : null,
      supply_amount: form.supply_amount ? Number(form.supply_amount) : null,
      tax_amount: form.tax_amount ? Number(form.tax_amount) : null,
      start_date: form.start_date || null,
      end_date: form.end_date || null,
      number: form.number || null,
    }

    startTransition(async () => {
      try {
        if (isEdit) {
          const update: ClientUpdate = payload
          await updateClientAction(client.id, update)
        } else {
          await createClientAction(payload)
        }
        onSuccess()
      } catch (err) {
        setError(err instanceof Error ? err.message : '저장에 실패했습니다.')
      }
    })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="grid grid-cols-2 gap-4">
        <Input
          label="고객번호"
          value={form.number ?? ''}
          onChange={(e) => set('number', e.target.value)}
          placeholder="001"
        />
        <Input
          label="상호명 *"
          value={form.company_name}
          onChange={(e) => set('company_name', e.target.value)}
          placeholder="(주)아톰세무"
          required
        />
        <Select
          label="법인/개인"
          value={form.business_type_category}
          onChange={(e) => set('business_type_category', e.target.value as BusinessTypeCategory)}
        >
          <option value="개인">개인</option>
          <option value="법인">법인</option>
        </Select>
        <Input
          label="사업자번호"
          value={form.business_number ?? ''}
          onChange={(e) => set('business_number', e.target.value)}
          placeholder="000-00-00000"
        />
        <Input
          label="법인번호"
          value={form.corporate_number ?? ''}
          onChange={(e) => set('corporate_number', e.target.value)}
          placeholder="000000-0000000"
        />
        <Input
          label="대표자"
          value={form.representative ?? ''}
          onChange={(e) => set('representative', e.target.value)}
        />
        <Input
          label="담당자"
          value={form.manager ?? ''}
          onChange={(e) => set('manager', e.target.value)}
        />
        <Input
          label="전화번호"
          value={form.phone ?? ''}
          onChange={(e) => set('phone', e.target.value)}
          placeholder="02-0000-0000"
        />
        <Input
          label="업태"
          value={form.business_type ?? ''}
          onChange={(e) => set('business_type', e.target.value)}
        />
        <Input
          label="종목"
          value={form.business_item ?? ''}
          onChange={(e) => set('business_item', e.target.value)}
        />
        <Input
          label="계약 시작일"
          type="date"
          value={form.start_date ?? ''}
          onChange={(e) => set('start_date', e.target.value)}
        />
        <Input
          label="계약 종료일"
          type="date"
          value={form.end_date ?? ''}
          onChange={(e) => set('end_date', e.target.value)}
        />
        <Input
          label="계약금액 (공급가+세액)"
          type="number"
          value={form.contract_amount?.toString() ?? ''}
          onChange={(e) => set('contract_amount', e.target.value ? Number(e.target.value) : null)}
          placeholder="0"
        />
        <Input
          label="공급가액"
          type="number"
          value={form.supply_amount?.toString() ?? ''}
          onChange={(e) => set('supply_amount', e.target.value ? Number(e.target.value) : null)}
          placeholder="0"
        />
        <Input
          label="세액"
          type="number"
          value={form.tax_amount?.toString() ?? ''}
          onChange={(e) => set('tax_amount', e.target.value ? Number(e.target.value) : null)}
          placeholder="0"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">주소</label>
        <input
          type="text"
          value={form.address ?? ''}
          onChange={(e) => set('address', e.target.value)}
          className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg outline-none focus:border-indigo-500"
          placeholder="서울특별시..."
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">메모</label>
        <textarea
          value={form.notes ?? ''}
          onChange={(e) => set('notes', e.target.value)}
          rows={3}
          className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg outline-none focus:border-indigo-500 resize-none"
        />
      </div>

      {error && (
        <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg">{error}</p>
      )}

      <div className="flex justify-end gap-2 pt-2">
        <Button type="button" variant="secondary" onClick={onCancel}>
          취소
        </Button>
        <Button type="submit" disabled={isPending}>
          {isPending ? '저장 중...' : isEdit ? '수정' : '등록'}
        </Button>
      </div>
    </form>
  )
}
