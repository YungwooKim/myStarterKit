import { test, expect } from '@playwright/test'
import { loginAs } from './helpers/login.helper'

/**
 * 관리자가 e2etest 사용자를 삭제하는 E2E 테스트
 * 05-user-register.spec.ts에서 생성한 테스트 계정 정리
 */
test.describe('관리자 테스트 사용자 삭제', () => {
  test('e2etest@example.com 사용자 삭제', async ({ page }) => {
    await loginAs(page, 'admin@admin.com', '1234')
    await page.goto('/admin/users')
    await page.waitForLoadState('networkidle')

    // e2etest@example.com 행 확인
    const targetRow = page.locator('tr:has(td:has-text("e2etest@example.com"))')
    await expect(targetRow).toBeVisible()

    // dialog 등록 (클릭 전 반드시 등록)
    page.on('dialog', dialog => dialog.accept())

    // 해당 행의 "삭제" 버튼 클릭
    await targetRow.locator('button:has-text("삭제")').click()

    // 삭제 후 목록에서 없음 확인
    await expect(page.locator('td:has-text("e2etest@example.com")')).not.toBeVisible()
  })
})
