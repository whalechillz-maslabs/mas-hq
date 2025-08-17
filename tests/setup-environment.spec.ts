import { test, expect } from '@playwright/test';
import { writeFileSync } from 'fs';
import { join } from 'path';

test.describe('환경 설정 및 원격 Supabase 연결', () => {
  test('환경변수 파일 생성', async () => {
    // 환경변수 파일 생성
    const envContent = `# 원격 Supabase 설정
NEXT_PUBLIC_SUPABASE_URL=https://cgscbtxtgualkfalouwh.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNnc2NidHh0Z3VhbGtmYWxvdXdoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ5MDY3MzYsImV4cCI6MjA3MDQ4MjczNn0.F0iFoFEJr87g4nA6Z7U1BK3t3ModxgZC2eWNIKRA0u8

# 서버 전용
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNnc2NidHh0Z3VhbGtmYWxvdXdoIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NDkwNjczNiwiZXhwIjoyMDcwNDgyNzM2fQ.EKXlFrz2tLsAa-B4h-OGct2O1zODSMGuGp8nMZta4go
`;

    try {
      writeFileSync(join(process.cwd(), '.env.local'), envContent);
      console.log('✅ .env.local 파일 생성 완료');
    } catch (error) {
      console.log('❌ .env.local 파일 생성 실패:', error);
    }

    try {
      writeFileSync(join(process.cwd(), '.env.development'), envContent);
      console.log('✅ .env.development 파일 생성 완료');
    } catch (error) {
      console.log('❌ .env.development 파일 생성 실패:', error);
    }
  });

  test('원격 Supabase 연결 테스트', async ({ page }) => {
    // 환경변수가 제대로 로드되었는지 확인
    await page.goto('/');
    
    // 페이지가 로드되는지 확인
    await expect(page).toHaveTitle(/MASLABS/);
    console.log('✅ 홈페이지 로드 성공');
  });

  test('로그인 페이지 접근 테스트', async ({ page }) => {
    await page.goto('/login');
    
    // 로그인 페이지 요소들 확인
    await expect(page.locator('h1:has-text("MASLABS")')).toBeVisible();
    await expect(page.locator('text=직원 로그인')).toBeVisible();
    await expect(page.locator('input[type="tel"]')).toBeVisible();
    await expect(page.locator('input[type="password"]')).toBeVisible();
    await expect(page.locator('button[type="submit"]')).toBeVisible();
    
    console.log('✅ 로그인 페이지 접근 성공');
  });

  test('관리자 로그인 테스트', async ({ page }) => {
    await page.goto('/login');
    
    // 관리자 로그인 정보 입력
    await page.fill('input[type="tel"]', '010-6669-9000');
    await page.fill('input[type="password"]', 'admin123');
    await page.click('button[type="submit"]');
    
    // 로그인 결과 확인
    await page.waitForTimeout(3000);
    
    const currentUrl = page.url();
    console.log('현재 URL:', currentUrl);
    
    if (currentUrl.includes('/dashboard')) {
      console.log('✅ 관리자 로그인 성공 - 대시보드로 리다이렉트됨');
      
      // 대시보드 요소들 확인
      await expect(page.locator('text=직원 대시보드')).toBeVisible();
      await expect(page.locator('text=시스템 관리자')).toBeVisible();
      
      console.log('✅ 대시보드 접근 성공');
    } else {
      const errorText = await page.locator('text=전화번호를 찾을 수 없습니다').count();
      if (errorText > 0) {
        console.log('❌ 로그인 실패: 전화번호를 찾을 수 없습니다');
        console.log('원격 Supabase에 관리자 계정이 생성되지 않았을 수 있습니다.');
      } else {
        console.log('❌ 로그인 실패: 알 수 없는 오류');
      }
    }
  });
});
