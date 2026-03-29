import RoleMenuTable from '@/components/admin/RoleMenuTable'

/**
 * 관리자 역할별 메뉴 권한 관리 페이지 (서버 컴포넌트)
 * RoleMenuTable 클라이언트 컴포넌트를 통해 역할별 메뉴 권한을 설정
 */
export default function RoleMenusPage() {
  return (
    <div className="h-full flex flex-col">
      <div className="mb-4 flex-shrink-0">
        <h1 className="text-2xl font-bold text-gray-900">역할별 메뉴 권한</h1>
        <p className="text-sm text-gray-500 mt-1">역할별로 접근 가능한 메뉴를 설정합니다.</p>
      </div>
      <div className="flex-1 min-h-0">
        <RoleMenuTable />
      </div>
    </div>
  )
}
