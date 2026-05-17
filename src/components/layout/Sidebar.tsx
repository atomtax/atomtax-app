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
  ClipboardList,
  ChevronDown,
  ChevronRight,
  ExternalLink,
  LogOut,
  FlaskConical,
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import AtomLogo from '@/components/ui/AtomLogo'

interface NavItem {
  label: string
  href?: string
  icon: React.ReactNode
  children?: NavChild[]
}

interface NavChild {
  label: string
  href: string
  /** true이면 새 탭 외부 링크 — active 하이라이트 대상 제외 */
  external?: boolean
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
    label: '결산참고',
    icon: <ClipboardList size={18} />,
    children: [
      { label: '부가가치세', href: '/reports-review/vat' },
      { label: '종합소득세', href: '/reports-review/income-tax' },
      { label: '법인세', href: '/reports-review/corporate-tax' },
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
      { label: '부가가치세 계산', href: '/calculator/vat/calc', external: true },
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

  /** 정확히 일치하거나 하위 경로일 때만 매칭 (false-positive 방지) */
  function isPrefixMatch(href: string): boolean {
    return pathname === href || pathname.startsWith(href + '/')
  }

  /** 자식 중 가장 긴 prefix 매치 — 형제 경로 충돌 시 더 구체적인 메뉴만 active */
  function getActiveChildHref(children: NavChild[]): string | null {
    const matches = children.filter((c) => !c.external && isPrefixMatch(c.href))
    if (matches.length === 0) return null
    return matches.reduce((best, c) =>
      c.href.length > best.href.length ? c : best,
    ).href
  }

  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>(() => {
    const initial: Record<string, boolean> = {}
    navItems.forEach((item) => {
      if (item.children) {
        initial[item.label] = getActiveChildHref(item.children) !== null
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

  const isAtomLabActive = isPrefixMatch('/atom-lab')

  return (
    <aside
      className="w-60 min-h-screen flex flex-col text-white"
      style={{ background: 'var(--sidebar-grad)' }}
    >
      {/* 로고 */}
      <div className="h-16 flex items-center gap-2.5 px-5 border-b border-white/10">
        <AtomLogo size={32} className="text-white shrink-0" />
        <div className="text-white text-lg font-extrabold font-outfit tracking-[0.08em]">
          ATOM BASE
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
                    ? 'bg-white/15 text-white font-semibold shadow-[inset_0_0_0_1px_rgba(255,255,255,0.2)]'
                    : 'text-white/85 hover:bg-white/10 hover:text-white'
                }`}
              >
                {item.icon}
                {item.label}
              </Link>
            )
          }

          const isOpen = openGroups[item.label] ?? false
          const activeChildHref = getActiveChildHref(item.children)
          const hasActive = activeChildHref !== null

          return (
            <div key={item.label}>
              <button
                onClick={() => toggleGroup(item.label)}
                className={`w-full flex items-center gap-3 px-5 py-2.5 text-sm transition-colors ${
                  hasActive
                    ? 'text-white font-semibold'
                    : 'text-white/85 hover:bg-white/10 hover:text-white'
                }`}
              >
                {item.icon}
                <span className="flex-1 text-left">{item.label}</span>
                {isOpen ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
              </button>
              {isOpen && (
                <div className="bg-black/10">
                  {item.children.map((child) => {
                    const isChildActive = !child.external && child.href === activeChildHref

                    if (child.external) {
                      return (
                        <a
                          key={child.href}
                          href={child.href}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-3 pl-12 pr-5 py-2 text-sm text-white/75 hover:bg-white/10 hover:text-white transition-colors"
                        >
                          <span className="flex-1">{child.label}</span>
                          <ExternalLink size={12} className="opacity-60" />
                        </a>
                      )
                    }

                    return (
                      <Link
                        key={child.href}
                        href={child.href}
                        onClick={(e) => {
                          // 같은 경로면 강제 새로고침 (Next.js Link는 same-path 시 동작 안 함)
                          if (pathname === child.href) {
                            e.preventDefault()
                            window.location.reload()
                          }
                        }}
                        className={`flex items-center gap-3 pl-12 pr-5 py-2 text-sm transition-colors ${
                          isChildActive
                            ? 'bg-white/15 text-white font-semibold shadow-[inset_0_0_0_1px_rgba(255,255,255,0.2)]'
                            : 'text-white/75 hover:bg-white/10 hover:text-white'
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

        {/* 아톰랩 — EXPERIMENT 섹션 */}
        <div className="mt-4 mx-4 border-t border-dashed border-white/20" />
        <div className="px-5 pt-3 pb-1 text-[10px] tracking-[1.5px] text-yellow-300 font-bold font-mono">
          EXPERIMENT
        </div>
        <Link
          href="/atom-lab"
          className={`flex items-center gap-3 px-5 py-2.5 text-sm transition-colors ${
            isAtomLabActive
              ? 'bg-white/15 text-white font-semibold shadow-[inset_0_0_0_1px_rgba(255,255,255,0.2)]'
              : 'text-white/85 hover:bg-white/10 hover:text-white'
          }`}
        >
          <FlaskConical size={18} className="text-yellow-300" />
          아톰랩
        </Link>
      </nav>

      {/* 로그아웃 */}
      <div className="border-t border-white/10 p-4">
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-3 py-2.5 text-sm text-white/80 hover:bg-white/10 hover:text-white rounded-lg transition-colors"
        >
          <LogOut size={18} />
          로그아웃
        </button>
      </div>
    </aside>
  )
}
