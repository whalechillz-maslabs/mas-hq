/**
 * transparent.png 파일을 흰색 라인으로 변환하는 스크립트
 * 검은색/어두운 색상을 흰색으로 변환하여 저장
 */

const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const processedDir = path.join(__dirname, '../../images/designs/marpple-design/processed');

/**
 * transparent.png 파일을 흰색 라인으로 변환
 */
async function convertToWhiteLine(inputPath, outputPath) {
    try {
        const image = sharp(inputPath);
        const metadata = await image.metadata();
        
        // 이미지 데이터 가져오기
        const { data, info } = await image
            .ensureAlpha()
            .raw()
            .toBuffer({ resolveWithObject: true });

        // 픽셀 데이터 처리: 검은색/어두운 색상을 흰색으로 변환
        const newData = Buffer.alloc(data.length);
        
        for (let i = 0; i < data.length; i += 4) {
            const r = data[i];
            const g = data[i + 1];
            const b = data[i + 2];
            const a = data[i + 3]; // alpha 채널

            // 투명한 픽셀은 그대로 유지
            if (a === 0) {
                newData[i] = 0;     // R
                newData[i + 1] = 0; // G
                newData[i + 2] = 0; // B
                newData[i + 3] = 0; // A (투명)
            } else {
                // 밝기 계산 (0-255)
                const brightness = (r + g + b) / 3;
                
                // 어두운 색상(검은색 계열)을 흰색으로 변환
                // 임계값: 128 이하는 흰색으로 변환
                if (brightness < 128) {
                    newData[i] = 255;     // R (흰색)
                    newData[i + 1] = 255; // G (흰색)
                    newData[i + 2] = 255; // B (흰색)
                    newData[i + 3] = a;   // A (원본 투명도 유지)
                } else {
                    // 밝은 색상은 그대로 유지하거나 약간 밝게
                    newData[i] = Math.min(255, r + 50);
                    newData[i + 1] = Math.min(255, g + 50);
                    newData[i + 2] = Math.min(255, b + 50);
                    newData[i + 3] = a;
                }
            }
        }

        // 새 이미지 생성
        await sharp(newData, {
            raw: {
                width: info.width,
                height: info.height,
                channels: 4
            }
        })
        .png()
        .toFile(outputPath);

        console.log(`   ✅ 변환 완료: ${path.basename(outputPath)}`);
        return true;
    } catch (error) {
        console.error(`   ❌ 변환 실패 (${path.basename(inputPath)}): ${error.message}`);
        return false;
    }
}

/**
 * 모든 transparent.png 파일 찾기 및 변환
 */
async function processAllTransparentFiles() {
    console.log('\n🔄 transparent.png 파일을 흰색 라인으로 변환 시작...\n');

    if (!fs.existsSync(processedDir)) {
        console.error(`   ❌ 디렉토리를 찾을 수 없습니다: ${processedDir}`);
        return;
    }

    // 모든 파일 목록 가져오기
    const files = fs.readdirSync(processedDir);
    const transparentFiles = files.filter(file => 
        file.includes('transparent') && file.endsWith('.png')
    );

    if (transparentFiles.length === 0) {
        console.log('   ⚠️ transparent.png 파일을 찾을 수 없습니다.');
        return;
    }

    console.log(`   📁 발견된 파일: ${transparentFiles.length}개\n`);

    let successCount = 0;
    let failCount = 0;

    for (const file of transparentFiles) {
        const inputPath = path.join(processedDir, file);
        
        // 출력 파일명: -transparent.png를 -white-line.png로 변경
        const outputFileName = file.replace('-transparent.png', '-white-line.png');
        const outputPath = path.join(processedDir, outputFileName);

        console.log(`   처리 중: ${file}`);
        const success = await convertToWhiteLine(inputPath, outputPath);
        
        if (success) {
            successCount++;
        } else {
            failCount++;
        }
    }

    console.log(`\n✅ 변환 완료!`);
    console.log(`   성공: ${successCount}개`);
    console.log(`   실패: ${failCount}개`);
}

processAllTransparentFiles();




