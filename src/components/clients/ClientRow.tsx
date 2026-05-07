'use client'

import { Edit, Trash2, Eye, FolderOpen } from 'lucide-react'
import type { Client } from '@/types/database'
import { formatBusinessNumber } from '@/lib/utils/format'

type Props = {
  client: Client
  onDetail: (client: Client) => void
  onEdit: (client: Client) => void
  onDelete: (client: Client) => void
}

export default function ClientRow({ client, onDetail, onEdit, onDelete }: Props) {
  const isCorpBadge = client.business_type_category === '법인'

  return (
    <tr className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
      {/* 번호 */}
      <td className="px-3 py-2.5 text-sm text-gray-500 text-center">{client.number ?? '—'}</td>

      {/* 거래처명 */}
      <td className="px-3 py-2.5">
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => onDetail(client)}
            className="text-sm font-medium text-gray-900 hover:text-indigo-600 hover:underline text-left"
          >
            {client.company_name}
          </button>
          <button
            onClick={() => onDetail(client)}
            className="text-gray-300 hover:text-gray-600 transition-colors"
            title="상세 보기"
          >
            <Eye size={13} />
          </button>
        </div>
      </td>

      {/* 담당자 */}
      <td className="px-3 py-2.5 text-sm text-gray-700">{client.manager ?? '—'}</td>

      {/* 사업자번호 */}
      <td className="px-3 py-2.5 text-sm text-gray-600 tabular-nums">
        {formatBusinessNumber(client.business_number)}
      </td>

      {/* 사업자구분 */}
      <td className="px-3 py-2.5 text-center">
        <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${
          isCorpBadge
            ? 'bg-purple-100 text-purple-700'
            : 'bg-green-100 text-green-700'
        }`}>
          {isCorpBadge ? '법인' : '개인'}
        </span>
      </td>

      {/* 대표자 */}
      <td className="px-3 py-2.5 text-sm text-gray-700">{client.representative ?? '—'}</td>

      {/* 종목 */}
      <td className="px-3 py-2.5">
        {client.business_item ? (
          <span className="inline-block px-2 py-0.5 bg-blue-50 text-blue-700 rounded text-xs">
            {client.business_item}
          </span>
        ) : <span className="text-gray-300 text-sm">—</span>}
      </td>

      {/* 연락처 */}
      <td className="px-3 py-2.5 text-sm text-gray-600">{client.phone ?? '—'}</td>

      {/* 기장 (구글 드라이브) */}
      <td className="px-3 py-2.5 text-center">
        {client.google_drive_folder_url ? (
          <button
            onClick={() => window.open(client.google_drive_folder_url!, '_blank')}
            className="inline-flex items-center gap-1 px-2 py-1 bg-green-600 text-white rounded text-xs hover:bg-green-700"
          >
            <FolderOpen size={11} />
            열기
          </button>
        ) : <span className="text-gray-300 text-sm">—</span>}
      </td>

      {/* 부동산 (매매사업자 드라이브) */}
      <td className="px-3 py-2.5 text-center">
        {client.trader_drive_folder_url ? (
          <button
            onClick={() => window.open(client.trader_drive_folder_url!, '_blank')}
            className="inline-flex items-center gap-1 px-2 py-1 bg-green-600 text-white rounded text-xs hover:bg-green-700"
          >
            <FolderOpen size={11} />
            열기
          </button>
        ) : <span className="text-gray-300 text-sm">—</span>}
      </td>

      {/* 수정 */}
      <td className="px-2 py-2.5 text-center">
        <button
          onClick={() => onEdit(client)}
          className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-gray-100 text-gray-700 rounded text-xs hover:bg-gray-200"
        >
          <Edit size={12} />
          수정
        </button>
      </td>

      {/* 삭제 */}
      <td className="px-2 py-2.5 text-center">
        <button
          onClick={() => onDelete(client)}
          className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-red-100 text-red-700 rounded text-xs hover:bg-red-200"
        >
          <Trash2 size={12} />
          삭제
        </button>
      </td>
    </tr>
  )
}
