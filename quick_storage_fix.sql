-- Storage RLS 비활성화 (빠른 해결책)
ALTER TABLE storage.objects DISABLE ROW LEVEL SECURITY;

-- 기존 정책 삭제
DROP POLICY IF EXISTS "contract-documents-upload-policy" ON storage.objects;
DROP POLICY IF EXISTS "contract-documents-select-policy" ON storage.objects;
DROP POLICY IF EXISTS "contract-documents-update-policy" ON storage.objects;
DROP POLICY IF EXISTS "contract-documents-delete-policy" ON storage.objects;

-- 버킷 생성/수정
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'contract-documents',
    'contract-documents',
    false,
    52428800,
    ARRAY['image/jpeg', 'image/png', 'image/gif', 'application/pdf', 'text/plain', 'image/webp']
) ON CONFLICT (id) DO UPDATE SET
    file_size_limit = 52428800,
    allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/gif', 'application/pdf', 'text/plain', 'image/webp'];

-- 완료 메시지
SELECT 'Storage RLS disabled and bucket configured successfully' as result;
