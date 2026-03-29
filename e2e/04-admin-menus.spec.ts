import { test, expect } from '@playwright/test'
import { loginAs } from './helpers/login.helper'

/**
 * E2E 테스트 메뉴명 상수
 */
const TEST_MENU_NAME = 'E2E테스트메뉴'
const TEST_MENU_NAME_MODIFIED = 'E2E테스트메뉴수정'

/**
 * 특정 이름의 메뉴를 정확히 일치하는 방식으로 삭제하는 헬퍼
 * dialog는 미리 page.on으로 등록해두어야 함
 */
async function deleteMenuByExactName(page: import('@playwright/test').Page, menuName: string) {
  const span = page.getByText(menuName, { exact: true })
  const rowDiv = span.locator(
    'xpath=ancestor::div[contains(@class,"flex") and contains(@class,"items-center") and contains(@class,"justify-between")]'
  )
  await rowDiv.locator('button:has-text("삭제")').click()
  await expect(page.getByText(menuName, { exact: true })).not.toBeVisible({ timeout: 10_000 })
}

/**
 * 관리자 메뉴 관리 페이지 E2E 테스트
 */
test.describe('관리자 메뉴 관리', () => {
  test.beforeEach(async ({ page }) => {
    await loginAs(page, 'admin@admin.com', '1234')
    await page.goto('/admin/menus')
    await page.waitForLoadState('networkidle')
  })

  test('메뉴 목록 로드 확인', async ({ page }) => {
    // "총 메뉴 수:" 텍스트 존재 확인
    await expect(page.locator('text=총 메뉴 수:')).toBeVisible()
  })

  test('"메뉴 추가" 버튼 클릭 시 추가 폼 표시', async ({ page }) => {
    // 메뉴 추가 버튼 클릭
    await page.click('button:has-text("메뉴 추가")')

    // h3="새 메뉴 추가" 폼 표시 확인
    await expect(page.locator('h3:has-text("새 메뉴 추가")')).toBeVisible()
  })

  test('새 메뉴 추가', async ({ page }) => {
    // dialog 영구 등록 (삭제 시 사용)
    page.on('dialog', dialog => dialog.accept())

    // 잔여 E2E 테스트 메뉴 정리
    if (await page.getByText(TEST_MENU_NAME_MODIFIED, { exact: true }).count() > 0) {
      await deleteMenuByExactName(page, TEST_MENU_NAME_MODIFIED)
    }
    if (await page.getByText(TEST_MENU_NAME, { exact: true }).count() > 0) {
      await deleteMenuByExactName(page, TEST_MENU_NAME)
    }

    // 메뉴 추가 버튼 클릭
    await page.click('button:has-text("메뉴 추가")')
    await expect(page.locator('h3:has-text("새 메뉴 추가")')).toBeVisible()

    // 메뉴 이름 및 경로 입력
    await page.fill('input[placeholder="메뉴 이름"]', TEST_MENU_NAME)
    await page.fill('input[placeholder="/example/path"]', '/e2e-test')

    // 폼 제출
    await page.click('button[type="submit"]')

    // 추가된 메뉴 목록에 표시 확인 (MenuTreeItem의 span 기준)
    await expect(page.getByText(TEST_MENU_NAME, { exact: true })).toBeVisible()
  })

  test('메뉴 수정', async ({ page }) => {
    // dialog 영구 등록
    page.on('dialog', dialog => dialog.accept())

    // 잔여 E2E 테스트 메뉴 정리
    if (await page.getByText(TEST_MENU_NAME_MODIFIED, { exact: true }).count() > 0) {
      await deleteMenuByExactName(page, TEST_MENU_NAME_MODIFIED)
    }
    if (await page.getByText(TEST_MENU_NAME, { exact: true }).count() > 0) {
      await deleteMenuByExactName(page, TEST_MENU_NAME)
    }

    // 새 E2E테스트메뉴 추가
    await page.click('button:has-text("메뉴 추가")')
    await page.fill('input[placeholder="메뉴 이름"]', TEST_MENU_NAME)
    await page.fill('input[placeholder="/example/path"]', '/e2e-test')
    await page.click('button[type="submit"]')
    await expect(page.getByText(TEST_MENU_NAME, { exact: true })).toBeVisible()

    // E2E테스트메뉴 행에서 "수정" 버튼 클릭 (exact 매칭으로 정확한 span 찾기)
    const menuSpan = page.getByText(TEST_MENU_NAME, { exact: true })
    const menuRowDiv = menuSpan.locator(
      'xpath=ancestor::div[contains(@class,"flex") and contains(@class,"items-center") and contains(@class,"justify-between")]'
    )
    await menuRowDiv.locator('button:has-text("수정")').click()

    // h3에 수정 중인 메뉴명 포함 확인
    await expect(page.locator(`h3:has-text("${TEST_MENU_NAME}")`)).toBeVisible()

    // 메뉴 이름 수정
    const nameInput = page.locator('input[placeholder="메뉴 이름"]')
    await nameInput.clear()
    await nameInput.fill(TEST_MENU_NAME_MODIFIED)

    // 폼 제출
    await page.click('button[type="submit"]')

    // 수정된 메뉴 표시 확인
    await expect(page.getByText(TEST_MENU_NAME_MODIFIED, { exact: true })).toBeVisible()

    // 기존 메뉴명 "E2E테스트메뉴" 미표시 확인 (exact 매칭)
    await expect(page.getByText(TEST_MENU_NAME, { exact: true })).not.toBeVisible()
  })

  test('수정된 메뉴 삭제', async ({ page }) => {
    // dialog 영구 등록
    page.on('dialog', dialog => dialog.accept())

    // E2E테스트메뉴수정이 없으면 E2E테스트메뉴를 생성 후 수정
    if (await page.getByText(TEST_MENU_NAME_MODIFIED, { exact: true }).count() === 0) {
      // E2E테스트메뉴도 없으면 생성
      if (await page.getByText(TEST_MENU_NAME, { exact: true }).count() === 0) {
        await page.click('button:has-text("메뉴 추가")')
        await page.fill('input[placeholder="메뉴 이름"]', TEST_MENU_NAME)
        await page.fill('input[placeholder="/example/path"]', '/e2e-test')
        await page.click('button[type="submit"]')
        await expect(page.getByText(TEST_MENU_NAME, { exact: true })).toBeVisible()
      }

      // E2E테스트메뉴 수정
      const menuSpan = page.getByText(TEST_MENU_NAME, { exact: true })
      const menuRowDiv = menuSpan.locator(
        'xpath=ancestor::div[contains(@class,"flex") and contains(@class,"items-center") and contains(@class,"justify-between")]'
      )
      await menuRowDiv.locator('button:has-text("수정")').click()
      const nameInput = page.locator('input[placeholder="메뉴 이름"]')
      await nameInput.clear()
      await nameInput.fill(TEST_MENU_NAME_MODIFIED)
      await page.click('button[type="submit"]')
      await expect(page.getByText(TEST_MENU_NAME_MODIFIED, { exact: true })).toBeVisible()
    }

    // E2E테스트메뉴수정 행에서 "삭제" 버튼 클릭
    await deleteMenuByExactName(page, TEST_MENU_NAME_MODIFIED)

    // 삭제 후 미표시 확인
    await expect(page.getByText(TEST_MENU_NAME_MODIFIED, { exact: true })).not.toBeVisible()
  })
})
