import { test, expect } from '@playwright/test'

/**
 * 일반 사용자 로그인 관련 E2E 테스트
 */
test.describe('일반 사용자 로그인', () => {
  test('e2etest 사용자 로그인 후 /dashboard 이동', async ({ page }) => {
    await page.goto('/')
    await page.fill('#email', 'e2etest@example.com')
    await page.fill('#password', 'test1234')
    await page.click('button[type="submit"]')

    // /dashboard로 이동 확인
    await page.waitForURL('/dashboard')
    expect(page.url()).toContain('/dashboard')
  })

  test('대시보드에서 "테스트유저" 이름 확인', async ({ page }) => {
    // 로그인
    await page.goto('/')
    await page.fill('#email', 'e2etest@example.com')
    await page.fill('#password', 'test1234')
    await page.click('button[type="submit"]')
    await page.waitForURL('/dashboard')

    // 테스트유저 이름 표시 확인
    await expect(page.locator('text=테스트유저').first()).toBeVisible()
  })
})
