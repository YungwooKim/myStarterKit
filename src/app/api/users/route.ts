import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import bcrypt from 'bcryptjs'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

/**
 * 사용자 목록 조회 API (ADMIN 또는 HR 역할 접근 가능)
 * GET /api/users
 */
export async function GET() {
  const session = await getServerSession(authOptions)

  // ADMIN 또는 HR만 접근 가능 (HR은 사용자 관리 페이지에 접근 권한 있음)
  if (!session || !['ADMIN', 'HR'].includes(session.user.role)) {
    return NextResponse.json({ error: '접근 권한이 없습니다.' }, { status: 403 })
  }

  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        name: true,
        roleId: true,
        userRole: {
          select: {
            id: true,
            name: true,
          },
        },
        createdAt: true,
        updatedAt: true,
        // 보안상 password 필드는 반환하지 않음
      },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json(users)
  } catch (error) {
    console.error('사용자 목록 조회 오류:', error)
    return NextResponse.json(
      { error: '사용자 목록 조회 중 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}

/**
 * 사용자 생성 API (ADMIN 전용)
 * POST /api/users
 */
export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions)

  if (!session || session.user.role !== 'ADMIN') {
    return NextResponse.json({ error: '접근 권한이 없습니다.' }, { status: 403 })
  }

  try {
    const { email, password, name, roleId } = await request.json()

    if (!email || !password || !name) {
      return NextResponse.json(
        { error: '이메일, 비밀번호, 이름을 모두 입력해주세요.' },
        { status: 400 }
      )
    }

    // 지정된 역할이 존재하는지 검증
    const targetRoleId = roleId || 'USER'
    const roleExists = await prisma.userRole.findUnique({
      where: { id: targetRoleId },
    })

    if (!roleExists) {
      return NextResponse.json(
        { error: '존재하지 않는 역할입니다.' },
        { status: 400 }
      )
    }

    // 이메일 중복 확인
    const existingUser = await prisma.user.findUnique({ where: { email } })
    if (existingUser) {
      return NextResponse.json(
        { error: '이미 사용 중인 이메일입니다.' },
        { status: 400 }
      )
    }

    const hashedPassword = await bcrypt.hash(password, 10)
    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        name,
        roleId: targetRoleId,
      },
      select: {
        id: true,
        email: true,
        name: true,
        roleId: true,
        userRole: {
          select: {
            id: true,
            name: true,
          },
        },
        createdAt: true,
      },
    })

    return NextResponse.json(user, { status: 201 })
  } catch (error) {
    console.error('사용자 생성 오류:', error)
    return NextResponse.json(
      { error: '사용자 생성 중 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}
