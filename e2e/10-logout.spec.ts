import { test, expect } from '@playwright/test'
import { loginAs, logout } from './helpers/login.helper'

/**
 * 로그아웃 관련 E2E 테스트
 */
test.describe('로그아웃', () => {
  test('로그인 후 로그아웃 시 / 이동', async ({ page }) => {
    await loginAs(page, 'admin@admin.com', '1234')

    // 로그아웃
    await logout(page)

    // / URL 확인
    await page.waitForURL('/')
    expect(page.url()).toMatch(/localhost:3000\/?$/)
  })

  test('로그아웃 후 /dashboard 접근 시 / 리다이렉트', async ({ page }) => {
    await loginAs(page, 'admin@admin.com', '1234')

    // 로그아웃
    await logout(page)
    await page.waitForURL(/\/((\?.*)|$)/)

    // 로그아웃 후 /dashboard 접근 시 /로 리다이렉트 (next-auth는 /?callbackUrl=... 형태)
    await page.goto('/dashboard')
    await page.waitForURL(/\/((\?.*)|$)/)
    expect(page.url()).toMatch(/localhost:3000\/(\?.*)?$/)
  })
})
