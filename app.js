/* ============== Enervi 7 — app.js (正式版) ============== */
/* 載入 Chart.js（若網頁還沒載） */
(function ensureChartJS() {
  if (!window.Chart) {
    const s = document.createElement('script');
    s.src = "https://cdn.jsdelivr.net/npm/chart.js@4.4.1/dist/chart.umd.min.js";
    s.defer = true;
    s.onload = () => console.log('[Enervi7] Chart.js loaded');
    document.head.appendChild(s);
  }
})();

/* ---------- 題目文字 ---------- */
const Q_TEXTS = {
  Q1: "Q1 覺察：我能清楚覺察自己此刻的情緒、念頭與身體感受。",
  Q2: "Q2 釋放：當我察覺壓力或情緒時，我能有效地鬆開與代謝。",
  Q3: "Q3 信任：我對生活與未來持有信任與安全感，能允許事情順勢發生。",
  Q4: "Q4 行動：我能把想法拆解成最小可行步驟，並付諸行動。",
  Q5: "Q5 流動：我能維持專注與節奏，接受回饋並快速微調。",
  Q6: "Q6 共鳴：我與他人／世界連結感良好，能創造正向回饋與影響。",
  Q7: "Q7 整合：我能總結經驗並固化成結構與習慣，持續複製成果。"
};
const T_TEXTS = {
  T1: "T1 覺察→釋放：看見情緒或議題後，能順利進入釋放。",
  T2: "T2 釋放→信任：在放下之後，自然進入信任與允許。",
  T3: "T3 信任→行動：由內在信任轉為具體行動是順暢的。",
  T4: "T4 行動→流動：從單次行動進入穩定節奏與回饋迭代。",
  T5: "T5 流動→共鳴：把成果分享並獲得回饋與擴散是順暢的。",
  T6: "T6 共鳴→整合：把有效做法整理成 SOP／習慣是順暢的。",
  T7: "T7 整合→新覺察：結束一輪後回到清明覺察開啟下一輪。"
};

/* ---------- 行動建議（每個 S 階段專屬） ---------- */
const STAGE_ACTIONS = {
  S1: [
    "寫三句『此刻我真實的感受是…』",
    "3 分鐘腹式呼吸（4-4-6）並記錄身體感受",
    "列出 1 個反覆出現的念頭，標記：事實/解讀？"
  ],
  S2: [
    "做一次『寫了就撕/燒』釋放書寫（2–3 段）",
    "身體掃描，對緊繃部位做 60 秒放鬆",
    "今天完成一件拖延小事並打勾"
  ],
  S3: [
    "用『我允許…』造句 3 句（對應今天焦點）",
    "回顧 1 次被支持的證據，寫下可複製要點",
    "主動請求一次小範圍的幫助"
  ],
  S4: [
    "把目標拆成 10 分鐘就能完成的一步，現在就做",
    "設定今日 3 件 MIT",
    "完成後『公開回報』給可信任對象"
  ],
  S5: [
    "把卡點→調整 1 個微策略（A/B 嘗試）",
    "25 分鐘番茄鐘全程專注",
    "記錄 1 個有效回饋，明天沿用"
  ],
  S6: [
    "分享小成果到社群/朋友並索取具體回饋",
    "辨識最被共鳴的價值，明天主打該元素",
    "主動建立一個合作可能（發出一則邀請）"
  ],
  S7: [
    "用 5 句話摘要本週 3 件學到＋1 改進",
    "把有效步驟寫成 Checklist 並固定到行程",
    "為下個週期設定一個可衡量指標（KPI）"
  ]
};

/* ---------- 悠樂芳：依主導階段的精油建議 ---------- */
/* 依你的說法：同時涵蓋單方與台灣常見複方（示例） */
const OIL_RECS = {
  S1: {  // 安住 Awareness
    single: ["薰衣草", "廣藿香", "佛手柑", "乳香"],
    blends: ["Peace & Calming", "Stress Away"]
  },
  S2: {  // 釋放 Release
    single: ["快樂鼠尾草", "尤加利", "檀香", "杜松"],
    blends: ["Release", "Valor"]
  },
  S3: {  // 信任 Trust
    single: ["岩蘭草", "黑雲杉", "雪松", "橙花"],
    blends: ["Believe", "Acceptance"]
  },
  S4: {  // 行動 Action
    single: ["薄荷", "檸檬", "迷迭香", "胡椒薄荷"],
    blends: ["Motivation", "En-R-Gee"]
  },
  S5: {  // 流動 Flow
    single: ["檸檬草", "羅勒", "白珠樹", "綠薄荷"],
    blends: ["Energy", "Awaken"]
  },
  S6: {  // 共鳴 Resonance
    single: ["天竺葵", "依蘭", "玫瑰草", "橙花"],
    blends: ["Joy", "Harmony"]
  },
  S7: {  // 整合 Integration
    single: ["乳香", "岩蘭草", "雪松", "黑雲杉"],
    blends: ["Highest Potential", "Transformation"]
  }
};

/* ---------- 計分：整合分數（Q 60% + 前後轉換各 20%） ---------- */
function computeScores(Q, T, usePenalty, tau = 4.0, delta = 0.3) {
  const wQ = 0.6, wPrev = 0.2, wNext = 0.2;
  const sRaw = [];
  for (let i = 0; i < 7; i++) {
    const val = wQ * Q[i] + wPrev * T[(i + 6) % 7] + wNext * T[i];
    let v = val;
    if (usePenalty) {
      if (T[(i + 6) % 7] < tau) v -= delta;
      if (T[i] < tau) v -= delta;
      if (v < 0) v = 0;
    }
    sRaw.push(v * 10); // 0..100
  }
  const stages = sRaw.map(v => Math.round(v * 10) / 10);
  const transitions = T.map(v => Math.round(v * 100) / 10); // 0..100
  const dominant = stages.indexOf(Math.max(...stages));
  const bottlenecks = [...transitions]
    .map((v, i) => ({ i, v }))
    .sort((a, b) => a.v - b.v)
    .slice(0, 2)
    .map(x => x.i);
  return { stages, transitions, dominant, bottlenecks };
}

/* ---------- UI 綁定 ---------- */
const el = {
  qWrap: document.getElementById('q-wrap'),
  tWrap: document.getElementById('t-wrap'),
  progress: document.getElementById('progress'),
  progressText: document.getElementById('progress-text'),
  btnStart: document.getElementById('btn-start'),
  cbPenalty: document.getElementById('cb-penalty'),
  tau: document.getElementById('tau'),
  delta: document.getElementById('delta'),
  canvas: document.getElementById('radar'),
  summary: document.getElementById('summary'),
  oils: document.getElementById('oil-recs'),
  actions: document.getElementById('action-recs'),
  savePng: document.getElementById('save-png'),
  journalText: document.getElementById('journal-text'),
  journalSave: document.getElementById('journal-save'),
  historyList: document.getElementById('history-list')
};

/* 產生 14 個滑桿 */
function makeSlider(id, label) {
  const wrap = document.createElement('div');
  wrap.className = 'slider-row';
  wrap.innerHTML = `
    <label for="${id}">${label}</label>
    <input type="range" id="${id}" min="0" max="10" step="1" value="5" />
    <div class="score"><span id="${id}-val">5</span> / 10</div>
  `;
  const input = wrap.querySelector(`#${id}`);
  const out = wrap.querySelector(`#${id}-val`);
  input.addEventListener('input', () => {
    out.textContent = input.value;
    updateProgress();
  });
  return wrap;
}
(function buildForm() {
  for (let i = 1; i <= 7; i++) el.qWrap.appendChild(makeSlider(`Q${i}`, Q_TEXTS[`Q${i}`]));
  for (let i = 1; i <= 7; i++) el.tWrap.appendChild(makeSlider(`T${i}`, T_TEXTS[`T${i}`]));
  updateProgress();
})();

function getAnswers() {
  const Q = [], T = [];
  for (let i = 1; i <= 7; i++) Q.push(+document.getElementById(`Q${i}`).value);
  for (let i = 1; i <= 7; i++) T.push(+document.getElementById(`T${i}`).value);
  return { Q, T };
}

function updateProgress() {
  const { Q, T } = getAnswers();
  const filled = [...Q, ...T].filter(v => !isNaN(v)).length;
  const ratio = filled / 14;
  el.progress.style.setProperty('--p', (ratio * 100).toFixed(0));
  if (el.progressText) el.progressText.textContent = `${filled}/14`;
}

/* ---------- 作圖（雷達：整合 / Q / T） ---------- */
let radar;
function drawRadar(stages, Q, T) {
  if (!window.Chart) return setTimeout(() => drawRadar(stages, Q, T), 80);
  const labels = ['安住','根基','感受','行動','交流','洞察','願景'];
  const data = {
    labels,
    datasets: [
      { label: '整合', data: stages, borderWidth: 2, fill: true },
      { label: '僅 Q', data: Q.map(x=>x*10), borderDash:[6,4], borderWidth:2, fill:false },
      { label: '僅 T', data: T.map(x=>x*10), borderDash:[2,3], borderWidth:2, fill:false }
    ]
  };
  const opt = {
    responsive: true,
    scales: { r: { min:0, max:100, ticks:{ stepSize:20 }, grid:{ circular:true } } },
    plugins: { legend:{ position:'bottom' } }
  };
  if (radar) radar.destroy();
  radar = new Chart(el.canvas, { type:'radar', data, options: opt });
}

/* ---------- 建議（依主導階段） ---------- */
function renderRecommendations(dominantIndex, bottlenecks) {
  const sId = `S${dominantIndex+1}`;
  const oil = OIL_RECS[sId] || { single:[], blends:[] };
  const as = STAGE_ACTIONS[sId] || [];

  el.summary.innerHTML =
    `主導階段：<b>${['安住','根基','感受','行動','交流','洞察','願景'][dominantIndex]}</b>
     ｜瓶頸：<b>S${((bottlenecks[0]+6)%7)+1}→S${bottlenecks[0]+1}</b>
     ；次瓶頸：<b>S${((bottlenecks[1]+6)%7)+1}→S${bottlenecks[1]+1}</b>`;

  el.oils.innerHTML = `
    <div class="card-title">建議精油（依主導＋瓶頸）</div>
    <div class="oil-line"><b>單方：</b>${oil.single.join('、')}</div>
    <div class="oil-line"><b>複方：</b>${oil.blends.join('、')}</div>
    <div class="hint">＊若要針對瓶頸加強：在主導階段基礎上，搭配對應轉換的舒緩/提振類精油。</div>
  `;

  el.actions.innerHTML = `
    <div class="card-title">行動建議（依主導）</div>
    <ul class="bullets">${as.map(x=>`<li>${x}</li>`).join('')}</ul>
  `;
}

/* ---------- 歷史（最近 7 次） ---------- */
function pushHistory(payload) {
  const key = 'enervi7:history';
  const list = JSON.parse(localStorage.getItem(key) || '[]');
  list.unshift(payload);
  if (list.length > 7) list.length = 7;
  localStorage.setItem(key, JSON.stringify(list));
}
function renderHistory() {
  const list = JSON.parse(localStorage.getItem('enervi7:history') || '[]');
  if (!list.length) { el.historyList.innerHTML = '<div class="muted">尚無資料</div>'; return; }
  const avg = new Array(7).fill(0);
  list.forEach(it => it.stages.forEach((v,i)=>avg[i]+=v));
  for (let i=0;i<7;i++) avg[i]=Math.round((avg[i]/list.length)*10)/10;
  el.historyList.innerHTML =
    `<div class="muted">最近 ${list.length} 次平均：</div>
     <div>${avg.map((v,i)=>`S${i+1}:${v}`).join(' ｜ ')}</div>`;
}

/* ---------- 下載結果卡（PNG） ---------- */
function downloadPNG() {
  if (!radar) return;
  const link = document.createElement('a');
  link.download = `enervi7_${new Date().toISOString().slice(0,10)}.png`;
  link.href = el.canvas.toDataURL('image/png');
  link.click();
}

/* ---------- 事件 ---------- */
el.btnStart.addEventListener('click', () => {
  const { Q, T } = getAnswers();
  const usePenalty = el.cbPenalty.checked;
  const tau = parseFloat(el.tau.value || '4.0');
  const delta = parseFloat(el.delta.value || '0.3');

  const { stages, transitions, dominant, bottlenecks } =
    computeScores(Q, T, usePenalty, tau, delta);

  drawRadar(stages, Q, T);
  renderRecommendations(dominant, bottlenecks);

  pushHistory({ time: Date.now(), stages, transitions });
  renderHistory();
});
el.savePng.addEventListener('click', downloadPNG);

/* 日誌 */
el.journalSave?.addEventListener('click', () => {
  const txt = (el.journalText.value || '').trim();
  if (!txt) return alert('請先輸入日誌內容');
  const key = 'enervi7:journal';
  const list = JSON.parse(localStorage.getItem(key) || '[]');
  list.unshift({ t: Date.now(), txt });
  localStorage.setItem(key, JSON.stringify(list));
  el.journalText.value = '';
  alert('已保存到本機（不會上傳）');
});

/* 初始歷史 */
renderHistory();

/* ============== /Enervi 7 — app.js ============== */