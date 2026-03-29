import { test, expect } from '@playwright/test'

/**
 * 관리자 로그인 관련 E2E 테스트
 */
test.describe('관리자 로그인', () => {
  test('로그인 페이지 UI 요소 확인', async ({ page }) => {
    await page.goto('/')

    // h1, h2 텍스트 확인
    await expect(page.locator('h1')).toHaveText('StarterKit')
    await expect(page.locator('h2')).toHaveText('로그인')

    // 입력 필드 존재 확인
    await expect(page.locator('#email')).toBeVisible()
    await expect(page.locator('#password')).toBeVisible()
  })

  test('잘못된 비밀번호로 로그인 시 에러 메시지 표시', async ({ page }) => {
    await page.goto('/')
    await page.fill('#email', 'admin@admin.com')
    await page.fill('#password', 'wrongpassword')
    await page.click('button[type="submit"]')

    // 에러 메시지 표시 확인
    await expect(page.locator('p.text-sm.text-red-600')).toBeVisible()
  })

  test('관리자 로그인 성공 후 /dashboard 이동', async ({ page }) => {
    await page.goto('/')
    await page.fill('#email', 'admin@admin.com')
    await page.fill('#password', '1234')
    await page.click('button[type="submit"]')

    // /dashboard로 이동 확인
    await page.waitForURL('/dashboard')
    expect(page.url()).toContain('/dashboard')
  })

  test('로그인된 상태에서 / 접근 시 /dashboard 자동 리다이렉트', async ({ page }) => {
    // 먼저 로그인
    await page.goto('/')
    await page.fill('#email', 'admin@admin.com')
    await page.fill('#password', '1234')
    await page.click('button[type="submit"]')
    await page.waitForURL('/dashboard')

    // 다시 / 접근
    await page.goto('/')

    // /dashboard로 리다이렉트 확인
    await page.waitForURL('/dashboard')
    expect(page.url()).toContain('/dashboard')
  })
})
