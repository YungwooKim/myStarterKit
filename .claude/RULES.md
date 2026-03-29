================================================================================
StarterKit 프로젝트 개발 규칙
================================================================================
최종 수정: 2026-03-29


--------------------------------------------------------------------------------
1. 기술 스택
--------------------------------------------------------------------------------
- 프레임워크   : Next.js 14 (App Router)
- 언어        : TypeScript
- ORM         : Prisma
- DB          : Supabase PostgreSQL (PgBouncer 풀링 + Direct URL 이중 설정)
- 인증        : NextAuth.js (Credentials Provider, JWT 전략)
- 스타일      : Tailwind CSS
- 비밀번호    : bcryptjs (salt rounds: 10)
- 패키지 매니저: npm


--------------------------------------------------------------------------------
2. 디렉토리 구조
--------------------------------------------------------------------------------
src/
  app/                     # Next.js App Router 페이지
    api/                   # API Route Handlers
      auth/[...nextauth]/  # NextAuth.js 엔드포인트
      menus/               # 메뉴 CRUD API
      users/               # 사용자 CRUD API
      roles/               # 역할 조회 API
      register/            # 회원가입 API (비인증 공개)
    admin/                 # 관리자 전용 페이지 (/admin/*)
    dashboard/             # 로그인 후 메인 화면
    register/              # 회원가입 페이지
    page.tsx               # 루트(/) = 로그인 페이지
    layout.tsx             # 루트 레이아웃 (SessionProvider 적용)
  components/
    admin/                 # 관리자 전용 클라이언트 컴포넌트
      MenuTree.tsx         # 메뉴 트리 CRUD UI
      UserTable.tsx        # 사용자 테이블 CRUD UI
    auth/                  # 인증 관련 컴포넌트
      LoginForm.tsx        # 로그인 폼
      RegisterForm.tsx     # 회원가입 폼
    layout/                # 공통 레이아웃 컴포넌트
      Navbar.tsx           # 상단 내비게이션
      Sidebar.tsx          # 좌측 사이드바 (역할 기반 메뉴)
    providers/
      SessionProvider.tsx  # NextAuth 세션 컨텍스트 클라이언트 래퍼
  lib/
    auth.ts                # NextAuth authOptions 설정
    prisma.ts              # Prisma 클라이언트 싱글톤
  middleware.ts            # 라우트 보호 미들웨어
  types/
    next-auth.d.ts         # NextAuth 타입 확장 (role, id, allowedPaths)
prisma/
  schema.prisma            # DB 스키마 정의
  seed.ts                  # 초기 데이터 시드 스크립트


--------------------------------------------------------------------------------
3. 코딩 컨벤션
--------------------------------------------------------------------------------
- 변수명 / 함수명  : camelCase (영어)
- 컴포넌트명       : PascalCase (예: LoginForm, UserTable)
- 타입 / 인터페이스: PascalCase (예: UserFormData, MenuItem)
- 상수 (불변 객체) : camelCase (예: defaultFormData, authOptions)
- 파일명           : 컴포넌트는 PascalCase, 나머지는 camelCase
- export 방식      : 컴포넌트는 default export, 설정/유틸은 named export


--------------------------------------------------------------------------------
4. 주석 템플릿
--------------------------------------------------------------------------------

[파일 상단 - 파일 전체 역할 1줄 요약]
/**
 * 파일의 역할을 한 줄로 설명
 * 필요 시 2~3줄까지 허용 (API 경로, 접근 권한 등)
 */

[함수/메서드 - 1줄 JSDoc]
/** 함수가 하는 일을 간단히 설명 */
function doSomething() { ... }

[파라미터가 있는 함수]
/**
 * 함수 설명
 * @param paramName - 파라미터 설명
 */
function doSomething(paramName: string) { ... }

[복잡한 로직 인라인]
// 조건이 명확하지 않거나 의도가 드러나지 않는 곳에만 작성
const filtered = items.filter((item) => !item.deleted) // 소프트 삭제 제외

주의사항:
- 자명한 코드(변수 선언, return 등)에는 주석 불필요
- 이미 주석이 있는 부분에 중복 추가 금지
- "왜"는 git 커밋 메시지로, 주석은 "무엇"만 설명


--------------------------------------------------------------------------------
5. API 패턴
--------------------------------------------------------------------------------
모든 API Route는 다음 순서를 따름:

1) 세션 체크 (인증 필요 API)
   const session = await getServerSession(authOptions)
   if (!session) return 401
   if (session.user.role !== 'ADMIN') return 403

2) 요청 바디 파싱 및 유효성 검사
   const { field1, field2 } = await request.json()
   if (!field1) return 400

3) DB 처리 (prisma)
   const result = await prisma.model.create({ ... })

4) 응답 반환
   - 성공 조회: return NextResponse.json(data)
   - 성공 생성: return NextResponse.json(data, { status: 201 })
   - 성공 삭제/수정: return NextResponse.json({ message: '...' })
   - 실패: return NextResponse.json({ error: '...' }, { status: 4xx/5xx })

에러 응답 형식 (통일):
  { error: '오류 메시지' }       // 실패
  { message: '성공 메시지' }     // 성공 (data 없는 경우)

HTTP 상태 코드 기준:
  200 - 조회/수정 성공 (기본값)
  201 - 생성 성공
  400 - 유효성 검사 실패, 잘못된 요청
  401 - 비로그인
  403 - 권한 없음
  500 - 서버 내부 오류


--------------------------------------------------------------------------------
6. 컴포넌트 패턴
--------------------------------------------------------------------------------

[서버 컴포넌트 (기본)]
- 'use client' 없이 작성
- async/await 사용 가능
- getServerSession으로 세션 조회
- 페이지 파일(page.tsx), 레이아웃(layout.tsx) 등
- 예: HomePage, DashboardPage, AdminLayout

[클라이언트 컴포넌트]
- 파일 최상단에 'use client' 선언 필수
- 다음 경우에만 클라이언트 컴포넌트로 작성:
  - useState / useEffect 등 React 훅 사용
  - 브라우저 이벤트 핸들러 (onClick, onSubmit 등)
  - useSession, useRouter, usePathname 사용
- 예: LoginForm, RegisterForm, Navbar, Sidebar, MenuTree, UserTable

[SessionProvider 패턴]
- NextAuth SessionProvider는 'use client'가 필요
- 서버 컴포넌트(layout.tsx)에서 사용하기 위해
  src/components/providers/SessionProvider.tsx로 분리


--------------------------------------------------------------------------------
7. 스타일 가이드 (Tailwind CSS)
--------------------------------------------------------------------------------

[레이아웃]
- 최소 높이: min-h-screen
- 페이지 배경: bg-gray-50
- 카드/패널: bg-white rounded-xl border border-gray-200 p-6
- 폼 섹션: bg-gray-50 border border-gray-200 rounded-lg p-5

[버튼]
- 기본(파란색): px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md
                hover:bg-blue-700 transition-colors
- 위험(빨간색): bg-red-100 text-red-700 hover:bg-red-200
- 경고(노란색): bg-yellow-100 text-yellow-700 hover:bg-yellow-200
- 비활성      : disabled:opacity-50 disabled:cursor-not-allowed

[입력 필드]
- 공통: w-full px-3 py-2 border border-gray-300 rounded-md text-sm
        focus:outline-none focus:ring-2 focus:ring-blue-500

[에러 메시지]
- 인라인 에러: p-3 bg-red-50 border border-red-200 rounded-md
- 에러 텍스트: text-sm text-red-600

[텍스트 계층]
- 제목 (h1): text-2xl font-bold text-gray-900
- 부제목 (h2): text-lg font-semibold text-gray-800
- 설명: text-sm text-gray-500
- 본문: text-sm text-gray-700


--------------------------------------------------------------------------------
8. 에러 처리 패턴
--------------------------------------------------------------------------------

[API - try/catch 필수]
try {
  // DB 작업
} catch (error) {
  console.error('작업명 오류:', error)
  return NextResponse.json(
    { error: '사용자 친화적 오류 메시지' },
    { status: 500 }
  )
}

[클라이언트 컴포넌트 - fetch 에러 처리]
const response = await fetch(url, options)
const data = await response.json()
if (!response.ok) {
  setError(data.error || '기본 오류 메시지')
  return
}

[에러 UI]
- 폼 내 에러: setError(message) → JSX에서 {error && <div>...</div>} 렌더링
- 페이지 레벨 에러: setError → 에러 패널 표시 (로딩 상태 대신)
- 삭제/수정 등 단발성 작업: alert(data.error) 사용 가능


--------------------------------------------------------------------------------
9. RBAC (역할 기반 접근 제어) 시스템
--------------------------------------------------------------------------------

[역할 목록]
  ADMIN  - 관리자   : 전체 메뉴 접근
  HR     - 인사담당자: 대시보드, 사용자 관리
  USER   - 일반사용자: 대시보드만

[접근 제어 레이어]
  1. 미들웨어 (src/middleware.ts)
     - /admin/* 경로: JWT의 allowedPaths에 포함된 경우만 접근 허용
     - 그 외 보호 경로: 토큰 존재 여부로 인증 체크
     - 공개 경로: /, /register

  2. 레이아웃/페이지 (서버 컴포넌트)
     - AdminLayout: ADMIN 역할 체크 후 미허가 시 /dashboard 리다이렉트
     - 이중 보호 구조 (미들웨어 1차 + 레이아웃 2차)

  3. API Route
     - 각 API에서 session.user.role로 권한 확인
     - GET /api/users: ADMIN 또는 HR
     - POST/DELETE /api/users: ADMIN 전용
     - PATCH /api/users/[id]: ADMIN 전용 (역할 변경 또는 비밀번호 초기화)
     - GET /api/roles: ADMIN 전용
     - GET /api/menus: ADMIN=전체, 그 외=RoleMenu 필터링
     - POST /api/menus, PUT/DELETE /api/menus/[id]: ADMIN 전용

[allowedPaths 흐름]
  로그인 → authorize()에서 RoleMenu → Menu.path 목록 조회
  → JWT에 allowedPaths 저장 → 미들웨어에서 경로 접근 제어에 사용

[비밀번호 초기화]
  임시 비밀번호: "0000"
  PATCH /api/users/[id] (body 없이) → bcrypt.hash('0000', 10)


--------------------------------------------------------------------------------
10. 시드 실행
--------------------------------------------------------------------------------
  Windows 환경: npx tsx prisma/seed.ts
  (npm run seed는 따옴표 이슈로 실패할 수 있음)

  초기 계정: admin@admin.com / 1234 (ADMIN 역할)


--------------------------------------------------------------------------------
11. 환경 변수
--------------------------------------------------------------------------------
  DATABASE_URL   - Supabase PgBouncer 풀링 URL
  DIRECT_URL     - Supabase Direct URL (마이그레이션용)
  NEXTAUTH_SECRET - JWT 서명 비밀키
  NEXTAUTH_URL   - 서비스 기본 URL


================================================================================
