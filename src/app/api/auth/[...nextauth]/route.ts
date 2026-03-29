import NextAuth from 'next-auth'
import { authOptions } from '@/lib/auth'

/**
 * NextAuth.js API Route 핸들러
 * GET/POST 요청 모두 NextAuth에서 처리
 */
const handler = NextAuth(authOptions)

export { handler as GET, handler as POST }
