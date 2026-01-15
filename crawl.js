const puppeteer = require('puppeteer');
const fs = require('fs').promises;

// 날짜 파싱 유틸리티
const parseDate = (dateStr) => {
  if (!dateStr) return null;
  try {
    return new Date(dateStr).toISOString();
  } catch {
    return null;
  }
};

const calculateDaysLeft = (deadline) => {
  if (!deadline) return null;
  const now = new Date();
  const end = new Date(deadline);
  const diff = Math.ceil((end - now) / (1000 * 60 * 60 * 24));
  return diff > 0 ? diff : 0;
};

async function crawlAll() {
  console.log('Starting crawler with Puppeteer...');
  
  // 브라우저 실행 (GitHub Actions 환경에 최적화된 설정)
  const browser = await puppeteer.launch({
    headless: "new",
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const allCompetitions = [];

  try {
    const page = await browser.newPage();
    // 봇 탐지 우회용 User-Agent 설정
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/114.0.0.0 Safari/537.36');

    // --- 1. Dacon 크롤링 ---
    try {
      console.log('Crawling Dacon...');
      await page.goto('https://dacon.io/competitions/official', { waitUntil: 'networkidle2' });
      
      const daconData = await page.evaluate(() => {
        const items = document.querySelectorAll('div[class*="CompetitionItem"]'); // 클래스명 부분 일치 검색
        return Array.from(items).map(item => {
          const titleEl = item.querySelector('h4') || item.querySelector('div[class*="Title"]');
          const linkEl = item.querySelector('a');
          
          if (!titleEl) return null;
          
          return {
            platform: 'Dacon',
            title: titleEl.innerText.trim(),
            url: linkEl ? linkEl.href : '',
            description: '', // Dacon 목록에는 상세설명이 잘 없음
            tags: ['Korea', 'Data Science']
          };
        }).filter(item => item !== null);
      });
      
      allCompetitions.push(...daconData);
    } catch (e) {
      console.error('Dacon fail:', e.message);
    }

    // --- 2. Devpost 크롤링 ---
    try {
      console.log('Crawling Devpost...');
      await page.goto('https://devpost.com/hackathons', { waitUntil: 'domcontentloaded' });
      
      const devpostData = await page.evaluate(() => {
        // Devpost는 구조가 자주 바뀌므로 다양한 선택자 시도
        const items = document.querySelectorAll('.hackathon-tile, .challenge-listing');
        return Array.from(items).map(item => {
            const titleEl = item.querySelector('.hackathon-tile-title, .challenge-title');
            const linkEl = item.querySelector('a');
            const timeEl = item.querySelector('.date-range, .challenge-deadline');

            if (!titleEl) return null;

            return {
                platform: 'Devpost',
                title: titleEl.innerText.trim(),
                url: linkEl ? linkEl.href : '',
                deadlineRaw: timeEl ? timeEl.innerText.trim() : null, // 후처리 필요
                tags: ['Hackathon']
            };
        }).filter(item => item !== null);
      });
      allCompetitions.push(...devpostData);
    } catch (e) {
      console.error('Devpost fail:', e.message);
    }
    
    // --- 3. Kaggle (주의: 봇 탐지가 매우 심함) ---
    // Kaggle은 Puppeteer로도 막힐 가능성이 높지만 시도는 해봅니다.
    // 안될 경우 Kaggle API 사용을 권장합니다.

  } catch (error) {
    console.error('General Error:', error);
  } finally {
    await browser.close();
  }

  // 데이터 후처리 (마감일 계산 등)
  const processedData = allCompetitions.map(comp => ({
    ...comp,
    deadline: parseDate(comp.deadlineRaw) || null, // 날짜 변환 로직 보강 필요
    daysLeft: 0 // 임시
  }));

  const data = {
    lastUpdated: new Date().toISOString(),
    totalCompetitions: processedData.length,
    competitions: processedData
  };

  await fs.writeFile('data/competitions.json', JSON.stringify(data, null, 2));
  console.log(`Crawl complete. Saved ${processedData.length} items.`);
}

crawlAll();