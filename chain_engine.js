/**
 * chain_engine.js — 무키(no API key) 온체인 네트워크 지표
 *
 * 기존 app.js는 Blockchair 하나에 의존했는데 지금 IP 블랙리스트(HTTP 430)에 걸려
 * BTC·ETH 온체인 지표가 통째로 죽는다. 솔라나는 공용 RPC가 브라우저 요청에 403이라
 * 애초에 한 번도 성공한 적이 없다(그런데도 화면에는 "솔라나 RPC 실시간 연동"이 떠 있었다).
 *
 * 여기서는 **키 없이 브라우저에서 실제로 응답하는 것만** 쓴다.
 * 실측(2026-08-12): mempool.space 200, blockchain.info 200, Blockchair 430, 솔라나 RPC 403.
 *
 * 원칙: 못 받으면 null을 반환한다. 옛날 상수로 메우지 않는다.
 * 화면에 "실시간"이라 쓰려면 실제로 지금 받아온 값이어야 한다.
 */
(function (global) {
    "use strict";

    function withTimeout(url, ms, opt) {
        var ctrl = new AbortController();
        var id = setTimeout(function () { ctrl.abort(); }, ms || 4000);
        var o = opt || {};
        o.signal = ctrl.signal;
        return fetch(url, o)
            .then(function (r) {
                clearTimeout(id);
                if (!r.ok) throw new Error("HTTP " + r.status);
                return r;
            })
            .catch(function (e) { clearTimeout(id); throw e; });
    }

    function json(url, ms) { return withTimeout(url, ms).then(function (r) { return r.json(); }); }
    function text(url, ms) { return withTimeout(url, ms).then(function (r) { return r.text(); }); }

    function fmtNum(n) {
        return Number(n).toLocaleString("ko-KR");
    }

    var ChainEngine = {
        VERSION: "1.0.0",

        /**
         * 비트코인 네트워크 실측 지표.
         * mempool.space + blockchain.info 둘 다 무키로 열려 있다.
         * 하나만 성공해도 그만큼은 진짜 값이라 부분 반환한다.
         */
        fetchBTC: function () {
            return Promise.all([
                json("https://mempool.space/api/blocks/tip/height").catch(function () { return null; }),
                json("https://mempool.space/api/mempool").catch(function () { return null; }),
                json("https://mempool.space/api/v1/fees/recommended").catch(function () { return null; }),
                json("https://api.blockchain.info/stats?cors=true").catch(function () { return null; })
            ]).then(function (r) {
                var height = r[0], mem = r[1], fees = r[2], stats = r[3];
                if (height === null && !mem && !fees && !stats) return null;

                var out = {};
                if (height !== null && isFinite(height)) {
                    out["블록 높이 (Height)"] = fmtNum(height);
                }
                if (stats && isFinite(stats.n_tx)) {
                    out["24h 트랜잭션 수"] = fmtNum(stats.n_tx) + "건";
                }
                if (fees && isFinite(fees.fastestFee)) {
                    out["권장 수수료 (sat/vB)"] = fees.fastestFee + " (빠름) / " + fees.hourFee + " (1시간)";
                }
                if (mem && isFinite(mem.count)) {
                    out["대기 트랜잭션 (Mempool)"] = fmtNum(mem.count) + "건";
                }
                if (stats && isFinite(stats.estimated_transaction_volume_usd)) {
                    out["24h 추정 전송액"] = "$" + fmtNum(Math.round(stats.estimated_transaction_volume_usd));
                }
                return Object.keys(out).length ? out : null;
            }).catch(function () { return null; });
        },

        /**
         * 이더리움. 무키로 쓸 수 있는 게 비트코인보다 훨씬 적다.
         *
         * Etherscan V1(`api.etherscan.io/api?module=stats`)은 폐기됐다 — 키를 넣어도
         * `"You are using a deprecated V1 endpoint"`만 돌아온다(실측 2026-08-12).
         * V2는 키가 필수라 무키 원칙에 안 맞는다.
         *
         * 대신 공개 이더리움 RPC로 직접 물어본다. 블록 번호와 가스 가격은
         * 표준 JSON-RPC라 키 없이도 답한다.
         */
        fetchETH: function () {
            var endpoints = [
                "https://ethereum-rpc.publicnode.com",
                "https://eth.llamarpc.com"
            ];
            var body = JSON.stringify([
                { jsonrpc: "2.0", id: 1, method: "eth_blockNumber", params: [] },
                { jsonrpc: "2.0", id: 2, method: "eth_gasPrice", params: [] }
            ]);

            var tryOne = function (i) {
                if (i >= endpoints.length) return Promise.resolve(null);
                return withTimeout(endpoints[i], 5000, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: body
                })
                    .then(function (r) { return r.json(); })
                    .then(function (res) {
                        if (!Array.isArray(res)) return tryOne(i + 1);
                        var bn = res.find(function (x) { return x && x.id === 1; });
                        var gp = res.find(function (x) { return x && x.id === 2; });
                        var out = {};

                        if (bn && bn.result) {
                            var height = parseInt(bn.result, 16);
                            if (isFinite(height)) out["블록 높이 (Height)"] = fmtNum(height);
                        }
                        if (gp && gp.result) {
                            var wei = parseInt(gp.result, 16);
                            // 1 Gwei = 1e9 wei. 사용자가 아는 단위로 바꾼다.
                            if (isFinite(wei)) out["가스 가격 (Gas)"] = (wei / 1e9).toFixed(2) + " Gwei";
                        }
                        return Object.keys(out).length ? out : tryOne(i + 1);
                    })
                    .catch(function () { return tryOne(i + 1); });
            };

            return tryOne(0);
        },

        /**
         * 솔라나. 공용 RPC(api.mainnet-beta.solana.com)는 브라우저에서 403을 준다 —
         * 기존 코드가 이 주소만 보고 있어서 SOL 온체인은 한 번도 성공한 적이 없다.
         * 그런데도 화면에는 2024년 상수(에포크 584)가 "실시간 연동"으로 떠 있었다.
         *
         * publicnode는 무키로 열려 있다(실측 2026-08-12: 에포크 1015 정상 수신).
         * ankr는 키를 요구해서(403 "API key is not allowed") 뺐다.
         * 전부 실패하면 null이다. null이면 "데이터 없음"을 띄워야지 옛 상수를 쓰면 안 된다.
         */
        fetchSOL: function () {
            var endpoints = [
                "https://solana-rpc.publicnode.com"
            ];

            // 두 호출을 **따로** 보낸다. 한 배치에 묶으면 안 된다.
            //
            // getSupply는 전 계정을 훑어서 12초쯤 걸린다(실측 12,295ms).
            // getEpochInfo는 51ms다. 배치로 묶으면 느린 쪽이 응답을 붙들고 있어
            // 타임아웃이 배치 전체를 취소해버린다 — 그래서 빠르게 받을 수 있는
            // 에포크·슬롯까지 통째로 날아가고 SOL이 항상 null이 됐다.
            var rpc = function (url, payload, ms) {
                return withTimeout(url, ms, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(payload)
                }).then(function (r) { return r.json(); });
            };

            var tryOne = function (i) {
                if (i >= endpoints.length) return Promise.resolve(null);
                var url = endpoints[i];

                return rpc(url, { jsonrpc: "2.0", id: 1, method: "getEpochInfo" }, 5000)
                    .then(function (res) {
                        var epoch = res && res.result;
                        if (!epoch || !isFinite(epoch.epoch)) return tryOne(i + 1);

                        var out = {};
                        out["최근 에포크 (Epoch)"] = epoch.epoch
                            + " (" + Math.floor((epoch.slotIndex / epoch.slotsInEpoch) * 100) + "% 진행)";
                        out["현재 슬롯 (Slot)"] = fmtNum(epoch.absoluteSlot || 0);

                        // 공급량은 느려서 따로, 넉넉한 타임아웃으로 받는다.
                        // 실패해도 에포크·슬롯은 이미 확보했으므로 그대로 반환한다.
                        return rpc(url, {
                            jsonrpc: "2.0", id: 2, method: "getSupply",
                            params: [{ excludeNonCirculatingAccountsList: true }]
                        }, 15000).then(function (sp) {
                            var supply = sp && sp.result && sp.result.value;
                            if (supply && isFinite(supply.circulating)) {
                                out["유통 공급량 (Circulating)"] =
                                    (supply.circulating / 1e9 / 1e6).toFixed(1) + "M SOL";
                            }
                            return out;
                        }).catch(function () { return out; });
                    })
                    .catch(function () { return tryOne(i + 1); });
            };

            return tryOne(0);
        },

        /** 심볼에 맞는 온체인 지표. 지원하지 않거나 실패하면 null. */
        fetch: function (symbol) {
            if (symbol === "BTC") return ChainEngine.fetchBTC();
            if (symbol === "ETH") return ChainEngine.fetchETH();
            if (symbol === "SOL") return ChainEngine.fetchSOL();
            return Promise.resolve(null);
        }
    };

    global.ChainEngine = ChainEngine;
    if (typeof module !== "undefined" && module.exports) module.exports = ChainEngine;
})(typeof window !== "undefined" ? window : globalThis);
