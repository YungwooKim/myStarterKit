import Link from 'next/link'
import { prisma } from '@/lib/prisma'

/**
 * 관리자 역할 관리 페이지 (서버 컴포넌트)
 * 역할 목록과 각 역할의 사용자 수, 메뉴 수를 표시
 */
export default async function AdminRolesPage() {
  // 역할 목록 조회 (사용자 수, 메뉴 수 포함)
  const roles = await prisma.userRole.findMany({
    include: {
      _count: {
        select: {
          users: true,
          roleMenus: true,
        },
      },
    },
    orderBy: { id: 'asc' },
  })

  return (
    <div className="h-full flex flex-col">
      <div className="mb-4 flex-shrink-0">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">역할 관리</h1>
            <p className="text-sm text-gray-500 mt-1">
              시스템에 등록된 사용자 역할 목록을 확인합니다.
            </p>
          </div>
          {/* 역할별 메뉴 권한 관리 링크 버튼 */}
          <Link
            href="/admin/role-menus"
            className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 transition-colors"
          >
            역할별 메뉴 권한 관리
          </Link>
        </div>
      </div>

      <div className="flex-1 min-h-0 bg-white rounded-xl border border-gray-200 p-6 overflow-auto">
        <p className="text-sm text-gray-500 mb-4">총 {roles.length}개 역할</p>

        <div className="overflow-x-auto rounded-lg border border-gray-200">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-4 py-3 text-left font-medium text-gray-600">역할 ID</th>
                <th className="px-4 py-3 text-left font-medium text-gray-600">역할 이름</th>
                <th className="px-4 py-3 text-left font-medium text-gray-600">사용자 수</th>
                <th className="px-4 py-3 text-left font-medium text-gray-600">메뉴 권한 수</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {roles.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-4 py-8 text-center text-gray-400">
                    등록된 역할이 없습니다.
                  </td>
                </tr>
              ) : (
                roles.map((role) => (
                  <tr key={role.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      {/* 역할 ID 배지 */}
                      <span className="px-2 py-1 text-xs font-semibold bg-gray-100 text-gray-700 rounded">
                        {role.id}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-medium text-gray-900">{role.name}</td>
                    <td className="px-4 py-3 text-gray-600">
                      {role._count.users.toLocaleString()}명
                    </td>
                    <td className="px-4 py-3 text-gray-600">
                      {role._count.roleMenus}개
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <p className="mt-4 text-xs text-gray-400">
          역할 추가/삭제 기능은 추후 지원 예정입니다.
        </p>
      </div>
    </div>
  )
}
