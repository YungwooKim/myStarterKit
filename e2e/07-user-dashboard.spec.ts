import { test, expect } from '@playwright/test'
import { loginAs } from './helpers/login.helper'

/**
 * 일반 사용자 대시보드 접근 제어 E2E 테스트
 * 관리자 전용 메뉴가 일반 사용자에게 노출되지 않아야 함
 */
test.describe('일반 사용자 대시보드', () => {
  test.beforeEach(async ({ page }) => {
    await loginAs(page, 'e2etest@example.com', 'test1234')
  })

  test('대시보드에 "관리자 메뉴" h2 섹션 미표시', async ({ page }) => {
    // 관리자 메뉴 섹션이 없어야 함
    await expect(page.locator('h2:has-text("관리자 메뉴")')).not.toBeVisible()
  })

  test('aside nav 내 "사용자 관리" 링크 미표시', async ({ page }) => {
    // 사용자 관리 링크가 없어야 함
    await expect(page.locator('aside nav').getByText('사용자 관리')).not.toBeVisible()
  })

  test('aside nav 내 "메뉴 관리" 링크 미표시', async ({ page }) => {
    // 메뉴 관리 링크가 없어야 함
    await expect(page.locator('aside nav').getByText('메뉴 관리')).not.toBeVisible()
  })

  test('nav a[href="/admin"] 미표시', async ({ page }) => {
    // admin 링크가 없어야 함
    await expect(page.locator('nav a[href="/admin"]')).not.toBeVisible()
  })
})
