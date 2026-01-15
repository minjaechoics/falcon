# 🏆 AI/Data Competition Dashboard

실시간으로 업데이트되는 AI/데이터 경진대회 통합 대시보드

## 📊 지원 플랫폼

- Kaggle
- Dacon
- Devpost
- AIcrowd
- Analytics Vidhya
- DrivenData
- Lablab.ai
- HackerEarth
- CodaLab
- MLH

## 🚀 GitHub Pages 배포 방법

### 1. 저장소 생성

```bash
# GitHub에서 새 저장소 생성 (예: competition-dashboard)
# 로컬에 클론
git clone https://github.com/YOUR_USERNAME/competition-dashboard.git
cd competition-dashboard
```

### 2. 프로젝트 파일 구조 생성

```bash
# 디렉토리 생성
mkdir -p .github/workflows data

# 파일 생성 (위의 코드들을 각 파일에 복사)
touch crawl.js package.json index.html styles.css app.js
touch .github/workflows/update-data.yml
touch data/competitions.json
```

### 3. 초기 데이터 파일 생성

`data/competitions.json` 파일에 다음 내용을 추가:

```json
{
  "lastUpdated": "2026-01-15T00:00:00.000Z",
  "totalCompetitions": 0,
  "competitions": []
}
```

### 4. Git 설정 및 푸시

```bash
# Git 초기화 (필요시)
git init

# 파일 추가
git add .
git commit -m "Initial commit: Competition dashboard setup"

# 원격 저장소에 푸시
git branch -M main
git push -u origin main
```

### 5. GitHub Pages 활성화

1. GitHub 저장소 페이지로 이동
2. **Settings** → **Pages** 클릭
3. **Source**에서 `main` 브랜치 선택
4. **Root** 폴더 선택
5. **Save** 클릭

### 6. GitHub Actions 권한 설정

1. **Settings** → **Actions** → **General**
2. **Workflow permissions**에서 **Read and write permissions** 선택
3. **Allow GitHub Actions to create and approve pull requests** 체크
4. **Save** 클릭

### 7. 첫 크롤링 실행

1. **Actions** 탭으로 이동
2. **Update Competition Data** 워크플로우 선택
3. **Run workflow** 클릭

## 🎯 기능

- ✅ 실시간 대회 정보 크롤링 (매일 자동 업데이트)
- 🔍 대회명 검색 기능
- 🏷️ 플랫폼별 필터링
- 📅 마감일/남은 기간 정렬
- 📱 반응형 디자인
- 🌙 다크 모드 UI

## 🛠️ 로컬 개발

```bash
# 의존성 설치
npm install

# 크롤러 실행
npm run crawl

# 로컬 서버 실행 (Python)
python -m http.server 8000

# 브라우저에서 접속
# http://localhost:8000
```

## 📝 크롤러 커스터마이징

`crawl.js` 파일에서 각 플랫폼별 크롤러를 수정하여 더 많은 정보를 추출하거나 새로운 플랫폼을 추가할 수 있습니다.

## ⚠️ 주의사항

- 웹 크롤링은 각 사이트의 robots.txt와 이용약관을 준수해야 합니다
- 일부 사이트는 동적 렌더링이 필요할 수 있어 Puppeteer 등이 필요할 수 있습니다
- API가 제공되는 플랫폼은 API 사용을 권장합니다

## 📄 라이선스

MIT License

## 🤝 기여

이슈와 PR을 환영합니다!