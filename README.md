# 네이버 블로그 실측 분석 리포트 v6

실측 데이터 기반 · AI 추론 최소화 · 데이터 출처 명시

---

## 구조

```
blog-analyzer/
├── pages/
│   ├── index.jsx          # 메인 분석 UI
│   ├── _app.js
│   └── api/naver/
│       ├── search.js      # 검색 API 프록시
│       ├── datalab-search.js   # DataLab 검색트렌드 프록시
│       └── datalab-blog.js     # DataLab 블로그트렌드 프록시
├── styles/globals.css
├── package.json
└── next.config.js
```

---

## 로컬 실행

```bash
npm install
npm run dev
# → http://localhost:3000
```

---

## Vercel 무료 배포 (5분)

### 1단계 - GitHub에 올리기
```bash
git init
git add .
git commit -m "init"
# GitHub에서 새 repository 생성 후:
git remote add origin https://github.com/YOUR_ID/blog-analyzer.git
git push -u origin main
```

### 2단계 - Vercel 연결
1. https://vercel.com 접속 → GitHub 로그인
2. "New Project" → 위에서 만든 repository 선택
3. Framework: **Next.js** (자동 감지됨)
4. "Deploy" 클릭

→ 약 1분 후 `https://blog-analyzer-xxx.vercel.app` 주소 발급

---

## 네이버 API 키 발급

1. https://developers.naver.com/apps/#/register 접속
2. 애플리케이션 이름 입력 (예: 블로그분석툴)
3. 사용 API 선택:
   - ✅ 검색 (블로그)
   - ✅ DataLab(검색어트렌드)
   - ✅ DataLab(블로그)
4. 환경: **WEB** → 서비스 URL에 Vercel 주소 입력
5. Client ID / Client Secret 복사

---

## 수집 가능한 실측 데이터

| 데이터 | 출처 | 비고 |
|--------|------|------|
| 게시글 목록·제목·날짜 | 검색 API | 최대 ~200건 |
| 월별 발행 추이 | 검색 API 계산 | 12개월 |
| 발행 공백 패턴 | 검색 API 계산 | 평균/최장/최단 간격 |
| 스니펫 기반 본문 길이 추정 | 검색 API | 약 12배 추정 |
| 키워드 빈도 추출 | 제목 텍스트 분석 | stopwords 제거 |
| 통합검색 트렌드 | DataLab /search | 월별 검색량 지수 |
| 블로그 포스팅 추이 | DataLab /blog/keyword | 월별 포스팅 수 |
| 키워드 시장성 점수 | 검색량×빈도 교차 | 4가지 유형 분류 |
| 방문자·이웃 수 | 직접 입력 | 관리자 페이지 확인 |

## 측정 불가 항목 (네이버 내부 비공개)
- C-Rank, D.I.A 점수
- 게시글별 조회수·댓글·공감 수
