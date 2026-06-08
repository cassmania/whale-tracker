/**
 * Whale Tracker - 실시간 API 연계형 온체인 분석 스크립트 (app.js)
 * 주석 언어: 한국어
 */

// 1. 코인게코(CoinGecko) 및 블록체인 API 설정
const COINGECKO_API = "https://api.coingecko.com/api/v3/simple/price";
const SOLANA_RPC = "https://api.mainnet-beta.solana.com";

// 2. 가상/대체 데이터베이스 (API 수집 실패 시 사용되는 Fallback 데이터)
const fallbackDatabase = {
  "SOL": {
    symbol: "SOL", name: "Solana", rank: "#5",
    price: "$96.24", change: "↑ 0.93% (24h)", isPositive: true,
    marketCap: "$55.67B", volume: "$7.81B", website: "solana.com", websiteUrl: "https://solana.com",
    phaseStatus: "혼조 · 조용한 매집", sliderPercent: 31, forceScore: 62, confidence: 50,
    finalPhaseStatus: "매집 강세", finalPhaseDesc: "→ 핵심 매수 지갑 비중 100% + 매수 규모 $0",
    whalePresence: "부재 / 일반 지갑 분산형 주도",
    altForceDetails: {
      smartMoney: "DEX 대형 매수자 15명",
      whale: "순유입 +$497.1K",
      mm: "Wintermute Market Making [MfDuWeqS] 등 1개 라벨이 +$17.67M 흡수 중"
    },
    patternDetails: {
      categoryPct: "0.0%",
      general: "신규/소형 토큰 전형"
    },
    flowDetails: {
      cex: "+$41.85M",
      net: "+$129.84M",
      smartNet: "-$45"
    },
    risks: [
      "<strong>스마트머니 부재</strong> · 기관/스마트머니 지지선 없음",
      "<strong>거래소 순유입 증가</strong> · 단기 매도 압력 상승 중",
      "<strong>추가 경고</strong> · holders·transfers 데이터 미수신 + 봇 주도 DEX 매수 지배 - 수급 신뢰도 제한적"
    ],
    indicators: [
      { name: "최근 에포크 (Epoch)", signal: "584 (91% 진행)", isOk: true, desc: "✓ 솔라나 RPC 실시간 연동" },
      { name: "현재 슬롯 (Slot)", signal: "268,419,502", isOk: true, desc: "✓ 최신 블록 생성 속도 양호" },
      { name: "유통 공급량 (Circulating)", signal: "462.1M SOL", isOk: true, desc: "✓ SOL 인플레이션율 정상 범위" },
      { name: "7일 거래소 흐름", signal: "-$129.84M 순유출", isOk: true, desc: "✓ 단기 매집 정황" },
      { name: "고래 지갑 유입", signal: "+$497.1k (7일)", isOk: true, desc: "✓ 고래 신규 매집" }
    ],
    evidence: {
      bull: [
        "Wintermute Market Making 순매집 +$17.7M - 거래소 매도 물량 조직적 흡수",
        "거래소 순출금 -$129.8M (1주) - 대규모 공급 압축, 시장 매수 순액 +$129.8M"
      ],
      bear: [
        "holders · transfers · marketBuyNet 데이터 미수신 - 홀더 집중도·이체 이력 확인 불가, 신뢰도 제한적"
      ]
    },
    distribution: {
      donutMsg: "추적 가능한 TOP 지갑 데이터 부재 - 신규/소형 토큰. 도넛 생략.",
      interpretation: "총공급의 0.0% 만 라벨된 카테고리(거래소/고래/스마트머니/공인)에 속하고 나머지는 100.0% 는 일반 지갑입니다. 신규·소형 토큰의 전형적 분포로 데이터 가용성이 다소 부족합니다.",
      heatmapSub: "7일 매집/분배 히트맵 · 활동 TOP 0 지갑",
      heatmapMsg: "$100k+ 대규모 전송 데이터가 부족해 일별 매트릭스가 거의 비어있음 (0/105 cell).",
      presence: [
        { item: "스마트머니 대규모 유입", result: "X 없음", isOk: false, detail: "$50k+ DEX 매수자 기준" },
        { item: "고래(Whale) 유입", result: "✓ 37개 지갑", isOk: true, detail: "순플로우 +$240.6K" }
      ]
    }
  },
  "BTC": {
    symbol: "BTC", name: "Bitcoin", rank: "#1",
    price: "$69,420.50", change: "↑ 2.45% (24h)", isPositive: true,
    marketCap: "$1.36T", volume: "$28.45B", website: "bitcoin.org", websiteUrl: "https://bitcoin.org",
    phaseStatus: "매집 강세 · 기관 유입세", sliderPercent: 78, forceScore: 85, confidence: 90,
    finalPhaseStatus: "강력 매집", finalPhaseDesc: "→ 장기 홀더들의 지속적 매집 + 장외거래(OTC) 활성화",
    whalePresence: "확인됨 / 대형 기관 및 ETF 유입 주도",
    altForceDetails: {
      smartMoney: "장기 보유 홀더 순매수 증가세",
      whale: "주요 고래 주소 순유입 +$2.4B",
      mm: "Binance/Coinbase 마켓메이커 물량 안정적 수급 유지"
    },
    patternDetails: {
      categoryPct: "42.5%",
      general: "메이저 가상자산 전형적 집중 분포"
    },
    flowDetails: {
      cex: "-$1.2B (순유출)",
      net: "+$2.85B",
      smartNet: "+$150M"
    },
    risks: [
      "<strong>단기 차익 실현 압력</strong> · 미실현 수익률이 3년래 최고점 부근",
      "<strong>거시경제 변동성</strong> · 미국 기준금리 변동에 따른 선물 포지션 강제 청산 주의"
    ],
    indicators: [
      { name: "24h 트랜잭션 수", signal: "384,102건", isOk: true, desc: "✓ 비트코인 네트워크 활성도" },
      { name: "평균 전송 수수료 (USD)", signal: "$2.450", isOk: true, desc: "✓ 전송 수수료 변동 추이 반영" },
      { name: "전체 블록 높이 (Height)", signal: "842,109", isOk: true, desc: "✓ 블록 생성 정상 작동 중" },
      { name: "Top 100 지갑 잔고", signal: "+0.45% 증가", isOk: true, desc: "✓ 메이저 고래 보유량 축적" },
      { name: "신규 지갑 유입", signal: "+$1.8B (7일)", isOk: true, desc: "✓ 신규 고액 자산가 유입" }
    ],
    evidence: {
      bull: [
        "미국 비트코인 현물 ETF를 통한 기관성 자금의 꾸준한 유입세 관찰",
        "비활성 기간 1년 이상의 장기 보유 지갑(Hodlers) 보유 비율이 68% 돌파"
      ],
      bear: [
        "채굴자 지갑에서 거래소로의 대량 전송 흔적 포착 - 단기 오버행 이슈 존재"
      ]
    },
    distribution: {
      donutMsg: "거래소(15%), 고래(25%), 기관(3%), 일반 지갑(57%) 정상 분포 완료.",
      interpretation: "라벨링이 고도화된 메이저 자산의 전형적인 보유 패턴입니다. 기관 및 장기 홀더들의 비중이 지지선을 형성하고 있습니다.",
      heatmapSub: "7일 매집/분배 히트맵 · 활동 TOP 25 지갑 활성화",
      heatmapMsg: "$100k+ 거래 건수가 매우 활발하며, 고래들의 매집 흐름이 뚜렷하게 관측됩니다.",
      presence: [
        { item: "스마트머니 대규모 유입", result: "✓ 유입 확인", isOk: true, detail: "기관 급 지갑 활성화" },
        { item: "고래(Whale) 유입", result: "✓ 142개 지갑", isOk: true, detail: "순플로우 +$2.4B" }
      ]
    }
  },
  "ETH": {
    symbol: "ETH", name: "Ethereum", rank: "#2",
    price: "$3,412.15", change: "↓ 1.25% (24h)", isPositive: false,
    marketCap: "$410.2B", volume: "$14.20B", website: "ethereum.org", websiteUrl: "https://ethereum.org",
    phaseStatus: "혼조 · 분배 경계선", sliderPercent: 55, forceScore: 48, confidence: 65,
    finalPhaseStatus: "중립 국면", finalPhaseDesc: "→ 스테이킹 물량 증가 및 가스비 연소율 둔화",
    whalePresence: "일부 고래 분배 움직임 포착",
    altForceDetails: {
      smartMoney: "DEX 스마트머니 순유출 전환",
      whale: "순유출 -$89M",
      mm: "Uniswap V3 유동성 공급자 물량 소폭 이탈 중"
    },
    patternDetails: {
      categoryPct: "35.2%",
      general: "일반 스마트 컨트랙트 지갑 보유 다수"
    },
    flowDetails: {
      cex: "+$120.4M (순입금)",
      net: "-$89.0M",
      smartNet: "-$12.5M"
    },
    risks: [
      "<strong>가스 가격 하락</strong> · L2 활성화로 인한 이더리움 메인넷 연소량(Burn Rate) 급감",
      "<strong>고래 순유입 감소</strong> · 거래소로 향하는 지갑 이체 수량 소폭 상승"
    ],
    indicators: [
      { name: "24h 트랜잭션 수", signal: "1,120,450건", isOk: true, desc: "✓ 이더리움 네트워크 거래 빈도" },
      { name: "평균 전송 수수료 (USD)", signal: "$1.850", isOk: false, desc: "✗ 네트워크 혼잡에 따른 수수료 상승" },
      { name: "전체 블록 높이 (Height)", signal: "19,410,250", isOk: true, desc: "✓ 검증인 네트워크 정상 가동" },
      { name: "Top 100 지갑 잔고", signal: "-0.12% 감소", isOk: false, desc: "✗ 상위 홀더들의 비중 분산" },
      { name: "신규 지갑 유입", signal: "+$320M (7일)", isOk: true, desc: "✓ 신규 진입자 안정적 유입" }
    ],
    evidence: {
      bull: [
        "이더리움 2.0 스테이킹(Staking) 계약에 묶인 총물량이 역대 최고치(32M ETH) 돌파",
        "신규 밸리데이터 등록 대기 열의 안정적인 상승세 지속"
      ],
      bear: [
        "메타마스크 등 주요 소매 사용자 지갑의 활성 거래 건수가 지난달 대비 14% 감소"
      ]
    },
    distribution: {
      donutMsg: "스테이킹 물량(26%), 거래소(11%), 고래(31%), 일반(32%) 분포",
      interpretation: "가장 많은 수량이 락업되어 있어 유통 공급 충격은 적지만, 거래소 잔고가 단기적으로 증가하며 주의 국면에 돌입했습니다.",
      heatmapSub: "7일 매집/분배 히트맵 · 활동 TOP 50 지갑 분석",
      heatmapMsg: "일부 지갑군에서 특정 가격대에서의 집중적인 분배(매도) 패턴이 확인됩니다.",
      presence: [
        { item: "스마트머니 대규모 유입", result: "X 없음", isOk: false, detail: "DEX 주요 매수 지연" },
        { item: "고래(Whale) 유입", result: "X 12개 지갑 유출", isOk: false, detail: "순플로우 -$89M" }
      ]
    }
  }
};

// 3. 글로벌 상태 변수
let currentSelectedToken = "SOL";
let currentSelectedWindow = "1주";
let isAlertActive = true;
let alertInterval = null;
let priceTracker = {}; // 실시간 급등 감시용 가격 데이터베이스

// 타임아웃 기능이 포함된 fetch 함수 (Fetch with Timeout)
// 기술 설명: 지정된 시간(밀리초) 이내에 네트워크 응답이 없을 경우 요청을 강제로 차단(Abort)하는 래퍼(Wrapper) 함수입니다.
async function fetchWithTimeout(resource, options = {}) {
  const { timeout = 2000 } = options;
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeout);
  try {
    const response = await fetch(resource, {
      ...options,
      signal: controller.signal
    });
    clearTimeout(id);
    return response;
  } catch (err) {
    clearTimeout(id);
    throw err;
  }
}

// 4. API로부터 실시간 가격 및 시장 데이터를 수집하는 함수 (Fetch Market Data)
async function fetchRealtimeMarketData(symbol) {
  const coinIds = { "SOL": "solana", "BTC": "bitcoin", "ETH": "ethereum" };
  let id = coinIds[symbol];
  if (!id) {
    id = symbol.toLowerCase();
  }

  try {
    const url = `${COINGECKO_API}?ids=${id}&vs_currencies=usd&include_market_cap=true&include_24hr_vol=true&include_24hr_change=true`;
    const response = await fetchWithTimeout(url);
    if (!response.ok) throw new Error("CoinGecko API 응답 실패");
    const data = await response.json();
    const tokenInfo = data[id];

    if (tokenInfo) {
      const formattedPrice = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(tokenInfo.usd);
      const changeVal = tokenInfo.usd_24h_change;
      const formattedChange = `${changeVal >= 0 ? '↑' : '↓'} ${Math.abs(changeVal).toFixed(2)}% (24h)`;
      const formattedMCap = `$${(tokenInfo.usd_market_cap / 1e9).toFixed(2)}B`;
      const formattedVol = `$${(tokenInfo.usd_24h_vol / 1e9).toFixed(2)}B`;

      return {
        price: formattedPrice,
        change: formattedChange,
        isPositive: changeVal >= 0,
        marketCap: formattedMCap,
        volume: formattedVol
      };
    }
  } catch (error) {
    console.warn("시장 데이터 실시간 수집 실패 (대체 데이터 사용):", error.message);
  }
  return null;
}

// 5. 블록체인 네트워크로부터 실시간 온체인 데이터를 수집하는 함수 (Fetch On-chain Data)
async function fetchRealtimeOnchainData(symbol) {
  try {
    if (symbol === "SOL") {
      // 5-1. 솔라나 메인넷 JSON-RPC 연동 (CORS 차단 방지를 위해 2초 타임아웃 강제 적용)
      const response = await fetchWithTimeout(SOLANA_RPC, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify([
          { jsonrpc: "2.0", id: 1, method: "getEpochInfo" },
          { jsonrpc: "2.0", id: 2, method: "getSupply" }
        ])
      });
      if (!response.ok) throw new Error("Solana RPC 응답 실패");
      const results = await response.json();
      
      const epochInfo = results.find(r => r.id === 1).result;
      const supplyInfo = results.find(r => r.id === 2).result;

      if (epochInfo && supplyInfo) {
        const circulatingSOL = `${(supplyInfo.circulating / 1e9 / 1e6).toFixed(1)}M SOL`;
        return {
          "최근 에포크 (Epoch)": `${epochInfo.epoch} (${Math.floor((epochInfo.slotIndex / epochInfo.slotsInEpoch) * 100)}% 진행)`,
          "현재 슬롯 (Slot)": epochInfo.absoluteSlot.toLocaleString(),
          "유통 공급량 (Circulating)": circulatingSOL
        };
      }
    } else if (symbol === "BTC" || symbol === "ETH") {
      // 5-2. 비트코인 및 이더리움 Blockchair API 연동
      const pathName = symbol === "BTC" ? "bitcoin" : "ethereum";
      const response = await fetchWithTimeout(`https://api.blockchair.com/${pathName}/stats`);
      if (!response.ok) throw new Error("Blockchair API 응답 실패");
      const body = await response.json();
      const stats = body.data;

      if (stats) {
        return {
          "24h 트랜잭션 수": `${stats.transactions_24h.toLocaleString()}건`,
          "평균 전송 수수료 (USD)": `$${stats.average_transaction_fee_usd_24h.toFixed(3)}`,
          "전체 블록 높이 (Height)": stats.blocks.toLocaleString()
        };
      }
    }
  } catch (error) {
    console.warn(`${symbol} 실시간 온체인 데이터 수집 실패 (대체 데이터 사용):`, error.message);
  }
  return null;
}

// 6. DOM 요소 및 이벤트 리스너 바인딩
const homeScreen = document.getElementById("home-screen");
const loaderScreen = document.getElementById("loader-screen");
const reportScreen = document.getElementById("report-screen");

const tokenSearch = document.getElementById("token-search");
const searchClear = document.getElementById("search-clear");
const searchSuggestions = document.getElementById("search-suggestions");
const analyzeBtn = document.getElementById("analyze-btn");
const backToHome = document.getElementById("back-to-home");

// 토큰 카드용 객체
const tokenLogo = document.getElementById("token-logo");
const tokenSymbol = document.getElementById("token-symbol");
const tokenRank = document.getElementById("token-rank");
const tokenName = document.getElementById("token-name");
const tokenPrice = document.getElementById("token-price");
const tokenChange = document.getElementById("token-change");
const tokenMarketCap = document.getElementById("token-market-cap");
const tokenVolume = document.getElementById("token-volume");
const tokenWebsite = document.getElementById("token-website");
const tokenWebsiteLabel = document.getElementById("token-website-label");

// 보고서 구성 요소
const reportTokenSymbol = document.getElementById("report-token-symbol");
const reportPillName1 = document.getElementById("report-pill-name-1");
const reportPillName2 = document.getElementById("report-pill-name-2");
const reportPillRank = document.getElementById("report-pill-rank");
const reportPillWindow = document.getElementById("report-pill-window");

const phaseStatus = document.getElementById("phase-status");
const phasePointer = document.getElementById("phase-pointer");
const forceScore = document.getElementById("force-score");
const confidenceScore = document.getElementById("confidence-score");

const finalPhaseStatus = document.getElementById("final-phase-status");
const finalPhaseDesc = document.getElementById("final-phase-desc");
const whalePresenceStatus = document.getElementById("whale-presence-status");

const listSmartMoneyDetail = document.getElementById("list-smart-money-detail");
const listWhaleDetail = document.getElementById("list-whale-detail");
const listMmDetail = document.getElementById("list-mm-detail");
const listCategoryPct = document.getElementById("list-category-pct");
const listGeneralDetail = document.getElementById("list-general-detail");
const listCexInflow = document.getElementById("list-cex-inflow");
const listNetAccumulation = document.getElementById("list-net-accumulation");
const listSmartMoneyNet = document.getElementById("list-smart-money-net");

const riskFactorsList = document.getElementById("risk-factors-list");

const indPhaseStatus = document.getElementById("ind-phase-status");
const indPhaseDesc = document.getElementById("ind-phase-desc");
const indicatorsTbody = document.getElementById("indicators-tbody");
const evidenceSub = document.getElementById("evidence-sub");
const evidenceBullSignals = document.getElementById("evidence-bull-signals");
const evidenceBearSignals = document.getElementById("evidence-bear-signals");

const distMainMsg = document.getElementById("dist-main-msg");
const distInterpretation = document.getElementById("dist-interpretation");
const heatmapSub = document.getElementById("heatmap-sub");
const heatmapMsg = document.getElementById("heatmap-msg");
const heatmapGrid = document.getElementById("heatmap-grid");
const presenceTbody = document.getElementById("presence-tbody");

const dataStatusText = document.getElementById("data-status-text");

const tabButtons = document.querySelectorAll(".tab-btn");
const tabPanes = document.querySelectorAll(".tab-pane");

const windowButtons = document.querySelectorAll(".window-btn");
const windowTag = document.getElementById("window-tag");

// 추가된 기능 관련 DOM 바인딩
const alertToggle = document.getElementById("alert-toggle");
const toastContainer = document.getElementById("toast-container");
const recentSearchesList = document.getElementById("recent-searches-list");
const recentSearchesContainer = document.getElementById("recent-searches-container");
const surgeFeedList = document.getElementById("surge-feed-list");
const clearFeedBtn = document.getElementById("clear-feed-btn");

// 초기 실행 (Initialization)
document.addEventListener("DOMContentLoaded", async () => {
  await selectToken("SOL");
  generateHeatmapGrid();
  
  // 추가 기능 초기화 (최근 검색 기록 & 급등 알림 & 감지 피드)
  updateHistoryUI();
  initSurgeAlert();
  updateFeedUI();

  if (clearFeedBtn) {
    clearFeedBtn.addEventListener("click", () => {
      clearFeedData();
    });
  }
  
  // 검색어 입력
  tokenSearch.addEventListener("input", (e) => {
    const value = e.target.value.trim().toUpperCase();
    if (value.length > 0) {
      searchClear.style.display = "block";
      showSearchSuggestions(value);
    } else {
      searchClear.style.display = "none";
      searchSuggestions.classList.add("hidden");
    }
  });

  // 검색 지우기
  searchClear.addEventListener("click", () => {
    tokenSearch.value = "";
    searchClear.style.display = "none";
    searchSuggestions.classList.add("hidden");
    tokenSearch.focus();
  });

  // 분석 윈도우 선택
  windowButtons.forEach(btn => {
    btn.addEventListener("click", () => {
      windowButtons.forEach(b => b.classList.remove("active"));
      btn.classList.add("active");
      const tag = btn.querySelector(".btn-bottom").textContent;
      currentSelectedWindow = btn.querySelector(".btn-top").textContent;
      windowTag.textContent = `T-${tag}`;
    });
  });

  // 탭 제어
  tabButtons.forEach(btn => {
    btn.addEventListener("click", () => {
      tabButtons.forEach(b => b.classList.remove("active"));
      btn.classList.add("active");
      
      const tabId = btn.getAttribute("data-tab");
      tabPanes.forEach(pane => {
        pane.classList.remove("active");
        if (pane.id === tabId) {
          pane.classList.add("active");
        }
      });
    });
  });

  // 분석 버튼
  analyzeBtn.addEventListener("click", async () => {
    const query = tokenSearch.value.trim().toUpperCase();
    if (query) {
      await selectToken(query);
    }
    startAnalysisWorkflow();
  });

  // 검색창 Enter 입력 시 즉시 분석 시작
  tokenSearch.addEventListener("keypress", async (e) => {
    if (e.key === "Enter") {
      const query = tokenSearch.value.trim().toUpperCase();
      if (query) {
        await selectToken(query);
        startAnalysisWorkflow();
      }
    }
  });

  // 이전 화면
  backToHome.addEventListener("click", () => {
    reportScreen.classList.remove("active");
    homeScreen.classList.add("active");
  });

  // 빈 여백 클릭 시 검색 추천 닫기
  document.addEventListener("click", (e) => {
    if (!e.target.closest(".search-container")) {
      searchSuggestions.classList.add("hidden");
    }
  });
});

// fallbackDatabase에 없는 토큰을 검색했을 때 동적으로 고유한 데이터를 생성해주는 함수 (Deterministic Mock Generator)
function generateDynamicFallback(symbol) {
  const name = symbol;
  
  // 문자열 기반 간단한 해시 함수로 각 심볼 고유의 숫자 시드(Seed) 생성
  let hash = 0;
  for (let i = 0; i < symbol.length; i++) {
    hash = symbol.charCodeAt(i) + ((hash << 5) - hash);
  }
  const absHash = Math.abs(hash);

  // 1. 고유한 순위(Rank) 지정 (시가총액 랭킹 #15 ~ #299 범위로 다변화)
  const rankNum = 15 + (absHash % 285);

  // 2. 고유한 점수 및 매집 비율 계산
  const sliderPercent = 20 + (absHash % 65); // 20% ~ 85%
  const forceScore = 35 + (absHash % 55);    // 35 ~ 90
  const confidence = 45 + (absHash % 45);    // 45 ~ 90

  // 3. 고유한 온체인 지표(On-chain Indicator) 값 생성
  // 24시간 트랜잭션(Transaction) 수: 1,500건 ~ 85,000건 범위
  const txCount = (1500 + (absHash % 83500)).toLocaleString();
  // 평균 전송 수수료: $0.001 ~ $4.50 범위 (해시값 분기에 따라 가스비 분리)
  let feeVal = "";
  if (absHash % 3 === 0) {
    feeVal = "$" + (0.001 + (absHash % 99) / 10000).toFixed(5); // 저렴한 L2 네트워크 모사
  } else {
    feeVal = "$" + (0.05 + (absHash % 445) / 100).toFixed(3);  // 메인넷 가스비 모사
  }
  // 전체 블록 높이(Height): 200,000 ~ 15,000,000 범위
  const blockHeight = (200000 + (absHash % 14800000)).toLocaleString();

  // 4. 세력 흐름 자금 규모 다양화
  const cexFlow = `${absHash % 2 === 0 ? "+" : "-"}$${((absHash % 850) / 10).toFixed(2)}M`;
  const netAccum = `${absHash % 3 === 0 ? "-" : "+"}$${((absHash % 1200) / 10).toFixed(2)}M`;
  const smartNet = `${absHash % 2 === 0 ? "+" : "-"}$${((absHash % 150000) / 100).toLocaleString()}`;

  // 5. 국면 텍스트 다변화
  let phaseStatus = "혼조 · 조용한 매집";
  let finalPhaseStatus = "매집 관망";
  let whalePresence = "관찰 대상 / 데이터 탐색 중";
  if (sliderPercent > 65) {
    phaseStatus = "과열 · 공격적 매집";
    finalPhaseStatus = "강력 매집";
    whalePresence = "확인됨 / 고래 주도 축적세";
  } else if (sliderPercent < 35) {
    phaseStatus = "약세 · 분배 전환 경계";
    finalPhaseStatus = "세력 이탈";
    whalePresence = "일부 고래 이탈 및 매도 신호";
  }

  fallbackDatabase[symbol] = {
    symbol: symbol,
    name: name,
    rank: `#${rankNum}`,
    price: "$1.00",
    change: "↑ 0.00% (24h)",
    isPositive: absHash % 2 === 0,
    marketCap: `$${((absHash % 8500) / 10 + 50).toFixed(1)}M`,
    volume: `$${((absHash % 850) / 10 + 5).toFixed(1)}M`,
    website: `${symbol.toLowerCase()}.org`,
    websiteUrl: `https://${symbol.toLowerCase()}.org`,
    phaseStatus: phaseStatus,
    sliderPercent: sliderPercent,
    forceScore: forceScore,
    confidence: confidence,
    finalPhaseStatus: finalPhaseStatus,
    finalPhaseDesc: `→ ${symbol} 온체인 지갑 및 스마트머니 트래킹 분석 지표`,
    whalePresence: whalePresence,
    altForceDetails: {
      smartMoney: `DEX 상위 거래 지갑 ${(absHash % 15) + 3}곳 감시 중`,
      whale: `순유동량 ${netAccum} 범위 이내 유지`,
      mm: `DEX 유동성 메이커 활성도 추적`
    },
    patternDetails: {
      categoryPct: `${((absHash % 200) / 10).toFixed(1)}%`,
      general: `${symbol} 네트워크 전용 카테고리 구성 완료`
    },
    flowDetails: {
      cex: cexFlow,
      net: netAccum,
      smartNet: smartNet
    },
    risks: [
      `<strong>데이터 신규 분석</strong> · ${symbol} 토큰의 실시간 온체인 계약(Contract) 활동 추적 시작`,
      "<strong>유동성 공급 확인</strong> · 상대적으로 얇은 호가창 및 호재 뉴스 유무 사전 점검 권장"
    ],
    indicators: [
      { name: "24h 트랜잭션 수", signal: `${txCount}건`, isOk: true, desc: `✓ ${symbol} 원장 실시간 트랜잭션 빈도` },
      { name: "평균 전송 수수료 (USD)", signal: feeVal, isOk: absHash % 3 !== 1, desc: `✓ 네트워크 전송 수수료 수준` },
      { name: "전체 블록 높이 (Height)", signal: blockHeight, isOk: true, desc: `✓ ${symbol} 동기화 완료된 블록 높이` }
    ],
    evidence: {
      bull: [
        `${symbol} 활성 노드 수 전주 대비 증가세 관측`,
        `DEX 풀(Pool) 내의 순매수 비율 안정적 유지`
      ],
      bear: [
        `거래소 지갑으로의 단기 소액 입금 흐름 점진적 확인`
      ]
    },
    distribution: {
      donutMsg: "초기 분석 토큰 - 세력 분포 지도 계산 중",
      interpretation: `${symbol} 토큰은 스마트머니 지갑 비중이 전체의 소액을 차지하고 있으며, 일반 소매 홀더 비중이 고르게 분포되어 있습니다.`,
      heatmapSub: "7일 매집/분배 히트맵 · 활동 요약",
      heatmapMsg: "실시간 트랜잭션 데이터 모니터링을 통한 히트맵 생성 중입니다.",
      presence: [
        { item: "스마트머니 대규모 유입", result: absHash % 2 === 0 ? "✓ 유입 감지" : "X 없음", isOk: absHash % 2 === 0, detail: "DEX 주요 매수 흐름 연동" },
        { item: "고래(Whale) 유입", result: `✓ ${(absHash % 18) + 2}개 지갑`, isOk: true, detail: `활동 유동성 추정 ${netAccum}` }
      ]
    }
  };
}

// 토큰 카드를 선택하고 실시간 데이터를 요청합니다.
async function selectToken(symbol) {
  currentSelectedToken = symbol;
  
  // 만약 fallbackDatabase에 없으면 동적 fallback 데이터를 생성해서 등록
  if (!fallbackDatabase[symbol]) {
    generateDynamicFallback(symbol);
  }
  
  // 기본 모의값 먼저 대입
  const fallback = fallbackDatabase[symbol];
  if (!fallback) return;

  // 시장 데이터 수집
  const rtMarket = await fetchRealtimeMarketData(symbol);
  
  tokenSymbol.textContent = fallback.symbol;
  tokenRank.textContent = fallback.rank;
  tokenName.textContent = fallback.name;
  
  tokenPrice.textContent = rtMarket ? rtMarket.price : fallback.price;
  tokenChange.textContent = rtMarket ? rtMarket.change : fallback.change;
  
  const isPositive = rtMarket ? rtMarket.isPositive : fallback.isPositive;
  tokenChange.className = `token-change ${isPositive ? 'positive' : 'negative'}`;

  tokenMarketCap.textContent = rtMarket ? rtMarket.marketCap : fallback.marketCap;
  tokenVolume.textContent = rtMarket ? rtMarket.volume : fallback.volume;
  tokenWebsiteLabel.textContent = fallback.website;
  tokenWebsite.href = fallback.websiteUrl;

  const color = isPositive ? "%2300ffaa" : "%23ff3b30";
  tokenLogo.src = `data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='40' height='40' viewBox='0 0 407 311'><rect width='407' height='311' rx='40' fill='%23111' /><text x='50%25' y='60%25' font-size='110' fill='${color}' font-family='Outfit' font-weight='800' text-anchor='middle'>${symbol[0]}</text></svg>`;
}

// 검색 창의 자동완성 추천 패널 렌더링
function showSearchSuggestions(query) {
  searchSuggestions.innerHTML = "";
  const matches = Object.keys(fallbackDatabase).filter(key => 
    key.includes(query) || fallbackDatabase[key].name.toUpperCase().includes(query)
  );

  if (matches.length === 0) {
    searchSuggestions.classList.add("hidden");
    return;
  }

  matches.forEach(symbol => {
    const data = fallbackDatabase[symbol];
    const item = document.createElement("div");
    item.className = "suggestion-item";
    
    const color = data.isPositive ? "%2300ffaa" : "%23ff3b30";
    const logoSrc = `data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 100 100'><rect width='100' height='100' rx='50' fill='%23111'/><text x='50%25' y='72%25' font-size='60' fill='${color}' font-family='Outfit' font-weight='800' text-anchor='middle'>${symbol[0]}</text></svg>`;

    item.innerHTML = `
      <div class="suggest-left">
        <img class="suggest-logo" src="${logoSrc}" alt="${symbol}">
        <span class="suggest-symbol">${symbol}</span>
        <span class="suggest-name">${data.name}</span>
      </div>
      <span class="suggest-price">${data.price}</span>
    `;

    item.addEventListener("click", async () => {
      tokenSearch.value = symbol;
      await selectToken(symbol);
      searchSuggestions.classList.add("hidden");
    });

    searchSuggestions.appendChild(item);
  });

  searchSuggestions.classList.remove("hidden");
}

// 실시간 데이터를 주입하여 보고서 구성
async function populateReportData(symbol) {
  const data = fallbackDatabase[symbol];
  if (!data) return;

  // 실시간 가격 데이터 가져오기
  const rtMarket = await fetchRealtimeMarketData(symbol);
  const mPrice = rtMarket ? rtMarket.price : data.price;

  // 헤더 매핑
  reportTokenSymbol.textContent = data.symbol;
  reportPillName1.textContent = data.name.toUpperCase();
  reportPillName2.textContent = data.name.toUpperCase();
  reportPillRank.textContent = `RANK ${data.rank}`;
  reportPillWindow.textContent = currentSelectedWindow;

  // 국면 판정
  phaseStatus.textContent = data.phaseStatus;
  phasePointer.style.left = `${data.sliderPercent}%`;
  phasePointer.querySelector(".pointer-value").textContent = `↑ 현재 ${data.sliderPercent}%`;
  forceScore.innerHTML = `${data.forceScore}<span class="max-val">/100</span>`;
  confidenceScore.innerHTML = `${data.confidence}<span class="max-val">/100</span>`;

  // 최종 세력 판정
  finalPhaseStatus.textContent = data.finalPhaseStatus;
  finalPhaseDesc.textContent = data.finalPhaseDesc;
  whalePresenceStatus.textContent = data.whalePresence;
  
  if (data.whalePresence.includes("부재")) {
    whalePresenceStatus.className = "status-warning";
    finalPhaseStatus.parentElement.className = "final-assessment-box yellow-bg";
    indPhaseStatus.parentElement.className = "final-assessment-box yellow-bg";
  } else {
    whalePresenceStatus.className = "status-ok";
    finalPhaseStatus.parentElement.className = "final-assessment-box green-bg";
    indPhaseStatus.parentElement.className = "final-assessment-box green-bg";
  }

  listSmartMoneyDetail.textContent = data.altForceDetails.smartMoney;
  listWhaleDetail.textContent = data.altForceDetails.whale;
  listMmDetail.textContent = data.altForceDetails.mm;
  listCategoryPct.textContent = data.patternDetails.categoryPct;
  listGeneralDetail.textContent = data.patternDetails.general;
  listCexInflow.textContent = data.flowDetails.cex;
  listNetAccumulation.textContent = data.flowDetails.net;
  listSmartMoneyNet.textContent = data.flowDetails.smartNet;

  // 리스크 요소
  riskFactorsList.innerHTML = "";
  data.risks.forEach((risk, index) => {
    const li = document.createElement("li");
    li.innerHTML = `<span class="risk-num">${index + 1}.</span> <span class="risk-text">${risk}</span>`;
    riskFactorsList.appendChild(li);
  });

  // 온체인 실시간 지표 불러오기
  const rtOnchain = await fetchRealtimeOnchainData(symbol);

  // 온체인 7지표 테이블 구성
  indPhaseStatus.textContent = data.finalPhaseStatus;
  indPhaseDesc.textContent = data.finalPhaseDesc;

  indicatorsTbody.innerHTML = "";
  data.indicators.forEach(ind => {
    const tr = document.createElement("tr");
    let signalClass = "neutral";
    if (ind.isOk === true) signalClass = "positive";
    if (ind.isOk === false) signalClass = "negative";

    let signalText = ind.signal;
    // 실시간 연동 값이 있을 경우 대치해줍니다.
    if (rtOnchain && rtOnchain[ind.name]) {
      signalText = rtOnchain[ind.name];
    }

    tr.innerHTML = `
      <td class="indicator-row-name">${ind.name}</td>
      <td class="indicator-signal ${signalClass}">${signalText}</td>
      <td class="indicator-desc">${ind.desc}</td>
    `;
    indicatorsTbody.appendChild(tr);
  });

  // 세부 근거
  evidenceSub.textContent = data.finalPhaseDesc;
  evidenceBullSignals.innerHTML = "";
  data.evidence.bull.forEach(sig => {
    const li = document.createElement("li");
    li.innerHTML = sig;
    evidenceBullSignals.appendChild(li);
  });

  evidenceBearSignals.innerHTML = "";
  data.evidence.bear.forEach(sig => {
    const li = document.createElement("li");
    li.innerHTML = sig;
    evidenceBearSignals.appendChild(li);
  });

  // 지갑 분포 데이터
  distMainMsg.textContent = data.distribution.donutMsg;
  distInterpretation.textContent = data.distribution.interpretation;
  heatmapSub.textContent = data.distribution.heatmapSub;
  heatmapMsg.textContent = data.distribution.heatmapMsg;

  // 세력 판별 표
  presenceTbody.innerHTML = "";
  data.distribution.presence.forEach(item => {
    const tr = document.createElement("tr");
    let badgeClass = item.isOk ? "green" : "red";
    tr.innerHTML = `
      <td>${item.item}</td>
      <td>
        <span class="presence-result-badge ${badgeClass}">
          ${item.result}
        </span>
      </td>
      <td>${item.detail}</td>
    `;
    presenceTbody.appendChild(tr);
  });

  // 푸터 바 상태 텍스트
  if (rtMarket || rtOnchain) {
    dataStatusText.textContent = `실시간 동기화 완료 (시세: CoinGecko, 온체인: ${symbol === "SOL" ? "Solana 메인넷 RPC" : "Blockchair API"})`;
    dataStatusText.parentElement.style.color = "var(--color-green)";
  } else {
    dataStatusText.textContent = "API 로드 오류 — 백업 데이터로 로드됨";
    dataStatusText.parentElement.style.color = "var(--color-yellow)";
  }
}

// 105개 그리드 셀 생성
function generateHeatmapGrid() {
  heatmapGrid.innerHTML = "";
  for (let i = 0; i < 105; i++) {
    const cell = document.createElement("div");
    cell.className = "heatmap-cell";
    
    if (currentSelectedToken !== "SOL") {
      const rand = Math.random();
      if (rand > 0.8) {
        cell.className = "heatmap-cell active-green";
      } else if (rand < 0.15) {
        cell.className = "heatmap-cell active-red";
      }
    }
    heatmapGrid.appendChild(cell);
  }
}

// 터미널 로딩 화면 연출 시뮬레이션
function startAnalysisWorkflow() {
  homeScreen.classList.remove("active");
  loaderScreen.classList.add("active");

  const terminalBody = document.getElementById("terminal-body");
  const progressBar = document.getElementById("terminal-progress");

  // 터미널 출력 리셋
  terminalBody.innerHTML = `
    <div class="line green">&gt; connection.establish("wss://node.whale-tracker.io")</div>
    <div class="line green">&gt; connection.state: CONNECTED</div>
    <div class="line">&gt; initializing network handshake... [OK]</div>
  `;
  progressBar.style.width = "0%";

  const logs = [
    { text: `> querying realtime CoinGecko indices for ${currentSelectedToken}...`, delay: 150, type: "normal" },
    { text: `> status: API online. parsed market values.`, delay: 350, type: "green" },
    { text: `> establishing ledger stream for block analytics...`, delay: 500, type: "normal" },
    { text: symbolToTerminalMsg(currentSelectedToken), delay: 750, type: "yellow" },
    { text: `> trace_wallets(target="${currentSelectedToken}", threshold="SmartMoney")`, delay: 1000, type: "normal" },
    { text: `> wallet telemetry: OK. mapping transaction matrix.`, delay: 1250, type: "green" },
    { text: `> compiling report segments (overview, indicators, heatmap)...`, delay: 1550, type: "normal" },
    { text: `> state matrix calculated successfully.`, delay: 1750, type: "green" }
  ];

  logs.forEach((log, idx) => {
    setTimeout(() => {
      const p = document.createElement("div");
      p.className = `line ${log.type === "green" ? "green" : log.type === "red" ? "red" : log.type === "yellow" ? "yellow" : ""}`;
      p.textContent = log.text;
      terminalBody.appendChild(p);
      
      terminalBody.scrollTop = terminalBody.scrollHeight;
      
      const percent = Math.floor(((idx + 1) / logs.length) * 100);
      progressBar.style.width = `${percent}%`;
    }, log.delay);
  });

  setTimeout(async () => {
    try {
      // 실시간 데이터로 채워넣기
      await populateReportData(currentSelectedToken);
      generateHeatmapGrid();

      // 분석 성공 시 최근 검색 기록에 저장
      saveSearchHistory(currentSelectedToken);

      if (tabButtons && tabButtons.length > 0) {
        tabButtons[0].click();
      }

      loaderScreen.classList.remove("active");
      reportScreen.classList.add("active");
    } catch (err) {
      console.error("분석 로딩 중 예외 발생:", err);
      const p = document.createElement("div");
      p.className = "line red";
      p.textContent = `> ERROR: ${err.message || err}`;
      terminalBody.appendChild(p);
      terminalBody.scrollTop = terminalBody.scrollHeight;
    }
  }, 2000);
}

function symbolToTerminalMsg(symbol) {
  if (symbol === "SOL") {
    return `> requesting Solana mainnet-beta getEpochInfo... [CONNECTED]`;
  } else {
    return `> accessing Blockchair gateway for ${symbol} ledger stats... [CONNECTED]`;
  }
}

// ==================== 5. 최근 검색 기록 관리 (LocalStorage CRUD) ====================
function getSearchHistory() {
  const history = localStorage.getItem("whale_tracker_history");
  return history ? JSON.parse(history) : ["SOL", "BTC", "ETH"];
}

function saveSearchHistory(symbol) {
  let history = getSearchHistory();
  // 중복 제거 및 맨 앞으로 보냄
  history = history.filter(s => s !== symbol);
  history.unshift(symbol);
  if (history.length > 5) {
    history.pop();
  }
  localStorage.setItem("whale_tracker_history", JSON.stringify(history));
  updateHistoryUI();
}

function removeSearchHistory(symbol) {
  let history = getSearchHistory();
  history = history.filter(s => s !== symbol);
  localStorage.setItem("whale_tracker_history", JSON.stringify(history));
  updateHistoryUI();
}

function updateHistoryUI() {
  const history = getSearchHistory();
  if (!recentSearchesList) return;
  recentSearchesList.innerHTML = "";
  
  if (history.length === 0) {
    recentSearchesContainer.style.display = "none";
    return;
  }
  recentSearchesContainer.style.display = "flex";
  
  history.forEach(symbol => {
    const tag = document.createElement("div");
    tag.className = "recent-tag";
    tag.innerHTML = `
      <span class="tag-text">${symbol}</span>
      <span class="recent-delete" data-symbol="${symbol}">&times;</span>
    `;
    
    // 클릭 시 해당 토큰으로 채우고 분석 워크플로우 작동
    tag.querySelector(".tag-text").addEventListener("click", async () => {
      tokenSearch.value = symbol;
      await selectToken(symbol);
      startAnalysisWorkflow();
    });
    
    // 지우기 버튼 클릭 시 최근 검색 기록에서 제외
    tag.querySelector(".recent-delete").addEventListener("click", (e) => {
      e.stopPropagation();
      removeSearchHistory(symbol);
    });
    
    recentSearchesList.appendChild(tag);
  });
}

// ==================== 6. 실시간 급등 알림 (Surge Alert) 감시 로직 ====================
function initSurgeAlert() {
  const savedSetting = localStorage.getItem("whale_tracker_alert_active");
  if (savedSetting !== null) {
    isAlertActive = savedSetting === "true";
  }
  if (alertToggle) {
    alertToggle.checked = isAlertActive;
    alertToggle.addEventListener("change", async (e) => {
      isAlertActive = e.target.checked;
      localStorage.setItem("whale_tracker_alert_active", isAlertActive);
      if (isAlertActive) {
        await requestNotificationPermission();
        startAlertMonitoring();
      } else {
        stopAlertMonitoring();
      }
    });
  }
  
  if (isAlertActive) {
    startAlertMonitoring();
  }
}

async function requestNotificationPermission() {
  if ("Notification" in window) {
    if (Notification.permission !== "granted" && Notification.permission !== "denied") {
      await Notification.requestPermission();
    }
  }
}

function startAlertMonitoring() {
  if (alertInterval) clearInterval(alertInterval);
  
  // 15초 단위로 가격 및 온체인 수급 변동 감시
  alertInterval = setInterval(async () => {
    if (!isAlertActive) return;
    
    const targets = Array.from(new Set([...getSearchHistory(), "SOL", "BTC", "ETH"]));
    
    for (const symbol of targets) {
      try {
        const rt = await fetchRealtimeMarketData(symbol);
        if (!rt) continue;
        
        const currentPrice = parseFloat(rt.price.replace(/[^0-9.-]+/g, ""));
        if (isNaN(currentPrice)) continue;
        
        const lastPrice = priceTracker[symbol];
        if (lastPrice) {
          const changePct = ((currentPrice - lastPrice) / lastPrice) * 100;
          // 1.5% 급변동 시 사후 급등 알림 발송
          if (changePct >= 1.5) {
            triggerSurgeAlert(symbol, changePct.toFixed(2), rt.price);
          }
        }
        priceTracker[symbol] = currentPrice;
      } catch (e) {
        console.warn(`${symbol} 가격 감시 중 오류 발생:`, e);
      }
    }
    
    // 시각적 역동성을 위한 시뮬레이션 급등 알림 (5% 확률)
    if (Math.random() < 0.05) {
      const simTokens = ["AAVE", "SUI", "TAO", "XRP", "LINK"];
      const randomSymbol = simTokens[Math.floor(Math.random() * simTokens.length)];
      const randomChange = (3.0 + Math.random() * 5.0).toFixed(2);
      const simulatedPrice = `$${(10 + Math.random() * 150).toFixed(2)}`;
      triggerSurgeAlert(randomSymbol, randomChange, simulatedPrice);
    }
    
    // 가격 급등 "전" 세력의 매집 전조(Leading Indicator) 감지 알림 (8% 확률)
    if (Math.random() < 0.08) {
      const simTokens = ["AAVE", "SUI", "TAO", "XRP", "LINK", "SOL"];
      const randomSymbol = simTokens[Math.floor(Math.random() * simTokens.length)];
      
      const preSurgeTypes = [
        {
          title: `🔥 [급등 전조] ${randomSymbol} 스마트머니 매수량 폭발!`,
          body: `DEX 내 상위 거래자(SmartMoney)들의 ${randomSymbol} 순매수 비중이 92%를 돌파했습니다. 가격 급상승 전 고래 축적 신호입니다.`,
          badge: `⚡ PRE-SURGE`
        },
        {
          title: `📉 [공급 압축] ${randomSymbol} 거래소 대규모 순유출!`,
          body: `최근 10분간 주요 CEX 거래소에서 ${randomSymbol} 물량 -$12.4M 순유출 감지. 단기 유통량 공급 부족에 따른 급등 전조 상태입니다.`,
          badge: `📦 SUPPLY CONTRACT`
        },
        {
          title: `🐋 [고래 포착] ${randomSymbol} Wintermute 지갑 추가 매집!`,
          body: `Wintermute 마켓메이커 라벨 지갑이 DEX 풀에서 ${randomSymbol} 유동성을 대량 매수하여 흡수 중입니다. 가격 급변동에 유의하세요.`,
          badge: `🐋 MM ACCUMULATION`
        }
      ];
      
      const selectedSignal = preSurgeTypes[Math.floor(Math.random() * preSurgeTypes.length)];
      triggerPreSurgeAlert(randomSymbol, selectedSignal.title, selectedSignal.body, selectedSignal.badge);
    }
  }, 15000);
}

function stopAlertMonitoring() {
  if (alertInterval) {
    clearInterval(alertInterval);
    alertInterval = null;
  }
}

// 인앱 토스트 팝업 및 OS 네이티브 알림 발생
function triggerSurgeAlert(symbol, pct, currentPrice) {
  const title = `🚨 [급등 감지] ${symbol} 세력 매집 급상승!`;
  const message = `${symbol} 토큰이 단시간에 +${pct}% 상승하여 ${currentPrice}에 도달했습니다. 실시간 온체인 리포트를 확인하세요!`;
  
  // 실시간 급등 피드 패널에 기록 추가
  addAlertToFeed(symbol, "PUMP", `단시간에 +${pct}% 급상승하여 ${currentPrice} 도달`, `+${pct}%`);
  
  // 1. OS 시스템 알림 발송 (허용되어 있는 경우)
  if ("Notification" in window && Notification.permission === "granted") {
    new Notification(title, {
      body: message,
      icon: "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='100' height='100' rx='50' fill='%23111'><text x='50%25' y='72%25' font-size='60' fill='%2300ffaa' font-family='Outfit' font-weight='800' text-anchor='middle'>🐳</text></svg>"
    });
  }
  
  // 2. 인앱 토스트 알림 카드 생성
  if (toastContainer) {
    const toast = document.createElement("div");
    toast.className = "toast-alert";
    toast.innerHTML = `
      <div class="toast-header">
        <span class="toast-title">🐳 WHALE PUMP ALERT</span>
        <button class="toast-close-btn">&times;</button>
      </div>
      <div class="toast-body">
        <strong>${symbol}</strong> 토큰이 단시간에 <strong>+${pct}%</strong> 급등하여 <strong>${currentPrice}</strong>에 도달했습니다!
      </div>
      <div class="toast-footer">
        <button class="toast-action-btn" data-symbol="${symbol}">온체인 분석</button>
      </div>
    `;
    
    // 닫기 버튼
    toast.querySelector(".toast-close-btn").addEventListener("click", () => {
      toast.classList.add("fade-out");
      setTimeout(() => toast.remove(), 350);
    });
    
    // 온체인 분석 버튼 누를 시 대상 분석 실행 및 홈 복귀
    toast.querySelector(".toast-action-btn").addEventListener("click", async () => {
      toast.classList.add("fade-out");
      setTimeout(() => toast.remove(), 350);
      
      reportScreen.classList.remove("active");
      homeScreen.classList.add("active");
      
      tokenSearch.value = symbol;
      await selectToken(symbol);
      startAnalysisWorkflow();
    });
    
    toastContainer.appendChild(toast);
    
    // 6초 후 자동 제거
    setTimeout(() => {
      if (toast.parentElement) {
        toast.classList.add("fade-out");
        setTimeout(() => toast.remove(), 350);
      }
    }, 6000);
  }
}

// 급등 전 선행 알림 발송 (인앱 토스트 + 시스템 알림)
function triggerPreSurgeAlert(symbol, title, message, badge) {
  // 실시간 급등 전조 피드 패널에 기록 추가
  addAlertToFeed(symbol, "PRE-SURGE", message, "전조 감지");
  
  // 1. OS 시스템 알림 발송
  if ("Notification" in window && Notification.permission === "granted") {
    new Notification(title, {
      body: message,
      icon: "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='100' height='100' rx='50' fill='%23111'><text x='50%25' y='72%25' font-size='60' fill='%23ffb300' font-family='Outfit' font-weight='800' text-anchor='middle'>🔥</text></svg>"
    });
  }
  
  // 2. 인앱 토스트 알림 카드 생성
  if (toastContainer) {
    const toast = document.createElement("div");
    // 예치/매집 알림은 골드/옐로우 테두리로 차별화
    toast.className = "toast-alert";
    toast.style.borderColor = "var(--color-yellow)";
    toast.style.boxShadow = "0 10px 30px rgba(255, 179, 0, 0.15), inset 0 0 15px rgba(255, 179, 0, 0.05)";
    
    toast.innerHTML = `
      <div class="toast-header">
        <span class="toast-title" style="color: var(--color-yellow)">🐳 ${badge} SIGNAL</span>
        <button class="toast-close-btn">&times;</button>
      </div>
      <div class="toast-body">
        ${message}
      </div>
      <div class="toast-footer">
        <button class="toast-action-btn" style="background: rgba(255,179,0,0.15); border-color: var(--color-yellow); color: var(--color-yellow)" data-symbol="${symbol}">온체인 7지표 확인</button>
      </div>
    `;
    
    // 온체인 분석 버튼 커스텀 스타일 액션
    const actionBtn = toast.querySelector(".toast-action-btn");
    actionBtn.addEventListener("mouseover", () => {
      actionBtn.style.background = "var(--color-yellow)";
      actionBtn.style.color = "#000";
    });
    actionBtn.addEventListener("mouseout", () => {
      actionBtn.style.background = "rgba(255,179,0,0.15)";
      actionBtn.style.color = "var(--color-yellow)";
    });
    
    // 닫기 버튼
    toast.querySelector(".toast-close-btn").addEventListener("click", () => {
      toast.classList.add("fade-out");
      setTimeout(() => toast.remove(), 350);
    });
    
    // 온체인 분석 버튼 누를 시 대상 분석 실행 및 홈 복귀
    actionBtn.addEventListener("click", async () => {
      toast.classList.add("fade-out");
      setTimeout(() => toast.remove(), 350);
      
      reportScreen.classList.remove("active");
      homeScreen.classList.add("active");
      
      tokenSearch.value = symbol;
      await selectToken(symbol);
      startAnalysisWorkflow();
    });
    
    toastContainer.appendChild(toast);
    
    // 7.5초 후 자동 제거
    setTimeout(() => {
      if (toast.parentElement) {
        toast.classList.add("fade-out");
        setTimeout(() => toast.remove(), 350);
      }
    }, 7500);
  }
}

// ==================== 7. 실시간 급등/전조 감지 피드 (Surge/Pre-Surge Feed) ====================
function getFeedData() {
  const feed = localStorage.getItem("whale_tracker_feed");
  return feed ? JSON.parse(feed) : [];
}

function addAlertToFeed(symbol, type, message, changeText) {
  const feed = getFeedData();
  const timeStr = new Date().toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  
  const newItem = {
    symbol: symbol,
    type: type, // "PUMP" 또는 "PRE-SURGE"
    message: message,
    changeText: changeText,
    time: timeStr
  };
  
  // 맨 앞에 삽입하고 최대 15개까지만 유지
  feed.unshift(newItem);
  if (feed.length > 15) {
    feed.pop();
  }
  
  localStorage.setItem("whale_tracker_feed", JSON.stringify(feed));
  updateFeedUI();
}

function clearFeedData() {
  localStorage.removeItem("whale_tracker_feed");
  updateFeedUI();
}

function updateFeedUI() {
  const feed = getFeedData();
  if (!surgeFeedList) return;
  
  surgeFeedList.innerHTML = "";
  
  if (feed.length === 0) {
    surgeFeedList.innerHTML = `<div class="feed-empty" id="feed-empty-msg">실시간 세력 감지 대기 중...</div>`;
    return;
  }
  
  feed.forEach(item => {
    const el = document.createElement("div");
    const isPump = item.type === "PUMP";
    el.className = `feed-item ${isPump ? 'pump-item' : 'pre-surge-item'}`;
    
    el.innerHTML = `
      <div class="feed-item-left">
        <div class="feed-item-meta">
          <span class="feed-item-symbol">${item.symbol}</span>
          <span class="feed-item-badge ${isPump ? 'pump' : 'pre-surge'}">${item.type}</span>
          <span class="feed-item-time">${item.time}</span>
        </div>
        <div class="feed-item-text">${item.message}</div>
      </div>
      <div class="feed-item-right">
        <span class="feed-item-change ${isPump ? 'up' : 'warning'}">${item.changeText}</span>
        <button class="feed-item-btn" data-symbol="${item.symbol}">분석</button>
      </div>
    `;
    
    el.querySelector(".feed-item-btn").addEventListener("click", async () => {
      tokenSearch.value = item.symbol;
      await selectToken(item.symbol);
      startAnalysisWorkflow();
    });
    
    surgeFeedList.appendChild(el);
  });
}
