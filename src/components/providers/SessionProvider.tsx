'use client'

import { SessionProvider as NextAuthSessionProvider } from 'next-auth/react'

/**
 * NextAuth.js 세션 프로바이더 래퍼 컴포넌트
 * 클라이언트 컴포넌트로 분리하여 서버 컴포넌트에서 사용 가능하도록 처리
 */
export default function SessionProvider({
  children,
}: {
  children: React.ReactNode
}) {
  return <NextAuthSessionProvider>{children}</NextAuthSessionProvider>
}
