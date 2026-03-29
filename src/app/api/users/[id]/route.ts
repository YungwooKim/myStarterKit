import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import bcrypt from 'bcryptjs'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

/**
 * 사용자 삭제 API (관리자 전용)
 * DELETE /api/users/[id]
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

    // 자기 자신은 삭제할 수 없음
    if (id === session.user.id) {
      return NextResponse.json(
        { error: '자기 자신의 계정은 삭제할 수 없습니다.' },
        { status: 400 }
      )
    }

    await prisma.user.delete({ where: { id } })
    return NextResponse.json({ message: '사용자가 삭제되었습니다.' })
  } catch (error) {
    console.error('사용자 삭제 오류:', error)
    return NextResponse.json(
      { error: '사용자 삭제 중 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}

/**
 * 사용자 정보 수정 API (관리자 전용)
 * PATCH /api/users/[id]
 * - body에 roleId가 있으면: 역할 변경
 * - body에 roleId가 없으면: 비밀번호를 "0000"으로 초기화
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions)

  if (!session || session.user.role !== 'ADMIN') {
    return NextResponse.json({ error: '접근 권한이 없습니다.' }, { status: 403 })
  }

  try {
    const { id } = params
    const body = await request.json().catch(() => ({}))

    // roleId가 전달된 경우 역할 변경 처리
    if (body.roleId) {
      // 대상 역할이 존재하는지 검증
      const roleExists = await prisma.userRole.findUnique({
        where: { id: body.roleId },
      })

      if (!roleExists) {
        return NextResponse.json(
          { error: '존재하지 않는 역할입니다.' },
          { status: 400 }
        )
      }

      await prisma.user.update({
        where: { id },
        data: { roleId: body.roleId },
      })

      return NextResponse.json({ message: `역할이 "${roleExists.name}"으로 변경되었습니다.` })
    }

    // roleId가 없는 경우 비밀번호 초기화 처리
    const tempPassword = await bcrypt.hash('0000', 10)

    await prisma.user.update({
      where: { id },
      data: { password: tempPassword },
    })

    return NextResponse.json({ message: '비밀번호가 "0000"으로 초기화되었습니다.' })
  } catch (error) {
    console.error('사용자 수정 오류:', error)
    return NextResponse.json(
      { error: '사용자 수정 중 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}
