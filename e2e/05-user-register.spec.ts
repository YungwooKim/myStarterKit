import { test, expect } from '@playwright/test'

/**
 * 사용자 회원가입 관련 E2E 테스트
 */
test.describe('사용자 회원가입', () => {
  test('/register 페이지 UI 요소 확인', async ({ page }) => {
    await page.goto('/register')

    // h1, h2 텍스트 확인
    await expect(page.locator('h1')).toHaveText('StarterKit')
    await expect(page.locator('h2')).toHaveText('회원가입')

    // 입력 필드 존재 확인
    await expect(page.locator('#name')).toBeVisible()
    await expect(page.locator('#email')).toBeVisible()
    await expect(page.locator('#password')).toBeVisible()
    await expect(page.locator('#confirmPassword')).toBeVisible()
  })

  test('비밀번호 불일치 시 에러 메시지 표시', async ({ page }) => {
    await page.goto('/register')

    await page.fill('#name', '테스트유저')
    await page.fill('#email', 'test@example.com')
    await page.fill('#password', 'test1234')
    await page.fill('#confirmPassword', 'different1234')
    await page.click('button[type="submit"]')

    // 비밀번호 불일치 에러 메시지 확인
    await expect(page.locator('text=비밀번호가 일치하지 않습니다.')).toBeVisible()
  })

  test('비밀번호 4자 미만 시 에러 메시지 표시', async ({ page }) => {
    await page.goto('/register')

    await page.fill('#name', '테스트유저')
    await page.fill('#email', 'test@example.com')
    await page.fill('#password', '123')
    await page.fill('#confirmPassword', '123')
    await page.click('button[type="submit"]')

    // 비밀번호 길이 에러 메시지 확인
    await expect(page.locator('text=비밀번호는 4자 이상이어야 합니다.')).toBeVisible()
  })

  test('정상 회원가입 후 /?registered=true 이동', async ({ page }) => {
    await page.goto('/register')

    await page.fill('#name', '테스트유저')
    await page.fill('#email', 'e2etest@example.com')
    await page.fill('#password', 'test1234')
    await page.fill('#confirmPassword', 'test1234')
    await page.click('button[type="submit"]')

    // /?registered=true로 이동 확인
    await page.waitForURL('/?registered=true')
    expect(page.url()).toContain('registered=true')
  })

  test('중복 이메일 재시도 시 에러 메시지 표시', async ({ page }) => {
    await page.goto('/register')

    // 이미 등록된 이메일로 재시도
    await page.fill('#name', '테스트유저')
    await page.fill('#email', 'e2etest@example.com')
    await page.fill('#password', 'test1234')
    await page.fill('#confirmPassword', 'test1234')
    await page.click('button[type="submit"]')

    // 중복 이메일 에러 메시지 표시 확인
    await expect(page.locator('p.text-sm.text-red-600')).toBeVisible()
  })
})
