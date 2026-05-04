import { createClient } from '@/lib/supabase/server'
import { Users, FileText, Building2, TrendingUp } from 'lucide-react'
import Header from '@/components/layout/Header'

async function getDashboardStats() {
  const supabase = await createClient()

  const [clientsResult, terminatedResult, tradersResult, invoicesResult] = await Promise.all([
    supabase.from('clients').select('id', { count: 'exact' }).eq('is_terminated', false),
    supabase.from('clients').select('id', { count: 'exact' }).eq('is_terminated', true),
    supabase.from('trader_inventory').select('id', { count: 'exact' }).neq('status', '완료'),
    supabase.from('adjustment_invoices').select('id', { count: 'exact' }),
  ])

  return {
    activeClients: clientsResult.count ?? 0,
    terminatedClients: terminatedResult.count ?? 0,
    activeTraders: tradersResult.count ?? 0,
    totalInvoices: invoicesResult.count ?? 0,
  }
}

export default async function DashboardPage() {
  const stats = await getDashboardStats()

  const cards = [
    {
      label: '기장고객',
      value: stats.activeClients,
      unit: '명',
      icon: <Users size={22} className="text-indigo-600" />,
      bg: 'bg-indigo-50',
    },
    {
      label: '해지고객',
      value: stats.terminatedClients,
      unit: '명',
      icon: <Users size={22} className="text-gray-400" />,
      bg: 'bg-gray-50',
    },
    {
      label: '진행중인 물건',
      value: stats.activeTraders,
      unit: '건',
      icon: <Building2 size={22} className="text-purple-600" />,
      bg: 'bg-purple-50',
    },
    {
      label: '조정료 청구서',
      value: stats.totalInvoices,
      unit: '건',
      icon: <FileText size={22} className="text-green-600" />,
      bg: 'bg-green-50',
    },
  ]

  return (
    <div>
      <Header title="대시보드" subtitle="아톰세무회계 내부 업무 현황" />

      <div className="grid grid-cols-4 gap-4">
        {cards.map((card) => (
          <div key={card.label} className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
            <div className="flex items-start justify-between mb-3">
              <p className="text-sm text-gray-500">{card.label}</p>
              <div className={`p-2 rounded-lg ${card.bg}`}>{card.icon}</div>
            </div>
            <p className="text-2xl font-bold text-gray-900">
              {card.value.toLocaleString()}
              <span className="text-sm font-normal text-gray-500 ml-1">{card.unit}</span>
            </p>
          </div>
        ))}
      </div>

      <div className="mt-8 bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
        <div className="flex items-center gap-2 mb-4">
          <TrendingUp size={18} className="text-indigo-600" />
          <h2 className="text-sm font-semibold text-gray-900">빠른 이동</h2>
        </div>
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: '고객 추가', href: '/clients' },
            { label: '조정료 청구서 작성', href: '/invoices/adjustment' },
            { label: '법인세 보고서', href: '/reports/corporate-tax' },
            { label: '매매사업자 물건', href: '/traders' },
            { label: '체크리스트', href: '/traders/checklist' },
            { label: '해지고객 관리', href: '/clients/terminated' },
          ].map((item) => (
            <a
              key={item.href}
              href={item.href}
              className="flex items-center justify-center px-4 py-3 text-sm font-medium text-indigo-600 bg-indigo-50 hover:bg-indigo-100 rounded-lg transition-colors"
            >
              {item.label}
            </a>
          ))}
        </div>
      </div>
    </div>
  )
}
