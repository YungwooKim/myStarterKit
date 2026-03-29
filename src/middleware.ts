import { withAuth } from 'next-auth/middleware'
import { NextResponse } from 'next/server'

/**
 * 라우트 보호 미들웨어
 * - /admin/* 경로: ADMIN 역할은 전체 허용, 그 외는 JWT의 allowedPaths 기반 체크
 * - /dashboard: 로그인된 사용자만 접근 가능
 * - /: 이미 로그인된 경우 대시보드로 리다이렉트
 */
export default withAuth(
  function middleware(req) {
    const { pathname } = req.nextUrl
    const token = req.nextauth.token

    // /admin 경로는 ADMIN 역할이거나 allowedPaths에 포함된 경우만 접근 가능
    if (pathname.startsWith('/admin')) {
      // ADMIN 역할은 모든 /admin/* 경로 접근 허용
      if (token?.role === 'ADMIN') {
        return NextResponse.next()
      }

      const allowedPaths = (token?.allowedPaths as string[]) || []
      // 현재 경로가 허용된 경로 목록에 포함되는지 확인
      const isAllowed = allowedPaths.some(
        (p) => pathname === p || pathname.startsWith(p + '/')
      )

      if (!isAllowed) {
        return NextResponse.redirect(new URL('/dashboard', req.url))
      }
    }

    return NextResponse.next()
  },
  {
    callbacks: {
      /**
       * 토큰 존재 여부로 기본 인증 체크
       * 토큰이 없으면 로그인 페이지로 자동 리다이렉트
       */
      authorized: ({ token, req }) => {
        const { pathname } = req.nextUrl

        // 공개 경로는 인증 불필요
        if (pathname === '/' || pathname === '/register') {
          return true
        }

        // 그 외 경로는 토큰 필요
        return !!token
      },
    },
  }
)

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
}
