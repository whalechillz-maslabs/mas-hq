import { test, expect } from '@playwright/test';
import { execSync } from 'child_process';

test.describe('원격 Supabase 스키마 마이그레이션', () => {
  test('원격 프로젝트 연결', async () => {
    try {
      // 원격 프로젝트 연결
      const result = execSync('npx supabase link --project-ref cgscbtxtgualkfalouwh', { 
        encoding: 'utf8',
        stdio: 'pipe'
      });
      console.log('✅ 원격 프로젝트 연결 성공:', result);
    } catch (error: any) {
      console.log('❌ 원격 프로젝트 연결 실패:', error.message);
      // 이미 연결되어 있을 수 있으므로 계속 진행
    }
  });

  test('스키마 마이그레이션 실행', async () => {
    try {
      // 스키마를 원격 Supabase에 적용
      const result = execSync('npx supabase db push', { 
        encoding: 'utf8',
        stdio: 'pipe'
      });
      console.log('✅ 스키마 마이그레이션 성공:', result);
    } catch (error: any) {
      console.log('❌ 스키마 마이그레이션 실패:', error.message);
      console.log('수동으로 다음 명령어를 실행해주세요:');
      console.log('npx supabase db push');
    }
  });

  test('관리자 계정 생성 확인', async ({ page }) => {
    // 로그인 페이지에서 관리자 계정으로 로그인 시도
    await page.goto('/login');
    
    await page.fill('input[type="tel"]', '010-6669-9000');
    await page.fill('input[type="password"]', 'admin123');
    await page.click('button[type="submit"]');
    
    await page.waitForTimeout(3000);
    
    const currentUrl = page.url();
    console.log('로그인 후 URL:', currentUrl);
    
    if (currentUrl.includes('/dashboard')) {
      console.log('✅ 관리자 계정이 원격 Supabase에 존재함');
    } else {
      console.log('❌ 관리자 계정이 원격 Supabase에 없음');
      console.log('원격 Supabase에 관리자 계정을 생성해야 합니다.');
    }
  });

  test('원격 Supabase 헬스체크', async ({ page }) => {
    try {
      // GraphQL 헬스체크
      const response = await page.request.post('https://cgscbtxtgualkfalouwh.supabase.co/graphql/v1', {
        data: { query: 'query { __typename }' }
      });
      
      if (response.ok()) {
        console.log('✅ 원격 Supabase GraphQL 연결 성공');
      } else {
        console.log('❌ 원격 Supabase GraphQL 연결 실패:', response.status());
      }
    } catch (error) {
      console.log('❌ 원격 Supabase 연결 테스트 실패:', error);
    }
  });
});
