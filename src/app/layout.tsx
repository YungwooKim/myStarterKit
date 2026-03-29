import type { Metadata } from 'next'
import './globals.css'
import SessionProvider from '@/components/providers/SessionProvider'

export const metadata: Metadata = {
  title: 'StarterKit',
  description: 'Next.js + Supabase + Prisma 기반 스타터 킷',
}

/**
 * 루트 레이아웃
 * 전체 앱에 SessionProvider를 적용하여 인증 상태를 공유
 */
export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="ko">
      <body>
        <SessionProvider>{children}</SessionProvider>
      </body>
    </html>
  )
}
