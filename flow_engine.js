/**
 * flow_engine.js — 실제 거래 체결 기반 고래 주문 흐름 엔진
 *
 * 이 파일이 존재하는 이유:
 * 기존 app.js의 "고래 유입 +$497.1k", "순플로우 +$2.4B", "37개 지갑" 같은 수치는
 * 전부 fallbackDatabase에 박아둔 고정 문자열이었다. 계산하는 코드가 없었다.
 * 지갑 단위 온체인 플로우를 주는 무료·무키 API는 사실상 없다
 * (Arkham·Nansen 유료, Blockchair는 대형거래 질의에 430, 솔라나 공용 RPC는 브라우저에서 403).
 *
 * 대신 **실제로 검증 가능한 것**만 계산한다: 거래소 체결 원장의 대형 주문.
 * 지갑 주소는 알 수 없지만 "$100k 이상 단일 체결이 매수였나 매도였나"는
 * 공개 API로 정확히 알 수 있고, 이건 지어낸 값이 아니다.
 *
 * 용어 주의 — 이건 **온체인 지갑 이동이 아니라 거래소 주문 흐름**이다.
 * UI에도 그렇게 표기해야 한다. 둘을 섞어 부르면 그게 곧 거짓말이 된다.
 *
 * 무키(no API key) 소스만 쓴다:
 *   - Binance aggTrades : 집계 체결. m=true면 매수자가 메이커 = 테이커가 매도.
 *   - Bybit recent-trade : 바이낸스 차단 시 대체.
 */
(function (global) {
    "use strict";

    // 고래로 칠 단일 체결 금액. 코인마다 유동성이 달라 하나로 못 잡는다.
    // BTC/ETH는 체결이 크고, 알트는 같은 기준을 쓰면 아무것도 안 잡힌다.
    var WHALE_USD = {
        BTC: 100000,
        ETH: 50000,
        SOL: 25000,
        _default: 10000
    };

    function whaleCut(symbol) {
        return WHALE_USD[symbol] !== undefined ? WHALE_USD[symbol] : WHALE_USD._default;
    }

    function num(v) {
        var n = parseFloat(v);
        return isFinite(n) ? n : 0;
    }

    function withTimeout(url, ms) {
        var ctrl = new AbortController();
        var id = setTimeout(function () { ctrl.abort(); }, ms || 4000);
        return fetch(url, { signal: ctrl.signal })
            .then(function (r) {
                clearTimeout(id);
                if (!r.ok) throw new Error("HTTP " + r.status);
                return r.json();
            })
            .catch(function (e) { clearTimeout(id); throw e; });
    }

    /**
     * 체결 배열을 공통 형태로 정규화한다.
     * @returns [{usd, side:"BUY"|"SELL", time}]
     */
    function fromBinance(raw) {
        if (!Array.isArray(raw)) return [];
        return raw.map(function (t) {
            var usd = num(t.p) * num(t.q);
            // m = "매수자가 메이커였는가". 참이면 능동적으로 판 쪽이 테이커다.
            return { usd: usd, side: t.m ? "SELL" : "BUY", time: t.T };
        });
    }

    function fromBybit(raw) {
        var list = raw && raw.result && raw.result.list;
        if (!Array.isArray(list)) return [];
        return list.map(function (t) {
            // Bybit side는 테이커 기준이라 그대로 쓴다.
            return {
                usd: num(t.price) * num(t.size),
                side: String(t.side).toUpperCase() === "SELL" ? "SELL" : "BUY",
                time: num(t.time)
            };
        });
    }

    /** 체결 목록을 받아 매수·매도 압력과 대형 주문을 집계한다. */
    function summarize(trades, symbol) {
        if (!trades.length) return null;
        var cut = whaleCut(symbol);
        var buyUsd = 0, sellUsd = 0, whales = [];

        for (var i = 0; i < trades.length; i++) {
            var t = trades[i];
            if (!(t.usd > 0)) continue;
            if (t.side === "BUY") buyUsd += t.usd; else sellUsd += t.usd;
            if (t.usd >= cut) whales.push(t);
        }

        var total = buyUsd + sellUsd;
        if (!(total > 0)) return null;

        var times = trades.map(function (t) { return t.time; }).filter(function (x) { return x > 0; });
        var spanSec = times.length >= 2 ? Math.round((Math.max.apply(null, times) - Math.min.apply(null, times)) / 1000) : 0;

        var whaleBuy = 0, whaleSell = 0;
        whales.forEach(function (w) {
            if (w.side === "BUY") whaleBuy += w.usd; else whaleSell += w.usd;
        });

        return {
            // 전체 체결 기준
            buyUsd: buyUsd,
            sellUsd: sellUsd,
            netUsd: buyUsd - sellUsd,
            // -100 ~ +100. 양수면 테이커 매수 우위.
            pressurePct: Math.round(((buyUsd - sellUsd) / total) * 1000) / 10,
            tradeCount: trades.length,
            windowSec: spanSec,
            // 대형 주문만 따로
            whaleCutUsd: cut,
            whaleCount: whales.length,
            whaleBuyUsd: whaleBuy,
            whaleSellUsd: whaleSell,
            whaleNetUsd: whaleBuy - whaleSell,
            biggest: whales.slice().sort(function (a, b) { return b.usd - a.usd; }).slice(0, 5)
        };
    }

    /**
     * 호가창 불균형. 체결(과거)과 달리 지금 걸려 있는 물량(현재)을 본다.
     * 매수벽이 두꺼우면 하방 지지, 매도벽이 두꺼우면 상방 저항이다.
     */
    function summarizeBook(book) {
        if (!book || !Array.isArray(book.bids) || !Array.isArray(book.asks)) return null;
        var bid = 0, ask = 0;
        book.bids.forEach(function (b) { bid += num(b[0]) * num(b[1]); });
        book.asks.forEach(function (a) { ask += num(a[0]) * num(a[1]); });
        var total = bid + ask;
        if (!(total > 0)) return null;
        return {
            bidUsd: bid,
            askUsd: ask,
            imbalancePct: Math.round(((bid - ask) / total) * 1000) / 10
        };
    }

    var FlowEngine = {
        VERSION: "1.0.0",
        WHALE_USD: WHALE_USD,
        whaleCut: whaleCut,
        summarize: summarize,
        summarizeBook: summarizeBook,
        fromBinance: fromBinance,
        fromBybit: fromBybit,

        /**
         * 실제 체결을 받아 고래 주문 흐름을 낸다.
         * 실패하면 null — 절대 지어내지 않는다. 호출부가 "데이터 없음"을 표시해야 한다.
         */
        fetchFlow: function (symbol) {
            var pair = symbol + "USDT";
            return withTimeout("https://api.binance.com/api/v3/aggTrades?symbol=" + pair + "&limit=1000", 4000)
                .then(function (raw) { return summarize(fromBinance(raw), symbol); })
                .catch(function () {
                    // 바이낸스가 막히거나 미상장이면 바이비트로 넘어간다.
                    return withTimeout("https://api.bybit.com/v5/market/recent-trade?category=spot&symbol=" + pair + "&limit=1000", 4000)
                        .then(function (raw) { return summarize(fromBybit(raw), symbol); })
                        .catch(function () { return null; });
                });
        },

        /** 호가창 불균형. 실패 시 null. */
        fetchBook: function (symbol) {
            return withTimeout("https://api.binance.com/api/v3/depth?symbol=" + symbol + "USDT&limit=100", 4000)
                .then(summarizeBook)
                .catch(function () { return null; });
        }
    };

    global.FlowEngine = FlowEngine;
    if (typeof module !== "undefined" && module.exports) module.exports = FlowEngine;
})(typeof window !== "undefined" ? window : globalThis);
