import Sidebar from '@/components/layout/Sidebar'

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="flex h-screen overflow-hidden bg-gray-50 print:h-auto print:overflow-visible print:block">
      <Sidebar />
      <main className="flex-1 overflow-y-auto p-8 print:overflow-visible print:p-0">
        {children}
      </main>
    </div>
  )
}
