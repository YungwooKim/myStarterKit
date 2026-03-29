'use client'

import { signOut, useSession } from 'next-auth/react'
import Link from 'next/link'

/**
 * 역할 ID를 한국어 표시명으로 변환
 * @param role - 역할 ID (ADMIN, HR, USER 등)
 */
function getRoleDisplayName(role: string): string {
  const roleNames: Record<string, string> = {
    ADMIN: '관리자',
    HR: '인사담당자',
    USER: '일반사용자',
  }
  return roleNames[role] ?? role
}

/**
 * 상단 네비게이션 바 컴포넌트
 * 로그인된 사용자 정보와 역할 배지, 로그아웃 버튼을 표시
 */
export default function Navbar() {
  const { data: session } = useSession()

  /**
   * 로그아웃 처리
   * 세션을 종료하고 로그인 페이지로 이동
   */
  const handleSignOut = async () => {
    await signOut({ callbackUrl: '/' })
  }

  return (
    <nav className="bg-white border-b border-gray-200 px-6 py-3 flex items-center justify-between">
      {/* 로고 및 브랜드 */}
      <div className="flex items-center gap-4">
        <Link href="/dashboard" className="text-xl font-bold text-blue-600">
          StarterKit
        </Link>
      </div>

      {/* 사용자 정보 및 메뉴 */}
      <div className="flex items-center gap-4">
        {session?.user && (
          <>
            {/* 관리자인 경우 관리자 메뉴 링크 표시 */}
            {session.user.role === 'ADMIN' && (
              <Link
                href="/admin"
                className="text-sm text-gray-600 hover:text-blue-600 transition-colors"
              >
                관리자
              </Link>
            )}
            <span className="text-sm text-gray-600">
              {session.user.name}
              <span className="ml-1 px-1.5 py-0.5 text-xs bg-blue-100 text-blue-700 rounded">
                {getRoleDisplayName(session.user.role)}
              </span>
            </span>
            <button
              onClick={handleSignOut}
              className="text-sm text-gray-500 hover:text-red-600 transition-colors"
            >
              로그아웃
            </button>
          </>
        )}
      </div>
    </nav>
  )
}
