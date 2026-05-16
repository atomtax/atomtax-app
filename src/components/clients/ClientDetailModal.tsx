'use client'

import { useState } from 'react'
import { X, ExternalLink } from 'lucide-react'
import type { Client } from '@/types/database'
import { formatBusinessNumber, normalizeBillingMonth } from '@/lib/utils/format'

type Tab = '기본정보' | '사업자정보' | '세무정보'

type Props = {
  client: Client
  onClose: () => void
  onEdit: (client: Client) => void
}

function Field({ label, value, link }: { label: string; value?: string | number | null; link?: string }) {
  const display = value !== null && value !== undefined && value !== '' ? String(value) : '—'
  return (
    <div>
      <dt className="text-xs text-gray-500 mb-0.5">{label}</dt>
      <dd className="text-sm text-gray-900 font-medium">
        {link && display !== '—' ? (
          <a href={link} target="_blank" rel="noopener noreferrer"
            className="text-indigo-600 hover:underline inline-flex items-center gap-1">
            {display} <ExternalLink size={12} />
          </a>
        ) : display}
      </dd>
    </div>
  )
}

export default function ClientDetailModal({ client, onClose, onEdit }: Props) {
  const [tab, setTab] = useState<Tab>('기본정보')

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col">
        {/* 헤더 */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <div>
            <div className="text-xs text-gray-400 mb-0.5">고객 상세 정보</div>
            <h2 className="text-lg font-semibold text-gray-900">{client.company_name}</h2>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X size={20} />
          </button>
        </div>

        {/* 탭 */}
        <div className="flex border-b border-gray-200 px-6">
          {(['기본정보', '사업자정보', '세무정보'] as Tab[]).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`py-3 px-4 text-sm font-medium border-b-2 transition-colors ${
                tab === t
                  ? 'border-indigo-600 text-indigo-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              {t}
            </button>
          ))}
        </div>

        {/* 콘텐츠 */}
        <div className="flex-1 overflow-y-auto px-6 py-5">
          {tab === '기본정보' && (
            <dl className="grid grid-cols-2 gap-x-8 gap-y-5">
              <Field label="고객번호" value={client.number} />
              <Field label="거래처명" value={client.company_name} />
              <Field label="담당자" value={client.manager} />
              <Field label="대표자" value={client.representative} />
              <Field label="연락처" value={client.phone} />
              <Field label="이메일" value={client.email} />
              <div className="col-span-2">
                <Field
                  label="구글 드라이브 폴더"
                  value={client.google_drive_folder_url ? '🔗 폴더 열기' : null}
                  link={client.google_drive_folder_url ?? undefined}
                />
              </div>
              <div className="col-span-2">
                <Field
                  label="매매사업자 부동산 폴더"
                  value={client.trader_drive_folder_url ? '🔗 폴더 열기' : null}
                  link={client.trader_drive_folder_url ?? undefined}
                />
              </div>
            </dl>
          )}

          {tab === '사업자정보' && (
            <dl className="grid grid-cols-2 gap-x-8 gap-y-5">
              <Field label="사업자번호" value={formatBusinessNumber(client.business_number)} />
              <Field
                label="사업자구분"
                value={client.business_type_category === '법인' ? '법인사업자' : '개인사업자'}
              />
              <Field label="주민등록번호" value={client.resident_number} />
              <Field label="법인등록번호" value={client.corporate_number} />
              <Field label="개업일" value={client.opening_date} />
              <Field label="업태" value={client.business_type} />
              <Field label="종목" value={client.business_item} />
              <Field label="업종코드" value={client.business_category_code} />
              <Field label="우편번호" value={client.postal_code} />
              <div className="col-span-2">
                <Field label="사업장 주소" value={client.address} />
              </div>
            </dl>
          )}

          {tab === '세무정보' && (
            <dl className="grid grid-cols-2 gap-x-8 gap-y-5">
              <Field
                label="공급가액"
                value={client.supply_value ? client.supply_value.toLocaleString('ko-KR') + '원' : null}
              />
              <Field
                label="세액"
                value={client.tax_value ? client.tax_value.toLocaleString('ko-KR') + '원' : null}
              />
              <Field label="최초출금월" value={normalizeBillingMonth(client.initial_billing_month) || null} />
              <div />
              <Field label="홈택스 아이디" value={client.hometax_id} />
              <Field label="홈택스 비밀번호" value={client.hometax_password} />
            </dl>
          )}
        </div>

        {/* 푸터 */}
        <div className="flex justify-end gap-2 px-6 py-4 border-t border-gray-200">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
          >
            닫기
          </button>
          <button
            onClick={() => onEdit(client)}
            className="px-4 py-2 text-sm bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
          >
            수정
          </button>
        </div>
      </div>
    </div>
  )
}
