import { DefaultSession, DefaultUser } from 'next-auth'
import { DefaultJWT } from 'next-auth/jwt'

/**
 * NextAuth.js 타입 확장
 * 기본 Session/User/JWT 타입에 role, id, allowedPaths 필드 추가
 */
declare module 'next-auth' {
  interface Session {
    user: {
      id: string
      role: string
      /** 해당 역할이 접근 가능한 메뉴 경로 목록 */
      allowedPaths: string[]
    } & DefaultSession['user']
  }

  interface User extends DefaultUser {
    role: string
    allowedPaths: string[]
  }
}

declare module 'next-auth/jwt' {
  interface JWT extends DefaultJWT {
    id: string
    role: string
    /** 해당 역할이 접근 가능한 메뉴 경로 목록 */
    allowedPaths: string[]
  }
}
