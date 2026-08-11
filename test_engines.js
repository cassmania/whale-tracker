/**
 * test_engines.js — flow_engine / chain_engine 검증
 *
 * 계산 로직은 고정 입력으로, 네트워크는 실제 호출로 확인한다.
 * 실행: node test_engines.js
 */
const assert = require("assert");
const FE = require("./flow_engine.js");
const CE = require("./chain_engine.js");

let 통과 = 0, 실패 = 0;
function 검증(이름, fn) {
    try { fn(); console.log("  OK  " + 이름); 통과++; }
    catch (e) { console.log("  X   " + 이름 + "\n      " + e.message); 실패++; }
}
async function 검증비동기(이름, fn) {
    try { await fn(); console.log("  OK  " + 이름); 통과++; }
    catch (e) { console.log("  X   " + 이름 + "\n      " + e.message); 실패++; }
}

console.log("\n[1] 체결 방향 판정");

// 바이낸스 m 플래그는 "매수자가 메이커였는가"다.
// m=true면 능동적으로 판 쪽(테이커)이 매도자다. 이걸 뒤집으면 매수·매도가 통째로 반대가 된다.
검증("m=true는 테이커 매도", () => {
    const r = FE.fromBinance([{ p: "100", q: "1", m: true, T: 1 }]);
    assert.strictEqual(r[0].side, "SELL");
});

검증("m=false는 테이커 매수", () => {
    const r = FE.fromBinance([{ p: "100", q: "1", m: false, T: 1 }]);
    assert.strictEqual(r[0].side, "BUY");
});

검증("바이비트 side는 그대로 테이커 기준", () => {
    const r = FE.fromBybit({ result: { list: [
        { price: "100", size: "1", side: "Sell", time: "1" },
        { price: "100", size: "2", side: "Buy", time: "2" }
    ] } });
    assert.strictEqual(r[0].side, "SELL");
    assert.strictEqual(r[1].side, "BUY");
});

console.log("\n[2] 집계");

검증("매수·매도 압력 계산", () => {
    const s = FE.summarize([
        { usd: 300, side: "BUY", time: 1000 },
        { usd: 100, side: "SELL", time: 2000 }
    ], "BTC");
    assert.strictEqual(s.buyUsd, 300);
    assert.strictEqual(s.sellUsd, 100);
    assert.strictEqual(s.netUsd, 200);
    assert.strictEqual(s.pressurePct, 50);   // (300-100)/400 = +50%
});

검증("고래 기준 미만은 대형 체결로 안 센다", () => {
    const s = FE.summarize([
        { usd: 99999, side: "BUY", time: 1 },
        { usd: 100001, side: "BUY", time: 2 }
    ], "BTC");   // BTC 기준 $100,000
    assert.strictEqual(s.whaleCount, 1);
    assert.strictEqual(s.whaleBuyUsd, 100001);
});

검증("코인별 고래 기준이 다르다", () => {
    assert.strictEqual(FE.whaleCut("BTC"), 100000);
    assert.strictEqual(FE.whaleCut("SOL"), 25000);
    // 표에 없는 코인은 기본값. 알트에 BTC 기준을 쓰면 아무것도 안 잡힌다.
    assert.strictEqual(FE.whaleCut("PEPE"), 10000);
});

검증("빈 입력이면 null (지어내지 않는다)", () => {
    assert.strictEqual(FE.summarize([], "BTC"), null);
});

검증("금액이 전부 0이면 null", () => {
    assert.strictEqual(FE.summarize([{ usd: 0, side: "BUY", time: 1 }], "BTC"), null);
});

검증("관측 구간(초)을 실제 타임스탬프에서 뽑는다", () => {
    const s = FE.summarize([
        { usd: 10, side: "BUY", time: 1000 },
        { usd: 10, side: "BUY", time: 61000 }
    ], "BTC");
    assert.strictEqual(s.windowSec, 60);
});

console.log("\n[3] 호가 불균형");

검증("매수벽이 두꺼우면 양수", () => {
    const b = FE.summarizeBook({ bids: [["100", "3"]], asks: [["101", "1"]] });
    assert.ok(b.imbalancePct > 0, "매수 우위여야 함");
});

검증("호가가 없으면 null", () => {
    assert.strictEqual(FE.summarizeBook(null), null);
    assert.strictEqual(FE.summarizeBook({ bids: [], asks: [] }), null);
});

console.log("\n[4] 실제 네트워크 (무키 소스)");

(async () => {
    await 검증비동기("BTC 온체인 실측 수신", async () => {
        const r = await CE.fetchBTC();
        assert.ok(r, "BTC 온체인이 null");
        assert.ok(Object.keys(r).length > 0, "빈 객체");
    });

    await 검증비동기("SOL 에포크가 현실적인 값", async () => {
        const r = await CE.fetchSOL();
        assert.ok(r, "SOL이 null — publicnode 응답 확인 필요");
        const epoch = parseInt(String(r["최근 에포크 (Epoch)"]), 10);
        // 2024년 상수(584)를 그대로 쓰던 회귀를 막는다. 2026년 기준 900을 넘는다.
        assert.ok(epoch > 900, `에포크 ${epoch} — 옛 상수로 회귀했을 수 있음`);
    });

    await 검증비동기("BTC 주문 흐름 실측 수신", async () => {
        const f = await FE.fetchFlow("BTC");
        assert.ok(f, "주문 흐름이 null");
        assert.ok(f.tradeCount > 0, "체결 수 0");
        assert.ok(f.pressurePct >= -100 && f.pressurePct <= 100, "압력 범위 이탈");
    });

    await 검증비동기("미상장 심볼은 null (가짜 값 금지)", async () => {
        const f = await FE.fetchFlow("NOTAREALCOIN123");
        assert.strictEqual(f, null, "없는 코인에 값이 나왔다");
    });

    console.log("\n총 " + (통과 + 실패) + "개 중 " + 통과 + "개 통과"
        + (실패 ? " / " + 실패 + "개 실패" : ""));
    process.exit(실패 ? 1 : 0);
})();
