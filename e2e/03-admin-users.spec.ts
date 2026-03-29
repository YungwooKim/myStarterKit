import { test, expect } from '@playwright/test'
import { loginAs } from './helpers/login.helper'

/**
 * 관리자 사용자 관리 페이지 E2E 테스트
 */
test.describe('관리자 사용자 관리', () => {
  test.beforeEach(async ({ page }) => {
    await loginAs(page, 'admin@admin.com', '1234')
    await page.goto('/admin/users')
    await page.waitForLoadState('networkidle')
  })

  test('사용자 목록 로드 확인', async ({ page }) => {
    // "총" 텍스트 포함하는 p 태그 확인
    await expect(page.locator('p:has-text("총")')).toBeVisible()

    // admin@admin.com 행 존재 확인
    await expect(page.locator('td:has-text("admin@admin.com")')).toBeVisible()
  })

  test('"사용자 등록" 버튼 클릭 시 등록 폼 표시', async ({ page }) => {
    // 사용자 등록 버튼 클릭
    await page.click('button:has-text("사용자 등록")')

    // h3="새 사용자 등록" 폼 표시 확인
    await expect(page.locator('h3:has-text("새 사용자 등록")')).toBeVisible()
  })

  test('새 사용자 생성', async ({ page }) => {
    // 사용자 등록 버튼 클릭
    await page.click('button:has-text("사용자 등록")')
    await expect(page.locator('h3:has-text("새 사용자 등록")')).toBeVisible()

    // 폼 범위 내에서 입력 필드 타게팅
    const form = page.locator('div:has(h3:has-text("새 사용자 등록"))')

    // 이름, 이메일, 비밀번호 입력
    await form.locator('input[type="text"]').fill('관리자생성유저')
    await form.locator('input[type="email"]').fill('admin_created@example.com')
    await form.locator('input[type="password"]').fill('test1234')

    // 폼 제출
    await form.locator('button[type="submit"]').click()

    // 폼 닫힘 확인
    await expect(page.locator('h3:has-text("새 사용자 등록")')).not.toBeVisible()

    // 생성된 사용자 목록에 표시 확인
    await expect(page.locator('td:has-text("admin_created@example.com")')).toBeVisible()
  })

  test('admin_created@example.com 비밀번호 초기화', async ({ page }) => {
    // admin_created@example.com 이메일이 없으면 먼저 생성
    const userExists = await page.locator('td:has-text("admin_created@example.com")').count()
    if (userExists === 0) {
      await page.click('button:has-text("사용자 등록")')
      await expect(page.locator('h3:has-text("새 사용자 등록")')).toBeVisible()
      const form = page.locator('div:has(h3:has-text("새 사용자 등록"))')
      await form.locator('input[type="text"]').fill('관리자생성유저')
      await form.locator('input[type="email"]').fill('admin_created@example.com')
      await form.locator('input[type="password"]').fill('test1234')
      await form.locator('button[type="submit"]').click()
      await expect(page.locator('td:has-text("admin_created@example.com")')).toBeVisible()
    }

    // dialog 등록 (클릭 전 반드시 등록)
    page.on('dialog', dialog => dialog.accept())

    // 해당 행에서 "비밀번호 초기화" 버튼 클릭
    const targetRow = page.locator('tr:has(td:has-text("admin_created@example.com"))')
    await targetRow.locator('button:has-text("비밀번호 초기화")').click()
  })

  test('admin_created@example.com 삭제', async ({ page }) => {
    // admin_created@example.com 이메일이 없으면 먼저 생성
    const userExists = await page.locator('td:has-text("admin_created@example.com")').count()
    if (userExists === 0) {
      await page.click('button:has-text("사용자 등록")')
      await expect(page.locator('h3:has-text("새 사용자 등록")')).toBeVisible()
      const form = page.locator('div:has(h3:has-text("새 사용자 등록"))')
      await form.locator('input[type="text"]').fill('관리자생성유저')
      await form.locator('input[type="email"]').fill('admin_created@example.com')
      await form.locator('input[type="password"]').fill('test1234')
      await form.locator('button[type="submit"]').click()
      await expect(page.locator('td:has-text("admin_created@example.com")')).toBeVisible()
    }

    // dialog 등록 (클릭 전 반드시 등록)
    page.on('dialog', dialog => dialog.accept())

    // 해당 행에서 "삭제" 버튼 클릭
    const targetRow = page.locator('tr:has(td:has-text("admin_created@example.com"))')
    await targetRow.locator('button:has-text("삭제")').click()

    // 삭제 후 목록에서 없음 확인
    await expect(page.locator('td:has-text("admin_created@example.com")')).not.toBeVisible()
  })
})
