import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

/**
 * 역할별 메뉴 목록 조회 API (관리자 전용)
 * GET /api/role-menus
 * - 모든 역할과 각 역할에 연결된 메뉴 목록 반환
 */
export async function GET() {
  const session = await getServerSession(authOptions)

  if (!session || session.user.role !== 'ADMIN') {
    return NextResponse.json({ error: '접근 권한이 없습니다.' }, { status: 403 })
  }

  try {
    const roles = await prisma.userRole.findMany({
      include: {
        roleMenus: {
          include: { menu: true },
          orderBy: { menu: { order: 'asc' } },
        },
      },
      orderBy: { id: 'asc' },
    })

    return NextResponse.json(roles)
  } catch (error) {
    console.error('역할별 메뉴 조회 오류:', error)
    return NextResponse.json(
      { error: '역할별 메뉴 조회 중 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}

/**
 * 역할-메뉴 연결 추가 API (관리자 전용)
 * POST /api/role-menus
 * - body: { roleId, menuId }
 */
export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions)

  if (!session || session.user.role !== 'ADMIN') {
    return NextResponse.json({ error: '접근 권한이 없습니다.' }, { status: 403 })
  }

  try {
    const { roleId, menuId } = await request.json()

    if (!roleId || !menuId) {
      return NextResponse.json(
        { error: 'roleId와 menuId가 필요합니다.' },
        { status: 400 }
      )
    }

    // upsert로 중복 방지
    const roleMenu = await prisma.roleMenu.upsert({
      where: { roleId_menuId: { roleId, menuId } },
      update: {},
      create: { roleId, menuId },
    })

    return NextResponse.json(roleMenu, { status: 201 })
  } catch (error) {
    console.error('역할-메뉴 연결 추가 오류:', error)
    return NextResponse.json(
      { error: '역할-메뉴 연결 추가 중 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}

/**
 * 역할-메뉴 연결 제거 API (관리자 전용)
 * DELETE /api/role-menus
 * - body: { roleId, menuId }
 */
export async function DELETE(request: NextRequest) {
  const session = await getServerSession(authOptions)

  if (!session || session.user.role !== 'ADMIN') {
    return NextResponse.json({ error: '접근 권한이 없습니다.' }, { status: 403 })
  }

  try {
    const { roleId, menuId } = await request.json()

    if (!roleId || !menuId) {
      return NextResponse.json(
        { error: 'roleId와 menuId가 필요합니다.' },
        { status: 400 }
      )
    }

    await prisma.roleMenu.delete({
      where: { roleId_menuId: { roleId, menuId } },
    })

    return NextResponse.json({ message: '역할-메뉴 연결이 제거되었습니다.' })
  } catch (error) {
    console.error('역할-메뉴 연결 제거 오류:', error)
    return NextResponse.json(
      { error: '역할-메뉴 연결 제거 중 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}
