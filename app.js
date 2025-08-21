/* Enervi 7 — app.js (完整可用版)
 * 七滑桿 + 雷達圖（含中文軸標籤）+「差距最大 Top 3」聚焦點/建議
 * 需要的 HTML 節點：
 *  - #genBtn、#radar（外層 .canvasWrap）、#focus、#advice
 *  - #s0~#s6 與 #v0~#v6
 */

// ---- 常數/資料 ----
const LABELS = ['安住', '根基', '感受', '行動', '交流', '洞察', '願景'];
const TIPS = {
  '安住': '穩住身心，從呼吸開始。',
  '根基': '安排可落地的小步驟，站穩今天。',
  '感受': '覺察身體與情緒訊號，給它們名字。',
  '行動': '選一件最小可行動作，5 分鐘就開始。',
  '交流': '把想法說出口，尋找一位信任的聽者。',
  '洞察': '把觀察寫成 3 句筆記，從中找模式。',
  '願景': '把「為何而做」寫成一句話，貼在眼前。'
};
const VERY_FLAT_THRESHOLD = 0.35; // 差距過小時，退回最低分排序

// ---- DOM 快取 ----
const $ = (s, el=document) => el.querySelector(s);
const sliders = LABELS.map((_, i) => $('#s' + i));
const spans   = LABELS.map((_, i) => $('#v' + i));
const genBtn  = $('#genBtn');
const cvs     = $('#radar');
const ctx     = cvs.getContext('2d');
let DPR = Math.max(1, window.devicePixelRatio || 1);

// ---- 初始化：slider 顯示數值 & 載入保存值 ----
sliders.forEach((s, i) => {
  if (!s) return;
  s.addEventListener('input', () => {
    spans[i].textContent = s.value;
    saveState();
  });
});
loadState();               // 載入保存的分數
syncSliderNumbers();       // 初始化數字顯示
initialRender();           // 初始畫面

// ---- 產生結果按鈕 ----
if (genBtn) {
  genBtn.addEventListener('click', () => {
    const scores = currentScores();
    drawRadar(scores);
    renderFocusAndActions(scores);
    saveState();
  });
}

// ========= 分數/狀態 =========
function currentScores() {
  return LABELS.map((_, i) => Number(sliders[i].value || 5));
}
function saveState() {
  try {
    localStorage.setItem('enervi7-values', JSON.stringify(currentScores()));
  } catch {}
}
function loadState() {
  try {
    const data = JSON.parse(localStorage.getItem('enervi7-values'));
    if (Array.isArray(data) && data.length === LABELS.length) {
      data.forEach((v, i) => {
        if (sliders[i]) sliders[i].value = v;
      });
    }
  } catch {}
}
function syncSliderNumbers() {
  LABELS.forEach((_, i) => {
    if (spans[i] && sliders[i]) spans[i].textContent = sliders[i].value;
  });
}

// ========= 雷達圖（RWD + HiDPI + 中文軸標籤） =========
function resizeCanvas() {
  const wrap = $('.canvasWrap');
  const w = wrap ? wrap.clientWidth : 360;
  const size = Math.min(600, Math.max(280, w)); // responsive
  cvs.style.width = size + 'px';
  cvs.style.height = size + 'px';
  cvs.width = Math.floor(size * DPR);
  cvs.height = Math.floor(size * DPR);
}
function drawGrid(cx, cy, r, steps = 5) {
  ctx.save();
  ctx.strokeStyle = '#302d4a';
  ctx.lineWidth = 1 * DPR;
  for (let s = 1; s <= steps; s++) {
    const rr = r * (s / steps);
    ctx.beginPath();
    for (let i = 0; i < LABELS.length; i++) {
      const ang = (Math.PI * 2) * (i / LABELS.length) - Math.PI / 2;
      const x = cx + Math.cos(ang) * rr;
      const y = cy + Math.sin(ang) * rr;
      if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
    }
    ctx.closePath();
    ctx.stroke();
  }
  // 軸線
  for (let i = 0; i < LABELS.length; i++) {
    const ang = (Math.PI * 2) * (i / LABELS.length) - Math.PI / 2;
    const x = cx + Math.cos(ang) * r;
    const y = cy + Math.sin(ang) * r;
    ctx.beginPath();
    ctx.moveTo(cx, cy); ctx.lineTo(x, y); ctx.stroke();
  }
  ctx.restore();
}
function drawLabels(cx, cy, r) {
  ctx.save();
  ctx.fillStyle = 'rgba(255,255,255,.88)';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.font = `${14 * DPR}px -apple-system,system-ui,'Segoe UI',Roboto,Arial,'Noto Sans TC','PingFang TC'`;
  LABELS.forEach((lab, i) => {
    const ang = (Math.PI * 2) * (i / LABELS.length) - Math.PI / 2;
    const pad = 18 * DPR;
    const x = cx + Math.cos(ang) * (r + pad);
    const y = cy + Math.sin(ang) * (r + pad);
    ctx.fillText(lab, x, y);
  });
  ctx.restore();
}
function drawPolygon(cx, cy, r, values) {
  ctx.save();
  const n = LABELS.length;
  const step = (Math.PI * 2) / n;
  ctx.beginPath();
  values.forEach((v, i) => {
    const ang = step * i - Math.PI / 2;
    const rr = r * (v / 10);
    const x = cx + Math.cos(ang) * rr;
    const y = cy + Math.sin(ang) * rr;
    if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
  });
  ctx.closePath();
  ctx.fillStyle = 'rgba(111,66,193,0.30)';
  ctx.strokeStyle = '#8b63e6';
  ctx.lineWidth = 2 * DPR;
  ctx.fill(); ctx.stroke();
  ctx.restore();
}
function drawRadar(values) {
  resizeCanvas();
  const cx = cvs.width / 2, cy = cvs.height / 2;
  const r = Math.min(cvs.width, cvs.height) / 2 - 48 * DPR;
  ctx.clearRect(0, 0, cvs.width, cvs.height);
  drawGrid(cx, cy, r, 5);
  drawPolygon(cx, cy, r, values);
  drawLabels(cx, cy, r);
}
window.addEventListener('resize', () => {
  drawRadar(currentScores());
});

// ========= 聚焦點/行動建議：差距最大 Top 3 =========
function pickTopImbalances(scores) {
  const avg = scores.reduce((a, b) => a + b, 0) / scores.length;
  const diffs = scores.map((v, i) => ({
    label: LABELS[i],
    value: v,
    delta: Math.abs(v - avg)
  }));
  diffs.sort((a, b) => b.delta - a.delta);

  // 若整體很平均，退回最低分排序
  if (diffs[0]?.delta < VERY_FLAT_THRESHOLD) {
    diffs.sort((a, b) => a.value - b.value);
  }
  return diffs.slice(0, 3);
}
function renderFocusAndActions(scores) {
  const top3 = pickTopImbalances(scores);

  // 今日聚焦點
  const focusBox = $('#focus');
  if (focusBox) {
    focusBox.innerHTML = top3.map(
      (f, idx) => `#${idx + 1} ${f.label}｜${TIPS[f.label] || ''}`
    ).join('<br>');
  }

  // 七階關鍵字 × 行動建議（Top 3）
  const adviceBox = $('#advice');
  if (adviceBox) {
    adviceBox.innerHTML = top3.map(
      (f) => `<b>${f.label}</b>（分數 ${f.value}）｜建議：${TIPS[f.label] || ''}`
    ).join('<br><br>');
  }

  try { localStorage.setItem('enervi7-focus-top3', JSON.stringify(top3)); } catch {}
}

// ========= 初始渲染 =========
function initialRender() {
  const scores = currentScores();
  drawRadar(scores);
  renderFocusAndActions(scores);
}