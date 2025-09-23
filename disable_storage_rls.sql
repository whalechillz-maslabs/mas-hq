-- ========================================
-- Storage RLS 완전 비활성화 스크립트
-- 실행일: 2025-01-27
-- 설명: contract-documents 버킷 업로드 문제 해결
-- ========================================

-- 1. Storage 객체 테이블의 RLS 비활성화
ALTER TABLE storage.objects DISABLE ROW LEVEL SECURITY;

-- 2. 기존 모든 Storage 정책 삭제
DROP POLICY IF EXISTS "contract-documents-upload-policy" ON storage.objects;
DROP POLICY IF EXISTS "contract-documents-select-policy" ON storage.objects;
DROP POLICY IF EXISTS "contract-documents-update-policy" ON storage.objects;
DROP POLICY IF EXISTS "contract-documents-delete-policy" ON storage.objects;

-- 3. contract-documents 버킷 생성 (없다면)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'contract-documents',
    'contract-documents',
    false, -- 비공개 버킷
    52428800, -- 50MB 제한
    ARRAY['image/jpeg', 'image/png', 'image/gif', 'application/pdf', 'text/plain', 'image/webp']
) ON CONFLICT (id) DO UPDATE SET
    file_size_limit = 52428800,
    allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/gif', 'application/pdf', 'text/plain', 'image/webp'];

-- 4. RLS 비활성화 확인
SELECT 
    'RLS Status Check' as section,
    schemaname,
    tablename,
    rowsecurity
FROM pg_tables 
WHERE schemaname = 'storage' 
    AND tablename = 'objects';

-- 5. 버킷 정보 확인
SELECT 
    'Bucket Info' as section,
    name,
    public,
    file_size_limit,
    allowed_mime_types
FROM storage.buckets 
WHERE name = 'contract-documents';

-- 6. 완료 메시지
SELECT 'Storage RLS has been disabled successfully' as result;
