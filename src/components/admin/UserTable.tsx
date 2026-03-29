'use client'

import { useState, useEffect, useCallback } from 'react'

/**
 * 역할 타입
 */
interface UserRole {
  id: string
  name: string
}

/**
 * 사용자 데이터 타입
 */
interface User {
  id: string
  email: string
  name: string
  roleId: string
  userRole?: UserRole
  createdAt: string
}

/**
 * 사용자 등록 폼 데이터 타입
 */
interface UserFormData {
  name: string
  email: string
  password: string
  roleId: string
}

/**
 * 역할 배지 컴포넌트
 * @param roleId - 역할 ID
 * @param roleName - 역할 이름
 */
function RoleBadge({ roleId, roleName }: { roleId: string; roleName?: string }) {
  const colorMap: Record<string, string> = {
    ADMIN: 'bg-purple-100 text-purple-700',
    HR: 'bg-blue-100 text-blue-700',
    USER: 'bg-gray-100 text-gray-600',
  }
  const color = colorMap[roleId] || 'bg-gray-100 text-gray-600'
  return (
    <span className={`inline-block px-2 py-0.5 text-xs font-medium rounded ${color}`}>
      {roleName || roleId}
    </span>
  )
}

/**
 * 관리자 사용자 관리 컴포넌트 (Grid-Detail 구조)
 * 좌측 목록 패널 + 우측 상세 편집 패널로 구성
 */
export default function UserTable() {
  const [users, setUsers] = useState<User[]>([])
  const [roles, setRoles] = useState<UserRole[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')

  // 선택된 사용자 및 편집 폼 상태
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const [editForm, setEditForm] = useState<{ name: string; roleId: string } | null>(null)
  const [isSaving, setIsSaving] = useState(false)

  // 검색 및 신규 등록 모드 상태
  const [searchQuery, setSearchQuery] = useState('')
  const [addMode, setAddMode] = useState(false)
  const [addForm, setAddForm] = useState<UserFormData>({
    name: '',
    email: '',
    password: '',
    roleId: 'USER',
  })
  const [addFormError, setAddFormError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  /** 역할 목록 조회 */
  const fetchRoles = useCallback(async () => {
    try {
      const response = await fetch('/api/roles')
      if (!response.ok) return
      const data = await response.json()
      setRoles(data)
    } catch {
      // 역할 목록 조회 실패 시 무시
    }
  }, [])

  /** 사용자 목록 조회 */
  const fetchUsers = useCallback(async () => {
    try {
      setIsLoading(true)
      const response = await fetch('/api/users')
      if (!response.ok) throw new Error('사용자 목록 조회 실패')
      const data = await response.json()
      setUsers(data)
    } catch {
      setError('사용자 목록을 불러오는 중 오류가 발생했습니다.')
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchRoles()
    fetchUsers()
  }, [fetchRoles, fetchUsers])

  /**
   * 사용자 행 클릭 시 상세 패널 열기
   * @param user - 선택된 사용자
   */
  const handleSelectUser = (user: User) => {
    setSelectedUser(user)
    setEditForm({ name: user.name, roleId: user.roleId })
    setAddMode(false)
  }

  /** 새 사용자 등록 모드 활성화 */
  const handleStartAddMode = () => {
    setAddMode(true)
    setSelectedUser(null)
    setEditForm(null)
    setAddForm({ name: '', email: '', password: '', roleId: roles[0]?.id || 'USER' })
    setAddFormError('')
  }

  /** 편집 폼을 선택된 사용자의 원래 값으로 초기화 (DB 저장 없음) */
  const handleResetEditForm = () => {
    if (!selectedUser) return
    setEditForm({ name: selectedUser.name, roleId: selectedUser.roleId })
  }

  /**
   * 사용자 정보 저장 (name, roleId PATCH 호출)
   */
  const handleSave = async () => {
    if (!selectedUser || !editForm) return
    setIsSaving(true)

    try {
      const response = await fetch(`/api/users/${selectedUser.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: editForm.name, roleId: editForm.roleId }),
      })
      const data = await response.json()

      if (!response.ok) {
        alert(data.error || '저장 중 오류가 발생했습니다.')
        return
      }

      // 목록 갱신 후 선택 사용자 정보도 업데이트
      await fetchUsers()
      setSelectedUser((prev) =>
        prev ? { ...prev, name: editForm.name, roleId: editForm.roleId } : null
      )
    } catch {
      alert('저장 중 오류가 발생했습니다.')
    } finally {
      setIsSaving(false)
    }
  }

  /**
   * 비밀번호 초기화 처리 (임시 비밀번호: 0000)
   */
  const handleResetPassword = async () => {
    if (!selectedUser) return
    if (!confirm(`"${selectedUser.name}"의 비밀번호를 "0000"으로 초기화하시겠습니까?`)) return

    try {
      const response = await fetch(`/api/users/${selectedUser.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      })
      const data = await response.json()

      if (!response.ok) {
        alert(data.error || '비밀번호 초기화 중 오류가 발생했습니다.')
        return
      }

      alert(data.message)
    } catch {
      alert('비밀번호 초기화 중 오류가 발생했습니다.')
    }
  }

  /**
   * 사용자 삭제 처리
   */
  const handleDelete = async () => {
    if (!selectedUser) return
    if (!confirm(`"${selectedUser.name}" 사용자를 삭제하시겠습니까?`)) return

    try {
      const response = await fetch(`/api/users/${selectedUser.id}`, { method: 'DELETE' })
      const data = await response.json()

      if (!response.ok) {
        alert(data.error || '삭제 처리 중 오류가 발생했습니다.')
        return
      }

      alert(data.message)
      setSelectedUser(null)
      setEditForm(null)
      fetchUsers()
    } catch {
      alert('삭제 처리 중 오류가 발생했습니다.')
    }
  }

  /**
   * 새 사용자 등록 폼 제출
   */
  const handleAddUser = async (e: React.FormEvent) => {
    e.preventDefault()
    setAddFormError('')
    setIsSubmitting(true)

    try {
      const response = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(addForm),
      })
      const data = await response.json()

      if (!response.ok) {
        setAddFormError(data.error || '사용자 등록 중 오류가 발생했습니다.')
        return
      }

      // 등록 후 목록 갱신 및 추가 모드 종료
      setAddMode(false)
      setAddForm({ name: '', email: '', password: '', roleId: roles[0]?.id || 'USER' })
      fetchUsers()
    } catch {
      setAddFormError('사용자 등록 중 오류가 발생했습니다.')
    } finally {
      setIsSubmitting(false)
    }
  }

  // 검색어 기준 클라이언트 사이드 필터링
  const filteredUsers = users.filter(
    (u) =>
      u.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.email.toLowerCase().includes(searchQuery.toLowerCase())
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
      {/* 좌측: 사용자 목록 패널 */}
      <div className="w-80 flex-shrink-0 bg-white rounded-xl border border-gray-200 flex flex-col">
        {/* 검색 및 등록 버튼 */}
        <div className="p-4 border-b border-gray-200 space-y-2">
          <input
            type="text"
            placeholder="이름 또는 이메일 검색"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            onClick={handleStartAddMode}
            className="w-full px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 transition-colors"
          >
            새 사용자 등록
          </button>
        </div>

        {/* 사용자 목록 */}
        <div className="flex-1 overflow-y-auto divide-y divide-gray-100">
          {filteredUsers.length === 0 ? (
            <div className="p-6 text-center text-gray-400 text-sm">
              {searchQuery ? '검색 결과가 없습니다.' : '등록된 사용자가 없습니다.'}
            </div>
          ) : (
            filteredUsers.map((user) => (
              <div
                key={user.id}
                onClick={() => handleSelectUser(user)}
                className={`px-4 py-3 cursor-pointer hover:bg-blue-50 transition-colors ${
                  selectedUser?.id === user.id ? 'bg-blue-50 border-l-2 border-blue-500' : ''
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-900 truncate">{user.name}</span>
                  <RoleBadge roleId={user.roleId} roleName={user.userRole?.name} />
                </div>
                <p className="text-xs text-gray-400 truncate mt-0.5">{user.email}</p>
              </div>
            ))
          )}
        </div>

        {/* 하단 집계 */}
        <div className="px-4 py-2 border-t border-gray-100">
          <p className="text-xs text-gray-400">총 {users.length}명</p>
        </div>
      </div>

      {/* 우측: 상세/등록 패널 */}
      <div className="flex-1 bg-white rounded-xl border border-gray-200 flex flex-col overflow-hidden">
        {/* 신규 등록 모드 */}
        {addMode && (
          <>
            {/* 신규 등록 헤더 */}
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between flex-shrink-0">
              <div>
                <h2 className="text-lg font-semibold text-gray-800">새 사용자 등록</h2>
                <p className="text-xs text-gray-400 mt-0.5">정보를 입력한 후 등록하세요.</p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="submit"
                  form="addUserForm"
                  disabled={isSubmitting}
                  className="px-3 py-1.5 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 disabled:opacity-50 transition-colors"
                >
                  {isSubmitting ? '등록 중...' : '등록'}
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
            {/* 신규 등록 폼 - 스크롤 가능 */}
            <div className="flex-1 overflow-y-auto p-6">
              <form id="addUserForm" onSubmit={handleAddUser} className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">이름</label>
                  <input
                    type="text"
                    value={addForm.name}
                    onChange={(e) => setAddForm((p) => ({ ...p, name: e.target.value }))}
                    required
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">이메일</label>
                  <input
                    type="email"
                    value={addForm.email}
                    onChange={(e) => setAddForm((p) => ({ ...p, email: e.target.value }))}
                    required
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">비밀번호</label>
                  <input
                    type="password"
                    value={addForm.password}
                    onChange={(e) => setAddForm((p) => ({ ...p, password: e.target.value }))}
                    required
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">역할</label>
                  <select
                    value={addForm.roleId}
                    onChange={(e) => setAddForm((p) => ({ ...p, roleId: e.target.value }))}
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {roles.map((role) => (
                      <option key={role.id} value={role.id}>
                        {role.name}
                      </option>
                    ))}
                  </select>
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

        {/* 사용자 상세 편집 모드 */}
        {!addMode && selectedUser && editForm && (
          <>
            {/* 상세 편집 헤더 */}
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between flex-shrink-0">
              <div>
                <h2 className="text-lg font-semibold text-gray-800">{selectedUser.name}</h2>
                <p className="text-xs text-gray-400 mt-0.5">사용자 정보를 수정한 후 저장하세요.</p>
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
                  onClick={handleResetPassword}
                  className="px-3 py-1.5 bg-yellow-100 text-yellow-700 text-sm font-medium rounded-md hover:bg-yellow-200 transition-colors"
                >
                  비밀번호 초기화
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
                  <label className="block text-xs font-medium text-gray-600 mb-1">이름</label>
                  <input
                    type="text"
                    value={editForm.name}
                    onChange={(e) => setEditForm((p) => p ? { ...p, name: e.target.value } : p)}
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">이메일</label>
                  {/* 이메일은 변경 불가 */}
                  <p className="px-3 py-2 text-sm text-gray-700 bg-gray-50 border border-gray-200 rounded-md">
                    {selectedUser.email}
                  </p>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">역할</label>
                  <select
                    value={editForm.roleId}
                    onChange={(e) => setEditForm((p) => p ? { ...p, roleId: e.target.value } : p)}
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {roles.map((role) => (
                      <option key={role.id} value={role.id}>
                        {role.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">가입일</label>
                  <p className="px-3 py-2 text-sm text-gray-700 bg-gray-50 border border-gray-200 rounded-md">
                    {new Date(selectedUser.createdAt).toLocaleDateString('ko-KR')}
                  </p>
                </div>
              </div>
            </div>
          </>
        )}

        {/* 안내 텍스트 (아무것도 선택되지 않은 상태) */}
        {!addMode && !selectedUser && (
          <div className="flex items-center justify-center h-full text-gray-400">
            <p className="text-sm">목록에서 사용자를 선택하세요.</p>
          </div>
        )}
      </div>
    </div>
  )
}
