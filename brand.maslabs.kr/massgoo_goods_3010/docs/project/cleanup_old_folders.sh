#!/bin/bash
# 기존 폴더 삭제 스크립트
# 모든 파일이 새 구조로 이동되었는지 확인 후 실행하세요

echo "=== 삭제 예정 폴더 목록 ==="
echo ""
echo "다음 폴더들이 삭제됩니다:"
echo ""
echo "1. images/caps/ (83 files)"
echo "   -> 이미 products/caps/marpple/로 이동됨"
echo ""
echo "2. images/sweatshirts/ (2 files)"
echo "   -> 이미 products/sweatshirts/marpple/로 이동됨"
echo ""
echo "3. images/tees/ (105 files)"
echo "   -> 이미 products/t-shirts/marpple/로 이동됨"
echo ""
echo "4. images/pouches/ (15 files)"
echo "   -> 이미 products/pouches/marpple/로 이동됨"
echo ""
echo "5. images/orders/ (17 files)"
echo "   -> 이미 products/*/photos/로 이동됨"
echo ""
echo "6. images/designs/ (84 files)"
echo "   - logos/ -> assets/logos/로 이동됨"
echo "   - marpple-design/ -> assets/characters/toby/로 이동됨"
echo "   - pouches/ -> products/pouches/designs/로 이동됨"
echo ""
echo "⚠️  주의: 이 작업은 되돌릴 수 없습니다!"
echo ""
read -p "정말 삭제하시겠습니까? (yes/no): " confirm

if [ "$confirm" = "yes" ]; then
    echo ""
    echo "삭제 중..."
    rm -rf images/caps
    rm -rf images/sweatshirts
    rm -rf images/tees
    rm -rf images/pouches
    rm -rf images/orders
    rm -rf images/designs
    echo ""
    echo "✅ 삭제 완료!"
else
    echo ""
    echo "❌ 삭제 취소됨"
fi

