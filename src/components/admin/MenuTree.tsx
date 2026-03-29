'use client'

import { useState, useEffect, useCallback } from 'react'

/**
 * 메뉴 데이터 타입 (트리 구조)
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
 * 메뉴 편집 폼 데이터 타입
 */
interface MenuFormData {
  name: string
  path: string
  icon: string
  order: number
  parentId: string
  isActive: boolean
}

const defaultFormData: MenuFormData = {
  name: '',
  path: '',
  icon: '',
  order: 0,
  parentId: '',
  isActive: true,
}

/**
 * 메뉴 트리를 평탄화 (검색 및 부모 선택 드롭다운용)
 * @param menus - 트리 구조 메뉴 배열
 * @param depth - 현재 깊이 (기본값 0)
 */
function flattenMenus(menus: Menu[], depth = 0): { menu: Menu; depth: number }[] {
  return menus.reduce<{ menu: Menu; depth: number }[]>((acc, menu) => {
    acc.push({ menu, depth })
    if (menu.children?.length > 0) {
      acc.push(...flattenMenus(menu.children, depth + 1))
    }
    return acc
  }, [])
}

/**
 * 메뉴 트리 아이템 컴포넌트 (재귀 렌더링)
 * @param menu - 메뉴 데이터
 * @param depth - 들여쓰기 깊이
 * @param selectedId - 현재 선택된 메뉴 ID
 * @param onSelect - 선택 핸들러
 */
function MenuTreeItem({
  menu,
  depth,
  selectedId,
  onSelect,
}: {
  menu: Menu
  depth: number
  selectedId: string | null
  onSelect: (menu: Menu) => void
}) {
  return (
    <div>
      <div
        onClick={() => onSelect(menu)}
        className={`flex items-center justify-between py-2.5 px-3 cursor-pointer rounded-md transition-colors ${
          selectedId === menu.id
            ? 'bg-blue-50 border-l-2 border-blue-500'
            : 'hover:bg-gray-50'
        } ${depth > 0 ? 'border-l-2 border-gray-200' : ''}`}
        style={{ marginLeft: depth * 20 }}
      >
        <div className="flex items-center gap-2 min-w-0">
          {depth > 0 && <span className="text-gray-300 text-xs flex-shrink-0">└</span>}
          <div className="min-w-0">
            <span className="text-sm font-medium text-gray-800 truncate">{menu.name}</span>
            {menu.path && (
              <span className="ml-2 text-xs text-gray-400 truncate">{menu.path}</span>
            )}
            {!menu.isActive && (
              <span className="ml-2 px-1.5 py-0.5 text-xs bg-gray-100 text-gray-500 rounded">
                비활성
              </span>
            )}
          </div>
        </div>
      </div>
      {/* 자식 메뉴 재귀 렌더링 */}
      {menu.children?.map((child) => (
        <MenuTreeItem
          key={child.id}
          menu={child}
          depth={depth + 1}
          selectedId={selectedId}
          onSelect={onSelect}
        />
      ))}
    </div>
  )
}

/**
 * 관리자 메뉴 트리 관리 컴포넌트 (Grid-Detail 구조)
 * 좌측 트리 목록 패널 + 우측 편집 패널로 구성
 */
export default function MenuTree() {
  const [menus, setMenus] = useState<Menu[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')

  // 선택된 메뉴 및 편집 폼 상태
  const [selectedMenu, setSelectedMenu] = useState<Menu | null>(null)
  const [editForm, setEditForm] = useState<MenuFormData | null>(null)
  const [formError, setFormError] = useState('')
  const [isSaving, setIsSaving] = useState(false)

  // 검색 및 신규 추가 모드 상태
  const [searchQuery, setSearchQuery] = useState('')
  const [addMode, setAddMode] = useState(false)
  const [addForm, setAddForm] = useState<MenuFormData>(defaultFormData)
  const [addFormError, setAddFormError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  /** 메뉴 목록 조회 */
  const fetchMenus = useCallback(async () => {
    try {
      setIsLoading(true)
      const response = await fetch('/api/menus')
      if (!response.ok) throw new Error('메뉴 목록 조회 실패')
      const data = await response.json()
      setMenus(data)
    } catch {
      setError('메뉴 목록을 불러오는 중 오류가 발생했습니다.')
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchMenus()
  }, [fetchMenus])

  /**
   * 메뉴 행 클릭 시 상세 패널 열기
   * @param menu - 선택된 메뉴
   */
  const handleSelectMenu = (menu: Menu) => {
    setSelectedMenu(menu)
    setEditForm({
      name: menu.name,
      path: menu.path || '',
      icon: menu.icon || '',
      order: menu.order,
      parentId: menu.parentId || '',
      isActive: menu.isActive,
    })
    setAddMode(false)
    setFormError('')
  }

  /** 새 메뉴 추가 모드 활성화 */
  const handleStartAddMode = () => {
    setAddMode(true)
    setSelectedMenu(null)
    setEditForm(null)
    setAddForm(defaultFormData)
    setAddFormError('')
  }

  /** 편집 폼을 선택된 메뉴의 원래 값으로 초기화 (DB 저장 없음) */
  const handleResetEditForm = () => {
    if (!selectedMenu) return
    setEditForm({
      name: selectedMenu.name,
      path: selectedMenu.path || '',
      icon: selectedMenu.icon || '',
      order: selectedMenu.order,
      parentId: selectedMenu.parentId || '',
      isActive: selectedMenu.isActive,
    })
    setFormError('')
  }

  /**
   * 메뉴 정보 저장 (PUT 호출)
   */
  const handleSave = async () => {
    if (!selectedMenu || !editForm) return
    if (!editForm.name.trim()) {
      setFormError('메뉴 이름은 필수입니다.')
      return
    }
    setIsSaving(true)
    setFormError('')

    try {
      const payload = {
        name: editForm.name,
        path: editForm.path || null,
        icon: editForm.icon || null,
        order: editForm.order,
        parentId: editForm.parentId || null,
        isActive: editForm.isActive,
      }

      const response = await fetch(`/api/menus/${selectedMenu.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      const data = await response.json()

      if (!response.ok) {
        setFormError(data.error || '저장 중 오류가 발생했습니다.')
        return
      }

      await fetchMenus()
      // 저장된 값으로 selectedMenu 동기화
      setSelectedMenu((prev) => prev ? { ...prev, ...payload, id: prev.id, children: prev.children } : null)
    } catch {
      setFormError('저장 중 오류가 발생했습니다.')
    } finally {
      setIsSaving(false)
    }
  }

  /**
   * 메뉴 삭제 처리
   */
  const handleDelete = async () => {
    if (!selectedMenu) return
    if (!confirm(`"${selectedMenu.name}" 메뉴를 삭제하시겠습니까?`)) return

    try {
      const response = await fetch(`/api/menus/${selectedMenu.id}`, { method: 'DELETE' })
      const data = await response.json()

      if (!response.ok) {
        alert(data.error || '삭제 처리 중 오류가 발생했습니다.')
        return
      }

      alert(data.message)
      setSelectedMenu(null)
      setEditForm(null)
      fetchMenus()
    } catch {
      alert('삭제 처리 중 오류가 발생했습니다.')
    }
  }

  /**
   * 새 메뉴 추가 폼 제출 (POST 호출)
   */
  const handleAddMenu = async (e: React.FormEvent) => {
    e.preventDefault()
    setAddFormError('')
    setIsSubmitting(true)

    try {
      const payload = {
        name: addForm.name,
        path: addForm.path || null,
        icon: addForm.icon || null,
        order: addForm.order,
        parentId: addForm.parentId || null,
        isActive: addForm.isActive,
      }

      const response = await fetch('/api/menus', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      const data = await response.json()

      if (!response.ok) {
        setAddFormError(data.error || '처리 중 오류가 발생했습니다.')
        return
      }

      // 등록 후 목록 갱신 및 추가 모드 종료
      setAddMode(false)
      setAddForm(defaultFormData)
      fetchMenus()
    } catch {
      setAddFormError('처리 중 오류가 발생했습니다.')
    } finally {
      setIsSubmitting(false)
    }
  }

  // 전체 메뉴 평탄화 목록
  const flatMenuList = flattenMenus(menus)

  // 검색 시 평탄 목록 필터링, 아닐 때 트리 구조 표시
  const searchActive = searchQuery.trim().length > 0
  const filteredFlat = flatMenuList.filter(
    ({ menu }) =>
      menu.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (menu.path || '').toLowerCase().includes(searchQuery.toLowerCase())
  )

  // 부모 메뉴 선택용 평탄화 목록 (현재 편집 중인 메뉴 제외)
  const parentOptions = flatMenuList.filter(
    ({ menu }) => !selectedMenu || menu.id !== selectedMenu.id
  )

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
    <div className="flex gap-4 h-full">
      {/* 좌측: 메뉴 목록 패널 */}
      <div className="w-80 flex-shrink-0 bg-white rounded-xl border border-gray-200 flex flex-col">
        {/* 검색 및 추가 버튼 */}
        <div className="p-4 border-b border-gray-200 space-y-2">
          <input
            type="text"
            placeholder="메뉴 이름 또는 경로 검색"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            onClick={handleStartAddMode}
            className="w-full px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 transition-colors"
          >
            새 메뉴 추가
          </button>
        </div>

        {/* 메뉴 트리 또는 검색 결과 목록 */}
        <div className="flex-1 overflow-y-auto p-3">
          {searchActive ? (
            // 검색 중: 평탄화된 목록 표시
            filteredFlat.length === 0 ? (
              <div className="py-6 text-center text-gray-400 text-sm">검색 결과가 없습니다.</div>
            ) : (
              filteredFlat.map(({ menu, depth }) => (
                <div
                  key={menu.id}
                  onClick={() => handleSelectMenu(menu)}
                  style={{ paddingLeft: depth * 16 }}
                  className={`flex items-center gap-1 py-2 px-3 cursor-pointer rounded-md text-sm transition-colors ${
                    selectedMenu?.id === menu.id
                      ? 'bg-blue-50 text-blue-700 font-medium'
                      : 'text-gray-800 hover:bg-gray-50'
                  }`}
                >
                  {depth > 0 && <span className="text-gray-300 text-xs">└</span>}
                  <span>{menu.name}</span>
                  {menu.path && <span className="ml-1 text-xs text-gray-400">{menu.path}</span>}
                </div>
              ))
            )
          ) : (
            // 검색 없음: 트리 구조 표시
            menus.length === 0 ? (
              <div className="py-6 text-center text-gray-400 text-sm">등록된 메뉴가 없습니다.</div>
            ) : (
              menus.map((menu) => (
                <MenuTreeItem
                  key={menu.id}
                  menu={menu}
                  depth={0}
                  selectedId={selectedMenu?.id || null}
                  onSelect={handleSelectMenu}
                />
              ))
            )
          )}
        </div>

        {/* 하단 집계 */}
        <div className="px-4 py-2 border-t border-gray-100">
          <p className="text-xs text-gray-400">총 {flatMenuList.length}개 메뉴</p>
        </div>
      </div>

      {/* 우측: 상세/등록 패널 */}
      <div className="flex-1 bg-white rounded-xl border border-gray-200 flex flex-col overflow-hidden">
        {/* 새 메뉴 추가 모드 */}
        {addMode && (
          <>
            {/* 새 메뉴 추가 헤더 */}
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between flex-shrink-0">
              <div>
                <h2 className="text-lg font-semibold text-gray-800">새 메뉴 추가</h2>
                <p className="text-xs text-gray-400 mt-0.5">정보를 입력한 후 추가하세요.</p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="submit"
                  form="addMenuForm"
                  disabled={isSubmitting}
                  className="px-3 py-1.5 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 disabled:opacity-50 transition-colors"
                >
                  {isSubmitting ? '처리 중...' : '추가'}
                </button>
                <button
                  type="button"
                  onClick={() => setAddMode(false)}
                  className="px-3 py-1.5 bg-gray-200 text-gray-700 text-sm font-medium rounded-md hover:bg-gray-300 transition-colors"
                >
                  취소
                </button>
              </div>
            </div>
            {/* 새 메뉴 추가 폼 - 스크롤 가능 */}
            <div className="flex-1 overflow-y-auto p-6">
              <form id="addMenuForm" onSubmit={handleAddMenu} className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">
                    메뉴 이름 <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={addForm.name}
                    onChange={(e) => setAddForm((p) => ({ ...p, name: e.target.value }))}
                    required
                    placeholder="메뉴 이름"
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">경로 (Path)</label>
                  <input
                    type="text"
                    value={addForm.path}
                    onChange={(e) => setAddForm((p) => ({ ...p, path: e.target.value }))}
                    placeholder="/example/path"
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">아이콘</label>
                  <input
                    type="text"
                    value={addForm.icon}
                    onChange={(e) => setAddForm((p) => ({ ...p, icon: e.target.value }))}
                    placeholder="아이콘 이름 (예: home)"
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">정렬 순서</label>
                  <input
                    type="number"
                    value={addForm.order}
                    onChange={(e) => setAddForm((p) => ({ ...p, order: parseInt(e.target.value) || 0 }))}
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">부모 메뉴</label>
                  <select
                    value={addForm.parentId}
                    onChange={(e) => setAddForm((p) => ({ ...p, parentId: e.target.value }))}
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">최상위 메뉴</option>
                    {flatMenuList.map(({ menu, depth }) => (
                      <option key={menu.id} value={menu.id}>
                        {'　'.repeat(depth)}{depth > 0 ? '└ ' : ''}{menu.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={addForm.isActive}
                      onChange={(e) => setAddForm((p) => ({ ...p, isActive: e.target.checked }))}
                      className="w-4 h-4 text-blue-600 rounded"
                    />
                    <span className="text-sm text-gray-700">활성화</span>
                  </label>
                </div>

                {addFormError && (
                  <div className="p-3 bg-red-50 border border-red-200 rounded-md">
                    <p className="text-sm text-red-600">{addFormError}</p>
                  </div>
                )}
              </form>
            </div>
          </>
        )}

        {/* 메뉴 상세 편집 모드 */}
        {!addMode && selectedMenu && editForm && (
          <>
            {/* 메뉴 편집 헤더 */}
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between flex-shrink-0">
              <div>
                <h2 className="text-lg font-semibold text-gray-800">{selectedMenu.name} 편집</h2>
                <p className="text-xs text-gray-400 mt-0.5">메뉴 정보를 수정한 후 저장하세요.</p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={handleSave}
                  disabled={isSaving}
                  className="px-3 py-1.5 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 disabled:opacity-50 transition-colors"
                >
                  {isSaving ? '저장 중...' : '저장'}
                </button>
                <button
                  onClick={handleResetEditForm}
                  className="px-3 py-1.5 bg-gray-200 text-gray-700 text-sm font-medium rounded-md hover:bg-gray-300 transition-colors"
                >
                  초기화
                </button>
                <button
                  onClick={handleDelete}
                  className="px-3 py-1.5 bg-red-100 text-red-700 text-sm font-medium rounded-md hover:bg-red-200 transition-colors"
                >
                  삭제
                </button>
              </div>
            </div>
            {/* 폼 영역 - 스크롤 가능 */}
            <div className="flex-1 overflow-y-auto p-6">
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">
                    메뉴 이름 <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={editForm.name}
                    onChange={(e) => setEditForm((p) => p ? { ...p, name: e.target.value } : p)}
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">경로 (Path)</label>
                  <input
                    type="text"
                    value={editForm.path}
                    onChange={(e) => setEditForm((p) => p ? { ...p, path: e.target.value } : p)}
                    placeholder="/example/path"
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">아이콘</label>
                  <input
                    type="text"
                    value={editForm.icon}
                    onChange={(e) => setEditForm((p) => p ? { ...p, icon: e.target.value } : p)}
                    placeholder="아이콘 이름 (예: home)"
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">정렬 순서</label>
                  <input
                    type="number"
                    value={editForm.order}
                    onChange={(e) => setEditForm((p) => p ? { ...p, order: parseInt(e.target.value) || 0 } : p)}
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">부모 메뉴</label>
                  <select
                    value={editForm.parentId}
                    onChange={(e) => setEditForm((p) => p ? { ...p, parentId: e.target.value } : p)}
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">최상위 메뉴</option>
                    {parentOptions.map(({ menu, depth }) => (
                      <option key={menu.id} value={menu.id}>
                        {'　'.repeat(depth)}{depth > 0 ? '└ ' : ''}{menu.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={editForm.isActive}
                      onChange={(e) => setEditForm((p) => p ? { ...p, isActive: e.target.checked } : p)}
                      className="w-4 h-4 text-blue-600 rounded"
                    />
                    <span className="text-sm text-gray-700">활성화</span>
                  </label>
                </div>
              </div>

              {formError && (
                <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-md">
                  <p className="text-sm text-red-600">{formError}</p>
                </div>
              )}
            </div>
          </>
        )}

        {/* 안내 텍스트 (아무것도 선택되지 않은 상태) */}
        {!addMode && !selectedMenu && (
          <div className="flex items-center justify-center h-full text-gray-400">
            <p className="text-sm">목록에서 메뉴를 선택하세요.</p>
          </div>
        )}
      </div>
    </div>
  )
}
