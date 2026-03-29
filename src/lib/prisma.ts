import { PrismaClient } from '@prisma/client'

/**
 * Prisma 클라이언트 싱글톤 인스턴스
 * 개발 환경에서 핫 리로드 시 여러 인스턴스 생성을 방지
 */
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    // 개발 환경에서만 쿼리 로그 출력
    log: process.env.NODE_ENV === 'development' ? ['query'] : [],
  })

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma
