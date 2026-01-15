let allCompetitions = [];
let filteredCompetitions = [];

// 날짜 포맷팅
function formatDate(dateString) {
    if (!dateString) return '미정';
    const date = new Date(dateString);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}.${month}.${day}`;
}

// 상대 시간 계산
function getRelativeTime(dateString) {
    if (!dateString) return '방금';
    const date = new Date(dateString);
    const now = new Date();
    const diff = Math.floor((now - date) / 1000);
    
    if (diff < 60) return '방금';
    if (diff < 3600) return `${Math.floor(diff / 60)}분 전`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}시간 전`;
    return `${Math.floor(diff / 86400)}일 전`;
}

// 남은 기간 클래스 결정
function getDaysLeftClass(daysLeft) {
    if (!daysLeft || daysLeft === 0) return 'urgent';
    if (daysLeft <= 7) return 'urgent';
    if (daysLeft <= 30) return 'warning';
    return 'safe';
}

// 남은 기간 텍스트
function getDaysLeftText(daysLeft) {
    if (!daysLeft || daysLeft === 0) return '마감';
    if (daysLeft === 1) return '1일 남음';
    return `${daysLeft}일 남음`;
}

// 대회 카드 생성
function createCompetitionCard(comp) {
    const card = document.createElement('div');
    card.className = 'competition-card';
    
    const tagsHTML = comp.tags && comp.tags.length > 0 
        ? `<div class="tags">${comp.tags.map(tag => `<span class="tag">${tag}</span>`).join('')}</div>`
        : '';
    
    card.innerHTML = `
        <div class="card-header">
            <span class="platform-badge">${comp.platform}</span>
            ${comp.daysLeft !== null 
                ? `<span class="days-left ${getDaysLeftClass(comp.daysLeft)}">${getDaysLeftText(comp.daysLeft)}</span>`
                : '<span class="days-left safe">상시 모집</span>'
            }
        </div>
        <h3 class="competition-title">${comp.title}</h3>
        ${comp.organizer ? `<div class="organizer">${comp.organizer}</div>` : ''}
        ${comp.description ? `<p class="description">${comp.description}</p>` : ''}
        ${tagsHTML}
        <div class="card-footer">
            <span class="deadline">${formatDate(comp.deadline)}</span>
            <a href="${comp.url}" target="_blank" rel="noopener noreferrer" class="view-link">
                상세보기
            </a>
        </div>
    `;
    
    return card;
}

// 대회 렌더링
function renderCompetitions(competitions) {
    const container = document.getElementById('competitions');
    const noResults = document.getElementById('noResults');
    
    if (competitions.length === 0) {
        container.innerHTML = '';
        noResults.style.display = 'block';
        return;
    }
    
    noResults.style.display = 'none';
    container.innerHTML = '';
    
    competitions.forEach(comp => {
        container.appendChild(createCompetitionCard(comp));
    });
}

// 필터링 및 검색
function filterCompetitions() {
    const searchTerm = document.getElementById('searchInput').value.toLowerCase();
    const platformFilter = document.getElementById('platformFilter').value;
    const sortFilter = document.getElementById('sortFilter').value;
    
    filteredCompetitions = allCompetitions.filter(comp => {
        const matchesSearch = !searchTerm || 
            comp.title.toLowerCase().includes(searchTerm) ||
            (comp.description && comp.description.toLowerCase().includes(searchTerm)) ||
            (comp.organizer && comp.organizer.toLowerCase().includes(searchTerm));
        
        const matchesPlatform = !platformFilter || comp.platform === platformFilter;
        
        return matchesSearch && matchesPlatform;
    });
    
    // 정렬
    filteredCompetitions.sort((a, b) => {
        switch (sortFilter) {
            case 'deadline':
                if (!a.deadline) return 1;
                if (!b.deadline) return -1;
                return new Date(a.deadline) - new Date(b.deadline);
            case 'daysLeft':
                if (a.daysLeft === null) return 1;
                if (b.daysLeft === null) return -1;
                return a.daysLeft - b.daysLeft;
            case 'platform':
                return a.platform.localeCompare(b.platform);
            default:
                return 0;
        }
    });
    
    renderCompetitions(filteredCompetitions);
}

// 데이터 로드
async function loadCompetitions() {
    const loading = document.getElementById('loading');
    
    try {
        const response = await fetch('data/competitions.json');
        const data = await response.json();
        
        allCompetitions = data.competitions;
        filteredCompetitions = [...allCompetitions];
        
        // 통계 업데이트
        document.getElementById('totalCompetitions').textContent = data.totalCompetitions;
        document.getElementById('lastUpdated').textContent = getRelativeTime(data.lastUpdated);
        
        loading.style.display = 'none';
        renderCompetitions(filteredCompetitions);
    } catch (error) {
        console.error('Failed to load competitions:', error);
        loading.innerHTML = `
            <p style="color: var(--danger);">데이터를 불러오는데 실패했습니다.</p>
            <p style="color: var(--text-secondary); font-size: 0.9rem;">잠시 후 다시 시도해주세요.</p>
        `;
    }
}

// 이벤트 리스너
document.addEventListener('DOMContentLoaded', () => {
    loadCompetitions();
    
    document.getElementById('searchInput').addEventListener('input', filterCompetitions);
    document.getElementById('platformFilter').addEventListener('change', filterCompetitions);
    document.getElementById('sortFilter').addEventListener('change', filterCompetitions);
    
    // 주기적으로 상대 시간 업데이트 (1분마다)
    setInterval(() => {
        const lastUpdatedEl = document.getElementById('lastUpdated');
        if (lastUpdatedEl && allCompetitions.length > 0) {
            const data = allCompetitions[0];
            lastUpdatedEl.textContent = getRelativeTime(new Date().toISOString());
        }
    }, 60000);
});