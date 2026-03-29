import { test, expect } from '@playwright/test'
import { loginAs } from './helpers/login.helper'

/**
 * 관리자 대시보드 관련 E2E 테스트
 */
test.describe('관리자 대시보드', () => {
  test.beforeEach(async ({ page }) => {
    await loginAs(page, 'admin@admin.com', '1234')
  })

  test('대시보드에 "관리자 메뉴" 섹션 표시', async ({ page }) => {
    // h2에 "관리자 메뉴" 텍스트 확인
    await expect(page.locator('h2:has-text("관리자 메뉴")')).toBeVisible()
  })

  test('/admin/users, /admin/menus 링크 존재', async ({ page }) => {
    // 관리자 페이지 링크 존재 확인 (동일 href가 여러 개 있을 수 있어 first() 사용)
    await expect(page.locator('a[href="/admin/users"]').first()).toBeVisible()
    await expect(page.locator('a[href="/admin/menus"]').first()).toBeVisible()
  })

  test('Navbar의 /admin 링크 클릭 후 /admin 이동', async ({ page }) => {
    // Navbar의 admin 링크 클릭
    await page.locator('a[href="/admin"]').first().click()
    await page.waitForURL('/admin')
    expect(page.url()).toContain('/admin')
  })

  test('aside nav 내 "사용자 관리" 클릭 후 /admin/users 이동', async ({ page }) => {
    // aside nav 내 사용자 관리 링크 클릭
    await page.locator('aside nav').getByText('사용자 관리').click()
    await page.waitForURL('/admin/users')
    expect(page.url()).toContain('/admin/users')
  })

  test('aside nav 내 "메뉴 관리" 클릭 후 /admin/menus 이동', async ({ page }) => {
    // aside nav 내 메뉴 관리 링크 클릭
    await page.locator('aside nav').getByText('메뉴 관리').click()
    await page.waitForURL('/admin/menus')
    expect(page.url()).toContain('/admin/menus')
  })
})
