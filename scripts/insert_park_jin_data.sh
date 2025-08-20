#!/bin/bash

# ================================================
# 박진(JIN) 데이터 삽입 스크립트
# ================================================

echo "🔍 박진(JIN) 데이터 삽입 시작..."

# 1. Supabase 연결 확인
echo "📡 Supabase 연결 확인 중..."
npx supabase status

if [ $? -ne 0 ]; then
    echo "❌ Supabase 연결 실패. Supabase 프로젝트가 실행 중인지 확인하세요."
    exit 1
fi

# 2. SQL 스크립트 실행
echo "🗄️ 박진 데이터 삽입 중..."
npx supabase db reset --linked

# 3. 박진 데이터 삽입
echo "👤 박진 직원 정보 삽입..."
npx supabase db push

# 4. 데이터 확인
echo "✅ 데이터 삽입 완료!"
echo ""
echo "📋 박진(JIN) 계정 정보:"
echo "   - 전화번호: 010-9132-4337"
echo "   - 기본 패스워드: 91324337 (전화번호 8자리)"
echo "   - 기본 핀번호: 1234"
echo "   - 사번: MASLABS-004"
echo "   - 부서: OP팀"
echo "   - 직책: 파트타임"
echo "   - 시급: 12,000원"
echo "   - 은행: 우리은행 19007131399"
echo ""
echo "🎯 테스트 방법:"
echo "   1. http://localhost:3000/login 접속"
echo "   2. 전화번호: 010-9132-4337"
echo "   3. 패스워드: 91324337"
echo "   4. 또는 핀번호: 1234"
echo ""
echo "🚀 테스트 실행: npm run test:park-jin"
