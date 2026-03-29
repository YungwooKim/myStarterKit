---
name: StarterKit 프로젝트 정보
description: Next.js 14 + Supabase + Prisma 기반 스타터킷 프로젝트의 기술 스택, 구조, RBAC 설계 정보
type: project
---

Next.js 14 App Router 기반 스타터킷 프로젝트를 `D:\dev\study\claude-code-mastery\StarterKit`에 구현.

**Why:** 실무 프로젝트의 기반이 되는 인증/사용자관리/메뉴관리 기능을 갖춘 풀스택 템플릿 구축. RBAC(역할 기반 접근 제어) 고도화로 유연한 권한 관리 지원.

**How to apply:** 이 프로젝트에서 작업할 때 아래 스택과 패턴을 일관되게 사용할 것.

## 기술 스택
- Next.js 14 (App Router)
- Prisma ORM + Supabase PostgreSQL
- NextAuth.js (Credentials Provider, JWT 전략)
- Tailwind CSS
- TypeScript
- bcryptjs (비밀번호 해싱)

## DB 연결
- Supabase 프로젝트: `irendhtishhztlfzcevw` (ap-southeast-1)
- PgBouncer 풀링 URL (DATABASE_URL) + Direct URL (DIRECT_URL) 이중 설정

## 주요 엔티티 (RBAC 고도화 후)
- UserRole: id(고정 문자열: ADMIN/HR/USER), name, users[], roleMenus[]
- User: id(cuid), email(unique), password(bcrypt), name, roleId(→UserRole FK, default: USER)
- Menu: id(cuid), name, path, icon, order, parentId(자기참조 트리), isActive, roleMenus[]
- RoleMenu: id(cuid), roleId, menuId, [roleId+menuId 복합 unique]

## 역할 목록 (시드 데이터)
- ADMIN: 관리자 - 전체 메뉴 접근
- HR: 인사담당자 - 대시보드, 사용자 관리
- USER: 일반사용자 - 대시보드만

## 초기 계정
- admin@admin.com / 1234 (ADMIN 역할) - seed.ts로 생성

## 비밀번호 초기화
- 임시 비밀번호: "0000"

## 인증 흐름 (RBAC 고도화 후)
- NextAuth Credentials Provider → bcrypt 검증 → JWT에 id/role/allowedPaths 추가 → Session에 전파
- allowedPaths: 로그인 시 RoleMenu → Menu.path 목록을 JWT에 저장
- 미들웨어에서 /admin/* 접근 시: ADMIN 역할은 무조건 허용, 그 외는 token.allowedPaths 기반 제어

## 관리자 페이지 목록
- /admin/users: 사용자 관리 (UserTable 컴포넌트)
- /admin/menus: 메뉴 관리 (MenuTree 컴포넌트)
- /admin/roles: 역할 관리 (서버 컴포넌트, prisma 직접 쿼리)
- /admin/role-menus: 역할별 메뉴 권한 (RoleMenuTable 컴포넌트)

## API 접근 권한
- GET /api/role-menus: ADMIN 전용 (역할+연결 메뉴 목록)
- POST /api/role-menus: ADMIN 전용 (역할-메뉴 연결 추가)
- DELETE /api/role-menus: ADMIN 전용 (역할-메뉴 연결 제거)

## 시드 실행
- `npm run seed`는 Windows에서 따옴표 이슈로 실패
- 대신 `npx tsx prisma/seed.ts` 사용

## 전체 API 접근 권한
- GET /api/users: ADMIN 또는 HR 허용 (HR도 사용자 관리 화면 접근 가능)
- POST /api/users, DELETE /api/users/[id]: ADMIN 전용
- PATCH /api/users/[id]: ADMIN 전용, body에 roleId 있으면 역할변경/없으면 비밀번호초기화
- GET /api/roles: ADMIN 전용
- GET /api/menus: ADMIN은 전체, 그 외 역할은 RoleMenu 필터링
