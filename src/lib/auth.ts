import { NextAuthOptions } from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import bcrypt from 'bcryptjs'
import { prisma } from '@/lib/prisma'

/**
 * NextAuth.js 인증 설정
 * Credentials Provider를 사용하여 이메일/비밀번호 로그인 처리
 * 로그인 시 역할(role)과 허용된 메뉴 경로(allowedPaths) JWT에 저장
 */
export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: '이메일', type: 'email' },
        password: { label: '비밀번호', type: 'password' },
      },
      /**
       * 사용자 인증 처리
       * @param credentials - 로그인 폼에서 입력된 이메일/비밀번호
       */
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error('이메일과 비밀번호를 입력해주세요.')
        }

        // DB에서 사용자 조회 (역할 및 허용 메뉴 포함)
        const user = await prisma.user.findUnique({
          where: { email: credentials.email },
          include: {
            userRole: {
              include: {
                roleMenus: {
                  include: {
                    menu: true,
                  },
                },
              },
            },
          },
        })

        if (!user) {
          throw new Error('존재하지 않는 계정입니다.')
        }

        // 비밀번호 검증
        const isPasswordValid = await bcrypt.compare(
          credentials.password,
          user.password
        )

        if (!isPasswordValid) {
          throw new Error('비밀번호가 올바르지 않습니다.')
        }

        // 허용된 메뉴 경로 추출 (null/undefined 제외)
        const allowedPaths = user.userRole.roleMenus
          .map((rm) => rm.menu.path)
          .filter((path): path is string => Boolean(path))

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.roleId,
          allowedPaths,
        }
      },
    }),
  ],
  callbacks: {
    /**
     * JWT 토큰에 사용자 역할(role)과 허용 경로(allowedPaths) 정보 추가
     */
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id
        token.role = (user as { role: string }).role
        token.allowedPaths = (user as { allowedPaths: string[] }).allowedPaths
      }
      return token
    },
    /**
     * 세션에 사용자 역할(role)과 허용 경로(allowedPaths) 정보 추가
     */
    async session({ session, token }) {
      if (token) {
        session.user.id = token.id as string
        session.user.role = token.role as string
        session.user.allowedPaths = (token.allowedPaths as string[]) || []
      }
      return session
    },
  },
  pages: {
    signIn: '/',      // 로그인 페이지 경로
    error: '/',       // 에러 발생 시 리다이렉트 경로
  },
  session: {
    strategy: 'jwt',
  },
  secret: process.env.NEXTAUTH_SECRET,
}
