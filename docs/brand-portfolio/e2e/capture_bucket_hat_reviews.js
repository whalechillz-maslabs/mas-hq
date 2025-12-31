/**
 * 데일리오버 버킷햇 (2965) 리뷰 이미지 & 데이터 스크래핑 스크립트
 * - Marpple 리뷰 API를 호출해 포토 리뷰를 다운로드하고 WEBP로 변환
 * - 상위 리뷰 5개의 메타데이터를 JSON으로 저장 (페이지에 인용 가능)
 */

const fs = require('fs');
const path = require('path');
const https = require('https');
const sharp = require('sharp');

const OUTPUT_DIR = path.join(__dirname, '../../images/caps');
const DATA_DIR = path.join(__dirname, '../../data/reviews');

const API_URL = 'https://www.marpple.com/kr/@api/review/list?bp_id=2965&pc_id=23579930&page=1&per_page=40';
const MAX_IMAGES = 12;
const MAX_REVIEWS = 5;

function ensureDir(dir) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

function download(url, filepath) {
  return new Promise((resolve, reject) => {
    const fullUrl = url.startsWith('//') ? `https:${url}` : url;
    https
      .get(fullUrl, (res) => {
        if (res.statusCode !== 200) {
          reject(new Error(`Download failed: ${res.statusCode}`));
          return;
        }
        const fileStream = fs.createWriteStream(filepath);
        res.pipe(fileStream);
        fileStream.on('finish', () => {
          fileStream.close(resolve);
        });
        fileStream.on('error', reject);
      })
      .on('error', reject);
  });
}

function fetchJson(url) {
  return new Promise((resolve, reject) => {
    https
      .get(url, (res) => {
        if (res.statusCode !== 200) {
          reject(new Error(`API error: ${res.statusCode}`));
          return;
        }
        let data = '';
        res.on('data', (chunk) => (data += chunk));
        res.on('end', () => {
          try {
            resolve(JSON.parse(data));
          } catch (err) {
            reject(err);
          }
        });
      })
      .on('error', reject);
  });
}

async function main() {
  ensureDir(OUTPUT_DIR);
  ensureDir(DATA_DIR);

  console.log('📥 Marpple 리뷰 API 호출 중...');
  const reviews = await fetchJson(API_URL);
  if (!Array.isArray(reviews)) {
    throw new Error('Unexpected API response');
  }
  console.log(`   → 총 ${reviews.length}개의 리뷰 데이터를 수신했습니다.`);

  const photoEntries = [];
  for (const review of reviews) {
    if (!review.files || !review.files.length) continue;
    for (const file of review.files) {
      if (photoEntries.length >= MAX_IMAGES) break;
      photoEntries.push({
        url: file.url,
        reviewId: review.id
      });
    }
    if (photoEntries.length >= MAX_IMAGES) break;
  }

  console.log(`📸 다운로드할 리뷰 이미지: ${photoEntries.length}개`);

  for (let i = 0; i < photoEntries.length; i++) {
    const entry = photoEntries[i];
    const pngPath = path.join(OUTPUT_DIR, `bucket-2965-review-${i + 1}.png`);
    const webpPath = path.join(OUTPUT_DIR, `bucket-2965-review-${i + 1}.webp`);

    try {
      await download(entry.url, pngPath);
      await sharp(pngPath).resize({ width: 1200, withoutEnlargement: true }).webp({ quality: 85 }).toFile(webpPath);
      fs.unlinkSync(pngPath);
      console.log(`   ✅ 리뷰 이미지 저장: bucket-2965-review-${i + 1}.webp`);
    } catch (error) {
      console.error(`   ⚠️ 리뷰 이미지 ${i + 1} 저장 실패: ${error.message}`);
    }
  }

  const reviewSummaries = reviews.slice(0, MAX_REVIEWS).map((review) => ({
    id: review.id,
    score: review.score,
    color: review._?.base_product_color?.name || 'N/A',
    created_at: review.created_at,
    comment: review.comment?.replace(/\r\n/g, ' ').trim(),
    image: review.files?.[0]?.url ? (review.files[0].url.startsWith('//') ? `https:${review.files[0].url}` : review.files[0].url) : null
  }));

  const dataPath = path.join(DATA_DIR, 'bucket_hat_reviews.json');
  fs.writeFileSync(dataPath, JSON.stringify({ fetched_at: new Date().toISOString(), reviews: reviewSummaries }, null, 2));
  console.log(`📝 리뷰 요약 저장: ${dataPath}`);

  console.log('\n🎉 데일리오버 버킷햇 리뷰 스크래핑 완료');
}

if (require.main === module) {
  main().catch((err) => {
    console.error(err);
    process.exit(1);
  });
}






