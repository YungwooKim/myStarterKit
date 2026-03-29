import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

/**
 * 역할-메뉴 연결을 upsert 방식으로 추가
 * 메뉴가 DB에 없으면 스킵
 * @param roleId - 역할 ID
 * @param menuPath - 메뉴 path
 */
const assignMenuToRole = async (roleId: string, menuPath: string) => {
  const menu = await prisma.menu.findFirst({ where: { path: menuPath } })
  if (!menu) {
    console.log(`  메뉴 없음 (스킵): ${menuPath}`)
    return
  }
  await prisma.roleMenu.upsert({
    where: { roleId_menuId: { roleId, menuId: menu.id } },
    update: {},
    create: { roleId, menuId: menu.id },
  })
}

/**
 * 초기 데이터 시드 스크립트
 * - UserRole 3건 생성: ADMIN, HR, USER
 * - admin 계정 생성 (admin@admin.com / 1234)
 * - 기본 메뉴 구조 생성 및 역할별 메뉴 권한 설정
 */
async function main() {
  console.log('시드 스크립트 시작...')

  // 1. UserRole 초기 데이터 upsert
  await prisma.userRole.upsert({
    where: { id: 'ADMIN' },
    update: { name: '관리자' },
    create: { id: 'ADMIN', name: '관리자' },
  })

  await prisma.userRole.upsert({
    where: { id: 'HR' },
    update: { name: '인사담당자' },
    create: { id: 'HR', name: '인사담당자' },
  })

  await prisma.userRole.upsert({
    where: { id: 'USER' },
    update: { name: '일반사용자' },
    create: { id: 'USER', name: '일반사용자' },
  })

  console.log('UserRole 생성 완료: ADMIN, HR, USER')

  // 2. 관리자 계정 생성 (이미 존재하면 건너뜀)
  const existingAdmin = await prisma.user.findUnique({
    where: { email: 'admin@admin.com' },
  })

  if (!existingAdmin) {
    const hashedPassword = await bcrypt.hash('1234', 10)
    const admin = await prisma.user.create({
      data: {
        email: 'admin@admin.com',
        password: hashedPassword,
        name: '관리자',
        roleId: 'ADMIN',
      },
    })
    console.log(`관리자 계정 생성 완료: ${admin.email}`)
  } else {
    console.log('관리자 계정이 이미 존재합니다.')
  }

  // 3. 기본 메뉴 구조 생성 (메뉴가 없을 때만)
  const existingMenus = await prisma.menu.count()
  if (existingMenus === 0) {
    // 최상위 메뉴 생성
    await prisma.menu.create({
      data: {
        name: '대시보드',
        path: '/dashboard',
        icon: 'home',
        order: 1,
        isActive: true,
      },
    })

    const adminMenu = await prisma.menu.create({
      data: {
        name: '관리자',
        path: '/admin',
        icon: 'settings',
        order: 2,
        isActive: true,
      },
    })

    // 하위 메뉴 생성
    await prisma.menu.create({
      data: {
        name: '사용자 관리',
        path: '/admin/users',
        icon: 'users',
        order: 1,
        parentId: adminMenu.id,
        isActive: true,
      },
    })

    await prisma.menu.create({
      data: {
        name: '메뉴 관리',
        path: '/admin/menus',
        icon: 'menu',
        order: 2,
        parentId: adminMenu.id,
        isActive: true,
      },
    })

    // 역할 관리 메뉴 추가
    await prisma.menu.create({
      data: {
        name: '역할 관리',
        path: '/admin/roles',
        icon: 'shield',
        order: 3,
        parentId: adminMenu.id,
        isActive: true,
      },
    })

    // 역할별 메뉴 권한 메뉴 추가
    await prisma.menu.create({
      data: {
        name: '역할별 메뉴 권한',
        path: '/admin/role-menus',
        icon: 'key',
        order: 4,
        parentId: adminMenu.id,
        isActive: true,
      },
    })

    console.log('기본 메뉴 구조 생성 완료')
  } else {
    console.log('메뉴 데이터가 이미 존재합니다. 신규 메뉴만 추가합니다...')

    // 기존 환경에서 신규 메뉴 추가 (없는 경우에만)
    const adminMenu = await prisma.menu.findFirst({ where: { path: '/admin' } })
    if (adminMenu) {
      const rolesMenuExists = await prisma.menu.findFirst({ where: { path: '/admin/roles' } })
      if (!rolesMenuExists) {
        await prisma.menu.create({
          data: {
            name: '역할 관리',
            path: '/admin/roles',
            icon: 'shield',
            order: 3,
            parentId: adminMenu.id,
            isActive: true,
          },
        })
        console.log('  역할 관리 메뉴 추가 완료')
      }

      const roleMenusMenuExists = await prisma.menu.findFirst({ where: { path: '/admin/role-menus' } })
      if (!roleMenusMenuExists) {
        await prisma.menu.create({
          data: {
            name: '역할별 메뉴 권한',
            path: '/admin/role-menus',
            icon: 'key',
            order: 4,
            parentId: adminMenu.id,
            isActive: true,
          },
        })
        console.log('  역할별 메뉴 권한 메뉴 추가 완료')
      }
    }
  }

  // 4. RoleMenu 설정 (항상 실행 - upsert 방식으로 안전하게 처리)
  console.log('역할별 메뉴 권한 설정 중...')

  // ADMIN: 전체 메뉴 접근 가능
  await assignMenuToRole('ADMIN', '/dashboard')
  await assignMenuToRole('ADMIN', '/admin')
  await assignMenuToRole('ADMIN', '/admin/users')
  await assignMenuToRole('ADMIN', '/admin/menus')
  await assignMenuToRole('ADMIN', '/admin/roles')
  await assignMenuToRole('ADMIN', '/admin/role-menus')

  // HR: 대시보드, 사용자 관리 접근 가능
  await assignMenuToRole('HR', '/dashboard')
  await assignMenuToRole('HR', '/admin/users')

  // USER: 대시보드만 접근 가능
  await assignMenuToRole('USER', '/dashboard')

  console.log('역할별 메뉴 권한 설정 완료')
  console.log('시드 스크립트 완료!')
}

main()
  .catch((e) => {
    console.error('시드 스크립트 오류:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
