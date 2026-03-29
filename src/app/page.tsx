import { getServerSession } from 'next-auth'
import { redirect } from 'next/navigation'
import { authOptions } from '@/lib/auth'
import LoginForm from '@/components/auth/LoginForm'

/**
 * 메인 포탈 화면 (로그인 페이지)
 * 이미 로그인된 사용자는 대시보드로 리다이렉트
 */
export default async function HomePage() {
  const session = await getServerSession(authOptions)

  // 이미 로그인된 경우 대시보드로 이동
  if (session) {
    redirect('/dashboard')
  }

  return <LoginForm />
}
