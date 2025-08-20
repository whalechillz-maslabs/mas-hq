#!/bin/bash

# Supabase 자동 패스워드 입력 스크립트
# 사용법: ./scripts/auto-supabase.sh [명령어]

SUPABASE_PASSWORD="MasLabs!2025auto"

# 명령어가 제공되지 않으면 기본값 사용
if [ $# -eq 0 ]; then
    COMMAND="db reset --linked"
else
    COMMAND="$@"
fi

echo "🔧 Supabase 명령어 실행: $COMMAND"
echo "🔑 패스워드 자동 입력 설정됨"

# 패스워드를 환경 변수로 설정
export SUPABASE_DB_PASSWORD="$SUPABASE_PASSWORD"

# 패스워드를 echo로 전달하여 자동 입력
echo -e "$SUPABASE_PASSWORD\ny" | npx supabase $COMMAND

echo "✅ Supabase 명령어 실행 완료"
