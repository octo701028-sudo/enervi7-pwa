/* app.js — Enervi 7 (PWA, single-file UI builder)
 * 特色：
 * - 14 題量表（S1~S7 七階、T1~T7 七個轉換）
 * - 一鍵計算：單一雷達圖（整合分數 vs 僅Q分數）、瓶頸摘要（Top 3）
 * - 關鍵字＋行動建議「恆常顯示」，並且將當日 Top 3 高亮
 * - localStorage 記錄最後一次作答
 * - 若網頁未載入 Chart.js，會自動以 CDN 動態載入
 */

/* -------------------- 基礎設定 -------------------- */
const DIMENSIONS = [
  "安住", "根基", "感受", "行動", "交流", "洞察", "願景"
];
// 七個轉換（對應維度以同序加權）
const TRANSITIONS = [
  "覺察→釋放", "釋放→信任", "信任→行動", "行動→流動", "流動→共鳴", "共鳴→整合", "整合→安住"
];

// 加權：整合分數 = Q + W_T * T（皆為 0–10）
const W_T = 0.6;

// 顏色
const COLORS = {
  brand: "#7a52f4",
  brandSoft: "rgba(122,82,244,0.25)",
  gray: "#a5a5a5",
  graySoft: "rgba(165,165,165,0.25)",
  chip: "#e9d9ff",
  chipText: "#3d2a7a"
};

/* -------------------- 行動建議（簡版字典，可自行擴充） -------------------- */
const SUGGESTIONS = {
  "安住": {
    keywords: ["穩住身心", "呼吸覺察", "回到當下"],
    actions: [
      "3 分鐘 4-4-6 腹式呼吸（吸4/停4/吐6）",
      "寫 3 句「此刻我真實的感受是…」",
      "建立『當下提示詞』，每次分心就默念一次"
    ]
  },
  "根基": {
    keywords: ["小步驟", "可驗證", "站穩今天"],
    actions: [
      "把目標拆成 10 分鐘內可完成的一步，立刻去做",
      "列出今日 3 件 MIT（最重要的事）",
      "完成一項後做 1 分鐘站姿掃描（腳-膝-骨盆）"
    ]
  },
  "感受": {
    keywords: ["共情", "溫柔看待", "情緒標記"],
    actions: [
      "把情緒寫成 1 句『我感到_____，因為_____』",
      "做 2 分鐘身體掃描，找到壓力點並放鬆",
      "挑 1 位信任對象傳遞近況（只要 1 段話）"
    ]
  },
  "行動": {
    keywords: ["節奏", "執行力", "回饋迭代"],
    actions: [
      "設 25 分鐘專注＋5 分鐘走動（1 回合）",
      "完成後寫 2 句學到什麼、下次怎麼做",
      "今天至少送出 1 個可被回覆的輸出（訊息/草稿）"
    ]
  },
  "交流": {
    keywords: ["公開回報", "請求回饋", "共創"],
    actions: [
      "把進度公開在『可信任小圈』並標記下一步",
      "發 1 個具體問題徵求回饋（限定 1 段）",
      "安排 10 分鐘同步，確認責任歸屬與時程"
    ]
  },
  "洞察": {
    keywords: ["模式辨識", "複盤", "假設驗證"],
    actions: [
      "列 1 條當日『反覆出現的念頭』並判斷是事實或解讀",
      "把今天做對/做錯各 1 件寫成要點",
      "設 1 個明日驗證點（如何知道更進步？）"
    ]
  },
  "願景": {
    keywords: ["北極星", "對齊", "有意義"],
    actions: [
      "把此刻任務對齊 1 句『為了什麼（Why）』",
      "把 1 週後可見的具體成品描述 2 句",
      "寫下『不做清單』，刪掉 1 件與願景無關的任務"
    ]
  }
};

/* -------------------- DOM 建構 -------------------- */
const $ = (sel, ctx = document) => ctx.querySelector(sel);
const $$ = (sel, ctx = document) => Array.from(ctx.querySelectorAll(sel));

function ensureRoot() {
  let root = document.getElementById("app");
  if (!root) {
    root = document.createElement("div");
    root.id = "app";
    document.body.innerHTML = ""; // 乾淨頁面
    document.body.appendChild(root);
  }
  return root;
}

function el(tag, attrs = {}, children = []) {
  const node = document.createElement(tag);
  Object.entries(attrs).forEach(([k, v]) => {
    if (k === "class") node.className = v;
    else if (k === "html") node.innerHTML = v;
    else node.setAttribute(k, v);
  });
  (Array.isArray(children) ? children : [children])
    .filter(Boolean)
    .forEach(c => node.appendChild(typeof c === "string" ? document.createTextNode(c) : c));
  return node;
}

/* -------------------- 載入 Chart.js（若不存在） -------------------- */
function loadChartIfNeeded() {
  return new Promise((resolve, reject) => {
    if (window.Chart) return resolve();
    const s = document.createElement("script");
    s.src = "https://cdn.jsdelivr.net/npm/chart.js";
    s.onload = () => resolve();
    s.onerror = () => reject(new Error("Chart.js 載入失敗"));
    document.head.appendChild(s);
  });
}

/* -------------------- UI 建置 -------------------- */
function buildUI() {
  const root = ensureRoot();

  const style = document.createElement("style");
  style.textContent = `
    :root {
      --brand: ${COLORS.brand};
      --brand-soft: ${COLORS.brandSoft};
      --gray: ${COLORS.gray};
      --chip: ${COLORS.chip};
      --chip-text: ${COLORS.chipText};
    }
    body { margin: 0; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", "PingFang TC", "Noto Sans TC", "Microsoft JhengHei", system-ui, sans-serif; background: #0f0f19; color: #f3f3f6; }
    .wrap { max-width: 940px; margin: 0 auto; padding: 16px 16px 72px; }
    .header { position: sticky; top: 0; z-index: 5; background: linear-gradient(180deg, var(--brand) 0%, rgba(122,82,244,0.45) 100%); padding: 14px 16px; font-weight: 700; font-size: 20px; border-bottom-left-radius: 14px; border-bottom-right-radius: 14px; }
    .card { background: #151525; border: 1px solid rgba(255,255,255,0.06); border-radius: 14px; padding: 16px; margin: 14px 0; }
    .title { font-size: 18px; font-weight: 700; margin-bottom: 8px; }
    .grid { display: grid; grid-template-columns: 1fr; gap: 12px; }
    @media (min-width: 720px){ .grid.two { grid-template-columns: 1fr 1fr; } }
    .row { display: grid; grid-template-columns: 84px 1fr 42px; gap: 10px; align-items: center; }
    .row label { color: #cfcfe8; font-size: 14px; }
    .row input[type="range"] { width: 100%; }
    .pill { display: inline-flex; align-items: center; gap: 6px; font-size: 12px; color: var(--chip-text); background: var(--chip); padding: 6px 10px; border-radius: 999px; margin-right: 8px; margin-bottom: 6px; }
    .btn { width: 100%; border: 0; padding: 14px; font-weight: 700; border-radius: 12px; color: white; background: var(--brand); cursor: pointer; }
    .muted { color: #a8a8bf; font-size: 13px; }
    canvas { max-width: 100%; }
    .hl { background: rgba(122,82,244,0.15); border: 1px solid rgba(122,82,244,0.35); }
    .chips { margin-top: 8px; }
    .subtitle { font-size: 15px; font-weight: 700; margin: 8px 0 6px; color: #dcdcf5; }
    .list { margin: 0; padding-left: 18px; }
  `;
  document.head.appendChild(style);

  root.innerHTML = "";
  const wrap = el("div", { class: "wrap" });

  wrap.appendChild(el("div", { class: "header" }, "Enervi 7"));

  // 問卷（14 題）
  const qCard = el("div", { class: "card" });
  qCard.appendChild(el("div", { class: "title" }, "今日量表（14 題）"));

  const form = el("div", { class: "grid" });

  // 生成 S1~S7
  const sValues = loadLocal("enervi_s", DIMENSIONS.map(() => 5));
  const tValues = loadLocal("enervi_t", TRANSITIONS.map(() => 5));

  DIMENSIONS.forEach((name, i) => {
    form.appendChild(makeSliderRow(`S${i + 1}`, name, sValues, i));
  });

  // 生成 T1~T7
  TRANSITIONS.forEach((name, i) => {
    form.appendChild(makeSliderRow(`T${i + 1}`, name, tValues, i, true));
  });

  qCard.appendChild(form);
  const btn = el("button", { class: "btn", id: "run" }, "✨ 開始測驗");
  qCard.appendChild(el("div", { style: "height:8px" }));
  qCard.appendChild(btn);
  wrap.appendChild(qCard);

  // 結果：雷達圖 + 瓶頸摘要
  const rCard = el("div", { class: "card" });
  rCard.appendChild(el("div", { class: "title" }, "雷達圖（七階整合）"));
  const canvas = el("canvas", { id: "chart", height: "320" });
  rCard.appendChild(canvas);
  rCard.appendChild(el("div", { class: "muted", html: "實線：整合分數（Q + 轉換加權）　/　虛線：僅 Q 分數" }));
  rCard.appendChild(el("div", { class: "subtitle" }, "瓶頸摘要（Top 3）"));
  const summary = el("div", { id: "summary" });
  rCard.appendChild(summary);
  wrap.appendChild(rCard);

  // 建議：恆常顯示
  const sCard = el("div", { class: "card" });
  sCard.appendChild(el("div", { class: "title" }, "七階關鍵字 × 行動建議（恆常顯示）"));
  const sugWrap = el("div", { id: "sugs" });
  sCard.appendChild(sugWrap);
  wrap.appendChild(sCard);

  document.body.appendChild(wrap);

  // 初始化建議區（先畫出所有，之後按結果高亮 Top 3）
  renderSuggestions(sugWrap, []);

  // 行為：計算 + 繪圖
  let chart;
  $("#run").addEventListener("click", async () => {
    saveLocal("enervi_s", sValues);
    saveLocal("enervi_t", tValues);

    await loadChartIfNeeded();

    const result = compute(sValues, tValues);
    // 繪圖
    chart = drawRadar(chart, $("#chart"), result);

    // 瓶頸摘要
    renderSummary(summary, result);

    // 高亮建議（Top 3）
    renderSuggestions(sugWrap, result.top3.map(x => x.name));
  });

  /* --- 小工具：產生 slider 列 --- */
  function makeSliderRow(id, label, arr, idx, isT = false) {
    const row = el("div", { class: "row" });
    row.appendChild(el("label", { for: id }, `${isT ? "T" : "S"}${idx + 1} ${label}`));

    const slider = el("input", { type: "range", min: "0", max: "10", step: "1", id });
    slider.value = arr[idx];
    const value = el("div", {}, String(arr[idx]));
    slider.addEventListener("input", () => {
      arr[idx] = Number(slider.value);
      value.textContent = slider.value;
    });

    row.appendChild(slider);
    row.appendChild(value);
    return row;
  }
}

/* -------------------- 計算邏輯 -------------------- */
function compute(sValues, tValues) {
  // 整合分數 = Q + W_T * T，限制 0–10
  const integrated = sValues.map((q, i) => clamp(q + W_T * tValues[i], 0, 10));

  // 平均與不平衡（與平均差距）
  const mean = integrated.reduce((a, b) => a + b, 0) / integrated.length;
  const diffs = integrated.map(v => v - mean);

  // 只留單一雷達：整合 vs 僅Q
  const data = {
    labels: DIMENSIONS,
    qOnly: sValues.slice(),
    integrated
  };

  // 取 Top 3 不足（最低整合分數，若同分再看負差距大者）
  const items = integrated.map((v, i) => ({
    name: DIMENSIONS[i],
    score: v,
    diff: diffs[i]
  }));
  items.sort((a, b) => a.score === b.score ? a.diff - b.diff : a.score - b.score);
  const top3 = items.slice(0, 3);

  // 找出「差距最大」的 3 組（和平均差最負）
  const byImbalance = items.slice().sort((a, b) => a.diff - b.diff).slice(0, 3);

  return { data, top3, byImbalance, mean: round1(mean) };
}

/* -------------------- 視覺：雷達圖 -------------------- */
function drawRadar(chart, canvas, result) {
  const { labels, qOnly, integrated } = result.data;

  if (chart) chart.destroy();
  return new Chart(canvas, {
    type: "radar",
    data: {
      labels,
      datasets: [
        {
          label: "整合分數",
          data: integrated,
          borderColor: COLORS.brand,
          backgroundColor: COLORS.brandSoft,
          borderWidth: 2,
          pointRadius: 2,
          pointBackgroundColor: COLORS.brand
        },
        {
          label: "僅 Q",
          data: qOnly,
          borderColor: COLORS.gray,
          backgroundColor: COLORS.graySoft,
          borderDash: [6, 6],
          borderWidth: 2,
          pointRadius: 0
        }
      ]
    },
    options: {
      responsive: true,
      scales: {
        r: {
          suggestedMin: 0,
          suggestedMax: 10,
          ticks: { showLabelBackdrop: false, color: "#a8a8bf", stepSize: 2 },
          grid: { color: "rgba(255,255,255,0.12)" },
          angleLines: { color: "rgba(255,255,255,0.12)" },
          pointLabels: { color: "#dcdcf5", font: { size: 12 } }
        }
      },
      plugins: {
        legend: {
          labels: { color: "#dcdcf5" }
        },
        tooltip: {
          callbacks: {
            label: (ctx) => `${ctx.dataset.label}: ${round1(ctx.parsed.r)}`
          }
        }
      }
    }
  });
}

/* -------------------- 渲染：摘要 + 建議 -------------------- */
function renderSummary(container, result) {
  const { top3, byImbalance, mean } = result;
  container.innerHTML = "";

  const focus = top3[0];
  container.appendChild(el("div", { class: "subtitle" }, `今日聚焦點：${focus.name}`));
  container.appendChild(el("div", { class: "card hl" }, [
    el("div", { class: "muted", html: `整合分數 <b>${round1(focus.score)}</b>（全體平均 ${mean}）` }),
  ]));

  container.appendChild(el("div", { class: "subtitle" }, "前 3 名瓶頸（最低整合分數）"));
  const ul1 = el("ul", { class: "list" });
  top3.forEach(i => {
    ul1.appendChild(el("li", {}, `${i.name}：${round1(i.score)}`));
  });
  container.appendChild(ul1);

  container.appendChild(el("div", { class: "subtitle" }, "差距最大（相對平均最不足）"));
  const ul2 = el("ul", { class: "list" });
  byImbalance.forEach(i => {
    ul2.appendChild(el("li", {}, `${i.name}：${i.diff < 0 ? "低於" : "高於"}平均 ${Math.abs(round1(i.diff))}`));
  });
  container.appendChild(ul2);
}

function renderSuggestions(container, highlightNames = []) {
  container.innerHTML = "";
  DIMENSIONS.forEach(name => {
    const box = el("div", { class: `card ${highlightNames.includes(name) ? "hl" : ""}` });
    box.appendChild(el("div", { class: "subtitle" }, name));

    // chips: keywords
    const chips = el("div", { class: "chips" });
    (SUGGESTIONS[name]?.keywords || []).forEach(k =>
      chips.appendChild(el("span", { class: "pill" }, k))
    );
    box.appendChild(chips);

    // actions
    const ul = el("ul", { class: "list" });
    (SUGGESTIONS[name]?.actions || []).forEach(a => {
      ul.appendChild(el("li", {}, a));
    });
    box.appendChild(ul);

    container.appendChild(box);
  });
}

/* -------------------- 儲存/載入 -------------------- */
function saveLocal(key, arr) {
  try { localStorage.setItem(key, JSON.stringify(arr)); } catch (_) {}
}
function loadLocal(key, fallback) {
  try {
    const v = JSON.parse(localStorage.getItem(key));
    if (Array.isArray(v) && v.length === fallback.length) return v.map(n => Number(n) || 0);
  } catch (_) {}
  return fallback;
}

/* -------------------- 小工具 -------------------- */
const clamp = (n, a, b) => Math.min(Math.max(n, a), b);
const round1 = (n) => Math.round(n * 10) / 10;

/* -------------------- 啟動 -------------------- */
document.addEventListener("DOMContentLoaded", buildUI);