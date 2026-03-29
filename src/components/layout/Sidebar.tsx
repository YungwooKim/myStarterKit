'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useEffect, useState } from 'react'

/**
 * API에서 반환하는 메뉴 아이템 타입
 */
interface MenuItem {
  id: string
  name: string
  path: string | null
  icon: string | null
  order: number
  parentId: string | null
  isActive: boolean
  children: MenuItem[]
}

/**
 * 사이드바 컴포넌트
 * /api/menus에서 역할 기반 필터링된 메뉴를 동적으로 로드하여 표시
 * 부모-자식 트리 구조 렌더링 지원
 */
export default function Sidebar() {
  const pathname = usePathname()
  const [menus, setMenus] = useState<MenuItem[]>([])
  const [isLoading, setIsLoading] = useState(true)

  /**
   * 역할 기반 메뉴 목록 조회
   * 서버에서 현재 사용자의 역할에 맞게 필터링된 메뉴를 반환함
   */
  useEffect(() => {
    const fetchMenus = async () => {
      try {
        const response = await fetch('/api/menus')
        if (!response.ok) return
        const data = await response.json()
        setMenus(data)
      } catch {
        // 메뉴 로드 실패 시 빈 목록으로 처리 (레이아웃이 깨지지 않도록)
      } finally {
        setIsLoading(false)
      }
    }

    fetchMenus()
  }, [])

  /**
   * 메뉴 아이템 렌더링 (재귀적으로 자식 메뉴 포함)
   * @param item - 렌더링할 메뉴 아이템
   * @param depth - 들여쓰기 깊이 (0: 최상위)
   */
  const renderMenuItem = (item: MenuItem, depth = 0) => {
    const href = item.path || '#'
    // 현재 경로가 해당 메뉴 경로와 일치하거나 하위 경로인 경우 활성화
    const isActive = item.path
      ? pathname === item.path || pathname.startsWith(item.path + '/')
      : false

    return (
      <li key={item.id}>
        <Link
          href={href}
          className={`flex items-center px-3 py-2 text-sm rounded-md transition-colors ${
            depth > 0 ? 'ml-4' : ''
          } ${
            isActive
              ? 'bg-blue-100 text-blue-700 font-medium'
              : 'text-gray-700 hover:bg-gray-100'
          }`}
        >
          {item.name}
        </Link>
        {/* 자식 메뉴가 있으면 재귀 렌더링 */}
        {item.children && item.children.length > 0 && (
          <ul className="mt-1 space-y-1">
            {item.children.map((child) => renderMenuItem(child, depth + 1))}
          </ul>
        )}
      </li>
    )
  }

  return (
    <aside className="w-60 min-h-screen bg-gray-50 border-r border-gray-200 py-6">
      <nav className="px-3">
        {isLoading ? (
          // 메뉴 로드 중 스켈레톤 표시
          <div className="space-y-2">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-8 bg-gray-200 rounded-md animate-pulse" />
            ))}
          </div>
        ) : (
          <ul className="space-y-1">
            {menus.map((item) => renderMenuItem(item))}
          </ul>
        )}
      </nav>
    </aside>
  )
}
