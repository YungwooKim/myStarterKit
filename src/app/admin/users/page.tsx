import UserTable from '@/components/admin/UserTable'

/**
 * 관리자 사용자 관리 페이지
 * UserTable 클라이언트 컴포넌트를 통해 사용자 CRUD 기능 제공
 */
export default function AdminUsersPage() {
  return (
    <div className="h-full flex flex-col">
      <div className="mb-4 flex-shrink-0">
        <h1 className="text-2xl font-bold text-gray-900">사용자 관리</h1>
        <p className="text-sm text-gray-500 mt-1">시스템 사용자를 등록하고 관리합니다.</p>
      </div>
      <div className="flex-1 min-h-0">
        <UserTable />
      </div>
    </div>
  )
}
