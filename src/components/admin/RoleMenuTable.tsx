'use client'

import { useState, useEffect, useCallback } from 'react'

/**
 * 메뉴 데이터 타입
 */
interface Menu {
  id: string
  name: string
  path: string | null
  icon: string | null
  order: number
  parentId: string | null
  isActive: boolean
  children: Menu[]
}

/**
 * RoleMenu 포함 메뉴 타입
 */
interface RoleMenuEntry {
  menu: Menu
}

/**
 * 역할 데이터 타입 (roleMenus 포함)
 */
interface RoleWithMenus {
  id: string
  name: string
  roleMenus: RoleMenuEntry[]
}

/**
 * 메뉴 트리를 평탄 배열로 변환 (깊이 정보 포함)
 * @param menus - 트리 구조 메뉴 배열
 * @param depth - 현재 깊이 (기본값 0)
 */
function flattenMenuTree(menus: Menu[], depth = 0): { menu: Menu; depth: number }[] {
  return menus.reduce<{ menu: Menu; depth: number }[]>((acc, menu) => {
    acc.push({ menu, depth })
    if (menu.children?.length > 0) {
      acc.push(...flattenMenuTree(menu.children, depth + 1))
    }
    return acc
  }, [])
}

/**
 * 역할별 메뉴 권한 관리 컴포넌트
 * 드롭다운으로 역할 선택 후 체크박스로 메뉴 권한 설정 (일괄 저장)
 */
export default function RoleMenuTable() {
  const [roles, setRoles] = useState<RoleWithMenus[]>([])
  const [allMenus, setAllMenus] = useState<Menu[]>([])
  const [selectedRoleId, setSelectedRoleId] = useState<string>('')
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const [isSaving, setIsSaving] = useState(false)

  // 로컬 편집 상태: 체크된 menuId Set
  const [pendingMenuIds, setPendingMenuIds] = useState<Set<string>>(new Set())
  // 저장된 원본 상태 (초기화용)
  const [originalMenuIds, setOriginalMenuIds] = useState<Set<string>>(new Set())

  /** 역할별 메뉴 데이터 및 전체 메뉴 목록 로드 */
  const fetchData = useCallback(async () => {
    try {
      setIsLoading(true)
      const [rolesRes, menusRes] = await Promise.all([
        fetch('/api/role-menus'),
        fetch('/api/menus'),
      ])

      if (!rolesRes.ok) throw new Error('역할 목록 조회 실패')
      if (!menusRes.ok) throw new Error('메뉴 목록 조회 실패')

      const rolesData: RoleWithMenus[] = await rolesRes.json()
      const menusData: Menu[] = await menusRes.json()

      setRoles(rolesData)
      setAllMenus(menusData)

      // 첫 번째 역할을 기본 선택
      if (rolesData.length > 0 && !selectedRoleId) {
        const firstRoleId = rolesData[0].id
        setSelectedRoleId(firstRoleId)
        const ids = new Set(rolesData[0].roleMenus.map((rm) => rm.menu.id))
        setPendingMenuIds(ids)
        setOriginalMenuIds(new Set(ids))
      }
    } catch {
      setError('데이터를 불러오는 중 오류가 발생했습니다.')
    } finally {
      setIsLoading(false)
    }
  }, [selectedRoleId])

  useEffect(() => {
    fetchData()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  /**
   * 역할 드롭다운 변경 시 pendingMenuIds와 originalMenuIds 동기화
   * @param roleId - 선택된 역할 ID
   */
  const handleRoleChange = (roleId: string) => {
    setSelectedRoleId(roleId)
    const role = roles.find((r) => r.id === roleId)
    const ids = new Set(role?.roleMenus.map((rm) => rm.menu.id) || [])
    setPendingMenuIds(ids)
    setOriginalMenuIds(new Set(ids))
  }

  /**
   * 체크박스 로컬 토글 (즉시 저장하지 않음)
   * @param menuId - 토글할 메뉴 ID
   */
  const handleToggle = (menuId: string) => {
    setPendingMenuIds((prev) => {
      const next = new Set(prev)
      if (next.has(menuId)) {
        next.delete(menuId)
      } else {
        next.add(menuId)
      }
      return next
    })
  }

  /** 편집 내용을 원본(저장된 상태)으로 초기화 */
  const handleReset = () => {
    setPendingMenuIds(new Set(originalMenuIds))
  }

  /**
   * 변경 사항을 일괄 저장
   * pendingMenuIds와 originalMenuIds 비교하여 추가/제거 API 호출
   */
  const handleSave = async () => {
    if (!selectedRoleId) return
    setIsSaving(true)

    try {
      // 추가 대상: pending에 있지만 original에 없는 것
      const toAdd = [...pendingMenuIds].filter((id) => !originalMenuIds.has(id))
      // 제거 대상: original에 있지만 pending에 없는 것
      const toRemove = [...originalMenuIds].filter((id) => !pendingMenuIds.has(id))

      // 추가 및 제거 요청 병렬 처리
      const addRequests = toAdd.map((menuId) =>
        fetch('/api/role-menus', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ roleId: selectedRoleId, menuId }),
        })
      )
      const removeRequests = toRemove.map((menuId) =>
        fetch('/api/role-menus', {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ roleId: selectedRoleId, menuId }),
        })
      )

      const results = await Promise.all([...addRequests, ...removeRequests])
      const hasError = results.some((r) => !r.ok)

      if (hasError) {
        alert('일부 항목 저장 중 오류가 발생했습니다.')
        return
      }

      // 저장 후 원본 상태 동기화 및 역할 데이터 갱신
      setOriginalMenuIds(new Set(pendingMenuIds))
      const rolesRes = await fetch('/api/role-menus')
      if (rolesRes.ok) {
        const rolesData: RoleWithMenus[] = await rolesRes.json()
        setRoles(rolesData)
      }
    } catch {
      alert('저장 중 오류가 발생했습니다.')
    } finally {
      setIsSaving(false)
    }
  }

  // 전체 메뉴를 깊이 정보와 함께 평탄 배열로 변환
  const flatMenus = flattenMenuTree(allMenus)

  // 현재 선택된 역할 정보
  const selectedRole = roles.find((r) => r.id === selectedRoleId)

  // 원본 대비 변경 사항 존재 여부
  const hasChanges =
    pendingMenuIds.size !== originalMenuIds.size ||
    [...pendingMenuIds].some((id) => !originalMenuIds.has(id))

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-40">
        <p className="text-gray-500">불러오는 중...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-4 bg-red-50 border border-red-200 rounded-md">
        <p className="text-red-600">{error}</p>
      </div>
    )
  }

  return (
    <div>
      {/* 역할 선택 드롭다운 */}
      <div className="flex items-center gap-3 mb-6">
        <label className="text-sm font-medium text-gray-700">역할 선택</label>
        <select
          value={selectedRoleId}
          onChange={(e) => handleRoleChange(e.target.value)}
          className="px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          {roles.map((role) => (
            <option key={role.id} value={role.id}>
              {role.name}
            </option>
          ))}
        </select>
      </div>

      {/* 선택된 역할의 메뉴 권한 */}
      {selectedRole && (
        <div>
          {/* 상단 정보 및 저장/초기화 버튼 */}
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm text-gray-500">
              <span className="font-medium text-gray-800">{selectedRole.name}</span> 역할의 메뉴 접근 권한
            </p>
            <div className="flex items-center gap-2">
              {hasChanges && (
                <span className="text-xs text-amber-600 font-medium">미저장 변경 사항 있음</span>
              )}
              <button
                onClick={handleReset}
                disabled={!hasChanges}
                className="px-3 py-1.5 text-sm bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 disabled:opacity-40 transition-colors"
              >
                초기화
              </button>
              <button
                onClick={handleSave}
                disabled={isSaving || !hasChanges}
                className="px-4 py-1.5 text-sm bg-blue-600 text-white font-medium rounded-md hover:bg-blue-700 disabled:opacity-40 transition-colors"
              >
                {isSaving ? '저장 중...' : '저장'}
              </button>
            </div>
          </div>

          <div className="border border-gray-200 rounded-lg overflow-hidden">
            {/* 테이블 헤더 */}
            <div className="px-4 py-3 bg-gray-50 border-b border-gray-200">
              <div className="flex items-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                <span className="flex-1">메뉴 이름</span>
                <span className="w-48">경로</span>
                <span className="w-12 text-center">허용</span>
              </div>
            </div>

            {/* 메뉴 목록 */}
            <div className="divide-y divide-gray-100">
              {flatMenus.length === 0 ? (
                <div className="px-4 py-8 text-center text-gray-400">
                  <p>등록된 메뉴가 없습니다.</p>
                </div>
              ) : (
                flatMenus.map(({ menu, depth }) => {
                  const checked = pendingMenuIds.has(menu.id)

                  return (
                    <div
                      key={menu.id}
                      className="flex items-center px-4 py-3 hover:bg-gray-50 transition-colors"
                    >
                      {/* 메뉴 이름 (트리 들여쓰기 표시) */}
                      <div className="flex-1 flex items-center">
                        <span style={{ paddingLeft: depth * 16 }} className="flex items-center gap-1">
                          {depth > 0 && (
                            <span className="text-gray-300 text-xs">└</span>
                          )}
                          <span className="text-sm text-gray-800">{menu.name}</span>
                        </span>
                      </div>

                      {/* 경로 */}
                      <div className="w-48">
                        <span className="text-xs text-gray-400 font-mono">
                          {menu.path || '-'}
                        </span>
                      </div>

                      {/* 허용 체크박스 (가장 우측) */}
                      <div className="w-12 flex justify-center">
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() => handleToggle(menu.id)}
                          className="w-4 h-4 text-blue-600 border-gray-300 rounded cursor-pointer"
                        />
                      </div>
                    </div>
                  )
                })
              )}
            </div>
          </div>

          <p className="mt-3 text-xs text-gray-400">
            체크박스를 변경한 후 저장 버튼을 눌러야 반영됩니다.
          </p>
        </div>
      )}
    </div>
  )
}
