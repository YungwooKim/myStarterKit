import { getServerSession } from 'next-auth'
import { NextResponse } from 'next/server'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

/**
 * 역할 목록 조회 API (관리자 전용)
 * GET /api/roles
 */
export async function GET() {
  const session = await getServerSession(authOptions)

  if (!session || session.user.role !== 'ADMIN') {
    return NextResponse.json({ error: '접근 권한이 없습니다.' }, { status: 403 })
  }

  try {
    const roles = await prisma.userRole.findMany({
      orderBy: { id: 'asc' },
    })

    return NextResponse.json(roles)
  } catch (error) {
    console.error('역할 목록 조회 오류:', error)
    return NextResponse.json(
      { error: '역할 목록 조회 중 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}
