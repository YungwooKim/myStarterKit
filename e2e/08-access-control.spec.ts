import { test, expect, request } from '@playwright/test'
import { loginAs } from './helpers/login.helper'

/**
 * 접근 제어 E2E 테스트
 * 권한 없는 페이지 접근 시 리다이렉트 동작 검증
 *
 * 참고: 일반 사용자 접근 제어 테스트는 e2etest@example.com 계정이 필요하며,
 * 이 계정은 05-user-register.spec.ts에서 생성되고 09-admin-delete-user.spec.ts에서 삭제됨.
 * 테스트 실행 순서가 보장되므로 08번은 09번 이전에 실행됨.
 * 단, 개별 실행 시를 대비하여 beforeAll에서 계정 생성을 시도함.
 */
test.describe('접근 제어', () => {
  test.beforeAll(async ({ }) => {
    // e2etest@example.com이 존재하지 않을 경우 회원가입 API로 생성
    // 이미 존재하면 409 반환되어 무시됨
    const apiContext = await request.newContext({ baseURL: 'http://localhost:3000' })
    await apiContext.post('/api/register', {
      data: {
        name: '테스트유저',
        email: 'e2etest@example.com',
        password: 'test1234',
      },
    })
    await apiContext.dispose()
  })

  test('일반 사용자는 /admin 접근 시 /dashboard로 리다이렉트', async ({ page }) => {
    await loginAs(page, 'e2etest@example.com', 'test1234')
    await page.goto('/admin')
    await page.waitForURL('/dashboard')
    expect(page.url()).toContain('/dashboard')
  })

  test('일반 사용자는 /admin/users 접근 시 /dashboard로 리다이렉트', async ({ page }) => {
    await loginAs(page, 'e2etest@example.com', 'test1234')
    await page.goto('/admin/users')
    await page.waitForURL('/dashboard')
    expect(page.url()).toContain('/dashboard')
  })

  test('일반 사용자는 /admin/menus 접근 시 /dashboard로 리다이렉트', async ({ page }) => {
    await loginAs(page, 'e2etest@example.com', 'test1234')
    await page.goto('/admin/menus')
    await page.waitForURL('/dashboard')
    expect(page.url()).toContain('/dashboard')
  })

  test('비로그인 상태에서 /dashboard 접근 시 / 로 리다이렉트', async ({ browser }) => {
    // 새 컨텍스트(쿠키 없음)로 테스트
    const context = await browser.newContext()
    const page = await context.newPage()

    await page.goto('/dashboard')
    // next-auth는 비로그인 시 /?callbackUrl=... 형태로 리다이렉트
    await page.waitForURL(/\/((\?.*)|$)/)
    expect(page.url()).toMatch(/localhost:3000\/(\?.*)?$/)

    await context.close()
  })
})
