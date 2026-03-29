# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

@.claude/RULES.md

## 제외 항목

RULES.md의 "2. 디렉토리 구조" 섹션은 참고용이며, 구조는 언제든지 변경될 수 있으므로 강제 적용하지 않음.

## 개발 명령어

```bash
npm run dev                                     # 개발 서버 실행
npm run build                                   # 프로덕션 빌드
npx tsx prisma/seed.ts                          # 시드 데이터 입력 (초기 계정: admin@admin.com / 1234)
npx prisma migrate dev --name [설명]            # 마이그레이션 생성 및 적용
npx prisma db push                              # 스키마 변경 즉시 반영 (마이그레이션 없이)
npx playwright test                             # E2E 테스트 전체 실행
npx playwright test e2e/01-admin-login.spec.ts  # 특정 E2E 테스트 실행
```

## 아키텍처 개요

### 인증 흐름
1. 사용자가 `/`(로그인 페이지)에서 이메일/비밀번호 입력
2. `src/lib/auth.ts`의 CredentialsProvider가 DB 조회 후 bcryptjs로 비밀번호 검증
3. 해당 역할(role)에 매핑된 메뉴 경로(allowedPaths)를 JWT에 포함하여 저장
4. `src/middleware.ts`가 모든 요청에서 JWT의 role과 allowedPaths로 접근 제어

### RBAC 접근 제어 레이어
- **1차 (미들웨어):** `/admin/*` 경로는 `allowedPaths` 포함 여부로 차단
- **2차 (레이아웃):** `src/app/admin/layout.tsx`에서 ADMIN 역할 재검증 후 미허가 시 `/dashboard` 리다이렉트
- **3차 (API):** 각 Route Handler에서 `session.user.role`로 권한 확인

### 데이터 모델 관계
```
UserRole (ADMIN|HR|USER) ─< User
Menu (자기참조 트리, parentId) ─< RoleMenu >─ UserRole
```
- `RoleMenu`는 역할별 접근 가능한 메뉴를 정의하며, 로그인 시 `allowedPaths` 생성에 사용됨
- Menu 삭제 시 관련 RoleMenu가 CASCADE 삭제됨

### 컴포넌트 분류 원칙
- **서버 컴포넌트 (기본):** `page.tsx`, `layout.tsx` — `getServerSession`으로 세션 조회
- **클라이언트 컴포넌트:** `'use client'` 선언 필수 — React 훅, 이벤트 핸들러, `useSession` 사용 시
- **SessionProvider 분리:** `src/components/providers/SessionProvider.tsx`에서 클라이언트 래퍼로 분리하여 루트 레이아웃에서 사용

### API Route 패턴
모든 Route Handler는 **세션 체크 → 바디 파싱/검증 → DB 처리 → 응답** 순서를 따름.
에러 응답은 `{ error: '...' }`, 성공(데이터 없음)은 `{ message: '...' }` 형식으로 통일.

## 환경 변수 (`.env`)

```
DATABASE_URL    # Supabase PgBouncer 풀링 URL (런타임용)
DIRECT_URL      # Supabase Direct URL (마이그레이션용)
NEXTAUTH_SECRET # JWT 서명 비밀키
NEXTAUTH_URL    # 서비스 기본 URL
```

## 주의 사항

- Windows 환경에서 `npm run seed`는 따옴표 이슈로 실패할 수 있으므로 `npx tsx prisma/seed.ts` 사용
- Prisma Client는 `src/lib/prisma.ts` 싱글톤을 통해서만 사용 (개발 환경 핫리로드 시 중복 인스턴스 방지)
