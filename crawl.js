const puppeteer = require('puppeteer');
const fs = require('fs').promises;
const path = require('path');

// 날짜 파싱 유틸리티
const parseDate = (dateStr) => {
  if (!dateStr) return null;
  try {
    return new Date(dateStr).toISOString();
  } catch {
    return null;
  }
};

async function crawlAll() {
  console.log('Starting crawler with Puppeteer...');
  
  // 브라우저 실행
  const browser = await puppeteer.launch({
    headless: "new",
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const allCompetitions = [];

  try {
    const page = await browser.newPage();
    // 화면 크기 설정 (반응형 사이트에서 요소가 안 보일 수 있음 방지)
    await page.setViewport({ width: 1280, height: 800 });
    
    // 봇 탐지 우회용 User-Agent
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/114.0.0.0 Safari/537.36');

    // --- 1. Dacon 크롤링 ---
    try {
      console.log('Crawling Dacon...');
      await page.goto('https://dacon.io/competitions/official', { waitUntil: 'networkidle2', timeout: 30000 });
      
      // [중요] 데이터가 로딩될 때까지 명시적으로 기다림 (최대 10초)
      try {
        await page.waitForSelector('a[href*="/competitions/official"]', { timeout: 10000 });
      } catch (e) {
        console.log('Timeout waiting for Dacon selector. Taking screenshot...');
        await page.screenshot({ path: 'dacon_error.png' });
      }

      const daconData = await page.evaluate(() => {
        // 더 범용적인 선택자 사용 (구조가 바뀌어도 링크는 유지되므로)
        // href에 "/competitions/official"이 포함된 모든 a 태그를 찾음
        const links = Array.from(document.querySelectorAll('a[href*="/competitions/official"]'));
        
        return links.map(link => {
          // 링크 내부나 주변에서 텍스트 추출 시도
          const title = link.innerText.trim() || link.querySelector('h4')?.innerText.trim();
          // 제목이 너무 짧거나(숫자 등) 없으면 필터링
          if (!title || title.length < 2) return null;

          return {
            platform: 'Dacon',
            title: title.split('\n')[0], // 줄바꿈이 있다면 첫 줄만 제목으로
            url: link.href,
            description: '',
            tags: ['Korea', 'Data Science']
          };
        }).filter(item => item !== null);
      });
      
      // 중복 제거 (같은 링크가 여러 번 잡힐 수 있음)
      const uniqueDacon = daconData.filter((v, i, a) => a.findIndex(t => (t.url === v.url)) === i);
      
      console.log(`Dacon found: ${uniqueDacon.length} items`);
      allCompetitions.push(...uniqueDacon);

    } catch (e) {
      console.error('Dacon fail:', e.message);
    }

    // --- 2. Devpost 크롤링 ---
    try {
      console.log('Crawling Devpost...');
      await page.goto('https://devpost.com/hackathons', { waitUntil: 'domcontentloaded', timeout: 30000 });
      
      // 요소 기다리기
      try {
        await page.waitForSelector('.hackathon-tile', { timeout: 5000 });
      } catch (e) { console.log('Devpost selector timeout'); }

      const devpostData = await page.evaluate(() => {
        const items = document.querySelectorAll('.hackathon-tile');
        return Array.from(items).map(item => {
            const titleEl = item.querySelector('.hackathon-tile-title');
            const linkEl = item.querySelector('a');
            const timeEl = item.querySelector('.date-range');

            if (!titleEl) return null;

            return {
                platform: 'Devpost',
                title: titleEl.innerText.trim(),
                url: linkEl ? linkEl.href : '',
                deadlineRaw: timeEl ? timeEl.innerText.trim() : null,
                tags: ['Hackathon']
            };
        }).filter(item => item !== null);
      });
      
      console.log(`Devpost found: ${devpostData.length} items`);
      allCompetitions.push(...devpostData);

    } catch (e) {
      console.error('Devpost fail:', e.message);
    }

  } catch (error) {
    console.error('General Error:', error);
  } finally {
    await browser.close();
  }

  // --- 데이터 저장 ---
  // data 폴더가 없으면 생성 (이게 없으면 에러남)
  try {
    await fs.mkdir('data', { recursive: true });
  } catch (e) {}

  const processedData = allCompetitions.map(comp => ({
    ...comp,
    deadline: parseDate(comp.deadlineRaw) || null,
    daysLeft: 0 
  }));

  const data = {
    lastUpdated: new Date().toISOString(),
    totalCompetitions: processedData.length,
    competitions: processedData
  };

  await fs.writeFile('data/competitions.json', JSON.stringify(data, null, 2));
  console.log(`Crawl complete. Saved ${processedData.length} items to data/competitions.json`);
}

crawlAll();
