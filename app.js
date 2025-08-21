/* ========= Enervi 7 – 整合雷達圖版 app.js =========
 * 純前端（PWA/ GitHub Pages 可用）
 * 需要 index.html 已載入 Chart.js（<script src="https://cdn.jsdelivr.net/npm/chart.js"></script>）
 * ================================================= */

// ---- 可調參數（權重）----
const W_Q = 0.6;      // 七階本體權重
const W_T_IN = 0.2;   // 轉入權重（上一階 -> 本階）
const W_T_OUT = 0.2;  // 轉出權重（本階 -> 下一階）

// ---- 七階標籤（雷達圖坐標軸順序要固定）----
const LEVELS = ["安住","根基","感受","行動","交流","洞察","願景"];

// ---- 題目文字（可自行微調語氣）----
// Q1~Q7：對應 LEVELS
const QUESTIONS_Q = [
  "Q1 安住：我能穩住身心，覺察並安定此刻狀態。",
  "Q2 根基：我安排可執行的小步驟，站穩今天。",
  "Q3 感受：我能看見情緒與身體訊號，並與之同在。",
  "Q4 行動：我能把想法拆解成行動並付諸實作。",
  "Q5 交流：我樂於分享並接收回饋，節奏穩定。",
  "Q6 洞察：我能從經驗提煉洞見，調整作法。",
  "Q7 願景：我記得初衷，看見方向並對齊資源。"
];

// T1~T7：定義為「LEVELS[i] → LEVELS[i+1]」的轉換能力（第 7 題收尾回到 1）
// 若你只想用 6 題轉換（不包含 願景→安住），把最後一題拿掉並同時下方計算也拿掉 %7 的回圈。
// 這裡用 7 題，算式比較對稱。
const QUESTIONS_T = [
  "T1 安住→根基：看見情緒/壓力後，我能順利安頓並落地成步驟。",
  "T2 根基→感受：在安排好步驟後，我能持續覺察感受與回饋。",
  "T3 感受→行動：內在感受能順利轉為具體行動。",
  "T4 行動→交流：從單次行動進入穩定節奏與分享回饋。",
  "T5 交流→洞察：從互動回饋中萃取可用洞見，持續微調。",
  "T6 洞察→願景：將洞見整理成方向/SOP/習慣，與願景對齊。",
  "T7 願景→安住：面向願景時，能回到安定、保持身心穩住。"
];

// ---- 動態建立 UI ----
const app = document.getElementById("app") || document.body;

// Wrapper
const container = document.createElement("div");
container.style.maxWidth = "960px";
container.style.margin = "0 auto";
container.style.padding = "16px";
app.appendChild(container);

// Section: 七階
const qBox = document.createElement("section");
qBox.innerHTML = `<h2 style="margin:16px 0">七階題（Q1–Q7）</h2>`;
container.appendChild(qBox);

// slider 產生器
function makeSliderRow(labelText) {
  const row = document.createElement("div");
  row.style.margin = "12px 0";
  row.innerHTML = `
    <div style="display:flex;align-items:center;gap:12px">
      <div style="flex:0 0 80px">${labelText}</div>
      <input type="range" min="0" max="10" value="5" step="1" style="flex:1" />
      <div class="val" style="width:24px;text-align:right">5</div>
    </div>
  `;
  const input = row.querySelector("input");
  const val = row.querySelector(".val");
  input.addEventListener("input", () => { val.textContent = input.value; });
  return { row, input };
}

// 建 Q sliders
const qSliders = QUESTIONS_Q.map((text) => {
  const {row, input} = makeSliderRow(text);
  qBox.appendChild(row);
  return input;
});

// Section: 七轉換
const tBox = document.createElement("section");
tBox.innerHTML = `<h2 style="margin:24px 0 16px">七轉換題（T1–T7）</h2>`;
container.appendChild(tBox);

// 建 T sliders
const tSliders = QUESTIONS_T.map((text) => {
  const {row, input} = makeSliderRow(text);
  tBox.appendChild(row);
  return input;
});

// 產生結果按鈕
const btn = document.createElement("button");
btn.textContent = "✨ 產生結果";
btn.style.display = "block";
btn.style.width = "100%";
btn.style.margin = "20px 0 12px";
btn.style.padding = "14px 16px";
btn.style.borderRadius = "10px";
btn.style.border = "none";
btn.style.fontSize = "16px";
btn.style.background = "linear-gradient(135deg,#7c4dff,#8e5bfd)";
btn.style.color = "white";
btn.style.cursor = "pointer";
container.appendChild(btn);

// Chart 區塊
const chartBox = document.createElement("section");
chartBox.innerHTML = `<h2 style="margin:16px 0">整合雷達圖</h2>
<canvas id="radar" height="340"></canvas>
<div style="opacity:.8;font-size:13px;margin-top:8px">
  紫線：整合分數（Q + 轉入/轉出加權）；
  灰線：僅 Q 投影；
  淡紫：僅 T 投影（把轉換量分攤到相鄰兩軸）。
</div>`;
container.appendChild(chartBox);

// 取得分數
function getQ() {
  return qSliders.map(s => Number(s.value));
}
function getT() {
  return tSliders.map(s => Number(s.value)); // 長度 7（第 i 題 = LEVELS[i] → LEVELS[i+1]）
}

// 將 T「投影」到 7 軸：把每個轉換的一半加到起點、一半加到終點
function projectTtoLevels(tArr) {
  const proj = Array(LEVELS.length).fill(0);
  for (let i = 0; i < LEVELS.length; i++) {
    const from = i;
    const to = (i + 1) % LEVELS.length;
    const half = tArr[i] / 2;
    proj[from] += half;
    proj[to]   += half;
  }
  return proj;
}

// 整合分數：Q + 轉入 + 轉出
function combineScores(qArr, tArr) {
  const n = LEVELS.length;
  const out = Array(n).fill(0);
  for (let i = 0; i < n; i++) {
    const q = qArr[i];
    const tOut = tArr[i];           // 本階 -> 下一階
    const tIn  = tArr[(i - 1 + n) % n]; // 上一階 -> 本階
    const val = (W_Q*q + W_T_IN*tIn + W_T_OUT*tOut) / (W_Q + W_T_IN + W_T_OUT);
    out[i] = Math.round(val * 10) / 10;
  }
  return out;
}

// 初始化 Chart.js Radar
let radarChart = null;
function renderRadar(qArr, tArr, combo) {
  const ctx = document.getElementById("radar").getContext("2d");
  const tProj = projectTtoLevels(tArr);

  const data = {
    labels: LEVELS,
    datasets: [
      {
        label: "整合分數",
        data: combo,
        fill: true,
        borderColor: "rgba(144, 99, 255, 1)",
        backgroundColor: "rgba(144, 99, 255, .15)",
        pointRadius: 3,
        borderWidth: 2
      },
      {
        label: "僅 Q（七階）",
        data: qArr,
        fill: false,
        borderColor: "rgba(180, 180, 200, .9)",
        backgroundColor: "rgba(0,0,0,0)",
        borderDash: [5,4],
        pointRadius: 0,
        borderWidth: 1.5
      },
      {
        label: "僅 T 投影（七轉換→七軸）",
        data: tProj,
        fill: true,
        borderColor: "rgba(180, 140, 255, .9)",
        backgroundColor: "rgba(180, 140, 255, .12)",
        pointRadius: 0,
        borderWidth: 1.5
      }
    ]
  };
  const options = {
    responsive: true,
    scales: {
      r: {
        suggestedMin: 0,
        suggestedMax: 10,
        ticks: { stepSize: 2, backdropColor: "transparent" },
        pointLabels: { font: { size: 13 } },
        grid: { color: "rgba(255,255,255,.1)" },
        angleLines: { color: "rgba(255,255,255,.1)" }
      }
    },
    plugins: {
      legend: { labels: { boxWidth: 12, usePointStyle: true } }
    }
  };

  if (radarChart) {
    radarChart.data = data;
    radarChart.options = options;
    radarChart.update();
  } else {
    radarChart = new Chart(ctx, { type: "radar", data, options });
  }
}

// 點擊產生結果
btn.addEventListener("click", () => {
  const q = getQ();
  const t = getT();
  const combo = combineScores(q, t);
  renderRadar(q, t, combo);
});