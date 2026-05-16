'use client'

import { useState, useMemo, useTransition } from 'react'
import * as XLSX from 'xlsx'
import { Plus, Upload, Download, FileSpreadsheet, ChevronUp, ChevronDown, ChevronLeft, ChevronRight, CalendarPlus, Factory } from 'lucide-react'
import type { Client, ClientInsert } from '@/types/database'
import { deleteClientAction } from '@/app/(dashboard)/clients/actions'
import ClientRow from './ClientRow'
import ClientDetailModal from './ClientDetailModal'
import ClientFormModal from './ClientFormModal'
import ClientExcelImportModal from './ClientExcelImportModal'
import { BulkOpeningDateUpload } from './BulkOpeningDateUpload'
import { BulkIndustryCodeUpload } from './BulkIndustryCodeUpload'

type SortKey = 'number' | 'company_name' | 'manager'
type SortDir = 'asc' | 'desc'

type Props = {
  initialClients: Client[]
  isTerminated?: boolean
}

const EXCEL_HEADERS = [
  '번호', '거래처명', '담당자', '대표자', '연락처', '이메일',
  '구글드라이브URL', '부동산폴더URL',
  '사업자번호', '사업자구분', '주민등록번호', '법인등록번호',
  '업태', '종목', '업종코드',
  '우편번호', '사업장주소',
  '공급가액', '세액', '최초출금월',
  '홈택스아이디', '홈택스비밀번호',
]

export default function ClientListManager({ initialClients, isTerminated = false }: Props) {
  const [, startTransition] = useTransition()
  const [clients, setClients] = useState<Client[]>(initialClients)

  // 필터 / 정렬 / 페이지
  const [managerFilter, setManagerFilter] = useState('all')
  const [search, setSearch] = useState('')
  const [sortKey, setSortKey] = useState<SortKey>('number')
  const [sortDir, setSortDir] = useState<SortDir>('asc')
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(100)

  // 모달 상태
  const [detailClient, setDetailClient] = useState<Client | null>(null)
  const [editClient, setEditClient] = useState<Client | null>(null)
  const [showAdd, setShowAdd] = useState(false)
  const [showExcelUpload, setShowExcelUpload] = useState(false)
  const [showOpeningDateUpload, setShowOpeningDateUpload] = useState(false)
  const [showIndustryCodeUpload, setShowIndustryCodeUpload] = useState(false)

  const managers = useMemo(
    () => [...new Set(clients.map((c) => c.manager).filter((m): m is string => !!m))].sort(),
    [clients]
  )

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'))
    else { setSortKey(key); setSortDir('asc') }
    setPage(1)
  }

  const SortIcon = ({ k }: { k: SortKey }) => {
    if (sortKey !== k) return <span className="text-gray-300"><ChevronUp size={12} /></span>
    return sortDir === 'asc' ? <ChevronUp size={12} /> : <ChevronDown size={12} />
  }

  const filtered = useMemo(() => {
    return clients
      .filter((c) => {
        if (managerFilter !== 'all' && c.manager !== managerFilter) return false
        if (search) {
          const q = search.toLowerCase()
          return (
            c.company_name.toLowerCase().includes(q) ||
            (c.business_number ?? '').includes(q) ||
            (c.representative ?? '').toLowerCase().includes(q) ||
            (c.number ?? '').includes(q)
          )
        }
        return true
      })
      .sort((a, b) => {
        const mul = sortDir === 'asc' ? 1 : -1
        if (sortKey === 'number') {
          return mul * (parseInt(a.number ?? '0') - parseInt(b.number ?? '0'))
        }
        if (sortKey === 'company_name') return mul * a.company_name.localeCompare(b.company_name, 'ko')
        if (sortKey === 'manager') return mul * (a.manager ?? '').localeCompare(b.manager ?? '', 'ko')
        return 0
      })
  }, [clients, managerFilter, search, sortKey, sortDir])

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize))
  const paginated = filtered.slice((page - 1) * pageSize, page * pageSize)

  const PaginationBar = () => {
    if (totalPages <= 1) return null
    return (
      <div className="flex items-center justify-between py-2">
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-500">페이지당</span>
          <select
            value={pageSize}
            onChange={(e) => { setPageSize(parseInt(e.target.value)); setPage(1) }}
            className="px-2 py-1 text-sm border border-gray-300 rounded"
          >
            {[25, 50, 100].map((n) => <option key={n} value={n}>{n}</option>)}
          </select>
          <span className="text-sm text-gray-400">/ 전체 {filtered.length}건</span>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            className="p-1 rounded border border-gray-300 disabled:opacity-40 hover:bg-gray-50"
          >
            <ChevronLeft size={16} />
          </button>
          {Array.from({ length: totalPages }, (_, i) => i + 1)
            .filter((p) => p === 1 || p === totalPages || Math.abs(p - page) <= 2)
            .map((p, idx, arr) => (
              <span key={p}>
                {idx > 0 && arr[idx - 1] !== p - 1 && <span className="px-1 text-gray-400">…</span>}
                <button
                  onClick={() => setPage(p)}
                  className={`w-8 h-8 text-sm rounded border transition-colors ${
                    p === page
                      ? 'bg-indigo-600 text-white border-indigo-600'
                      : 'border-gray-300 hover:bg-gray-50 text-gray-700'
                  }`}
                >
                  {p}
                </button>
              </span>
            ))}
          <button
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            className="p-1 rounded border border-gray-300 disabled:opacity-40 hover:bg-gray-50"
          >
            <ChevronRight size={16} />
          </button>
        </div>
      </div>
    )
  }

  const handleDelete = (client: Client) => {
    const ok = confirm(
      `[${client.company_name}] 고객을 삭제하시겠습니까?\n\n연결된 청구서/보고서의 고객 정보가 사라집니다. (데이터는 유지됩니다)`
    )
    if (!ok) return
    startTransition(async () => {
      try {
        await deleteClientAction(client.id)
        setClients((prev) => prev.filter((c) => c.id !== client.id))
      } catch (err) {
        alert(`삭제 실패: ${err instanceof Error ? err.message : String(err)}`)
      }
    })
  }

  const handleSaved = (saved: Client) => {
    setClients((prev) => {
      const idx = prev.findIndex((c) => c.id === saved.id)
      if (idx >= 0) {
        // 해임 처리로 목록에서 사라져야 하는 경우
        if (isTerminated && !saved.is_terminated) return prev.filter((c) => c.id !== saved.id)
        if (!isTerminated && saved.is_terminated) return prev.filter((c) => c.id !== saved.id)
        const updated = [...prev]
        updated[idx] = saved
        return updated
      }
      return [saved, ...prev]
    })
    setEditClient(null)
    setShowAdd(false)
    if (saved.is_terminated && !isTerminated) {
      alert(`[${saved.company_name}] 해임 처리되었습니다. 해임고객 관리 페이지에서 확인하세요.`)
    }
    if (!saved.is_terminated && isTerminated) {
      alert(`[${saved.company_name}] 기장고객으로 복원되었습니다.`)
    }
  }

  const handleTemplateDownload = () => {
    const ws = XLSX.utils.aoa_to_sheet([EXCEL_HEADERS])
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, '고객사 템플릿')
    XLSX.writeFile(wb, '아톰세무회계_고객사_템플릿.xlsx')
  }

  const handleExcelDownload = () => {
    const data = filtered.map((c): Record<string, string | number | null> => ({
      번호: c.number,
      거래처명: c.company_name,
      담당자: c.manager,
      대표자: c.representative,
      연락처: c.phone,
      이메일: c.email,
      구글드라이브URL: c.google_drive_folder_url,
      부동산폴더URL: c.trader_drive_folder_url,
      사업자번호: c.business_number,
      사업자구분: c.business_type_category,
      주민등록번호: c.resident_number,
      법인등록번호: c.corporate_number,
      업태: c.business_type,
      종목: c.business_item,
      업종코드: c.business_category_code,
      우편번호: c.postal_code,
      사업장주소: c.address,
      공급가액: c.supply_value,
      세액: c.tax_value,
      최초출금월: c.initial_billing_month,
      홈택스아이디: c.hometax_id,
      홈택스비밀번호: c.hometax_password,
    }))
    const ws = XLSX.utils.json_to_sheet(data)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, '고객사 목록')
    XLSX.writeFile(wb, `아톰세무회계_고객사_${isTerminated ? '해임' : '활성'}_${new Date().toISOString().slice(0, 10)}.xlsx`)
  }

  return (
    <div className="p-6 max-w-[1600px] mx-auto">
      {/* 헤더 */}
      <div className="mb-4">
        <h1 className="text-2xl font-bold text-gray-900">
          {isTerminated ? '해임고객 관리' : '기장고객 목록'}
        </h1>
        <p className="text-sm text-gray-500 mt-0.5">
          총 {filtered.length}명
          {isTerminated && (
            <span className="ml-2 text-amber-600">
              수정 탭에서 &apos;해임여부&apos;를 해제하면 기장고객으로 복원됩니다.
            </span>
          )}
        </p>
      </div>

      {/* 컨트롤 바 */}
      <div className="bg-white border border-gray-200 rounded-lg p-3 mb-4 flex flex-wrap items-center gap-2">
        {/* 담당자 필터 */}
        <select
          value={managerFilter}
          onChange={(e) => { setManagerFilter(e.target.value); setPage(1) }}
          className="px-3 py-2 text-sm border border-gray-300 rounded-md"
        >
          <option value="all">전체 담당자</option>
          {managers.map((m) => <option key={m} value={m}>{m}</option>)}
        </select>

        {/* 검색 */}
        <input
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1) }}
          placeholder="거래처명 검색..."
          className="px-3 py-2 text-sm border border-gray-300 rounded-md w-48 focus:outline-none focus:border-indigo-500"
        />

        {/* 우측 버튼 */}
        <div className="ml-auto flex flex-wrap gap-2">
          {!isTerminated && (
            <>
              <button
                onClick={handleTemplateDownload}
                className="inline-flex items-center gap-1.5 px-3 py-2 text-sm border border-gray-300 rounded-md bg-white hover:bg-gray-50 text-gray-700"
              >
                <FileSpreadsheet size={14} />
                템플릿 다운로드
              </button>
              <button
                onClick={() => setShowExcelUpload(true)}
                className="inline-flex items-center gap-1.5 px-3 py-2 text-sm bg-yellow-500 text-white rounded-md hover:bg-yellow-600"
              >
                <Upload size={14} />
                엑셀 업로드
              </button>
              <button
                onClick={() => setShowOpeningDateUpload(true)}
                className="inline-flex items-center gap-1.5 px-3 py-2 text-sm bg-sky-600 text-white rounded-md hover:bg-sky-700"
              >
                <CalendarPlus size={14} />
                개업일 일괄 업로드
              </button>
              <button
                onClick={() => setShowIndustryCodeUpload(true)}
                className="inline-flex items-center gap-1.5 px-3 py-2 text-sm bg-purple-600 text-white rounded-md hover:bg-purple-700"
              >
                <Factory size={14} />
                업종코드 마스터
              </button>
            </>
          )}
          <button
            onClick={handleExcelDownload}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-sm bg-emerald-600 text-white rounded-md hover:bg-emerald-700"
          >
            <Download size={14} />
            엑셀 다운로드
          </button>
          {!isTerminated && (
            <button
              onClick={() => setShowAdd(true)}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-sm bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
            >
              <Plus size={14} />
              고객사 추가
            </button>
          )}
        </div>
      </div>

      {/* 페이지네이션 (상단) */}
      <PaginationBar />

      {/* 테이블 */}
      <div className="bg-white border border-gray-200 rounded-lg overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-200 text-xs text-gray-500">
            <tr>
              <th
                className="px-3 py-2.5 text-center cursor-pointer hover:text-gray-900 whitespace-nowrap"
                onClick={() => toggleSort('number')}
              >
                <span className="inline-flex items-center gap-1">번호 <SortIcon k="number" /></span>
              </th>
              <th
                className="px-3 py-2.5 text-left cursor-pointer hover:text-gray-900 whitespace-nowrap"
                onClick={() => toggleSort('company_name')}
              >
                <span className="inline-flex items-center gap-1">거래처명 <SortIcon k="company_name" /></span>
              </th>
              <th
                className="px-3 py-2.5 text-left cursor-pointer hover:text-gray-900 whitespace-nowrap"
                onClick={() => toggleSort('manager')}
              >
                <span className="inline-flex items-center gap-1">담당자 <SortIcon k="manager" /></span>
              </th>
              <th className="px-3 py-2.5 text-left whitespace-nowrap">사업자번호</th>
              <th className="px-3 py-2.5 text-center whitespace-nowrap">사업자구분</th>
              <th className="px-3 py-2.5 text-left whitespace-nowrap">대표자</th>
              <th className="px-3 py-2.5 text-left whitespace-nowrap">종목</th>
              <th className="px-3 py-2.5 text-left whitespace-nowrap">연락처</th>
              <th className="px-3 py-2.5 text-center whitespace-nowrap">기장</th>
              <th className="px-3 py-2.5 text-center whitespace-nowrap">부동산</th>
              <th className="px-3 py-2.5 text-center whitespace-nowrap">수정</th>
              <th className="px-3 py-2.5 text-center whitespace-nowrap">삭제</th>
            </tr>
          </thead>
          <tbody>
            {paginated.length === 0 ? (
              <tr>
                <td colSpan={12} className="px-4 py-12 text-center text-sm text-gray-400">
                  {search || managerFilter !== 'all' ? '검색 결과가 없습니다.' : '등록된 고객이 없습니다.'}
                </td>
              </tr>
            ) : (
              paginated.map((client) => (
                <ClientRow
                  key={client.id}
                  client={client}
                  onDetail={setDetailClient}
                  onEdit={setEditClient}
                  onDelete={handleDelete}
                />
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* 페이지네이션 (하단) */}
      <PaginationBar />

      {/* 상세 팝업 */}
      {detailClient && (
        <ClientDetailModal
          client={detailClient}
          onClose={() => setDetailClient(null)}
          onEdit={(c) => { setDetailClient(null); setEditClient(c) }}
        />
      )}

      {/* 수정 폼 */}
      {editClient && (
        <ClientFormModal
          client={editClient}
          onClose={() => setEditClient(null)}
          onSaved={handleSaved}
        />
      )}

      {/* 추가 폼 */}
      {showAdd && (
        <ClientFormModal
          onClose={() => setShowAdd(false)}
          onSaved={handleSaved}
        />
      )}

      {/* 엑셀 업로드 */}
      {showExcelUpload && (
        <ClientExcelImportModal
          existingClients={clients}
          onClose={() => setShowExcelUpload(false)}
          onImported={(created, updated) => {
            setShowExcelUpload(false)
            alert(`업로드 완료: 신규 ${created}건, 갱신 ${updated}건`)
            // 페이지 새로고침으로 최신 데이터 반영
            window.location.reload()
          }}
        />
      )}

      {/* 개업일 일괄 업로드 */}
      {showOpeningDateUpload && (
        <BulkOpeningDateUpload
          onClose={() => setShowOpeningDateUpload(false)}
          onDone={() => window.location.reload()}
        />
      )}

      {/* 업종코드 마스터 업로드 */}
      {showIndustryCodeUpload && (
        <BulkIndustryCodeUpload
          onClose={() => setShowIndustryCodeUpload(false)}
          onDone={() => setShowIndustryCodeUpload(false)}
        />
      )}
    </div>
  )
}
