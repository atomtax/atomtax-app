'use client'

import { memo, useState } from 'react'
import Link from 'next/link'
import dynamic from 'next/dynamic'
import { FileText, FolderOpen, MoveUpRight } from 'lucide-react'
import type { TraderProgressStatus } from '@/types/database'
import type { ChecklistRowData } from '../types'
import { ProgressStatusSelect } from './ProgressStatusSelect'
import { ExpandedDetails } from './ExpandedDetails'

const PropertyReportModal = dynamic(
  () =>
    import('@/components/traders/PropertyReportModal').then(
      (m) => m.PropertyReportModal,
    ),
  { ssr: false },
)

interface Props {
  row: ChecklistRowData
  onStatusChange: (propertyId: string, status: TraderProgressStatus) => void
}

function ChecklistRowImpl({ row, onStatusChange }: Props) {
  const { property, client } = row
  const [expanded, setExpanded] = useState(false)
  const [showReport, setShowReport] = useState(false)

  function toggleExpand() {
    setExpanded((p) => !p)
  }

  function stopExpand(e: React.MouseEvent) {
    e.stopPropagation()
  }

  function handleOpenFolder() {
    if (!client.trader_drive_folder_url) {
      alert(
        '이 고객사에는 부동산 폴더 URL이 등록되어 있지 않습니다. 고객 정보에서 먼저 등록해주세요.',
      )
      return
    }
    window.open(
      client.trader_drive_folder_url,
      '_blank',
      'noopener,noreferrer',
    )
  }

  return (
    <>
      <tr
        className="border-b border-gray-100 hover:bg-gray-50 cursor-pointer"
        onClick={toggleExpand}
      >
        <td className="px-3 py-2 text-sm text-gray-700">
          {client.manager || '담당자 미지정'}
        </td>
        <td className="px-3 py-2" onClick={stopExpand}>
          <Link
            href={`/traders/${client.id}`}
            className="text-sm font-medium hover:underline"
            style={{ color: '#2563eb' }}
          >
            {client.company_name}
          </Link>
        </td>
        <td className="px-3 py-2 text-sm text-gray-900">
          {property.property_name}
          <span className="ml-1 text-xs text-gray-400">{expanded ? '▾' : '▸'}</span>
        </td>
        <td className="px-3 py-2 text-sm text-center text-gray-700">
          {property.transfer_date ?? '-'}
        </td>
        <td
          className="px-3 py-2 text-sm text-center"
          style={{ color: '#dc2626', fontWeight: 700 }}
        >
          {property.filing_deadline ?? '-'}
        </td>
        <td className="px-3 py-2" onClick={stopExpand}>
          <ProgressStatusSelect
            propertyId={property.id}
            value={property.progress_status}
            onChange={onStatusChange}
          />
        </td>
        <td className="px-3 py-2 text-center" onClick={stopExpand}>
          <button
            type="button"
            onClick={handleOpenFolder}
            disabled={!client.trader_drive_folder_url}
            title={
              client.trader_drive_folder_url
                ? '부동산 폴더 새 탭으로 열기'
                : '고객 정보에 부동산 폴더 URL을 먼저 등록하세요'
            }
            className="px-2 py-1 bg-yellow-100 text-yellow-800 hover:bg-yellow-200 text-xs rounded inline-flex items-center gap-1 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <FolderOpen size={11} /> 폴더
          </button>
        </td>
        <td className="px-3 py-2 text-center" onClick={stopExpand}>
          <Link
            href={`/traders/${client.id}`}
            className="px-2 py-1 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 text-xs rounded inline-flex items-center gap-1"
          >
            <MoveUpRight size={11} /> 상세
          </Link>
        </td>
        <td className="px-3 py-2 text-center" onClick={stopExpand}>
          <button
            type="button"
            onClick={() => setShowReport(true)}
            className="px-2 py-1 bg-green-100 text-green-700 hover:bg-green-200 text-xs rounded inline-flex items-center gap-1"
          >
            <FileText size={11} /> 보고서
          </button>
        </td>
      </tr>

      {expanded && (
        <tr className="border-b border-gray-200">
          <td colSpan={9} className="p-0">
            <ExpandedDetails property={property} />
          </td>
        </tr>
      )}

      {showReport && (
        <PropertyReportModal
          property={property}
          clientName={client.company_name}
          onClose={() => setShowReport(false)}
        />
      )}
    </>
  )
}

export const ChecklistRow = memo(ChecklistRowImpl)
