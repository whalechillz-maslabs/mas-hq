-- ========================================
-- Storage 버킷 정책 수정 스크립트
-- 실행일: 2025-01-27
-- 설명: contract-documents 버킷 업로드 실패 문제 해결
-- ========================================

-- 1. contract-documents 버킷이 존재하는지 확인
SELECT 
    'Storage Bucket Check' as section,
    name,
    public,
    file_size_limit,
    allowed_mime_types
FROM storage.buckets 
WHERE name = 'contract-documents';

-- 2. 기존 Storage 정책 삭제 (있다면)
DROP POLICY IF EXISTS "contract-documents-upload-policy" ON storage.objects;
DROP POLICY IF EXISTS "contract-documents-select-policy" ON storage.objects;
DROP POLICY IF EXISTS "contract-documents-update-policy" ON storage.objects;
DROP POLICY IF EXISTS "contract-documents-delete-policy" ON storage.objects;

-- 3. 새로운 Storage 정책 생성
-- 업로드 정책: 모든 사용자가 업로드 가능 (Auth 비활성화 상태)
CREATE POLICY "contract-documents-upload-policy" ON storage.objects
    FOR INSERT WITH CHECK (
        bucket_id = 'contract-documents'
    );

-- 조회 정책: 모든 사용자가 조회 가능
CREATE POLICY "contract-documents-select-policy" ON storage.objects
    FOR SELECT USING (
        bucket_id = 'contract-documents'
    );

-- 수정 정책: 모든 사용자가 수정 가능
CREATE POLICY "contract-documents-update-policy" ON storage.objects
    FOR UPDATE USING (
        bucket_id = 'contract-documents'
    );

-- 삭제 정책: 모든 사용자가 삭제 가능
CREATE POLICY "contract-documents-delete-policy" ON storage.objects
    FOR DELETE USING (
        bucket_id = 'contract-documents'
    );

-- 4. 버킷이 없다면 생성
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'contract-documents',
    'contract-documents',
    false, -- 비공개 버킷
    52428800, -- 50MB 제한
    ARRAY['image/jpeg', 'image/png', 'image/gif', 'application/pdf', 'text/plain']
) ON CONFLICT (id) DO UPDATE SET
    file_size_limit = 52428800,
    allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/gif', 'application/pdf', 'text/plain'];

-- 5. 정책 확인
SELECT 
    'Storage Policies Check' as section,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE tablename = 'objects' 
    AND schemaname = 'storage'
    AND policyname LIKE '%contract-documents%'
ORDER BY policyname;

-- 6. 완료 메시지
SELECT 'Storage bucket policies have been fixed successfully' as result;
