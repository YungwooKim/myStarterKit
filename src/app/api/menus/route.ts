import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

/**
 * 메뉴 목록 조회 API
 * GET /api/menus
 * - ADMIN: 전체 메뉴 반환 (메뉴 관리 화면에서 모든 메뉴를 볼 수 있어야 하므로)
 * - 그 외: RoleMenu 기반 역할별 필터링 후 트리 구조 반환
 */
export async function GET() {
  const session = await getServerSession(authOptions)

  if (!session) {
    return NextResponse.json({ error: '로그인이 필요합니다.' }, { status: 401 })
  }

  try {
    const roleId = session.user.role

    // ADMIN은 전체 메뉴 조회 (메뉴 관리 기능 때문에 전체 접근 필요)
    if (roleId === 'ADMIN') {
      const menus = await prisma.menu.findMany({
        where: { parentId: null },
        include: {
          children: {
            include: {
              children: {
                orderBy: { order: 'asc' },
              },
            },
            orderBy: { order: 'asc' },
          },
        },
        orderBy: { order: 'asc' },
      })

      return NextResponse.json(menus)
    }

    // 그 외 역할은 RoleMenu에서 허용된 menuId 목록 조회
    const roleMenus = await prisma.roleMenu.findMany({
      where: { roleId },
      select: { menuId: true },
    })

    const allowedMenuIds = roleMenus.map((rm) => rm.menuId)

    // 허용된 메뉴만 조회 (활성 상태인 것만)
    const allMenus = await prisma.menu.findMany({
      where: {
        isActive: true,
        id: { in: allowedMenuIds },
      },
      orderBy: { order: 'asc' },
    })

    // 최상위 메뉴(parentId가 null)를 기준으로 트리 구조 구성
    const menuMap = new Map(allMenus.map((m) => ({ ...m, children: [] as typeof allMenus })).map((m) => [m.id, m]))

    const treeMenus: (typeof allMenus[0] & { children: typeof allMenus })[] = []

    for (const menu of allMenus) {
      const node = menuMap.get(menu.id)!
      if (!menu.parentId || !menuMap.has(menu.parentId)) {
        // 최상위 메뉴 또는 부모가 허용 목록에 없는 경우 루트로 처리
        treeMenus.push(node as typeof allMenus[0] & { children: typeof allMenus })
      } else {
        // 부모 메뉴의 children에 추가
        const parent = menuMap.get(menu.parentId)
        if (parent) {
          ;(parent as typeof allMenus[0] & { children: typeof allMenus }).children.push(node as typeof allMenus[0])
        }
      }
    }

    return NextResponse.json(treeMenus)
  } catch (error) {
    console.error('메뉴 목록 조회 오류:', error)
    return NextResponse.json(
      { error: '메뉴 목록 조회 중 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}

/**
 * 메뉴 생성 API (관리자 전용)
 * POST /api/menus
 */
export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions)

  if (!session || session.user.role !== 'ADMIN') {
    return NextResponse.json({ error: '접근 권한이 없습니다.' }, { status: 403 })
  }

  try {
    const { name, path, icon, order, parentId, isActive } = await request.json()

    if (!name) {
      return NextResponse.json(
        { error: '메뉴 이름을 입력해주세요.' },
        { status: 400 }
      )
    }

    const menu = await prisma.menu.create({
      data: {
        name,
        path: path || null,
        icon: icon || null,
        order: order || 0,
        parentId: parentId || null,
        isActive: isActive !== undefined ? isActive : true,
      },
    })

    return NextResponse.json(menu, { status: 201 })
  } catch (error) {
    console.error('메뉴 생성 오류:', error)
    return NextResponse.json(
      { error: '메뉴 생성 중 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}
