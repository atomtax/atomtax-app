'use client'

import Link from 'next/link'
import type { ChecklistRowData } from '../types'

interface Props {
  manager: string
  rows: ChecklistRowData[]
}

export function ManagerGroupCard({ manager, rows }: Props) {
  return (
    <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
      <div
        className="px-5 py-2.5 flex items-center gap-2 text-white text-sm font-semibold"
        style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}
      >
        <span>👤</span>
        <span>{manager}</span>
        <span className="opacity-80 text-xs">({rows.length}건)</span>
      </div>

      <ul className="divide-y divide-gray-100">
        {rows.map(({ property, client }) => (
          <li key={property.id} className="px-4 py-2.5 hover:bg-gray-50 text-sm">
            <Link
              href={`/traders/${client.id}`}
              className="flex items-center justify-between gap-3"
            >
              <div className="min-w-0 flex-1">
                <span className="font-medium text-gray-900">
                  {property.property_name}
                </span>
                <span className="text-gray-500 ml-2 text-xs">
                  ({client.company_name})
                </span>
              </div>
              <div className="text-xs text-gray-500 flex items-center gap-3 whitespace-nowrap">
                <span>양도 {property.transfer_date ?? '-'}</span>
                <span>
                  기한{' '}
                  <span style={{ color: '#dc2626', fontWeight: 700 }}>
                    {property.filing_deadline ?? '-'}
                  </span>
                </span>
              </div>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  )
}
