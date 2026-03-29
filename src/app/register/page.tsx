import { getServerSession } from 'next-auth'
import { redirect } from 'next/navigation'
import { authOptions } from '@/lib/auth'
import RegisterForm from '@/components/auth/RegisterForm'

/**
 * 회원가입 페이지
 * 이미 로그인된 사용자는 대시보드로 리다이렉트
 */
export default async function RegisterPage() {
  const session = await getServerSession(authOptions)

  if (session) {
    redirect('/dashboard')
  }

  return <RegisterForm />
}
