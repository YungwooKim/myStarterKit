import { Page } from '@playwright/test'

/**
 * 지정 계정으로 로그인 후 /dashboard 대기
 * @param page - Playwright Page 인스턴스
 * @param email - 로그인 이메일
 * @param password - 로그인 비밀번호
 */
export async function loginAs(page: Page, email: string, password: string) {
  await page.goto('/')
  await page.fill('#email', email)
  await page.fill('#password', password)
  await page.click('button[type="submit"]')
  await page.waitForURL('/dashboard')
}

/**
 * 로그아웃 후 / 대기
 * @param page - Playwright Page 인스턴스
 */
export async function logout(page: Page) {
  await page.click('button:has-text("로그아웃")')
  await page.waitForURL('/')
}
