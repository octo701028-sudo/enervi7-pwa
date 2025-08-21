/* =========================================================
 * Enervi 7 — PWA 單檔版 app.js
 * 功能：
 *  - 14 題（0–10）→ 計算七階（每階 2 題平均）
 *  - 顯示雷達圖、分數表、瓶頸摘要（落後前三）
 *  - 下方恆常顯示「七階關鍵字 × 行動建議」
 *  - localStorage 記住上次作答
 *  - 僅依賴 Chart.js（已在 index.html 引入）
 * ========================================================= */

(() => {
  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));

  // ─────────────────────────────────────────────────────────
  // 基本資料：七階名稱 & 顏色
  // ─────────────────────────────────────────────────────────
  const DIMENSIONS = [
    { key: "S1", label: "安住" },
    { key: "S2", label: "根基" },
    { key: "S3", label: "感受" },
    { key: "S4", label: "行動" },
    { key: "S5", label: "交流" },
    { key: "S6", label: "洞察" },
    { key: "S7", label: "願景" },
  ];

  // 每個維度 2 題，共 14 題
  // 題目敘述盡量具體，讓使用者知道自己在評量什麼
  const QUESTIONS = [
    // S1 安住
    { dim: "S1", text: "我能分辨此刻的情緒、念頭與身體感受。" },
    { dim: "S1", text: "當我覺察到壓力或情緒時，能有效放鬆與代謝。" },

    // S2 根基
    { dim: "S2", text: "我對生活與未來有信任與安全感。" },
    { dim: "S2", text: "我能把想法拆解為可執行的小步驟並開始行動。" },

    // S3 感受
    { dim: "S3", text: "我能接納與表達感受，不壓抑也不過度反應。" },
    { dim: "S3", text: "當情緒波動時，我能在短時間內回到穩定狀態。" },

    // S4 行動
    { dim: "S4", text: "我能維持專注並遵循節奏，穩定推進任務。" },
    { dim: "S4", text: "我能清楚定義今日 3 個最重要任務（MIT）。" },

    // S5 交流
    { dim: "S5", text: "我能清楚表達需求並進行有效溝通。" },
    { dim: "S5", text: "我願意公開回報進度，並向可信任對象尋求回饋。" },

    // S6 洞察
    { dim: "S6", text: "我能看見模式與盲點，將經驗轉為可重複的方法。" },
    { dim: "S6", text: "面對卡關時，我能快速找到關鍵假設並驗證。" },

    // S7 願景
    { dim: "S7", text: "我清楚看見當下的方向與長程願景之關聯。" },
    { dim: "S7", text: "我能在變動中調整路線，仍保持前進與意義感。" },
  ];

  // 七階關鍵字 + 行動建議（精簡但可落地）
  const ACTION_BANK = {
    S1: {
      title: "安住 Awareness",
      keywords: "覺知當下、分辨情緒、看見模式、真實面對",
      actions: [
        "寫三句「此刻我真實的感受是…」。",
        "3 分鐘 4-4-6 腹式呼吸（含身體掃描）。",
        "列出 1 個反覆出現的念頭，標註它是『事實』或『解讀』。"
      ],
    },
    S2: {
      title: "根基 Ground",
      keywords: "邊界、節奏、結構、優先順序",
      actions: [
        "把目標拆成 10 分鐘可完成的一步，現在就做。",
        "設定今天 3 個 MIT（最重要任務）。",
        "每 50 分鐘休息 10 分鐘（番茄鐘 5 回合）。"
      ],
    },
    S3: {
      title: "感受 Emotion",
      keywords: "接納、流動、調節、韌性",
      actions: [
        "做 6 次深呼吸；吐氣時延長 2 秒並放鬆肩頸。",
        "以『我感到…因為…』寫下 3 句感受句。",
        "安排 15 分鐘身體移動（走路／伸展）。"
      ],
    },
    S4: {
      title: "行動 Action",
      keywords: "最小步驟、可驗證、節奏、執行力",
      actions: [
        "將一件任務拆成最小可交付成果（10–20 分鐘）。",
        "今天完成 1 次『公開回報』給同伴。",
        "使用『先做再修』原則，避免過度完美。"
      ],
    },
    S5: {
      title: "交流 Connection",
      keywords: "表達、回饋、請求、協作",
      actions: [
        "向一位對象提出清楚請求（內容＋期限）。",
        "邀請 1 次具體回饋（『哪裡有效？哪裡可更好？』）。",
        "把成果以 3 句話對外說清楚。"
      ],
    },
    S6: {
      title: "洞察 Insight",
      keywords: "映照、抽象化、SOP、實驗",
      actions: [
        "把剛完成的步驟寫成 3 條 SOP。",
        "提出 1 個關鍵假設並在今天驗證。",
        "把『卡關原因』列 3 點，挑 1 點實驗。"
      ],
    },
    S7: {
      title: "願景 Vision",
      keywords: "意義、方向、聚焦、對齊",
      actions: [
        "寫 3 句『這件事對我的意義是…』。",
        "檢視今日安排：是否對齊 1 個中長程目標？",
        "把願景轉成本週 1 件可驗證的里程碑。"
      ],
    },
  };

  // 題目與維度索引關係：每階兩題
  const DIM_TO_INDEXES = DIMENSIONS.reduce((acc, d) => {
    acc[d.key] = [];
    return acc;
  }, {});
  QUESTIONS.forEach((q, i) => DIM_TO_INDEXES[q.dim].push(i));

  // ─────────────────────────────────────────────────────────
  // 狀態
  // ─────────────────────────────────────────────────────────
  const LS_KEY = "enervi7_answers_v1";
  let answers = loadAnswers() || QUESTIONS.map(() => 5); // 預設 5 分中間值
  let chart; // Chart.js 實例

  function loadAnswers() {
    try {
      const raw = localStorage.getItem(LS_KEY);
      if (!raw) return null;
      const arr = JSON.parse(raw);
      if (Array.isArray(arr) && arr.length === QUESTIONS.length) return arr;
      return null;
    } catch {
      return null;
    }
  }
  function saveAnswers() {
    localStorage.setItem(LS_KEY, JSON.stringify(answers));
  }

  // ─────────────────────────────────────────────────────────
  // 計算：七階分數、瓶頸前三
  // ─────────────────────────────────────────────────────────
  function calcDimensionScores(ans) {
    // 各維度 = 同維度兩題平均（0–10）
    return DIMENSIONS.map(d => {
      const idxs = DIM_TO_INDEXES[d.key];
      const avg =
        (ans[idxs[0]] + ans[idxs[1]]) / 2;
      return Number(avg.toFixed(2));
    });
  }

  function top3Deficits(dimScores) {
    // 以「低於全體平均」的差值排序，取前三
    const mean = dimScores.reduce((a, b) => a + b, 0) / dimScores.length;
    const gaps = dimScores.map((v, i) => ({
      idx: i,
      label: DIMENSIONS[i].label,
      score: v,
      gap: v - mean, // 負值代表落後
    }));
    const sorted = gaps.sort((a, b) => a.gap - b.gap);
    // 只取落後的（gap<0），最多 3 個
    return sorted.filter(x => x.gap < 0).slice(0, 3);
  }

  // ─────────────────────────────────────────────────────────
  // UI：產生整個頁面
  // ─────────────────────────────────────────────────────────
  function render() {
    const app = $("#app");
    app.innerHTML = `
      <h1>Enervi 7</h1>

      <section class="card" id="qSection">
        <h2>今日能量測驗（14 題）</h2>
        <p style="opacity:.8;margin-top:-6px">請以 0–10 分評估「此刻的你」。</p>
        <div id="questionList"></div>
        <button id="btnRun">✨ 開始測驗</button>
      </section>

      <section class="card" id="resultSection" style="display:none">
        <h2>雷達圖（七階整合）</h2>
        <canvas id="radarChart" height="240"></canvas>
        <div id="scoreTable"></div>
        <div class="advice" id="bottleneckBox"></div>
      </section>

      <section class="card">
        <h2>七階關鍵字 × 行動建議</h2>
        <div id="adviceList"></div>
      </section>
    `;

    // 題目區
    const qWrap = $("#questionList");
    QUESTIONS.forEach((q, i) => {
      const dimLabel = DIMENSIONS.find(d => d.key === q.dim)?.label || "";
      const row = document.createElement("div");
      row.className = "question";
      row.innerHTML = `
        <div style="display:flex;justify-content:space-between;gap:8px;">
          <div style="opacity:.9">Q${i + 1}．${q.text} <span style="opacity:.6">（${dimLabel}）</span></div>
          <div style="min-width:28px;text-align:right" id="val-${i}">${answers[i]}</div>
        </div>
        <input type="range" min="0" max="10" step="1" value="${answers[i]}" id="rng-${i}" />
      `;
      qWrap.appendChild(row);
      $("#rng-" + i).addEventListener("input", (e) => {
        const v = Number(e.target.value);
        answers[i] = v;
        $("#val-" + i).textContent = v;
        saveAnswers();
      });
    });

    // 行動建議恆常顯示
    const advWrap = $("#adviceList");
    DIMENSIONS.forEach((d) => {
      const conf = ACTION_BANK[d.key];
      const box = document.createElement("div");
      box.className = "advice";
      box.innerHTML = `
        <div style="font-weight:700;margin-bottom:6px">${d.label}｜${conf.title}</div>
        <div style="opacity:.8;margin-bottom:6px">關鍵字：${conf.keywords}</div>
        <ul style="margin:0 0 0 18px;padding:0;">
          ${conf.actions.map(a => `<li>${a}</li>`).join("")}
        </ul>
      `;
      advWrap.appendChild(box);
    });

    // 事件：開始測驗
    $("#btnRun").addEventListener("click", () => {
      runAssessment();
      // 滑到結果區
      setTimeout(() => {
        $("#resultSection").scrollIntoView({ behavior: "smooth", block: "start" });
      }, 0);
    });

    // 若有舊答案則自動產生一次結果（體驗更順）
    if (loadAnswers()) runAssessment();
  }

  // ─────────────────────────────────────────────────────────
  // 產生結果：雷達圖 + 分數表 + 瓶頸摘要
  // ─────────────────────────────────────────────────────────
  function runAssessment() {
    const dimScores = calcDimensionScores(answers);
    renderChart(dimScores);
    renderScores(dimScores);
    renderBottlenecks(dimScores);
    $("#resultSection").style.display = "";
  }

  function renderChart(dimScores) {
    const ctx = $("#radarChart").getContext("2d");
    if (chart) {
      chart.data.labels = DIMENSIONS.map(d => d.label);
      chart.data.datasets[0].data = dimScores;
      chart.update();
      return;
    }
    chart = new Chart(ctx, {
      type: "radar",
      data: {
        labels: DIMENSIONS.map(d => d.label),
        datasets: [{
          label: "整合分數",
          data: dimScores,
          fill: true,
          backgroundColor: "rgba(155, 89, 182, 0.20)",
          borderColor: "rgba(155, 89, 182, 1)",
          pointBackgroundColor: "rgba(155, 89, 182, 1)",
          pointBorderColor: "#fff",
          pointHoverBackgroundColor: "#fff",
          pointHoverBorderColor: "rgba(155, 89, 182, 1)",
        }]
      },
      options: {
        responsive: true,
        scales: {
          r: {
            suggestedMin: 0,
            suggestedMax: 10,
            grid: { color: "rgba(255,255,255,0.08)" },
            angleLines: { color: "rgba(255,255,255,0.12)" },
            pointLabels: { color: "#ddd", font: { size: 12 } },
            ticks: { display: true, color: "#999", backdropColor: "transparent" }
          }
        },
        plugins: {
          legend: { display: false }
        }
      }
    });
  }

  function renderScores(dimScores) {
    const wrap = $("#scoreTable");
    const rows = dimScores.map((v, i) =>
      `<tr><td>${DIMENSIONS[i].label}</td><td style="text-align:right">${v.toFixed(1)}</td></tr>`
    ).join("");
    wrap.innerHTML = `
      <div style="margin-top:6px;opacity:.8">分數總覽</div>
      <table style="width:100%;margin-top:6px;border-collapse:collapse">
        <tbody>${rows}</tbody>
      </table>
    `;
  }

  function renderBottlenecks(dimScores) {
    const box = $("#bottleneckBox");
    const top3 = top3Deficits(dimScores);
    if (top3.length === 0) {
      box.innerHTML = `
        <div style="font-weight:700;margin-bottom:6px">今日聚焦點</div>
        <div>整體相對均衡。維持節奏即可！</div>
      `;
      return;
    }

    const tips = top3.map(item => {
      const key = DIMENSIONS[item.idx].key;
      const conf = ACTION_BANK[key];
      const firstTwo = conf.actions.slice(0, 2);
      return `
        <div class="advice" style="background:#17171c">
          <div style="font-weight:700;margin-bottom:4px">【${conf.title.split(" ")[0]}】分數 ${item.score.toFixed(1)}</div>
          <div style="opacity:.9;margin-bottom:6px">關鍵字：${conf.keywords}</div>
          <div style="opacity:.8;margin-bottom:4px">立即行動（建議挑 1 項）：</div>
          <ul style="margin:0 0 0 18px;padding:0;">
            ${firstTwo.map(a => `<li>${a}</li>`).join("")}
          </ul>
        </div>
      `;
    }).join("");

    box.innerHTML = `
      <div style="font-weight:700;margin-bottom:6px">瓶頸摘要（落後前三）</div>
      ${tips}
    `;
  }

  // ─────────────────────────────────────────────────────────
  // 樣式（簡單卡片）
  // ─────────────────────────────────────────────────────────
  const style = document.createElement("style");
  style.textContent = `
    .card {
      background: #111218;
      border: 1px solid rgba(255,255,255,.06);
      border-radius: 12px;
      padding: 16px;
      margin: 16px 0;
      box-shadow: 0 10px 30px rgba(0,0,0,.25);
    }
    table td { padding: 6px 0; border-bottom: 1px solid rgba(255,255,255,.06); }
  `;
  document.head.appendChild(style);

  // ─────────────────────────────────────────────────────────
  // 啟動
  // ─────────────────────────────────────────────────────────
  render();
})();