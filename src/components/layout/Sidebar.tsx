'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState } from 'react'
import {
  LayoutDashboard,
  Users,
  FileText,
  Building2,
  BarChart3,
  ChevronDown,
  ChevronRight,
  LogOut,
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

interface NavItem {
  label: string
  href?: string
  icon: React.ReactNode
  children?: { label: string; href: string }[]
}

const navItems: NavItem[] = [
  {
    label: '대시보드',
    href: '/dashboard',
    icon: <LayoutDashboard size={18} />,
  },
  {
    label: '고객 관리',
    icon: <Users size={18} />,
    children: [
      { label: '기장고객 목록', href: '/clients' },
      { label: '해지고객', href: '/clients/terminated' },
    ],
  },
  {
    label: '청구서',
    icon: <FileText size={18} />,
    children: [
      { label: '조정료 청구서', href: '/invoices/adjustment' },
      { label: '세금계산서', href: '/invoices/tax' },
    ],
  },
  {
    label: '매매사업자 관리',
    icon: <Building2 size={18} />,
    children: [
      { label: '매매사업자 데이터', href: '/traders' },
      { label: '매매사업자 체크리스트', href: '/traders/checklist' },
      { label: '부가가치세 계산', href: '/traders/vat' },
    ],
  },
  {
    label: '보고서 작성',
    icon: <BarChart3 size={18} />,
    children: [
      { label: '법인세 보고서', href: '/reports/corporate-tax' },
      { label: '종합소득세', href: '/reports/income-tax' },
      { label: '부가가치세', href: '/reports/vat' },
      { label: '결산보고서', href: '/reports/settlement' },
    ],
  },
]

export default function Sidebar() {
  const pathname = usePathname()
  const router = useRouter()
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>(() => {
    const initial: Record<string, boolean> = {}
    navItems.forEach((item) => {
      if (item.children) {
        const isActive = item.children.some((child) => pathname.startsWith(child.href))
        initial[item.label] = isActive
      }
    })
    return initial
  })

  const toggleGroup = (label: string) => {
    setOpenGroups((prev) => ({ ...prev, [label]: !prev[label] }))
  }

  const handleLogout = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  return (
    <aside className="w-60 min-h-screen bg-white border-r border-gray-200 flex flex-col">
      {/* 로고 */}
      <div className="h-16 flex items-center px-5 border-b border-gray-200">
        <div
          className="text-lg font-bold text-white px-3 py-1.5 rounded-lg"
          style={{ background: 'linear-gradient(135deg, #667eea, #764ba2)' }}
        >
          아톰세무회계
        </div>
      </div>

      {/* 네비게이션 */}
      <nav className="flex-1 py-4 overflow-y-auto">
        {navItems.map((item) => {
          if (!item.children) {
            const isActive = pathname === item.href
            return (
              <Link
                key={item.label}
                href={item.href!}
                className={`flex items-center gap-3 px-5 py-2.5 text-sm transition-colors ${
                  isActive
                    ? 'text-indigo-600 bg-indigo-50 font-medium border-r-2 border-indigo-600'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                }`}
              >
                {item.icon}
                {item.label}
              </Link>
            )
          }

          const isOpen = openGroups[item.label] ?? false
          const hasActive = item.children.some((child) => pathname.startsWith(child.href))

          return (
            <div key={item.label}>
              <button
                onClick={() => toggleGroup(item.label)}
                className={`w-full flex items-center gap-3 px-5 py-2.5 text-sm transition-colors ${
                  hasActive
                    ? 'text-indigo-600 font-medium'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                }`}
              >
                {item.icon}
                <span className="flex-1 text-left">{item.label}</span>
                {isOpen ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
              </button>
              {isOpen && (
                <div className="bg-gray-50">
                  {item.children.map((child) => {
                    const isChildActive = pathname.startsWith(child.href) &&
                      !(child.href === '/clients' && pathname.startsWith('/clients/terminated'))
                    return (
                      <Link
                        key={child.href}
                        href={child.href}
                        className={`flex items-center gap-3 pl-12 pr-5 py-2 text-sm transition-colors ${
                          isChildActive
                            ? 'text-indigo-600 bg-indigo-50 font-medium border-r-2 border-indigo-600'
                            : 'text-gray-500 hover:bg-gray-100 hover:text-gray-900'
                        }`}
                      >
                        {child.label}
                      </Link>
                    )
                  })}
                </div>
              )}
            </div>
          )
        })}
      </nav>

      {/* 로그아웃 */}
      <div className="border-t border-gray-200 p-4">
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-3 py-2.5 text-sm text-gray-500 hover:bg-gray-50 hover:text-gray-900 rounded-lg transition-colors"
        >
          <LogOut size={18} />
          로그아웃
        </button>
      </div>
    </aside>
  )
}
