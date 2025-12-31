#!/bin/bash
# MASSGOO 굿즈 프로젝트 로컬 서버 시작 스크립트
# 포트: 3010

PORT=3010
PROJECT_NAME="massgoo_goods_3010"

echo "🚀 Starting ${PROJECT_NAME} on port ${PORT}..."
echo "📍 URL: http://localhost:${PORT}"
echo ""

# Python3 HTTP 서버 사용
if command -v python3 &> /dev/null; then
    python3 -m http.server ${PORT}
elif command -v python &> /dev/null; then
    python -m SimpleHTTPServer ${PORT}
else
    echo "❌ Python이 설치되어 있지 않습니다."
    echo "다음 명령어로 설치하세요: brew install python3"
    exit 1
fi

