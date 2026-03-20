"use client";
import { useState, useCallback } from "react";

// ══════════════════════════════════════════════════════
//  데이터 소스 레이블 상수
//  REAL  = 실측값  |  EST = AI 추정  |  NA = 측정불가
// ══════════════════════════════════════════════════════
const SRC = { REAL: "real", EST: "est", NA: "na" };

const INDUSTRIES = [
  { id: "food",      label: "🍽️ 음식·맛집"      },
  { id: "travel",    label: "✈️ 여행·관광"        },
  { id: "beauty",    label: "💄 뷰티·패션"        },
  { id: "health",    label: "💪 건강·피트니스"    },
  { id: "energy",    label: "⚡ 에너지·산업"      },
  { id: "realestate",label: "🏠 부동산·인테리어"  },
  { id: "finance",   label: "💰 금융·재테크"      },
  { id: "parenting", label: "👶 육아·교육"        },
  { id: "tech",      label: "💻 IT·테크"          },
  { id: "general",   label: "📝 일반·기타"        },
];

const INDUSTRY_BENCHMARKS = {
  food:      { avgChar:2200,imageRate:90,videoRate:30,engRate:6.5,monthlyPosts:20,cRank:68 },
  travel:    { avgChar:2800,imageRate:92,videoRate:35,engRate:5.8,monthlyPosts:12,cRank:65 },
  beauty:    { avgChar:1800,imageRate:95,videoRate:40,engRate:7.2,monthlyPosts:18,cRank:70 },
  health:    { avgChar:2000,imageRate:75,videoRate:28,engRate:4.8,monthlyPosts:16,cRank:62 },
  energy:    { avgChar:1500,imageRate:55,videoRate:12,engRate:2.1,monthlyPosts:8, cRank:48 },
  realestate:{ avgChar:1800,imageRate:80,videoRate:20,engRate:3.5,monthlyPosts:12,cRank:58 },
  finance:   { avgChar:2200,imageRate:65,videoRate:18,engRate:4.2,monthlyPosts:15,cRank:60 },
  parenting: { avgChar:1900,imageRate:85,videoRate:25,engRate:6.0,monthlyPosts:14,cRank:63 },
  tech:      { avgChar:2500,imageRate:70,videoRate:22,engRate:3.8,monthlyPosts:12,cRank:61 },
  general:   { avgChar:1800,imageRate:75,videoRate:20,engRate:4.0,monthlyPosts:12,cRank:60 },
};

// ══════════════════════════════════════════════════════
//  AI 분석 프롬프트 - 실측 데이터 기반 해석 역할만
// ══════════════════════════════════════════════════════
const buildAIPrompt = (realData, industry, addInfo) => {
  const bm = INDUSTRY_BENCHMARKS[industry] || INDUSTRY_BENCHMARKS.general;
  const ind = INDUSTRIES.find(i => i.id === industry);

  return {
    system: `당신은 네이버 블로그 전문 분석가입니다.
아래에 제공되는 데이터는 실제 API와 사용자 입력으로 수집된 실측값입니다.
절대로 데이터를 임의로 만들거나 추측하지 마세요.
제공된 실측 데이터만을 근거로 해석·분석·인사이트를 제공하세요.
측정되지 않은 항목은 "측정불가"로 명시하세요.

응답은 반드시 JSON만 반환하세요 (마크다운, 주석 없이):
{
  "blogName": "블로그 이름 (제목 태그나 URL에서 추출)",
  "overallScore": 숫자(0-100, 실측 데이터 기반으로만 산정),
  "scoreBreakdown": {
    "postConsistency": 숫자(월별 발행 일관성, 실측),
    "contentVolume": 숫자(총 게시글량),
    "keywordDiversity": 숫자(키워드 다양성, 제목 분석 기반),
    "recentActivity": 숫자(최근 1개월 활동성),
    "titleOptimization": 숫자(제목 SEO 평균 점수)
  },
  "industryRank": "상위 X% (추정)",
  "summary": "실측 데이터 기반 3-4문장 종합 분석. 수치를 근거로 명시할 것.",
  "contentPatterns": {
    "avgTitleLength": 숫자,
    "hasNumberInTitle": 숫자(백분율),
    "hasLocalKeyword": 숫자(백분율),
    "hasYearInTitle": 숫자(백분율),
    "topPatterns": ["자주 쓰이는 제목 패턴1", "패턴2", "패턴3"]
  },
  "keywordAnalysis": {
    "topKeywords": [{"keyword":"키워드","count":숫자,"trend":"up|stable|down"}],
    "missingKeywords": ["공략 추천 키워드1","키워드2","키워드3"],
    "keywordDensityScore": 숫자
  },
  "activityAnalysis": {
    "peakDayOfWeek": "가장 많이 발행하는 요일",
    "consistencyScore": 숫자,
    "recentMomentum": "상승|유지|하락",
    "longestGap": 숫자(일, 발행 공백 최대값)
  },
  "strengths": ["강점1 (근거 수치 포함)","강점2","강점3","강점4"],
  "weaknesses": ["개선점1 (근거 수치 포함)","개선점2","개선점3","개선점4"],
  "recommendations": ["1순위 실행방안","2순위","3순위"],
  "phase1": ["즉시 실행1","즉시 실행2","즉시 실행3"],
  "phase2": ["단기 실행1","단기 실행2","단기 실행3"],
  "phase3": ["중기 실행1","중기 실행2","중기 실행3"],
  "competitors": [
    {"name":"동종 업종 상위 블로그 예시A","overallScore":85,"monthlyPosts":22,"cRank":81,"strengths":"특징 설명"},
    {"name":"동종 업종 상위 블로그 예시B","overallScore":79,"monthlyPosts":16,"cRank":74,"strengths":"특징 설명"},
    {"name":"동종 업종 상위 블로그 예시C","overallScore":71,"monthlyPosts":13,"cRank":68,"strengths":"특징 설명"}
  ]
}`,
    user: `[블로그 분석 요청]
업종: ${ind?.label}
업종 벤치마크: 평균 글자수 ${bm.avgChar}자 / 이미지율 ${bm.imageRate}% / 월 게시글 ${bm.monthlyPosts}건 / C-Rank ${bm.cRank}
${addInfo ? `추가정보: ${addInfo}` : ""}

[수집된 실측 데이터]
${JSON.stringify(realData, null, 2)}

위 실측 데이터만 기반으로 분석하세요. 없는 데이터는 절대 추측하지 마세요.`
  };
};

// ══════════════════════════════════════════════════════
//  제목 SEO 채점기
// ══════════════════════════════════════════════════════
const scoreTitleSEO = (title) => {
  if (!title?.trim()) return null;
  const checks = [
    { label:"적정 길이 (15-35자)", pass: title.length>=15&&title.length<=35, score:20 },
    { label:"숫자 포함",           pass: /[0-9]/.test(title), score:15 },
    { label:"연도·최신 키워드",    pass: /202[0-9]|최신|최근|올해|이번/.test(title), score:10 },
    { label:"감성·클릭 유도어",    pass: /추천|완벽|필수|꼭|진짜|솔직|실제|후기|리뷰|직접|총정리/.test(title), score:15 },
    { label:"의문문·리스트형",     pass: /[?？]|TOP\s*[0-9]|[0-9]+가지|[0-9]+개/.test(title), score:15 },
    { label:"지역명 포함",         pass: /서울|부산|대구|인천|수원|성남|용인|강남|홍대|경기|전국/.test(title), score:10 },
    { label:"특수문자 과다 없음",  pass: (title.match(/[!！♥★☆]/g)||[]).length<=2, score:15 },
  ];
  return { total: checks.reduce((s,c)=>s+(c.pass?c.score:0),0), checks, length: title.length };
};

// ══════════════════════════════════════════════════════
//  유틸
// ══════════════════════════════════════════════════════
const stripHtml = s => (s||"").replace(/<[^>]+>/g,"").trim();

const buildMonthlyTrend = (items) => {
  const counts = {};
  (items||[]).forEach(item => {
    const d = item.postdate || "";
    if (d.length>=6) { const ym=d.slice(0,4)+"-"+d.slice(4,6); counts[ym]=(counts[ym]||0)+1; }
  });
  const now = new Date();
  return Array.from({length:12},(_,i)=>{
    const dt = new Date(now.getFullYear(), now.getMonth()-(11-i), 1);
    const ym = dt.getFullYear()+"-"+String(dt.getMonth()+1).padStart(2,"0");
    return { month:ym, label:ym.slice(2), count:counts[ym]||0 };
  });
};

const extractKeywordsFromTitles = (titles) => {
  const stopwords = new Set(["의","가","이","은","는","을","를","과","와","에","에서","로","으로","도","만","그","저","이런","저런","어떤","하는","있는","없는","하고","하여","통해","위한","위해","대한","관한"]);
  const freq = {};
  titles.forEach(t => {
    (t.match(/[가-힣a-zA-Z]{2,}/g)||[]).forEach(w => {
      if (!stopwords.has(w) && w.length>=2) freq[w]=(freq[w]||0)+1;
    });
  });
  return Object.entries(freq).sort((a,b)=>b[1]-a[1]).slice(0,15)
    .map(([k,v])=>({ keyword:k, count:v, trend:"stable" }));
};

// ══════════════════════════════════════════════════════
//  UI 서브 컴포넌트
// ══════════════════════════════════════════════════════
const DATA_BADGE = {
  [SRC.REAL]: { bg:"#dcfce7", border:"#86efac", color:"#166534", text:"실측" },
  [SRC.EST]:  { bg:"#fef9c3", border:"#fde047", color:"#854d0e", text:"추정" },
  [SRC.NA]:   { bg:"#f1f5f9", border:"#cbd5e1", color:"#64748b", text:"측정불가" },
};

function DataBadge({ src }) {
  const b = DATA_BADGE[src] || DATA_BADGE[SRC.NA];
  return (
    <span style={{ fontSize:8, padding:"1px 6px", borderRadius:99, fontWeight:700,
      background:b.bg, border:`1px solid ${b.border}`, color:b.color, marginLeft:5, verticalAlign:"middle" }}>
      {b.text}
    </span>
  );
}

function MetricCard({ label, value, unit, src, color="#3B82F6", icon, sub }) {
  const isNA = src===SRC.NA || value==null || value==="측정불가";
  return (
    <div style={{ background:"#fff", borderRadius:12, padding:"13px 15px",
      boxShadow:"0 2px 12px rgba(0,0,0,.07)", borderTop:`3px solid ${isNA?"#e2e8f0":color}`, flex:1, minWidth:0 }}>
      <div style={{ fontSize:18, marginBottom:3 }}>{icon}</div>
      <div style={{ fontSize:isNA?13:22, fontWeight:800, color:isNA?"#94a3b8":"#1e293b", lineHeight:1 }}>
        {isNA ? "측정불가" : (typeof value==="number" ? value.toLocaleString() : value)}
      </div>
      <div style={{ fontSize:10, color:"#94a3b8", marginTop:1 }}>{isNA?"":unit}</div>
      <div style={{ display:"flex", alignItems:"center", marginTop:4 }}>
        <span style={{ fontSize:11, fontWeight:600, color:"#475569" }}>{label}</span>
        <DataBadge src={src} />
      </div>
      {sub && !isNA && <div style={{ fontSize:10, color:"#94a3b8", marginTop:2 }}>{sub}</div>}
    </div>
  );
}

function ScoreRing({ score, size=80, color="#00C57E" }) {
  const r=(size/2)-8, circ=2*Math.PI*r, dash=(score/100)*circ;
  return (
    <div style={{ position:"relative", width:size, height:size }}>
      <svg width={size} height={size} style={{ transform:"rotate(-90deg)" }}>
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="#e8edf5" strokeWidth="7"/>
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={color} strokeWidth="7"
          strokeDasharray={`${dash} ${circ}`} strokeLinecap="round"
          style={{ transition:"stroke-dasharray 1s ease" }}/>
      </svg>
      <div style={{ position:"absolute",top:0,left:0,width:size,height:size,
        display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center" }}>
        <span style={{ fontSize:size*.26, fontWeight:800, color, lineHeight:1 }}>{score}</span>
        <span style={{ fontSize:size*.13, color:"#94a3b8" }}>/100</span>
      </div>
    </div>
  );
}

function BenchmarkBar({ label, myVal, benchVal, unit="", color="#1A2B5E", src }) {
  if (src===SRC.NA || myVal==null) {
    return (
      <div style={{ marginBottom:14 }}>
        <div style={{ display:"flex", justifyContent:"space-between", marginBottom:4 }}>
          <span style={{ fontSize:11, color:"#374151", fontWeight:600 }}>{label} <DataBadge src={SRC.NA}/></span>
          <span style={{ fontSize:10, color:"#94a3b8" }}>업종평균 {benchVal}{unit}</span>
        </div>
        <div style={{ height:8, background:"#f1f5f9", borderRadius:99,
          display:"flex", alignItems:"center", paddingLeft:10 }}>
          <span style={{ fontSize:9, color:"#cbd5e1" }}>데이터 없음</span>
        </div>
      </div>
    );
  }
  const max=Math.max(myVal,benchVal,1)*1.25, ahead=myVal>=benchVal;
  return (
    <div style={{ marginBottom:14 }}>
      <div style={{ display:"flex", justifyContent:"space-between", marginBottom:4 }}>
        <span style={{ fontSize:11, color:"#374151", fontWeight:600 }}>{label} <DataBadge src={src}/></span>
        <span style={{ fontSize:10, color:"#94a3b8" }}>업종평균 {benchVal}{unit}</span>
      </div>
      <div style={{ position:"relative", height:8, background:"#e8edf5", borderRadius:99 }}>
        <div style={{ position:"absolute", left:`${(benchVal/max)*100}%`, top:-3, width:2, height:14, background:"#94a3b8", borderRadius:99 }}/>
        <div style={{ position:"absolute", left:0, top:0, height:"100%", borderRadius:99,
          width:`${Math.min((myVal/max)*100,100)}%`,
          background:ahead?color:"#EF4444", transition:"width 1s ease" }}/>
      </div>
      <div style={{ display:"flex", justifyContent:"space-between", marginTop:3 }}>
        <span style={{ fontSize:11, fontWeight:800, color:ahead?color:"#EF4444" }}>{myVal}{unit}</span>
        <span style={{ fontSize:10, fontWeight:700, color:ahead?"#00C57E":"#EF4444" }}>
          {ahead?`+${(myVal-benchVal).toFixed(1)}${unit} ▲`:`${(myVal-benchVal).toFixed(1)}${unit} ▼`}
        </span>
      </div>
    </div>
  );
}

function RadarChart({ data, labels, colors, size=200 }) {
  const cx=size/2, cy=size/2, r=size*.35, n=labels.length;
  const toXY=(val,i)=>{ const a=(Math.PI*2*i/n)-Math.PI/2, rv=(val/100)*r; return {x:cx+rv*Math.cos(a),y:cy+rv*Math.sin(a)}; };
  return (
    <svg width={size} height={size} style={{ overflow:"visible" }}>
      {[20,40,60,80,100].map(lv=>{ const pts=Array.from({length:n},(_,i)=>toXY(lv,i));
        return <polygon key={lv} points={pts.map(p=>`${p.x},${p.y}`).join(" ")} fill="none" stroke="#e8edf5" strokeWidth="1"/>; })}
      {Array.from({length:n},(_,i)=>{ const e=toXY(100,i); return <line key={i} x1={cx} y1={cy} x2={e.x} y2={e.y} stroke="#e8edf5" strokeWidth="1"/>; })}
      {data.map((ds,di)=>{ const pts=ds.map((v,i)=>toXY(v,i));
        return (<g key={di}><polygon points={pts.map(p=>`${p.x},${p.y}`).join(" ")} fill={colors[di]} fillOpacity=".15" stroke={colors[di]} strokeWidth="2"/>
          {pts.map((p,i)=><circle key={i} cx={p.x} cy={p.y} r="3" fill={colors[di]}/>)}</g>); })}
      {labels.map((l,i)=>{ const p=toXY(118,i);
        return <text key={i} x={p.x} y={p.y} textAnchor="middle" dominantBaseline="middle" fontSize="9" fill="#64748b" fontWeight="600">{l}</text>; })}
    </svg>
  );
}

const TABS = [
  { id:"overview",   label:"📊 종합요약"      },
  { id:"posts",      label:"📝 게시글 분석"   },
  { id:"keywords",   label:"🔑 키워드·DataLab"},
  { id:"benchmark",  label:"📏 업종 벤치마크" },
  { id:"competitor", label:"🔍 경쟁사 비교"   },
  { id:"trend",      label:"📈 시계열 추이"   },
  { id:"seo",        label:"🔤 SEO 채점기"    },
  { id:"action",     label:"🚀 실행 계획"     },
];

// ══════════════════════════════════════════════════════
//  메인 앱
// ══════════════════════════════════════════════════════
export default function App() {
  // API 키
  const [clientId,     setClientId]     = useState("");
  const [clientSecret, setClientSecret] = useState("");
  const [showApiPanel, setShowApiPanel] = useState(true);

  // 입력
  const [url,       setUrl]       = useState("");
  const [industry,  setIndustry]  = useState("general");
  const [addInfo,   setAddInfo]   = useState("");

  // 수동 입력 데이터 (블로그 주인 or 대행사)
  const [manualVisitors,  setManualVisitors]  = useState("");
  const [manualFollowers, setManualFollowers] = useState("");
  const [manualTotalPosts,setManualTotalPosts]= useState("");
  const [showManualInput, setShowManualInput] = useState(false);

  // DataLab 키워드
  const [dlKeywords, setDlKeywords] = useState("");

  // 상태
  const [step,       setStep]       = useState(1);
  const [loading,    setLoading]    = useState(false);
  const [loadingMsg, setLoadingMsg] = useState("");
  const [loadingPct, setLoadingPct] = useState(0);
  const [result,     setResult]     = useState(null); // { aiData, realData, dataSources }
  const [error,      setError]      = useState("");
  const [activeTab,  setActiveTab]  = useState("overview");

  // SEO 채점기
  const [titleInput, setTitleInput] = useState("");
  const [titleScore, setTitleScore] = useState(null);

  // 분석 이력
  const [history, setHistory]       = useState([]);
  const [showHistory, setShowHistory] = useState(false);

  // ════════════════════════════════════════════
  //  API 헬퍼 - Next.js 서버 프록시 경유 (CORS 해결)
  //  브라우저 → /api/naver/* → 서버 → 네이버 API
  // ════════════════════════════════════════════

  const naverAuthHeaders = () => ({
    "x-naver-client-id":     clientId,
    "x-naver-client-secret": clientSecret,
    "Content-Type":          "application/json",
  });

  // ① 검색 API 프록시 (다중 쿼리, 중복 제거)
  const fetchBlogPosts = async (blogId) => {
    if (!clientId || !clientSecret || !blogId) return null;
    try {
      const res = await fetch("/api/naver/search", {
        method:  "POST",
        headers: naverAuthHeaders(),
        body:    JSON.stringify({ blogId }),
      });
      if (!res.ok) return null;
      const j = await res.json();
      return j.items?.length ? j.items : null;
    } catch { return null; }
  };

  // ② DataLab 통합검색 트렌드 프록시
  const fetchDataLabSearch = async (keywords) => {
    if (!clientId || !clientSecret || !keywords.length) return null;
    try {
      const res = await fetch("/api/naver/datalab-search", {
        method:  "POST",
        headers: naverAuthHeaders(),
        body:    JSON.stringify({ keywords }),
      });
      if (!res.ok) { console.warn("DataLab search:", res.status); return null; }
      return await res.json();
    } catch (e) { console.warn("DataLab search err:", e); return null; }
  };

  // ③ DataLab 블로그 포스팅 추이 프록시
  const fetchDataLabBlogKeyword = async (keywords) => {
    if (!clientId || !clientSecret || !keywords.length) return null;
    try {
      const res = await fetch("/api/naver/datalab-blog", {
        method:  "POST",
        headers: naverAuthHeaders(),
        body:    JSON.stringify({ keywords }),
      });
      if (!res.ok) { console.warn("DataLab blog:", res.status); return null; }
      return await res.json();
    } catch (e) { console.warn("DataLab blog err:", e); return null; }
  };

  // ⑤ 발행 날짜 배열 → 공백 패턴 분석 (실측 계산)
  const analyzePostingGaps = (items) => {
    if (!items || items.length < 2) return null;
    const dates = items
      .map(i => i.postdate)
      .filter(Boolean)
      .map(d => new Date(d.slice(0,4)+"-"+d.slice(4,6)+"-"+d.slice(6,8)))
      .sort((a,b) => b-a);

    const gaps = [];
    for (let i = 0; i < dates.length - 1; i++) {
      gaps.push(Math.round((dates[i] - dates[i+1]) / (1000*60*60*24)));
    }
    if (!gaps.length) return null;

    const avgGap  = Math.round(gaps.reduce((s,v)=>s+v,0) / gaps.length);
    const maxGap  = Math.max(...gaps);
    const minGap  = Math.min(...gaps);
    const under7  = gaps.filter(g=>g<=7).length;
    const under30 = gaps.filter(g=>g<=30).length;
    // 최근 30일 발행 수
    const now = new Date();
    const last30 = dates.filter(d=>(now-d)<30*24*60*60*1000).length;
    const last7  = dates.filter(d=>(now-d)<7*24*60*60*1000).length;

    return { avgGap, maxGap, minGap, under7Pct: Math.round((under7/gaps.length)*100),
      under30Pct: Math.round((under30/gaps.length)*100), last30, last7, totalAnalyzed: dates.length };
  };

  // ⑥ 스니펫 기반 콘텐츠 품질 추정 (실측 텍스트 분석)
  const analyzeSnippets = (posts) => {
    if (!posts || !posts.length) return null;
    const snippets = posts.map(p => stripHtml(p.description || "")).filter(Boolean);
    if (!snippets.length) return null;

    const avgSnippetLen = Math.round(snippets.reduce((s,t)=>s+t.length,0)/snippets.length);
    // 스니펫 길이 기반 본문 길이 추정 (스니펫은 보통 본문의 약 10-15%)
    const estAvgBodyLen = Math.round(avgSnippetLen * 12);
    const hasQuestion   = snippets.filter(s=>/[?？]/.test(s)).length;
    const hasNumbers    = snippets.filter(s=>/[0-9]/.test(s)).length;
    const hasImageMention = snippets.filter(s=>/사진|이미지|그림|캡처|스크린/.test(s)).length;

    return {
      avgSnippetLen,
      estAvgBodyLen,
      hasQuestionPct:     Math.round((hasQuestion/snippets.length)*100),
      hasNumbersPct:      Math.round((hasNumbers/snippets.length)*100),
      hasImageMentionPct: Math.round((hasImageMention/snippets.length)*100),
      snippetCount:       snippets.length,
    };
  };

  // ⑦ 키워드 시장성 점수 계산 (DataLab 검색량 × 블로그 빈도 교차)
  const calcKeywordMarketScore = (extractedKws, dlSearchData) => {
    if (!extractedKws?.length) return [];
    const dlMap = {};
    if (dlSearchData?.results) {
      dlSearchData.results.forEach(r => {
        const avg = r.data ? r.data.reduce((s,d)=>s+d.ratio,0)/r.data.length : 0;
        dlMap[r.title] = avg;
      });
    }
    return extractedKws.map(kw => {
      const dlScore  = dlMap[kw.keyword] || 0;
      const blogFreq = Math.min((kw.count / (extractedKws[0]?.count || 1)) * 100, 100);
      // 검색량 높고 + 내 블로그 자주 다루면 → 핵심 키워드
      // 검색량 높고 + 내 블로그 적게 다루면 → 기회 키워드
      const marketScore = Math.round(dlScore * 0.6 + blogFreq * 0.4);
      const type = dlScore > 50 && blogFreq > 50 ? "핵심" :
                   dlScore > 50 && blogFreq <= 50 ? "기회" :
                   dlScore <= 50 && blogFreq > 50 ? "집중" : "탐색";
      return { ...kw, dlScore: Math.round(dlScore), blogFreq: Math.round(blogFreq),
        marketScore, type };
    }).sort((a,b) => b.marketScore - a.marketScore);
  };

  // ── 메인 분석 함수
  const analyze = useCallback(async () => {
    if (!url.trim()) { setError("네이버 블로그 URL을 입력해주세요."); return; }
    if (!url.includes("blog.naver.com") && !url.includes("blog.me")) {
      setError("올바른 네이버 블로그 URL을 입력해주세요."); return;
    }
    if (!clientId || !clientSecret) {
      setError("네이버 API 키를 입력해주세요. API 없이는 정확한 분석이 불가능합니다."); return;
    }
    setError(""); setLoading(true); setStep(2); setLoadingPct(0);

    const phases = [
      { msg:"블로그 ID 추출 중...",              pct:5  },
      { msg:"게시글 다중 수집 중 (검색 API)...", pct:18 },
      { msg:"발행 패턴·공백 분석 중...",         pct:32 },
      { msg:"제목·키워드 실측 추출 중...",       pct:45 },
      { msg:"DataLab 통합검색 트렌드 수집...",   pct:57 },
      { msg:"DataLab 블로그 포스팅 추이 수집...",pct:67 },
      { msg:"키워드 시장성 교차 분석 중...",     pct:76 },
      { msg:"AI 실측 데이터 해석 중...",         pct:88 },
      { msg:"리포트 생성 완료...",               pct:100 },
    ];
    let pi = 0;
    setLoadingMsg(phases[0].msg); setLoadingPct(phases[0].pct);
    const advance = () => { pi=Math.min(pi+1,phases.length-1); setLoadingMsg(phases[pi].msg); setLoadingPct(phases[pi].pct); };
    const timer = setInterval(advance, 2000);

    try {
      // ① 블로그 ID 추출
      const match = url.match(/blog\.naver\.com\/([^/?#]+)/);
      const blogId = match?.[1] || "";
      advance();

      // ② 검색 API - 다중 쿼리 게시글 수집 (실측)
      const posts = await fetchBlogPosts(blogId);
      const hasRealPosts = posts && posts.length > 0;
      advance();

      // ③ 실측 지표 계산 (공백 패턴 + 스니펫 분석 추가)
      let realMetrics = {};
      let monthlyTrend = [];
      let titles = [];
      let extractedKeywords = [];
      let postingGaps = null;
      let snippetAnalysis = null;

      if (hasRealPosts) {
        titles = posts.map(p => stripHtml(p.title));
        monthlyTrend = buildMonthlyTrend(posts);
        extractedKeywords = extractKeywordsFromTitles(titles);
        postingGaps   = analyzePostingGaps(posts);       // ★ 신규: 공백 패턴
        snippetAnalysis = analyzeSnippets(posts);         // ★ 신규: 스니펫 분석

        const titleScores = titles.map(t => scoreTitleSEO(t)?.total || 0);
        const avgTitleSEO = Math.round(titleScores.reduce((s,v)=>s+v,0) / titleScores.length);

        const withNumbers = titles.filter(t=>/[0-9]/.test(t)).length;
        const withYear    = titles.filter(t=>/202[0-9]/.test(t)).length;
        const withLocal   = titles.filter(t=>/서울|부산|수원|경기|강남/.test(t)).length;
        const avgTitleLen = Math.round(titles.reduce((s,t)=>s+t.length,0)/titles.length);

        const nonZeroMonths = monthlyTrend.filter(m=>m.count>0).length;
        const consistency   = Math.round((nonZeroMonths/12)*100);

        const recentCounts = monthlyTrend.slice(-3).map(m=>m.count);
        const prevCounts   = monthlyTrend.slice(-6,-3).map(m=>m.count);
        const recentAvg = recentCounts.reduce((s,v)=>s+v,0)/3;
        const prevAvg   = prevCounts.reduce((s,v)=>s+v,0)/3;

        realMetrics = {
          collectedPosts: posts.length,
          monthlyTrend, titles: titles.slice(0,30),
          extractedKeywords, avgTitleSEO, avgTitleLen,
          titlePatterns: {
            withNumbers:  Math.round((withNumbers/titles.length)*100),
            withYear:     Math.round((withYear/titles.length)*100),
            withLocal:    Math.round((withLocal/titles.length)*100),
          },
          consistencyScore: consistency,
          recentAvgPosts: +recentAvg.toFixed(1),
          prevAvgPosts:   +prevAvg.toFixed(1),
          momentum: recentAvg > prevAvg*1.1 ? "상승" : recentAvg < prevAvg*0.9 ? "하락" : "유지",
          latestPostDate: posts[0]?.postdate || null,
          oldestPostDate: posts[posts.length-1]?.postdate || null,
          postingGaps,      // ★ 신규
          snippetAnalysis,  // ★ 신규
          snippets: posts.slice(0,10).map(p=>stripHtml(p.description)),
        };
      }
      advance();

      // ④ DataLab 3종 병렬 수집 (실측)
      const kwList = dlKeywords
        ? dlKeywords.split(/[,\s]+/).map(k=>k.trim()).filter(Boolean)
        : extractedKeywords.slice(0,5).map(k=>k.keyword);

      let dlSearchData  = null; // 통합 검색량 트렌드
      let dlBlogData    = null; // 블로그 포스팅량 트렌드
      let kwMarketScore = [];

      if (kwList.length > 0) {
        // DataLab 검색 + 블로그 키워드 병렬 수집
        [dlSearchData, dlBlogData] = await Promise.all([
          fetchDataLabSearch(kwList),
          fetchDataLabBlogKeyword(kwList),
        ]);
        advance();
        // ⑤ 키워드 시장성 교차 분석 (실측 기반)
        kwMarketScore = calcKeywordMarketScore(extractedKeywords, dlSearchData);
      } else {
        advance();
      }
      advance();

      // ⑥ 수동 입력값 병합
      const manualData = {
        dailyVisitors:  manualVisitors   ? parseInt(manualVisitors)   : null,
        followers:      manualFollowers  ? parseInt(manualFollowers)  : null,
        totalPostCount: manualTotalPosts ? parseInt(manualTotalPosts) : null,
      };
      advance();

      // ⑦ AI 분석 - 실측 데이터 해석 (수치 재생성 금지)
      const realDataForAI = {
        blogId, blogUrl: url,
        searchAPIData: hasRealPosts ? {
          collectedCount:   realMetrics.collectedPosts,
          latestPostDate:   realMetrics.latestPostDate,
          oldestPostDate:   realMetrics.oldestPostDate,
          monthlyTrend:     monthlyTrend.map(m=>({ month:m.month, count:m.count })),
          titleSamples:     titles.slice(0,20),
          avgTitleLength:   realMetrics.avgTitleLen,
          avgTitleSEOScore: realMetrics.avgTitleSEO,
          titlePatterns:    realMetrics.titlePatterns,
          topKeywords:      extractedKeywords.slice(0,10),
          consistencyScore: realMetrics.consistencyScore,
          recentMomentum:   realMetrics.momentum,
          postingGaps:      postingGaps,
          snippetAnalysis:  snippetAnalysis,
          snippetSamples:   realMetrics.snippets,
        } : "검색 API 수집 실패",
        dataLabSearch: dlSearchData ? {
          description: "네이버 통합검색 키워드별 월별 검색량 지수(0-100 상대값)",
          results: dlSearchData.results?.map(r=>({
            keyword: r.title,
            monthlyAvg: r.data ? Math.round(r.data.reduce((s,d)=>s+d.ratio,0)/r.data.length) : null,
            trend: r.data?.slice(-3).reduce((s,d)=>s+d.ratio,0) >
                   r.data?.slice(-6,-3).reduce((s,d)=>s+d.ratio,0) ? "상승" : "하락",
            last3months: r.data?.slice(-3).map(d=>({ period:d.period, ratio:d.ratio }))
          }))
        } : "DataLab 검색 수집 실패",
        dataLabBlog: dlBlogData ? {
          description: "해당 키워드를 다루는 블로그 포스팅 수 월별 추이",
          results: dlBlogData.results?.map(r=>({
            keyword: r.title,
            monthlyAvg: r.data ? Math.round(r.data.reduce((s,d)=>s+d.ratio,0)/r.data.length) : null,
            trend: r.data?.slice(-3).reduce((s,d)=>s+d.ratio,0) >
                   r.data?.slice(-6,-3).reduce((s,d)=>s+d.ratio,0) ? "증가" : "감소",
          }))
        } : "DataLab 블로그 수집 실패",
        keywordMarketAnalysis: kwMarketScore.slice(0,10),
        manualInput: {
          dailyVisitors:  manualData.dailyVisitors  || "미입력",
          followers:      manualData.followers      || "미입력",
          totalPostCount: manualData.totalPostCount || "미입력",
        },
      };

      const prompts = buildAIPrompt(realDataForAI, industry, addInfo);
      const aiRes = await fetch("https://api.anthropic.com/v1/messages", {
        method:"POST",
        headers:{ "Content-Type":"application/json" },
        body: JSON.stringify({
          model:"claude-sonnet-4-20250514",
          max_tokens:4000,
          system: prompts.system,
          messages:[{ role:"user", content:prompts.user }]
        })
      });

      const aiJson = await aiRes.json();
      if (aiJson.error) throw new Error(aiJson.error.message);
      if (aiJson.stop_reason==="max_tokens") throw new Error("응답이 너무 깁니다. 다시 시도해주세요.");

      const raw = aiJson.content.map(b=>b.text||"").join("");
      let str = raw.replace(/```json\s*/g,"").replace(/```\s*/g,"").trim();
      const fb=str.indexOf("{"), lb=str.lastIndexOf("}");
      if (fb!==-1&&lb!==-1) str=str.slice(fb,lb+1);

      let aiData;
      try { aiData = JSON.parse(str); }
      catch(e) { throw new Error("AI 응답 파싱 실패: "+e.message); }
      advance();

      // ⑦ 최종 결과 조립 - 데이터 소스 명시
      const finalResult = {
        // 기본
        blogId, blogUrl: url,
        blogName: aiData.blogName || blogId,
        industry, industryLabel: INDUSTRIES.find(i=>i.id===industry)?.label,
        reportDate: new Date().toLocaleDateString("ko-KR",{year:"numeric",month:"long",day:"numeric"}),

        // 실측 지표
        collectedPosts:   { value: hasRealPosts ? realMetrics.collectedPosts : null, src: hasRealPosts?SRC.REAL:SRC.NA },
        monthlyTrend:     { value: hasRealPosts ? monthlyTrend : [], src: hasRealPosts?SRC.REAL:SRC.NA },
        avgTitleSEO:      { value: hasRealPosts ? realMetrics.avgTitleSEO : null, src: hasRealPosts?SRC.REAL:SRC.NA },
        avgTitleLen:      { value: hasRealPosts ? realMetrics.avgTitleLen : null, src: hasRealPosts?SRC.REAL:SRC.NA },
        consistencyScore: { value: hasRealPosts ? realMetrics.consistencyScore : null, src: hasRealPosts?SRC.REAL:SRC.NA },
        momentum:         { value: hasRealPosts ? realMetrics.momentum : null, src: hasRealPosts?SRC.REAL:SRC.NA },
        topKeywords:      { value: hasRealPosts ? extractedKeywords : [], src: hasRealPosts?SRC.REAL:SRC.NA },
        titlePatterns:    { value: hasRealPosts ? realMetrics.titlePatterns : null, src: hasRealPosts?SRC.REAL:SRC.NA },
        recentPosts:      { value: hasRealPosts ? posts.slice(0,10) : [], src: hasRealPosts?SRC.REAL:SRC.NA },

        // DataLab 실측 (3종)
        datalabSearch:     { value: dlSearchData?.results || null, src: dlSearchData?SRC.REAL:SRC.NA },
        datalabBlog:       { value: dlBlogData?.results   || null, src: dlBlogData?SRC.REAL:SRC.NA },
        datalabKeywords:   kwList,
        // 키워드 시장성 분석 (실측 교차)
        kwMarketScore:     { value: kwMarketScore.length ? kwMarketScore : null, src: kwMarketScore.length?SRC.REAL:SRC.NA },
        // 발행 공백 패턴 (실측)
        postingGaps:       { value: postingGaps, src: postingGaps?SRC.REAL:SRC.NA },
        // 스니펫 기반 콘텐츠 추정
        snippetAnalysis:   { value: snippetAnalysis, src: snippetAnalysis?SRC.REAL:SRC.NA },

        // 수동 입력 실측
        dailyVisitors:    { value: manualData.dailyVisitors, src: manualData.dailyVisitors!=null?SRC.REAL:SRC.NA },
        followers:        { value: manualData.followers,     src: manualData.followers!=null?SRC.REAL:SRC.NA },
        totalPostCount:   { value: manualData.totalPostCount,src: manualData.totalPostCount!=null?SRC.REAL:SRC.NA },

        // C-Rank / D.I.A / 방문자 통계 = 측정불가
        cRank:            { value: null, src: SRC.NA },
        diaScore:         { value: null, src: SRC.NA },
        totalComments:    { value: null, src: SRC.NA },
        totalLikes:       { value: null, src: SRC.NA },

        // AI 해석 결과 (추정)
        overallScore:     { value: aiData.overallScore, src: SRC.EST },
        industryRank:     { value: aiData.industryRank, src: SRC.EST },
        summary:          aiData.summary,
        scoreBreakdown:   aiData.scoreBreakdown,
        contentPatterns:  aiData.contentPatterns,
        keywordAnalysis:  aiData.keywordAnalysis,
        activityAnalysis: aiData.activityAnalysis,
        strengths:        aiData.strengths || [],
        weaknesses:       aiData.weaknesses || [],
        recommendations:  aiData.recommendations || [],
        phase1:           aiData.phase1 || [],
        phase2:           aiData.phase2 || [],
        phase3:           aiData.phase3 || [],
        competitors:      aiData.competitors || [],
        industryBenchmark: INDUSTRY_BENCHMARKS[industry],

        // 데이터 수집 요약
        dataSourceSummary: {
          searchAPI:     hasRealPosts,
          datalabSearch: !!dlSearchData,
          datalabBlog:   !!dlBlogData,
          manualInput:   Object.values(manualData).some(v=>v!=null),
          postingGaps:   !!postingGaps,
          snippetAnalysis: !!snippetAnalysis,
          kwMarket:      kwMarketScore.length > 0,
          realDataCount: [hasRealPosts, !!dlSearchData, !!dlBlogData,
            Object.values(manualData).some(v=>v!=null)].filter(Boolean).length,
        }
      };

      setResult(finalResult);
      setHistory(prev=>[{ data:finalResult, ts:new Date().toLocaleString("ko-KR") }, ...prev].slice(0,5));
      setActiveTab("overview");
      setStep(3);
    } catch(e) {
      setError("분석 오류: "+e.message); setStep(1);
    } finally { clearInterval(timer); setLoading(false); }
  }, [url, industry, addInfo, clientId, clientSecret, manualVisitors, manualFollowers, manualTotalPosts, dlKeywords]);

  const downloadJson = () => {
    if (!result) return;
    const blob = new Blob([JSON.stringify(result,null,2)],{type:"application/json"});
    const a=document.createElement("a"); a.href=URL.createObjectURL(blob);
    a.download=`blog_analysis_${Date.now()}.json`; a.click();
  };

  const resetAll = () => {
    setUrl(""); setStep(1); setResult(null); setError(""); setActiveTab("overview");
    setTitleInput(""); setTitleScore(null); setShowHistory(false);
  };

  const d = result;
  const bm = d?.industryBenchmark || INDUSTRY_BENCHMARKS["general"];
  const score = d?.overallScore?.value || 0;
  const grade = score>=90?"S":score>=80?"A":score>=70?"B":score>=60?"C":"D";
  const gradeColor = {S:"#F59E0B",A:"#00C57E",B:"#3B82F6",C:"#8B5CF6",D:"#EF4444"}[grade]||"#94a3b8";

  const hasAPI = clientId && clientSecret;

  return (
    <div style={{ fontFamily:"'Malgun Gothic','Apple SD Gothic Neo',sans-serif",
      background:"linear-gradient(135deg,#f0f4ff 0%,#f8faff 100%)", minHeight:"100vh", paddingBottom:60 }}>

      {/* 헤더 */}
      <div style={{ background:"linear-gradient(135deg,#0f1f4e,#1A2B5E)", padding:"18px 28px",
        boxShadow:"0 4px 20px rgba(15,31,78,.4)" }}>
        <div style={{ maxWidth:1100, margin:"0 auto", display:"flex", alignItems:"center", gap:14 }}>
          <div style={{ background:"#00C57E", borderRadius:10, width:40, height:40,
            display:"flex", alignItems:"center", justifyContent:"center", fontSize:18 }}>📊</div>
          <div>
            <div style={{ fontSize:17, fontWeight:800, color:"#fff" }}>네이버 블로그 실측 분석 리포트 v6</div>
            <div style={{ fontSize:10, color:"#94a3b8", marginTop:1 }}>
              실측 데이터 기반 · AI 추론 최소화 · 데이터 출처 명시
            </div>
          </div>
          <div style={{ marginLeft:"auto", display:"flex", gap:8 }}>
            {history.length>0 && (
              <button onClick={()=>setShowHistory(v=>!v)}
                style={{ background:"rgba(0,197,126,.2)", border:"1px solid rgba(0,197,126,.4)",
                  borderRadius:8, padding:"6px 12px", color:"#00C57E", fontSize:11, cursor:"pointer", fontWeight:700 }}>
                📋 이력 {history.length}건
              </button>
            )}
            {step>1 && (
              <button onClick={resetAll} style={{ background:"rgba(255,255,255,.1)",
                border:"1px solid rgba(255,255,255,.2)", borderRadius:8, padding:"6px 12px",
                color:"#fff", fontSize:11, cursor:"pointer" }}>↺ 새 분석</button>
            )}
          </div>
        </div>
      </div>

      {/* 데이터 소스 범례 */}
      <div style={{ background:"#1e293b", padding:"8px 28px" }}>
        <div style={{ maxWidth:1100, margin:"0 auto", display:"flex", gap:16, alignItems:"center" }}>
          <span style={{ fontSize:10, color:"#64748b", fontWeight:600 }}>데이터 출처:</span>
          {Object.entries(DATA_BADGE).map(([k,v])=>(
            <div key={k} style={{ display:"flex", alignItems:"center", gap:4 }}>
              <span style={{ fontSize:9, padding:"1px 6px", borderRadius:99, fontWeight:700,
                background:v.bg, border:`1px solid ${v.border}`, color:v.color }}>{v.text}</span>
              <span style={{ fontSize:9, color:"#64748b" }}>
                {k===SRC.REAL?"API/직접입력"   :k===SRC.EST?"AI 해석 추정":"수집 불가"}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* 이력 패널 */}
      {showHistory && history.length>0 && (
        <div style={{ background:"#f8faff", borderBottom:"1px solid #e0e7ff", padding:"12px 28px" }}>
          <div style={{ maxWidth:1100, margin:"0 auto" }}>
            <div style={{ fontSize:11, fontWeight:700, color:"#1A2B5E", marginBottom:8 }}>📋 분석 이력</div>
            <div style={{ display:"flex", gap:9 }}>
              {history.map((h,i)=>(
                <button key={i} onClick={()=>{setResult(h.data);setStep(3);setActiveTab("overview");setShowHistory(false);}}
                  style={{ padding:"8px 12px", background:i===0?"#1A2B5E":"#fff",
                    border:`1px solid ${i===0?"#1A2B5E":"#e0e7ff"}`, borderRadius:9,
                    cursor:"pointer", textAlign:"left", fontFamily:"inherit" }}>
                  <div style={{ fontSize:11, fontWeight:700, color:i===0?"#fff":"#1e293b" }}>{h.data.blogName}</div>
                  <div style={{ fontSize:9, color:i===0?"#94a3b8":"#64748b", marginTop:2 }}>
                    {h.data.overallScore?.value}점 · {h.ts}
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      <div style={{ maxWidth:1100, margin:"20px auto 0", padding:"0 22px" }}>

        {/* ══ STEP 1: 입력 */}
        {step===1 && (
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:20 }}>

            {/* 좌측: API 설정 */}
            <div style={{ background:"#fff", borderRadius:16, padding:"24px 26px",
              boxShadow:"0 4px 20px rgba(0,0,0,.07)", border:"2px solid #e0e7ff" }}>
              <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:16 }}>
                <div>
                  <div style={{ fontSize:15, fontWeight:800, color:"#1e293b" }}>🔑 네이버 API 설정</div>
                  <div style={{ fontSize:11, color:"#64748b", marginTop:2 }}>API 키 없이는 실측 분석이 불가능합니다</div>
                </div>
                <button onClick={()=>setShowApiPanel(v=>!v)}
                  style={{ fontSize:10, padding:"4px 10px", borderRadius:6, border:"1px solid #e0e7ff",
                    background:"#f8faff", cursor:"pointer", color:"#64748b" }}>
                  {showApiPanel?"숨기기":"펼치기"}
                </button>
              </div>

              {showApiPanel && (
                <div>
                  <div style={{ padding:"12px 14px", background:"#f0f9ff",
                    borderRadius:10, border:"1px solid #bae6fd", marginBottom:14 }}>
                    <div style={{ fontSize:11, fontWeight:700, color:"#0369a1", marginBottom:5 }}>📌 API 발급 방법</div>
                    <div style={{ fontSize:10, color:"#0c4a6e", lineHeight:1.8 }}>
                      1. <a href="https://developers.naver.com/apps/#/register" target="_blank"
                        style={{ color:"#0369a1", fontWeight:700 }}>네이버 개발자 센터</a> 접속<br/>
                      2. 애플리케이션 등록 → 검색 API + DataLab 선택<br/>
                      3. Client ID / Secret 발급 후 아래 입력
                    </div>
                  </div>
                  <div style={{ marginBottom:10 }}>
                    <label style={{ fontSize:11, fontWeight:700, color:"#374151", display:"block", marginBottom:5 }}>Client ID</label>
                    <input value={clientId} onChange={e=>setClientId(e.target.value)}
                      placeholder="네이버 Client ID"
                      style={{ width:"100%", padding:"10px 12px", border:`1.5px solid ${clientId?"#00C57E":"#e0e7ff"}`,
                        borderRadius:8, fontSize:12, outline:"none", boxSizing:"border-box", fontFamily:"inherit" }}/>
                  </div>
                  <div>
                    <label style={{ fontSize:11, fontWeight:700, color:"#374151", display:"block", marginBottom:5 }}>Client Secret</label>
                    <input value={clientSecret} onChange={e=>setClientSecret(e.target.value)}
                      type="password" placeholder="네이버 Client Secret"
                      style={{ width:"100%", padding:"10px 12px", border:`1.5px solid ${clientSecret?"#00C57E":"#e0e7ff"}`,
                        borderRadius:8, fontSize:12, outline:"none", boxSizing:"border-box", fontFamily:"inherit" }}/>
                  </div>
                  {hasAPI && (
                    <div style={{ marginTop:10, padding:"8px 12px", background:"#f0fdf4",
                      borderRadius:8, border:"1px solid #86efac", fontSize:11, color:"#166534", fontWeight:700 }}>
                      ✅ API 연결됨 — 검색 API + DataLab 실측 수집 활성화
                    </div>
                  )}
                </div>
              )}

              {/* DataLab 키워드 */}
              <div style={{ marginTop:16, paddingTop:16, borderTop:"1px solid #f0f4ff" }}>
                <label style={{ fontSize:11, fontWeight:700, color:"#374151", display:"block", marginBottom:5 }}>
                  📈 DataLab 분석 키워드
                  <span style={{ fontSize:10, color:"#94a3b8", fontWeight:400, marginLeft:5 }}>
                    (비우면 제목에서 자동 추출)
                  </span>
                </label>
                <input value={dlKeywords} onChange={e=>setDlKeywords(e.target.value)}
                  placeholder="예: LPG가스, 가스배달, 도시가스 (쉼표 구분)"
                  style={{ width:"100%", padding:"10px 12px", border:"1.5px solid #e0e7ff",
                    borderRadius:8, fontSize:11, outline:"none", boxSizing:"border-box", fontFamily:"inherit" }}/>
              </div>

              {/* 수동 입력 */}
              <div style={{ marginTop:16, paddingTop:16, borderTop:"1px solid #f0f4ff" }}>
                <div style={{ display:"flex", justifyContent:"space-between", marginBottom:10 }}>
                  <div>
                    <div style={{ fontSize:11, fontWeight:700, color:"#374151" }}>✏️ 내부 데이터 직접 입력 (선택)</div>
                    <div style={{ fontSize:10, color:"#64748b", marginTop:1 }}>블로그 관리자 페이지에서 확인 가능한 수치</div>
                  </div>
                  <button onClick={()=>setShowManualInput(v=>!v)}
                    style={{ fontSize:10, padding:"3px 8px", borderRadius:6, border:"1px solid #e0e7ff",
                      background:"#f8faff", cursor:"pointer", color:"#64748b" }}>
                    {showManualInput?"접기":"펼치기"}
                  </button>
                </div>
                {showManualInput && (
                  <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:8 }}>
                    {[
                      {label:"일 방문자 수",  val:manualVisitors,  set:setManualVisitors,  ph:"예: 850"},
                      {label:"이웃 수",        val:manualFollowers, set:setManualFollowers, ph:"예: 450"},
                      {label:"총 게시글 수",   val:manualTotalPosts,set:setManualTotalPosts,ph:"예: 320"},
                    ].map((item,i)=>(
                      <div key={i}>
                        <label style={{ fontSize:10, color:"#64748b", display:"block", marginBottom:3 }}>{item.label}</label>
                        <input value={item.val} onChange={e=>item.set(e.target.value)} placeholder={item.ph}
                          style={{ width:"100%", padding:"8px 10px", border:"1.5px solid #e0e7ff",
                            borderRadius:7, fontSize:11, outline:"none", boxSizing:"border-box", fontFamily:"inherit" }}/>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* 우측: 블로그 정보 */}
            <div style={{ background:"#fff", borderRadius:16, padding:"24px 26px",
              boxShadow:"0 4px 20px rgba(0,0,0,.07)" }}>
              <div style={{ fontSize:15, fontWeight:800, color:"#1e293b", marginBottom:4 }}>🔗 블로그 정보</div>
              <div style={{ fontSize:11, color:"#64748b", marginBottom:18 }}>분석할 네이버 블로그 URL과 업종을 입력하세요</div>

              <div style={{ marginBottom:14 }}>
                <label style={{ fontSize:11, fontWeight:700, color:"#374151", display:"block", marginBottom:6 }}>블로그 URL *</label>
                <input value={url} onChange={e=>setUrl(e.target.value)}
                  onKeyDown={e=>e.key==="Enter"&&analyze()}
                  placeholder="https://blog.naver.com/your_blog_id"
                  style={{ width:"100%", padding:"11px 14px",
                    border:`2px solid ${error?"#EF4444":url?"#00C57E":"#e8edf5"}`,
                    borderRadius:10, fontSize:13, outline:"none", boxSizing:"border-box", fontFamily:"inherit" }}/>
                {error && <div style={{ color:"#EF4444", fontSize:11, marginTop:4 }}>{error}</div>}
              </div>

              <div style={{ marginBottom:14 }}>
                <label style={{ fontSize:11, fontWeight:700, color:"#374151", display:"block", marginBottom:8 }}>업종 *</label>
                <div style={{ display:"grid", gridTemplateColumns:"repeat(5,1fr)", gap:6 }}>
                  {INDUSTRIES.map(ind=>(
                    <button key={ind.id} onClick={()=>setIndustry(ind.id)}
                      style={{ padding:"8px 4px", borderRadius:8,
                        border:`2px solid ${industry===ind.id?"#1A2B5E":"#e8edf5"}`,
                        background:industry===ind.id?"#f0f4ff":"#fff", cursor:"pointer",
                        fontSize:10, fontWeight:industry===ind.id?800:500,
                        color:industry===ind.id?"#1A2B5E":"#64748b",
                        fontFamily:"inherit", textAlign:"center", lineHeight:1.4 }}>
                      {ind.label}
                    </button>
                  ))}
                </div>
              </div>

              <div style={{ marginBottom:20 }}>
                <label style={{ fontSize:11, fontWeight:700, color:"#374151", display:"block", marginBottom:6 }}>추가 정보 (선택)</label>
                <textarea value={addInfo} onChange={e=>setAddInfo(e.target.value)}
                  placeholder="운영 목적, 주요 타겟 고객, 특이사항 등" rows={2}
                  style={{ width:"100%", padding:"10px 14px", border:"1.5px solid #e8edf5",
                    borderRadius:9, fontSize:11, outline:"none", resize:"vertical",
                    boxSizing:"border-box", fontFamily:"inherit" }}/>
              </div>

              <button onClick={analyze} disabled={!hasAPI}
                style={{ width:"100%", padding:"14px",
                  background:hasAPI?"linear-gradient(135deg,#1A2B5E,#2D3F7A)":"#e2e8f0",
                  color:hasAPI?"#fff":"#94a3b8", border:"none", borderRadius:11, fontSize:14, fontWeight:700,
                  cursor:hasAPI?"pointer":"not-allowed",
                  boxShadow:hasAPI?"0 4px 16px rgba(26,43,94,.3)":"none", fontFamily:"inherit" }}>
                {hasAPI?"🔍 실측 데이터 기반 분석 시작":"⚠️ API 키를 먼저 입력해주세요"}
              </button>

              {/* 수집 가능 항목 안내 */}
              <div style={{ marginTop:16, padding:"12px 14px", background:"#f8faff",
                borderRadius:10, border:"1px solid #e0e7ff" }}>
                <div style={{ fontSize:11, fontWeight:700, color:"#1A2B5E", marginBottom:8 }}>수집 예정 데이터</div>
                <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:4 }}>
                  {[
                    { src:SRC.REAL, label:"게시글 목록·제목·날짜 (검색 API 다중 수집)" },
                    { src:SRC.REAL, label:"월별 발행 추이·공백 패턴 (실측 계산)" },
                    { src:SRC.REAL, label:"통합검색 트렌드 (DataLab /search)" },
                    { src:SRC.REAL, label:"블로그 포스팅 추이 (DataLab /blog/keyword)" },
                    { src:SRC.REAL, label:"키워드 시장성 점수 (검색량×빈도 교차)" },
                    { src:SRC.REAL, label:"스니펫 기반 본문 길이 추정" },
                    { src:SRC.REAL, label:"방문자·이웃 수 (직접 입력)" },
                    { src:SRC.NA,   label:"C-Rank · D.I.A (네이버 내부 비공개)" },
                    { src:SRC.NA,   label:"게시글별 조회수·댓글 (비공개)" },
                    { src:SRC.EST,  label:"종합점수·인사이트 (AI 해석)" },
                  ].map((item,i)=>(
                    <div key={i} style={{ display:"flex", alignItems:"center", gap:5, fontSize:10, color:"#64748b" }}>
                      <DataBadge src={item.src}/> {item.label}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ══ STEP 2: 로딩 */}
        {step===2 && (
          <div style={{ background:"#fff", borderRadius:16, padding:"52px 36px",
            boxShadow:"0 4px 24px rgba(0,0,0,.07)", textAlign:"center" }}>
            <div style={{ fontSize:44, marginBottom:14, display:"inline-block",
              animation:"spin 2s linear infinite" }}>🔬</div>
            <div style={{ fontSize:17, fontWeight:800, color:"#1A2B5E", marginBottom:8 }}>실측 데이터 수집 중</div>
            <div style={{ fontSize:13, color:"#00C57E", fontWeight:700, marginBottom:20 }}>{loadingMsg}</div>
            <div style={{ background:"#e8edf5", borderRadius:99, height:8, margin:"0 auto 16px", maxWidth:400 }}>
              <div style={{ background:"linear-gradient(90deg,#00C57E,#1A2B5E)", borderRadius:99, height:8,
                width:`${loadingPct}%`, transition:"width .8s ease" }}/>
            </div>
            <div style={{ fontSize:12, color:"#94a3b8" }}>{loadingPct}%</div>
            <style>{`@keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}`}</style>
          </div>
        )}

        {/* ══ STEP 3: 결과 */}
        {step===3 && d && (
          <div>
            {/* 데이터 수집 현황 배너 */}
            <div style={{ background:"#fff", borderRadius:12, padding:"12px 18px",
              marginBottom:14, boxShadow:"0 2px 10px rgba(0,0,0,.05)",
              display:"flex", alignItems:"center", gap:16, flexWrap:"wrap" }}>
              <div style={{ fontSize:12, fontWeight:700, color:"#374151" }}>📊 데이터 수집 현황</div>
              {[
                { label:"검색 API",      ok:d.dataSourceSummary.searchAPI,     detail: d.collectedPosts.value ? `${d.collectedPosts.value}건` : "실패" },
                { label:"DataLab 검색", ok:d.dataSourceSummary.datalabSearch,  detail: d.datalabSearch?.value ? `${d.datalabKeywords.length}개 키워드` : "실패" },
                { label:"DataLab 블로그",ok:d.dataSourceSummary.datalabBlog,   detail: d.datalabBlog?.value ? "수집됨" : "실패" },
                { label:"발행 공백",     ok:d.dataSourceSummary.postingGaps,   detail: d.postingGaps?.value ? `평균 ${d.postingGaps.value.avgGap}일` : "미수집" },
                { label:"시장성 분석",  ok:d.dataSourceSummary.kwMarket,       detail: d.kwMarketScore?.value ? `${d.kwMarketScore.value.length}개` : "미수집" },
                { label:"직접 입력",    ok:d.dataSourceSummary.manualInput,    detail: d.dataSourceSummary.manualInput ? "입력됨" : "미입력" },
              ].map((item,i)=>(
                <div key={i} style={{ display:"flex", alignItems:"center", gap:5 }}>
                  <div style={{ width:7, height:7, borderRadius:"50%",
                    background:item.ok?"#00C57E":"#EF4444" }}/>
                  <span style={{ fontSize:11, color:"#374151", fontWeight:600 }}>{item.label}</span>
                  <span style={{ fontSize:10, color:"#94a3b8" }}>{item.detail}</span>
                </div>
              ))}
              <div style={{ marginLeft:"auto", fontSize:11, fontWeight:700,
                color:d.dataSourceSummary.realDataCount>=2?"#00C57E":"#F59E0B" }}>
                실측 데이터 {d.dataSourceSummary.realDataCount}/3개 소스 활성화
              </div>
            </div>

            {/* 헤더 카드 */}
            <div style={{ background:"linear-gradient(135deg,#0f1f4e,#1A2B5E)",
              borderRadius:16, padding:"20px 24px", marginBottom:12,
              boxShadow:"0 6px 24px rgba(15,31,78,.3)" }}>
              <div style={{ display:"flex", alignItems:"center", gap:18, flexWrap:"wrap" }}>
                <ScoreRing score={score} size={84} color="#00C57E"/>
                <div style={{ flex:1, minWidth:200 }}>
                  <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:3 }}>
                    <div style={{ fontSize:18, fontWeight:800, color:"#fff" }}>{d.blogName}</div>
                    <span style={{ padding:"2px 8px", background:"#00C57E20", border:"1px solid #00C57E50",
                      borderRadius:5, fontSize:10, color:"#00C57E", fontWeight:700 }}>{d.industryLabel}</span>
                    <DataBadge src={d.overallScore.src}/>
                  </div>
                  <div style={{ fontSize:10, color:"#64748b", marginBottom:8 }}>{d.blogUrl}</div>
                  <div style={{ fontSize:11, color:"#cbd5e1", lineHeight:1.6 }}>{d.summary}</div>
                </div>
                <div style={{ textAlign:"center" }}>
                  <div style={{ fontSize:10, color:"#94a3b8", marginBottom:2 }}>종합 등급 <DataBadge src={SRC.EST}/></div>
                  <div style={{ fontSize:36, fontWeight:900, color:gradeColor }}>{grade}</div>
                  <div style={{ fontSize:10, color:"#64748b", marginTop:2 }}>{d.industryRank?.value}</div>
                </div>
              </div>
            </div>

            {/* KPI 카드 */}
            <div style={{ display:"flex", gap:9, marginBottom:12, flexWrap:"wrap" }}>
              <MetricCard label="수집 게시글" value={d.collectedPosts.value} unit="건" src={d.collectedPosts.src} color="#3B82F6" icon="📝"
                sub="검색 API 기준"/>
              <MetricCard label="일 평균 방문자" value={d.dailyVisitors.value} unit="명" src={d.dailyVisitors.src} color="#00C57E" icon="👥"
                sub="직접 입력값"/>
              <MetricCard label="이웃 수" value={d.followers.value} unit="명" src={d.followers.src} color="#F59E0B" icon="🔔"
                sub="직접 입력값"/>
              <MetricCard label="제목 SEO 평균" value={d.avgTitleSEO.value} unit="점" src={d.avgTitleSEO.src} color="#8B5CF6" icon="🔤"
                sub="100점 만점"/>
              <MetricCard label="발행 일관성" value={d.consistencyScore.value} unit="%" src={d.consistencyScore.src} color="#EF4444" icon="📅"
                sub="12개월 기준"/>
            </div>

            {/* 탭 */}
            <div style={{ display:"flex", gap:5, marginBottom:12, overflowX:"auto", paddingBottom:2 }}>
              {TABS.map(tab=>(
                <button key={tab.id} onClick={()=>setActiveTab(tab.id)}
                  style={{ padding:"7px 14px", borderRadius:8, border:"none", cursor:"pointer",
                    background:activeTab===tab.id?"#1A2B5E":"#fff",
                    color:activeTab===tab.id?"#fff":"#64748b",
                    fontSize:11, fontWeight:700, whiteSpace:"nowrap", fontFamily:"inherit",
                    boxShadow:activeTab===tab.id?"0 2px 12px rgba(26,43,94,.25)":"0 1px 4px rgba(0,0,0,.06)" }}>
                  {tab.label}
                </button>
              ))}
            </div>

            {/* 탭: 종합요약 */}
            {activeTab==="overview" && (
              <div>
                <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12, marginBottom:12 }}>
                  {/* 점수 분해 */}
                  <div style={{ background:"#fff", borderRadius:13, padding:18, boxShadow:"0 2px 10px rgba(0,0,0,.06)" }}>
                    <div style={{ fontSize:13, fontWeight:800, color:"#1e293b", marginBottom:3 }}>📊 점수 세부 분해</div>
                    <div style={{ fontSize:10, color:"#94a3b8", marginBottom:12 }}>AI 해석 기반 추정 <DataBadge src={SRC.EST}/></div>
                    {d.scoreBreakdown && Object.entries({
                      postConsistency:"발행 일관성",contentVolume:"콘텐츠 양",
                      keywordDiversity:"키워드 다양성",recentActivity:"최근 활동성",titleOptimization:"제목 최적화"
                    }).map(([k,label])=>{
                      const v = d.scoreBreakdown[k] || 0;
                      const c = v>=70?"#00C57E":v>=50?"#F59E0B":"#EF4444";
                      return (
                        <div key={k} style={{ marginBottom:9 }}>
                          <div style={{ display:"flex", justifyContent:"space-between", marginBottom:3 }}>
                            <span style={{ fontSize:11, color:"#374151", fontWeight:600 }}>{label}</span>
                            <span style={{ fontSize:11, fontWeight:800, color:c }}>{v}점</span>
                          </div>
                          <div style={{ background:"#e8edf5", borderRadius:99, height:5 }}>
                            <div style={{ background:c, borderRadius:99, height:5, width:`${v}%`, transition:"width 1s ease" }}/>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  {/* 활동 분석 */}
                  <div style={{ background:"#fff", borderRadius:13, padding:18, boxShadow:"0 2px 10px rgba(0,0,0,.06)" }}>
                    <div style={{ fontSize:13, fontWeight:800, color:"#1e293b", marginBottom:12 }}>⚡ 활동 분석</div>
                    {[
                      { label:"모멘텀", value:d.momentum?.value, src:d.momentum?.src, icon:"📈" },
                      { label:"최근 3개월 월평균", value:d.recentPosts?.value!=null?null:null,
                        src:d.monthlyTrend?.src, icon:"📅",
                        display: d.monthlyTrend?.value?.length
                          ? (d.monthlyTrend.value.slice(-3).reduce((s,m)=>s+m.count,0)/3).toFixed(1)+"건"
                          : null },
                      { label:"마지막 발행일", value:d.collectedPosts?.src===SRC.REAL
                          ? (d.recentPosts?.value?.[0]?.postdate
                            ? d.recentPosts.value[0].postdate.slice(0,4)+"-"+d.recentPosts.value[0].postdate.slice(4,6)+"-"+d.recentPosts.value[0].postdate.slice(6,8)
                            : null) : null,
                        src:d.collectedPosts?.src, icon:"🕐" },
                    ].map((item,i)=>{
                      const v = item.display || item.value;
                      return (
                        <div key={i} style={{ display:"flex", justifyContent:"space-between",
                          padding:"9px 0", borderBottom:i<2?"1px solid #f0f4ff":"none" }}>
                          <span style={{ fontSize:11, color:"#64748b" }}>{item.icon} {item.label}</span>
                          <div style={{ display:"flex", alignItems:"center", gap:4 }}>
                            {v ? <span style={{ fontSize:12, fontWeight:800,
                              color:item.label==="모멘텀"?(v==="상승"?"#00C57E":v==="하락"?"#EF4444":"#F59E0B"):"#1A2B5E" }}>{v}</span>
                              : <span style={{ fontSize:10, color:"#94a3b8" }}>측정불가</span>}
                            <DataBadge src={item.src}/>
                          </div>
                        </div>
                      );
                    })}
                    {/* C-Rank / D.I.A 측정불가 명시 */}
                    <div style={{ marginTop:10, padding:"10px 12px", background:"#f8faff",
                      borderRadius:8, border:"1px solid #e0e7ff" }}>
                      <div style={{ fontSize:10, fontWeight:700, color:"#64748b", marginBottom:4 }}>측정 불가 항목</div>
                      {[["C-Rank","네이버 내부 지표"],["D.I.A","네이버 내부 지표"],
                        ["조회수","비공개 데이터"],["댓글·공감","비공개 데이터"]].map(([k,r])=>(
                        <div key={k} style={{ display:"flex", justifyContent:"space-between", fontSize:10,
                          color:"#94a3b8", marginBottom:2 }}>
                          <span>{k}</span><span>{r}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
                {/* 강점·개선점 */}
                <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12 }}>
                  <div style={{ background:"#f0fdf4", borderRadius:12, padding:18, border:"1px solid #86efac" }}>
                    <div style={{ fontSize:12, fontWeight:800, color:"#166534", marginBottom:10 }}>
                      ✅ 강점 <DataBadge src={SRC.EST}/>
                    </div>
                    {d.strengths.map((s,i)=>(
                      <div key={i} style={{ display:"flex", gap:6, marginBottom:6 }}>
                        <span style={{ color:"#00C57E", fontWeight:700, flexShrink:0 }}>▸</span>
                        <span style={{ fontSize:11.5, color:"#374151", lineHeight:1.5 }}>{s}</span>
                      </div>
                    ))}
                  </div>
                  <div style={{ background:"#fffbeb", borderRadius:12, padding:18, border:"1px solid #fde68a" }}>
                    <div style={{ fontSize:12, fontWeight:800, color:"#92400e", marginBottom:10 }}>
                      ⚠️ 개선점 <DataBadge src={SRC.EST}/>
                    </div>
                    {d.weaknesses.map((w,i)=>(
                      <div key={i} style={{ display:"flex", gap:6, marginBottom:6 }}>
                        <span style={{ color:"#F59E0B", fontWeight:700, flexShrink:0 }}>▸</span>
                        <span style={{ fontSize:11.5, color:"#374151", lineHeight:1.5 }}>{w}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* 탭: 게시글 분석 */}
            {activeTab==="posts" && (
              <div>
                <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12, marginBottom:12 }}>
                  {/* 제목 패턴 */}
                  <div style={{ background:"#fff", borderRadius:13, padding:18, boxShadow:"0 2px 10px rgba(0,0,0,.06)" }}>
                    <div style={{ fontSize:13, fontWeight:800, color:"#1e293b", marginBottom:3 }}>📐 제목 패턴 분석</div>
                    <div style={{ fontSize:10, color:"#94a3b8", marginBottom:12 }}>
                      수집된 게시글 {d.collectedPosts.value}건 분석 <DataBadge src={d.collectedPosts.src}/>
                    </div>
                    {d.titlePatterns?.value && [
                      { label:"숫자 포함 제목", val:d.titlePatterns.value.withNumbers, color:"#3B82F6" },
                      { label:"연도 포함 제목", val:d.titlePatterns.value.withYear,    color:"#00C57E" },
                      { label:"지역명 포함 제목",val:d.titlePatterns.value.withLocal,  color:"#F59E0B" },
                    ].map((item,i)=>(
                      <div key={i} style={{ marginBottom:10 }}>
                        <div style={{ display:"flex", justifyContent:"space-between", marginBottom:3 }}>
                          <span style={{ fontSize:11, color:"#374151" }}>{item.label}</span>
                          <span style={{ fontSize:11, fontWeight:800, color:item.color }}>{item.val}%</span>
                        </div>
                        <div style={{ background:"#e8edf5", borderRadius:99, height:6 }}>
                          <div style={{ background:item.color, borderRadius:99, height:6,
                            width:`${item.val}%`, transition:"width 1s ease" }}/>
                        </div>
                      </div>
                    ))}
                    <div style={{ marginTop:12, padding:"10px 12px", background:"#f8faff",
                      borderRadius:8, border:"1px solid #e0e7ff" }}>
                      <div style={{ fontSize:10, color:"#64748b" }}>
                        평균 제목 길이: <strong style={{ color:"#1A2B5E" }}>{d.avgTitleLen?.value}자</strong>
                        <span style={{ marginLeft:8 }}>평균 SEO 점수: <strong style={{ color:"#1A2B5E" }}>{d.avgTitleSEO?.value}점</strong></span>
                      </div>
                    </div>
                  </div>
                  {/* 최근 게시글 */}
                  <div style={{ background:"#fff", borderRadius:13, padding:18, boxShadow:"0 2px 10px rgba(0,0,0,.06)" }}>
                    <div style={{ fontSize:13, fontWeight:800, color:"#1e293b", marginBottom:3 }}>
                      📋 실제 수집된 최근 게시글 <DataBadge src={SRC.REAL}/>
                    </div>
                    <div style={{ fontSize:10, color:"#94a3b8", marginBottom:10 }}>네이버 검색 API 실측</div>
                    {d.recentPosts?.value?.length > 0 ? d.recentPosts.value.slice(0,8).map((post,i)=>(
                      <div key={i} style={{ padding:"7px 0", borderBottom:i<7?"1px solid #f0f4ff":"none" }}>
                        <a href={post.link} target="_blank" rel="noopener noreferrer"
                          style={{ fontSize:11.5, color:"#1A2B5E", textDecoration:"none", fontWeight:600,
                            lineHeight:1.4, display:"block" }}
                          dangerouslySetInnerHTML={{ __html:post.title }}/>
                        <div style={{ fontSize:9, color:"#94a3b8", marginTop:2 }}>
                          {post.postdate?.slice(0,4)}-{post.postdate?.slice(4,6)}-{post.postdate?.slice(6,8)}
                        </div>
                      </div>
                    )) : <div style={{ color:"#94a3b8", fontSize:12, textAlign:"center", padding:20 }}>API 데이터 없음</div>}
                  </div>
                </div>
              </div>
            )}

            {/* 탭: 키워드·DataLab */}
            {activeTab==="keywords" && (
              <div>
                <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12, marginBottom:12 }}>
                  {/* 실측 키워드 */}
                  <div style={{ background:"#fff", borderRadius:13, padding:18, boxShadow:"0 2px 10px rgba(0,0,0,.06)" }}>
                    <div style={{ fontSize:13, fontWeight:800, color:"#1e293b", marginBottom:3 }}>
                      🔑 실측 키워드 빈도 <DataBadge src={d.topKeywords.src}/>
                    </div>
                    <div style={{ fontSize:10, color:"#94a3b8", marginBottom:12 }}>게시글 제목에서 직접 추출</div>
                    {d.topKeywords.value?.length > 0 ? d.topKeywords.value.slice(0,12).map((kw,i)=>{
                      const maxCnt = d.topKeywords.value[0]?.count || 1;
                      const colors = ["#1A2B5E","#2D3F7A","#3B82F6","#6366f1","#8B5CF6","#a78bfa"];
                      return (
                        <div key={i} style={{ display:"flex", alignItems:"center", gap:8, marginBottom:7 }}>
                          <div style={{ width:20, height:20, borderRadius:5, flexShrink:0,
                            background:colors[i%colors.length], color:"#fff", fontSize:9,
                            fontWeight:800, display:"flex", alignItems:"center", justifyContent:"center" }}>{i+1}</div>
                          <div style={{ flex:1, fontSize:11.5, color:"#374151" }}>{kw.keyword}</div>
                          <div style={{ width:60, background:"#e8edf5", borderRadius:99, height:5 }}>
                            <div style={{ background:colors[i%colors.length], borderRadius:99, height:5,
                              width:`${(kw.count/maxCnt)*100}%` }}/>
                          </div>
                          <div style={{ fontSize:10, fontWeight:700, color:colors[i%colors.length], width:24, textAlign:"right" }}>{kw.count}</div>
                        </div>
                      );
                    }) : <div style={{ color:"#94a3b8", fontSize:12, textAlign:"center", padding:20 }}>API 데이터 필요</div>}
                  </div>

                  {/* DataLab 통합검색 트렌드 */}
                  <div style={{ background:"#fff", borderRadius:13, padding:18, boxShadow:"0 2px 10px rgba(0,0,0,.06)" }}>
                    <div style={{ fontSize:13, fontWeight:800, color:"#1e293b", marginBottom:3 }}>
                      📈 DataLab 통합검색 트렌드 <DataBadge src={d.datalabSearch?.src||SRC.NA}/>
                    </div>
                    <div style={{ fontSize:10, color:"#94a3b8", marginBottom:12 }}>
                      네이버 통합검색 키워드 검색량 지수 (0~100, 상대값)
                    </div>
                    {d.datalabSearch?.value ? (
                      d.datalabSearch.value.slice(0,5).map((kw,ki)=>{
                        const pts = kw.data || [];
                        const maxR = Math.max(...pts.map(p=>p.ratio),1);
                        const tColor = kw.trend==="상승"?"#00C57E":kw.trend==="하락"?"#EF4444":"#F59E0B";
                        return (
                          <div key={ki} style={{ marginBottom:14 }}>
                            <div style={{ display:"flex", justifyContent:"space-between", marginBottom:5 }}>
                              <span style={{ fontSize:12, fontWeight:700, color:"#374151" }}>{kw.title}</span>
                              <div style={{ display:"flex", gap:8, alignItems:"center" }}>
                                <span style={{ fontSize:10, color:"#94a3b8" }}>월평균 {kw.monthlyAvg||"-"}</span>
                                <span style={{ fontSize:10, fontWeight:700, color:tColor }}>{kw.trend==="상승"?"▲상승":kw.trend==="하락"?"▼하락":"─유지"}</span>
                              </div>
                            </div>
                            <div style={{ display:"flex", gap:2, alignItems:"flex-end", height:36 }}>
                              {pts.slice(-12).map((pt,i)=>(
                                <div key={i} style={{ flex:1, display:"flex", flexDirection:"column", alignItems:"center" }}>
                                  <div style={{ width:"100%", background:i>=pts.slice(-12).length-3?"#1A2B5E":"#c7d2fe",
                                    height:Math.max((pt.ratio/maxR)*32,2), borderRadius:"2px 2px 0 0" }}/>
                                  {i===pts.slice(-12).length-1 && <div style={{ fontSize:7, color:"#94a3b8", marginTop:1 }}>최근</div>}
                                </div>
                              ))}
                            </div>
                          </div>
                        );
                      })
                    ) : (
                      <div style={{ padding:"20px 0", textAlign:"center" }}>
                        <div style={{ fontSize:11, color:"#94a3b8" }}>DataLab 데이터 없음</div>
                        <div style={{ fontSize:10, color:"#cbd5e1", marginTop:4 }}>API 키 확인 또는 DataLab 권한 설정 필요</div>
                      </div>
                    )}
                  </div>
                </div>

                {/* DataLab 블로그 포스팅 추이 + 시장성 분석 */}
                <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12, marginTop:12 }}>
                  {/* DataLab 블로그 키워드 추이 */}
                  <div style={{ background:"#fff", borderRadius:13, padding:18, boxShadow:"0 2px 10px rgba(0,0,0,.06)" }}>
                    <div style={{ fontSize:13, fontWeight:800, color:"#1e293b", marginBottom:3 }}>
                      📝 블로그 포스팅 추이 <DataBadge src={d.datalabBlog?.src||SRC.NA}/>
                    </div>
                    <div style={{ fontSize:10, color:"#94a3b8", marginBottom:12 }}>
                      키워드 관련 네이버 블로그 전체 포스팅 수 월별 추이
                    </div>
                    {d.datalabBlog?.value ? (
                      d.datalabBlog.value.slice(0,5).map((kw,ki)=>{
                        const tColor = kw.trend==="증가"?"#00C57E":"#EF4444";
                        return (
                          <div key={ki} style={{ display:"flex", justifyContent:"space-between",
                            padding:"9px 0", borderBottom:ki<4?"1px solid #f0f4ff":"none" }}>
                            <span style={{ fontSize:12, color:"#374151" }}>{kw.title}</span>
                            <div style={{ display:"flex", gap:8, alignItems:"center" }}>
                              <span style={{ fontSize:10, color:"#94a3b8" }}>월평균 {kw.monthlyAvg||"-"}</span>
                              <span style={{ fontSize:11, fontWeight:700, color:tColor }}>{kw.trend==="증가"?"▲증가":"▼감소"}</span>
                            </div>
                          </div>
                        );
                      })
                    ) : (
                      <div style={{ fontSize:11, color:"#94a3b8", textAlign:"center", padding:20 }}>
                        DataLab 블로그 API 데이터 없음
                      </div>
                    )}
                  </div>

                  {/* 키워드 시장성 점수 (실측 교차 분석) */}
                  <div style={{ background:"#fff", borderRadius:13, padding:18, boxShadow:"0 2px 10px rgba(0,0,0,.06)" }}>
                    <div style={{ fontSize:13, fontWeight:800, color:"#1e293b", marginBottom:3 }}>
                      🎯 키워드 시장성 분석 <DataBadge src={d.kwMarketScore?.src||SRC.NA}/>
                    </div>
                    <div style={{ fontSize:10, color:"#94a3b8", marginBottom:8 }}>
                      DataLab 검색량 × 블로그 빈도 교차 분석
                    </div>
                    {/* 범례 */}
                    <div style={{ display:"flex", gap:6, marginBottom:10, flexWrap:"wrap" }}>
                      {[
                        {type:"핵심", color:"#1A2B5E", desc:"검색↑ 활용↑"},
                        {type:"기회", color:"#00C57E", desc:"검색↑ 활용↓"},
                        {type:"집중", color:"#F59E0B", desc:"검색↓ 활용↑"},
                        {type:"탐색", color:"#94a3b8", desc:"검색↓ 활용↓"},
                      ].map(item=>(
                        <div key={item.type} style={{ display:"flex", alignItems:"center", gap:3 }}>
                          <div style={{ width:8, height:8, borderRadius:2, background:item.color }}/>
                          <span style={{ fontSize:9, color:"#64748b" }}>{item.type}({item.desc})</span>
                        </div>
                      ))}
                    </div>
                    {d.kwMarketScore?.value ? (
                      d.kwMarketScore.value.slice(0,10).map((kw,i)=>{
                        const typeColor = {핵심:"#1A2B5E",기회:"#00C57E",집중:"#F59E0B",탐색:"#94a3b8"}[kw.type]||"#94a3b8";
                        return (
                          <div key={i} style={{ display:"flex", alignItems:"center", gap:8,
                            padding:"6px 0", borderBottom:i<9?"1px solid #f0f4ff":"none" }}>
                            <div style={{ width:36, textAlign:"center", padding:"1px 4px",
                              background:typeColor+"20", border:`1px solid ${typeColor}40`,
                              borderRadius:4, fontSize:9, color:typeColor, fontWeight:700, flexShrink:0 }}>
                              {kw.type}
                            </div>
                            <span style={{ flex:1, fontSize:11, color:"#374151" }}>{kw.keyword}</span>
                            <div style={{ textAlign:"right" }}>
                              <div style={{ fontSize:11, fontWeight:800, color:typeColor }}>{kw.marketScore}점</div>
                              <div style={{ fontSize:8, color:"#94a3b8" }}>검색{kw.dlScore} · 빈도{kw.blogFreq}</div>
                            </div>
                          </div>
                        );
                      })
                    ) : (
                      <div style={{ fontSize:11, color:"#94a3b8", textAlign:"center", padding:20 }}>
                        API 키 + DataLab 권한 필요
                      </div>
                    )}
                  </div>
                </div>

                {/* 발행 공백 패턴 분석 */}
                {d.postingGaps?.value && (
                  <div style={{ background:"#fff", borderRadius:13, padding:18,
                    boxShadow:"0 2px 10px rgba(0,0,0,.06)", marginTop:12 }}>
                    <div style={{ fontSize:13, fontWeight:800, color:"#1e293b", marginBottom:3 }}>
                      🗓️ 발행 공백 패턴 분석 <DataBadge src={SRC.REAL}/>
                    </div>
                    <div style={{ fontSize:10, color:"#94a3b8", marginBottom:14 }}>
                      수집된 {d.postingGaps.value.totalAnalyzed}건 게시글 날짜 기반 실측 계산
                    </div>
                    <div style={{ display:"flex", gap:10, flexWrap:"wrap" }}>
                      {[
                        { label:"평균 발행 간격", value:d.postingGaps.value.avgGap+"일", color:"#1A2B5E",
                          sub: d.postingGaps.value.avgGap<=7?"주 1회 이상 우수":d.postingGaps.value.avgGap<=14?"2주 1회 보통":"발행 빈도 부족" },
                        { label:"최장 공백", value:d.postingGaps.value.maxGap+"일", color:"#EF4444",
                          sub:"최대 미발행 기간" },
                        { label:"최단 간격", value:d.postingGaps.value.minGap+"일", color:"#00C57E",
                          sub:"최소 발행 간격" },
                        { label:"7일 이내 발행 비율", value:d.postingGaps.value.under7Pct+"%", color:"#3B82F6",
                          sub:"전체 중 단기 발행" },
                        { label:"최근 30일 발행", value:d.postingGaps.value.last30+"건", color:"#F59E0B",
                          sub:"최근 한 달 활동" },
                        { label:"최근 7일 발행", value:d.postingGaps.value.last7+"건", color:"#8B5CF6",
                          sub:"최근 1주 활동" },
                      ].map((item,i)=>(
                        <div key={i} style={{ flex:1, minWidth:130, padding:"12px 14px",
                          background:"#f8faff", borderRadius:10, border:"1px solid #e0e7ff",
                          borderTop:`3px solid ${item.color}` }}>
                          <div style={{ fontSize:18, fontWeight:900, color:item.color, lineHeight:1 }}>{item.value}</div>
                          <div style={{ fontSize:10, color:"#64748b", marginTop:4, fontWeight:600 }}>{item.label}</div>
                          <div style={{ fontSize:9, color:"#94a3b8", marginTop:2 }}>{item.sub}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* 스니펫 기반 콘텐츠 품질 추정 */}
                {d.snippetAnalysis?.value && (
                  <div style={{ background:"#fff", borderRadius:13, padding:18,
                    boxShadow:"0 2px 10px rgba(0,0,0,.06)", marginTop:12 }}>
                    <div style={{ fontSize:13, fontWeight:800, color:"#1e293b", marginBottom:3 }}>
                      📄 스니펫 기반 콘텐츠 품질 추정 <DataBadge src={SRC.REAL}/>
                    </div>
                    <div style={{ fontSize:10, color:"#94a3b8", marginBottom:14 }}>
                      수집된 게시글 스니펫 {d.snippetAnalysis.value.snippetCount}건 텍스트 분석 기반 추정
                    </div>
                    <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:10 }}>
                      {[
                        { label:"추정 평균 본문 길이", value:(d.snippetAnalysis.value.estAvgBodyLen||0).toLocaleString()+"자",
                          sub:"스니펫 길이 × 12 추정", color:"#1A2B5E" },
                        { label:"의문형 콘텐츠 비율", value:d.snippetAnalysis.value.hasQuestionPct+"%",
                          sub:"독자 질문 유도형", color:"#3B82F6" },
                        { label:"수치 포함 콘텐츠", value:d.snippetAnalysis.value.hasNumbersPct+"%",
                          sub:"구체적 데이터 포함", color:"#00C57E" },
                      ].map((item,i)=>(
                        <div key={i} style={{ padding:"12px 14px", background:"#f8faff",
                          borderRadius:10, border:`1px solid #e0e7ff`, borderTop:`3px solid ${item.color}` }}>
                          <div style={{ fontSize:17, fontWeight:900, color:item.color }}>{item.value}</div>
                          <div style={{ fontSize:10, fontWeight:700, color:"#374151", marginTop:4 }}>{item.label}</div>
                          <div style={{ fontSize:9, color:"#94a3b8", marginTop:2 }}>{item.sub}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

              </div>
            )}

            {/* 탭: 업종 벤치마크 */}
            {activeTab==="benchmark" && (
              <div style={{ background:"#fff", borderRadius:13, padding:22, boxShadow:"0 2px 10px rgba(0,0,0,.06)" }}>
                <div style={{ fontSize:15, fontWeight:800, color:"#1e293b", marginBottom:4 }}>
                  {d.industryLabel} 업종 벤치마크 비교
                </div>
                <div style={{ fontSize:11, color:"#64748b", marginBottom:18 }}>
                  실측 데이터만 비교 · 측정 불가 항목은 별도 표시
                </div>
                <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:24 }}>
                  <div>
                    <BenchmarkBar label="제목 SEO 평균 점수" myVal={d.avgTitleSEO.value} benchVal={70} unit="점" color="#8B5CF6" src={d.avgTitleSEO.src}/>
                    <BenchmarkBar label="발행 일관성" myVal={d.consistencyScore.value} benchVal={75} unit="%" color="#3B82F6" src={d.consistencyScore.src}/>
                    <BenchmarkBar label="일 방문자" myVal={d.dailyVisitors.value} benchVal={500} unit="명" color="#00C57E" src={d.dailyVisitors.src}/>
                  </div>
                  <div>
                    <BenchmarkBar label="이웃 수" myVal={d.followers.value} benchVal={300} unit="명" color="#F59E0B" src={d.followers.src}/>
                    <BenchmarkBar label="월 게시글 (추정)" myVal={d.monthlyTrend?.value?.length
                      ? Math.round(d.monthlyTrend.value.slice(-3).reduce((s,m)=>s+m.count,0)/3)
                      : null} benchVal={bm.monthlyPosts} unit="건" color="#EF4444"
                      src={d.monthlyTrend?.src}/>
                    <div style={{ padding:"12px 14px", background:"#f8faff", borderRadius:10, border:"1px solid #e0e7ff", marginBottom:14 }}>
                      <div style={{ fontSize:11, fontWeight:700, color:"#64748b", marginBottom:6 }}>⚠️ 측정 불가 (벤치마크 비교 불가)</div>
                      {[["C-Rank",`업종평균 ${bm.cRank}`],["이미지율",`업종평균 ${bm.imageRate}%`],
                        ["영상율",`업종평균 ${bm.videoRate}%`],["참여율",`업종평균 ${bm.engRate}%`]].map(([k,v])=>(
                        <div key={k} style={{ display:"flex", justifyContent:"space-between", fontSize:10,
                          color:"#94a3b8", marginBottom:2 }}>
                          <span>{k} <DataBadge src={SRC.NA}/></span><span>{v}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* 탭: 경쟁사 비교 */}
            {activeTab==="competitor" && (
              <div>
                <div style={{ padding:"10px 14px", background:"#fef3c7", borderRadius:10,
                  border:"1px solid #fde68a", marginBottom:14, fontSize:11, color:"#92400e" }}>
                  ⚠️ 경쟁사 데이터는 <DataBadge src={SRC.EST}/> AI 추정값입니다.
                  실제 경쟁사를 직접 분석하시려면 해당 URL로 별도 분석을 진행하세요.
                </div>
                <div style={{ background:"#fff", borderRadius:13, padding:18, boxShadow:"0 2px 10px rgba(0,0,0,.06)", marginBottom:12 }}>
                  <div style={{ fontSize:14, fontWeight:800, color:"#1e293b", marginBottom:14 }}>📡 동종 업종 상위 블로그 비교 (추정)</div>
                  <div style={{ display:"flex", alignItems:"center", gap:20, flexWrap:"wrap" }}>
                    <RadarChart
                      labels={["종합점수","발행량","일관성","제목SEO","활동성","팔로워"]}
                      data={[
                        [score, Math.min((d.monthlyTrend?.value?.slice(-3).reduce((s,m)=>s+m.count,0)||0)/3*4,100),
                         d.consistencyScore.value||0, d.avgTitleSEO.value||0,
                         d.momentum?.value==="상승"?80:d.momentum?.value==="하락"?40:60,
                         Math.min((d.followers.value||0)/10,100)],
                        ...(d.competitors||[]).slice(0,2).map(c=>[
                          c.overallScore, Math.min(c.monthlyPosts*4,100), 75, 70, 65, 60
                        ])
                      ]}
                      colors={["#1A2B5E","#00C57E","#F59E0B"]}
                      size={200}/>
                    <div style={{ flex:1 }}>
                      {[{label:"내 블로그",color:"#1A2B5E",score},{...(d.competitors?.[0]||{}),label:d.competitors?.[0]?.name,color:"#00C57E"},
                        {...(d.competitors?.[1]||{}),label:d.competitors?.[1]?.name,color:"#F59E0B"}].filter(i=>i.label).map((item,i)=>(
                        <div key={i} style={{ display:"flex", alignItems:"center", gap:9, marginBottom:9 }}>
                          <div style={{ width:10, height:10, borderRadius:"50%", background:item.color, flexShrink:0 }}/>
                          <span style={{ fontSize:11, color:"#374151", flex:1 }}>{item.label}</span>
                          <span style={{ fontSize:12, fontWeight:800, color:item.color }}>{item.overallScore||item.score}점</span>
                          {i>0 && <DataBadge src={SRC.EST}/>}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
                <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:12 }}>
                  {(d.competitors||[]).map((comp,i)=>(
                    <div key={i} style={{ background:"#fff", borderRadius:12, padding:16,
                      boxShadow:"0 2px 10px rgba(0,0,0,.06)", border:"1px solid #e8edf5" }}>
                      <div style={{ display:"flex", justifyContent:"space-between", marginBottom:8 }}>
                        <div style={{ fontSize:12, fontWeight:800, color:"#1e293b" }}>{comp.name}</div>
                        <DataBadge src={SRC.EST}/>
                      </div>
                      {[["종합점수",comp.overallScore+"점"],["월 게시글",comp.monthlyPosts+"건"],["C-Rank",comp.cRank]].map(([k,v],ri)=>(
                        <div key={ri} style={{ display:"flex", justifyContent:"space-between",
                          padding:"5px 0", borderBottom:ri<2?"1px solid #f0f4ff":"none", fontSize:10.5 }}>
                          <span style={{ color:"#64748b" }}>{k}</span>
                          <span style={{ fontWeight:700, color:"#1A2B5E" }}>{v}</span>
                        </div>
                      ))}
                      <div style={{ marginTop:8, fontSize:10, color:"#64748b", lineHeight:1.5 }}>💡 {comp.strengths}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 탭: 시계열 추이 */}
            {activeTab==="trend" && (() => {
              const trend = d.monthlyTrend?.value || [];
              const maxC = Math.max(...trend.map(t=>t.count),1);
              const total = trend.reduce((s,t)=>s+t.count,0);
              const half = Math.floor(trend.length/2);
              const prev = trend.slice(0,half).reduce((s,t)=>s+t.count,0);
              const rec  = trend.slice(half).reduce((s,t)=>s+t.count,0);
              const growthPct = prev>0?Math.round(((rec-prev)/prev)*100):0;
              const peak = trend.reduce((a,b)=>b.count>a.count?b:a,trend[0]||{});
              const bmMonthly = bm.monthlyPosts;
              return (
                <div>
                  <div style={{ display:"flex", gap:9, marginBottom:12 }}>
                    {[
                      {label:"12개월 총 발행",value:total+"건",color:"#1A2B5E",icon:"📝",src:d.monthlyTrend.src},
                      {label:"월 평균",value:(total/12).toFixed(1)+"건",color:"#3B82F6",icon:"📅",src:d.monthlyTrend.src,sub:`업종평균 ${bmMonthly}건`},
                      {label:"전반기→후반기",value:prev+"→"+rec+"건",color:"#8B5CF6",icon:"📊",src:d.monthlyTrend.src},
                      {label:"성장률",value:(growthPct>=0?"+":"")+growthPct+"%",color:growthPct>=0?"#00C57E":"#EF4444",icon:"📈",src:d.monthlyTrend.src},
                      {label:"최고 발행월",value:peak.label||"-",sub:peak.count+"건",color:"#F59E0B",icon:"🏆",src:d.monthlyTrend.src},
                    ].map((item,i)=>(
                      <div key={i} style={{ flex:1, background:"#fff", borderRadius:11, padding:"12px 13px",
                        boxShadow:"0 2px 10px rgba(0,0,0,.06)", borderTop:`3px solid ${item.color}` }}>
                        <div style={{ fontSize:15, marginBottom:3 }}>{item.icon}</div>
                        <div style={{ fontSize:16, fontWeight:800, color:item.color, lineHeight:1 }}>{item.value}</div>
                        {item.sub && <div style={{ fontSize:9, color:"#94a3b8", marginTop:2 }}>{item.sub}</div>}
                        <div style={{ display:"flex", alignItems:"center", marginTop:3 }}>
                          <span style={{ fontSize:10, color:"#64748b" }}>{item.label}</span>
                          <DataBadge src={item.src}/>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div style={{ background:"#fff", borderRadius:13, padding:20, boxShadow:"0 2px 10px rgba(0,0,0,.06)" }}>
                    <div style={{ fontSize:13, fontWeight:800, color:"#1e293b", marginBottom:4 }}>
                      📅 월별 게시글 발행 추이 <DataBadge src={d.monthlyTrend.src}/>
                    </div>
                    <div style={{ fontSize:10, color:"#94a3b8", marginBottom:16 }}>
                      {d.monthlyTrend.src===SRC.REAL?"✅ 네이버 검색 API 실측 데이터":"데이터 없음"}
                    </div>
                    {trend.length > 0 ? (
                      <div style={{ display:"flex", alignItems:"flex-end", gap:5, height:140, padding:"0 4px" }}>
                        {trend.map((t,i)=>{
                          const h=maxC>0?Math.max((t.count/maxC)*115,t.count>0?5:0):0;
                          const isRecent=i>=trend.length-3;
                          return (
                            <div key={i} style={{ flex:1, display:"flex", flexDirection:"column", alignItems:"center" }}>
                              {t.count>0 && <div style={{ fontSize:8, color:"#64748b", marginBottom:2, fontWeight:600 }}>{t.count}</div>}
                              <div style={{ width:"100%", height:h,
                                background:isRecent?"linear-gradient(180deg,#00C57E,#1A2B5E)":t.count>=bmMonthly?"#1A2B5E":"#c7d2fe",
                                borderRadius:"3px 3px 0 0", transition:"height .8s ease" }}/>
                              <div style={{ fontSize:7.5, color:isRecent?"#1A2B5E":"#94a3b8",
                                marginTop:3, fontWeight:isRecent?700:400,
                                writingMode:"vertical-rl", transform:"rotate(180deg)", height:24 }}>
                                {t.label}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    ) : <div style={{ textAlign:"center", color:"#94a3b8", padding:30 }}>API 데이터가 없어 시계열 차트를 표시할 수 없습니다</div>}
                  </div>
                </div>
              );
            })()}

            {/* 탭: SEO 채점기 */}
            {activeTab==="seo" && (
              <div>
                <div style={{ background:"#fff", borderRadius:13, padding:20, boxShadow:"0 2px 10px rgba(0,0,0,.06)", marginBottom:12 }}>
                  <div style={{ fontSize:14, fontWeight:800, color:"#1e293b", marginBottom:4 }}>🔤 제목 SEO 자동 채점기</div>
                  <div style={{ fontSize:11, color:"#64748b", marginBottom:14 }}>작성 예정 제목의 SEO 점수를 즉시 확인하세요</div>
                  <div style={{ display:"flex", gap:10, marginBottom:14 }}>
                    <input value={titleInput}
                      onChange={e=>{ setTitleInput(e.target.value); setTitleScore(scoreTitleSEO(e.target.value)); }}
                      placeholder="예: 2025 수원 LPG 가스 배달 업체 추천 TOP 5 (직접 비교)"
                      style={{ flex:1, padding:"11px 14px", border:"2px solid #e0e7ff",
                        borderRadius:10, fontSize:13, outline:"none", fontFamily:"inherit" }}/>
                  </div>
                  {titleScore && (
                    <div>
                      <div style={{ display:"flex", gap:16, alignItems:"center", marginBottom:14, padding:16,
                        borderRadius:12, background:titleScore.total>=70?"#f0fdf4":titleScore.total>=50?"#fffbeb":"#fef2f2",
                        border:`1px solid ${titleScore.total>=70?"#86efac":titleScore.total>=50?"#fde68a":"#fecaca"}` }}>
                        <div style={{ textAlign:"center" }}>
                          <div style={{ fontSize:36, fontWeight:900,
                            color:titleScore.total>=70?"#00C57E":titleScore.total>=50?"#F59E0B":"#EF4444" }}>
                            {titleScore.total}
                          </div>
                          <div style={{ fontSize:10, color:"#64748b" }}>/ 100점</div>
                        </div>
                        <div style={{ flex:1 }}>
                          <div style={{ fontSize:14, fontWeight:800,
                            color:titleScore.total>=70?"#166534":titleScore.total>=50?"#92400e":"#991b1b" }}>
                            {titleScore.total>=70?"✅ 우수":"⚠️ 개선 필요"}
                          </div>
                          <div style={{ fontSize:11, color:"#64748b", marginTop:3 }}>
                            현재 {titleScore.length}자
                            {titleScore.length<15?" (너무 짧음)":titleScore.length>35?" (너무 길음)":" (적정 길이)"}
                          </div>
                        </div>
                      </div>
                      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:7 }}>
                        {titleScore.checks.map((c,i)=>(
                          <div key={i} style={{ display:"flex", alignItems:"center", gap:8, padding:"9px 12px",
                            borderRadius:9, background:c.pass?"#f0fdf4":"#f8faff",
                            border:`1px solid ${c.pass?"#86efac":"#e0e7ff"}` }}>
                            <div style={{ width:20, height:20, borderRadius:"50%", flexShrink:0,
                              background:c.pass?"#00C57E":"#e8edf5", color:c.pass?"#fff":"#94a3b8",
                              display:"flex", alignItems:"center", justifyContent:"center", fontSize:10 }}>
                              {c.pass?"✓":"✕"}
                            </div>
                            <span style={{ flex:1, fontSize:11, color:"#374151" }}>{c.label}</span>
                            <span style={{ fontSize:11, fontWeight:800, color:c.pass?"#00C57E":"#94a3b8" }}>
                              {c.pass?"+"+c.score:0}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
                {/* 내 블로그 제목들 일괄 채점 */}
                {d.recentPosts?.value?.length > 0 && (
                  <div style={{ background:"#fff", borderRadius:13, padding:18, boxShadow:"0 2px 10px rgba(0,0,0,.06)" }}>
                    <div style={{ fontSize:13, fontWeight:800, color:"#1e293b", marginBottom:12 }}>
                      📊 수집된 실제 제목 SEO 점수 일람 <DataBadge src={SRC.REAL}/>
                    </div>
                    {d.recentPosts.value.slice(0,10).map((post,i)=>{
                      const t = stripHtml(post.title);
                      const sc = scoreTitleSEO(t);
                      const c = sc?.total>=70?"#00C57E":sc?.total>=50?"#F59E0B":"#EF4444";
                      return (
                        <div key={i} style={{ display:"flex", alignItems:"center", gap:10, marginBottom:8,
                          padding:"8px 12px", borderRadius:9, background:"#f8faff", border:"1px solid #e8edf5" }}>
                          <div style={{ width:34, height:34, borderRadius:"50%", background:c,
                            color:"#fff", fontSize:10, fontWeight:800, display:"flex",
                            alignItems:"center", justifyContent:"center", flexShrink:0 }}>{sc?.total}</div>
                          <div style={{ flex:1, fontSize:11, color:"#374151", lineHeight:1.4 }}>{t}</div>
                          <div style={{ width:60, background:"#e8edf5", borderRadius:99, height:5 }}>
                            <div style={{ background:c, borderRadius:99, height:5, width:`${sc?.total||0}%` }}/>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* 탭: 실행 계획 */}
            {activeTab==="action" && (
              <div>
                <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:12, marginBottom:14 }}>
                  {[
                    {title:"1단계",period:"즉시 (1-2주)",items:d.phase1,color:"#00C57E",bg:"#f0fdf4",border:"#86efac"},
                    {title:"2단계",period:"단기 (1개월)", items:d.phase2,color:"#F59E0B",bg:"#fffbeb",border:"#fde68a"},
                    {title:"3단계",period:"중기 (3개월)", items:d.phase3,color:"#3B82F6",bg:"#eff6ff",border:"#bfdbfe"},
                  ].map((phase,i)=>(
                    <div key={i} style={{ background:phase.bg, borderRadius:12, padding:16, border:`1px solid ${phase.border}` }}>
                      <div style={{ fontSize:13, fontWeight:800, color:phase.color, marginBottom:2 }}>{phase.title}</div>
                      <div style={{ fontSize:10, color:"#64748b", marginBottom:12 }}>{phase.period}</div>
                      {(phase.items||[]).map((item,j)=>(
                        <div key={j} style={{ display:"flex", gap:7, marginBottom:8 }}>
                          <div style={{ width:17,height:17,borderRadius:"50%",background:phase.color,
                            color:"#fff",fontSize:8,fontWeight:800,display:"flex",
                            alignItems:"center",justifyContent:"center",flexShrink:0,marginTop:2 }}>{j+1}</div>
                          <span style={{ fontSize:11, color:"#374151", lineHeight:1.5 }}>{item}</span>
                        </div>
                      ))}
                    </div>
                  ))}
                </div>
                <div style={{ background:"linear-gradient(135deg,#0f1f4e,#1A2B5E)", borderRadius:12, padding:18 }}>
                  <div style={{ fontSize:13, fontWeight:800, color:"#fff", marginBottom:3 }}>
                    🎯 우선 권장사항 TOP 3 <DataBadge src={SRC.EST}/>
                  </div>
                  <div style={{ fontSize:10, color:"#64748b", marginBottom:12 }}>실측 데이터 기반 AI 해석</div>
                  {(d.recommendations||[]).map((rec,i)=>(
                    <div key={i} style={{ display:"flex", gap:10, marginBottom:9, padding:"10px 13px",
                      background:"rgba(255,255,255,.07)", borderRadius:9, border:"1px solid rgba(255,255,255,.1)" }}>
                      <div style={{ width:22,height:22,borderRadius:"50%",
                        background:["#00C57E","#F59E0B","#3B82F6"][i],color:"#fff",
                        fontSize:10,fontWeight:800,display:"flex",alignItems:"center",
                        justifyContent:"center",flexShrink:0 }}>{i+1}</div>
                      <span style={{ fontSize:11.5, color:"#e2e8f0", lineHeight:1.5 }}>{rec}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 하단 버튼 */}
            <div style={{ marginTop:16, background:"linear-gradient(135deg,#0f1f4e,#1A2B5E)",
              borderRadius:13, padding:"16px 22px", display:"flex", alignItems:"center", gap:14, flexWrap:"wrap" }}>
              <div>
                <div style={{ fontSize:13, fontWeight:800, color:"#fff" }}>📑 PPT 보고서 생성</div>
                <div style={{ fontSize:10, color:"#94a3b8", marginTop:1 }}>실측 데이터 기반 · 데이터 출처 명시 포함</div>
              </div>
              <div style={{ marginLeft:"auto", display:"flex", gap:9 }}>
                <button onClick={downloadJson}
                  style={{ padding:"9px 18px", background:"rgba(255,255,255,.1)",
                    border:"1px solid rgba(255,255,255,.2)", borderRadius:9,
                    color:"#fff", fontSize:12, fontWeight:700, cursor:"pointer", fontFamily:"inherit" }}>
                  ⬇ JSON 다운로드
                </button>
                <button onClick={()=>{downloadJson();setStep(4);}}
                  style={{ padding:"9px 20px", background:"#00C57E", border:"none",
                    borderRadius:9, color:"#fff", fontSize:12, fontWeight:800,
                    cursor:"pointer", boxShadow:"0 4px 14px rgba(0,197,126,.4)", fontFamily:"inherit" }}>
                  🚀 PPT 생성
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ══ STEP 4 */}
        {step===4 && (
          <div style={{ background:"#fff", borderRadius:16, padding:"32px 36px", boxShadow:"0 4px 24px rgba(0,0,0,.07)" }}>
            <div style={{ textAlign:"center", marginBottom:24 }}>
              <div style={{ fontSize:44, marginBottom:10 }}>🎉</div>
              <div style={{ fontSize:17, fontWeight:800, color:"#1A2B5E", marginBottom:5 }}>PPT 데이터 준비 완료</div>
              <div style={{ fontSize:12, color:"#64748b" }}>JSON 파일을 Claude에게 전달하면 실측 데이터 기반 PPT가 생성됩니다</div>
            </div>
            <div style={{ background:"#f8faff", borderRadius:12, padding:20, marginBottom:16, border:"1px solid #e0e7ff" }}>
              {["JSON 데이터 다운로드","Claude 새 대화창에 JSON 파일 첨부",
                "\"이 JSON으로 네이버 블로그 분석 PPT 만들어줘 (데이터 출처 표시 포함)\" 요청",
                "실측 데이터 출처 명시된 전문 PPT 자동 생성"].map((text,i)=>(
                <div key={i} style={{ display:"flex", gap:12, marginBottom:10, alignItems:"flex-start" }}>
                  <div style={{ width:26,height:26,borderRadius:"50%",background:"#1A2B5E",
                    color:"#fff",fontSize:11,fontWeight:800,display:"flex",
                    alignItems:"center",justifyContent:"center",flexShrink:0 }}>{i+1}</div>
                  <div style={{ fontSize:12, color:"#374151", paddingTop:4 }}>{text}</div>
                </div>
              ))}
            </div>
            <div style={{ display:"flex", gap:11 }}>
              <button onClick={()=>setStep(3)} style={{ flex:1, padding:"12px", background:"#f8f9fc",
                border:"1px solid #e8edf5", borderRadius:11, fontSize:13, fontWeight:700,
                cursor:"pointer", color:"#374151", fontFamily:"inherit" }}>← 분석 결과 보기</button>
              <button onClick={downloadJson} style={{ flex:1, padding:"12px",
                background:"linear-gradient(135deg,#0f1f4e,#1A2B5E)", border:"none",
                borderRadius:11, fontSize:13, fontWeight:700, cursor:"pointer", color:"#fff",
                fontFamily:"inherit", boxShadow:"0 4px 14px rgba(15,31,78,.3)" }}>⬇ JSON 다운로드</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
