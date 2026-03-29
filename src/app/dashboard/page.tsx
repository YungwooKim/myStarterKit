import { getServerSession } from 'next-auth'
import { redirect } from 'next/navigation'
import { authOptions } from '@/lib/auth'
import Navbar from '@/components/layout/Navbar'
import Sidebar from '@/components/layout/Sidebar'

/**
 * 대시보드 페이지
 * 로그인된 사용자만 접근 가능 (미들웨어에서 보호)
 */
export default async function DashboardPage() {
  const session = await getServerSession(authOptions)

  if (!session) {
    redirect('/')
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="flex">
        <Sidebar />
        <main className="flex-1 p-8">
          {/* 환영 메시지 */}
          <div className="mb-8">
            <h1 className="text-2xl font-bold text-gray-900">대시보드</h1>
            <p className="mt-1 text-gray-500">
              안녕하세요, {session.user.name}님!
            </p>
          </div>

          {/* 통계 카드 */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">계정 유형</p>
                  <p className="text-2xl font-bold text-gray-900 mt-1">
                    {session.user.role === 'ADMIN' ? '관리자' : '일반 사용자'}
                  </p>
                </div>
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                  <span className="text-blue-600 text-xl">
                    {session.user.role === 'ADMIN' ? '★' : '●'}
                  </span>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">이메일</p>
                  <p className="text-lg font-semibold text-gray-900 mt-1 truncate">
                    {session.user.email}
                  </p>
                </div>
                <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                  <span className="text-green-600 text-xl">@</span>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">상태</p>
                  <p className="text-2xl font-bold text-green-600 mt-1">활성</p>
                </div>
                <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                  <span className="text-green-600 text-xl">✓</span>
                </div>
              </div>
            </div>
          </div>

          {/* 관리자 바로가기 (관리자만 표시) */}
          {session.user.role === 'ADMIN' && (
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-800 mb-4">관리자 메뉴</h2>
              <div className="grid grid-cols-2 gap-4">
                <a
                  href="/admin/users"
                  className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg hover:bg-blue-50 hover:border-blue-200 border border-gray-200 transition-colors"
                >
                  <span className="text-2xl">👥</span>
                  <div>
                    <p className="font-medium text-gray-800">사용자 관리</p>
                    <p className="text-sm text-gray-500">사용자 목록 조회 및 관리</p>
                  </div>
                </a>
                <a
                  href="/admin/menus"
                  className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg hover:bg-blue-50 hover:border-blue-200 border border-gray-200 transition-colors"
                >
                  <span className="text-2xl">📋</span>
                  <div>
                    <p className="font-medium text-gray-800">메뉴 관리</p>
                    <p className="text-sm text-gray-500">트리 구조 메뉴 등록/수정/삭제</p>
                  </div>
                </a>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  )
}
