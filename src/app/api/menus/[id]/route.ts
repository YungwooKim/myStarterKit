import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

/**
 * 메뉴 수정 API (관리자 전용)
 * PUT /api/menus/[id]
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions)

  if (!session || session.user.role !== 'ADMIN') {
    return NextResponse.json({ error: '접근 권한이 없습니다.' }, { status: 403 })
  }

  try {
    const { id } = params
    const { name, path, icon, order, parentId, isActive } = await request.json()

    if (!name) {
      return NextResponse.json(
        { error: '메뉴 이름을 입력해주세요.' },
        { status: 400 }
      )
    }

    // 자기 자신을 부모로 설정하는 순환 참조 방지
    if (parentId === id) {
      return NextResponse.json(
        { error: '자기 자신을 부모 메뉴로 설정할 수 없습니다.' },
        { status: 400 }
      )
    }

    const menu = await prisma.menu.update({
      where: { id },
      data: {
        name,
        path: path || null,
        icon: icon || null,
        order: order || 0,
        parentId: parentId || null,
        isActive: isActive !== undefined ? isActive : true,
      },
    })

    return NextResponse.json(menu)
  } catch (error) {
    console.error('메뉴 수정 오류:', error)
    return NextResponse.json(
      { error: '메뉴 수정 중 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}

/**
 * 메뉴 삭제 API (관리자 전용)
 * DELETE /api/menus/[id]
 */
export async function DELETE(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions)

  if (!session || session.user.role !== 'ADMIN') {
    return NextResponse.json({ error: '접근 권한이 없습니다.' }, { status: 403 })
  }

  try {
    const { id } = params

    // 하위 메뉴가 있는 경우 삭제 불가
    const childCount = await prisma.menu.count({ where: { parentId: id } })
    if (childCount > 0) {
      return NextResponse.json(
        { error: '하위 메뉴가 있는 메뉴는 삭제할 수 없습니다. 하위 메뉴를 먼저 삭제해주세요.' },
        { status: 400 }
      )
    }

    await prisma.menu.delete({ where: { id } })
    return NextResponse.json({ message: '메뉴가 삭제되었습니다.' })
  } catch (error) {
    console.error('메뉴 삭제 오류:', error)
    return NextResponse.json(
      { error: '메뉴 삭제 중 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}
