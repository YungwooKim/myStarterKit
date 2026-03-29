import { getServerSession } from 'next-auth'
import { redirect } from 'next/navigation'
import { authOptions } from '@/lib/auth'
import Navbar from '@/components/layout/Navbar'
import Sidebar from '@/components/layout/Sidebar'

/**
 * 관리자 영역 공통 레이아웃
 * ADMIN 역할 또는 allowedPaths에 /admin 경로가 있는 사용자 접근 허용
 * (미들웨어 1차 보호 + 레이아웃 2차 보호)
 */
export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await getServerSession(authOptions)

  // ADMIN 이거나 allowedPaths 중 /admin 경로가 하나라도 있으면 접근 허용
  const allowedPaths = session?.user?.allowedPaths || []
  const hasAdminAccess =
    session?.user?.role === 'ADMIN' ||
    allowedPaths.some((p) => p.startsWith('/admin'))

  if (!session || !hasAdminAccess) {
    redirect('/dashboard')
  }

  return (
    <div className="h-screen flex flex-col bg-gray-50">
      <Navbar />
      <div className="flex flex-1 overflow-hidden">
        <Sidebar />
        <main className="flex-1 overflow-auto p-8">{children}</main>
      </div>
    </div>
  )
}
