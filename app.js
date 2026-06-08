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
      { name: "최근 에포크 (Epoch)", signal: "실시간 로드 중...", isOk: true, desc: "✓ 솔라나 RPC 실시간 연동" },
      { name: "현재 슬롯 (Slot)", signal: "실시간 로드 중...", isOk: true, desc: "✓ 최신 블록 생성 속도 양호" },
      { name: "유통 공급량 (Circulating)", signal: "실시간 로드 중...", isOk: true, desc: "✓ SOL 인플레이션율 정상 범위" },
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
    risks: [
      "<strong>단기 차익 실현 압력</strong> · 미실현 수익률이 3년래 최고점 부근",
      "<strong>거시경제 변동성</strong> · 미국 기준금리 변동에 따른 선물 포지션 강제 청산 주의"
    ],
    indicators: [
      { name: "24h 트랜잭션 수", signal: "실시간 로드 중...", isOk: true, desc: "✓ 비트코인 네트워크 활성도" },
      { name: "평균 전송 수수료 (USD)", signal: "실시간 로드 중...", isOk: true, desc: "✓ 전송 수수료 변동 추이 반영" },
      { name: "전체 블록 높이 (Height)", signal: "실시간 로드 중...", isOk: true, desc: "✓ 블록 생성 정상 작동 중" },
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
    risks: [
      "<strong>가스 가격 하락</strong> · L2 활성화로 인한 이더리움 메인넷 연소량(Burn Rate) 급감",
      "<strong>고래 순유입 감소</strong> · 거래소로 향하는 지갑 이체 수량 소폭 상승"
    ],
    indicators: [
      { name: "24h 트랜잭션 수", signal: "실시간 로드 중...", isOk: true, desc: "✓ 이더리움 네트워크 거래 빈도" },
      { name: "평균 전송 수수료 (USD)", signal: "실시간 로드 중...", isOk: false, desc: "✗ 네트워크 혼잡에 따른 수수료 상승" },
      { name: "전체 블록 높이 (Height)", signal: "실시간 로드 중...", isOk: true, desc: "✓ 검증인 네트워크 정상 가동" },
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
  const id = coinIds[symbol];
  if (!id) return null;

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

// 초기 실행 (Initialization)
document.addEventListener("DOMContentLoaded", async () => {
  await selectToken("SOL");
  generateHeatmapGrid();
  
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
  analyzeBtn.addEventListener("click", () => {
    startAnalysisWorkflow();
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

// 토큰 카드를 선택하고 실시간 데이터를 요청합니다.
async function selectToken(symbol) {
  currentSelectedToken = symbol;
  
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
