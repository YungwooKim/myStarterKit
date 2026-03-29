import Link from 'next/link'

/**
 * 관리자 홈 페이지
 * 관리자 기능 진입점 및 메뉴 바로가기 제공
 */
export default function AdminPage() {
  const adminMenus = [
    {
      title: '사용자 관리',
      description: '사용자 목록 조회, 등록, 삭제, 비밀번호 초기화',
      href: '/admin/users',
      icon: '👥',
      color: 'blue',
    },
    {
      title: '메뉴 관리',
      description: '트리 구조 메뉴 등록, 수정, 삭제',
      href: '/admin/menus',
      icon: '📋',
      color: 'green',
    },
  ]

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">관리자 홈</h1>
        <p className="mt-1 text-gray-500">시스템 관리 기능을 이용하세요.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {adminMenus.map((menu) => (
          <Link
            key={menu.href}
            href={menu.href}
            className="bg-white rounded-xl border border-gray-200 p-6 hover:shadow-md hover:border-blue-200 transition-all"
          >
            <div className="flex items-start gap-4">
              <span className="text-4xl">{menu.icon}</span>
              <div>
                <h2 className="text-lg font-semibold text-gray-800">{menu.title}</h2>
                <p className="mt-1 text-sm text-gray-500">{menu.description}</p>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  )
}
