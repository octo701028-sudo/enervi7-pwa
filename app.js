// Enervi7 前端邏輯（純前端、無後端）
const LABELS = ["安住","根基","感受","行動","交流","洞察","願景"];

const el = q => document.querySelector(q);
const els = q => document.querySelectorAll(q);

const sliders = LABELS.map((_,i)=>el('#s'+i));
const spans   = LABELS.map((_,i)=>el('#v'+i));
const genBtn  = el('#genBtn');
const canvas  = el('#radar');
const ctx     = canvas.getContext('2d');
let DPR = Math.max(1, window.devicePixelRatio || 1);

// 安裝 PWA
let deferredPrompt = null;
window.addEventListener('beforeinstallprompt', (e)=>{
  e.preventDefault();
  deferredPrompt = e;
  const btn = el('#installBtn');
  if (btn) btn.style.display='inline-block';
});
const installBtn = el('#installBtn');
if (installBtn) installBtn.addEventListener('click', async ()=>{
  if (!deferredPrompt) { alert('已可從瀏覽器選單「加入主畫面」安裝'); return; }
  deferredPrompt.prompt();
  await deferredPrompt.userChoice;
  deferredPrompt = null;
  installBtn.style.display='none';
});

// slider 顯示數值＆儲存
sliders.forEach((s,i)=>{
  s.addEventListener('input', ()=>{
    spans[i].textContent = s.value;
    saveState();
  });
});

function saveState(){
  const vals = sliders.map(s=>Number(s.value));
  localStorage.setItem('enervi7-values', JSON.stringify(vals));
}
function loadState(){
  try{
    const data = JSON.parse(localStorage.getItem('enervi7-values'));
    if (Array.isArray(data) && data.length===7){
      data.forEach((v,i)=>{
        sliders[i].value = v;
        spans[i].textContent = v;
      });
    }
  }catch{}
}
loadState();

// 產生結果
genBtn.addEventListener('click', ()=>{
  const values = sliders.map(s=>Number(s.value));
  drawRadar(values);
  renderAdvice(values);
  saveState();
});

// 初始繪圖
drawRadar(sliders.map(s=>Number(s.value)));
renderAdvice(sliders.map(s=>Number(s.value)));

// 繪製雷達圖（含中文標籤 + HiDPI）
function resizeCanvas(){
  const w = el('.canvasWrap').clientWidth || 320;
  const size = Math.min(600, Math.max(280, w)); // responsive
  canvas.style.width = size + 'px';
  canvas.style.height = size + 'px';
  canvas.width = Math.floor(size * DPR);
  canvas.height = Math.floor(size * DPR);
}
function drawGrid(cx, cy, r, steps=5){
  ctx.save();
  ctx.strokeStyle = '#302d4a';
  ctx.lineWidth = 1 * DPR;
  for (let s=1; s<=steps; s++){
    const rr = r * (s/steps);
    ctx.beginPath();
    for (let i=0; i<LABELS.length; i++){
      const ang = (Math.PI*2) * (i/LABELS.length) - Math.PI/2;
      const x = cx + Math.cos(ang)*rr;
      const y = cy + Math.sin(ang)*rr;
      if (i===0) ctx.moveTo(x,y); else ctx.lineTo(x,y);
    }
    ctx.closePath(); ctx.stroke();
  }
  // 軸線
  for (let i=0; i<LABELS.length; i++){
    const ang = (Math.PI*2) * (i/LABELS.length) - Math.PI/2;
    const x = cx + Math.cos(ang)*r;
    const y = cy + Math.sin(ang)*r;
    ctx.beginPath();
    ctx.moveTo(cx,cy); ctx.lineTo(x,y); ctx.stroke();
  }
  ctx.restore();
}
function drawLabels(cx, cy, r){
  ctx.save();
  ctx.fillStyle = '#cfcbe6';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.font = `${14*DPR}px -apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Ubuntu,'Noto Sans TC','PingFang TC',sans-serif`;
  LABELS.forEach((lab,i)=>{
    const ang = (Math.PI*2) * (i/LABELS.length) - Math.PI/2;
    const pad = 18*DPR;
    const x = cx + Math.cos(ang)*(r+pad);
    const y = cy + Math.sin(ang)*(r+pad);
    ctx.fillText(lab, x, y);
  });
  ctx.restore();
}
function drawPolygon(cx, cy, r, values){
  ctx.save();
  const n = LABELS.length;
  const step = (Math.PI*2)/n;
  ctx.beginPath();
  values.forEach((v,i)=>{
    const ang = step*i - Math.PI/2;
    const rr = r * (v/10);
    const x = cx + Math.cos(ang)*rr;
    const y = cy + Math.sin(ang)*rr;
    if (i===0) ctx.moveTo(x,y); else ctx.lineTo(x,y);
  });
  ctx.closePath();
  ctx.fillStyle = 'rgba(111,66,193,0.30)';
  ctx.strokeStyle = '#8b63e6';
  ctx.lineWidth = 2*DPR;
  ctx.fill(); ctx.stroke();
  ctx.restore();
}

function drawRadar(values){
  resizeCanvas();
  const cx = canvas.width/2, cy = canvas.height/2;
  const r = Math.min(canvas.width, canvas.height)/2 - 48*DPR;
  ctx.clearRect(0,0,canvas.width,canvas.height);
  drawGrid(cx,cy,r,5);
  drawPolygon(cx,cy,r,values);
  drawLabels(cx,cy,r);
}

window.addEventListener('resize', ()=>{
  drawRadar(sliders.map(s=>Number(s.value)));
});

function renderAdvice(values){
  // 找最低值→焦點
  const minIdx = values.indexOf(Math.min(...values));
  const focusText = `${LABELS[minIdx]}｜穩住身心，從呼吸開始。`;
  el('#focus').textContent = focusText;

  // 每一軸的關鍵字和建議
  const map = {
    "安住":"放慢節奏 3 分鐘，做 6 次深呼吸。",
    "根基":"安排一件可落地的小步驟，站穩今天。",
    "感受":"寫下此刻的三個情緒，接納它們。",
    "行動":"設定 25 分鐘專注（番茄），完成一小段。",
    "交流":"發一則真誠訊息，建立一個連結。",
    "洞察":"記錄一個觀察或學到的事。",
    "願景":"重讀你的 1 句願景，對齊今天的行動。"
  };
  const box = el('#advice');
  box.innerHTML = LABELS.map((lab,i)=>{
    return `<div class="item"><b>${lab}</b>：分數 <b>${values[i]}</b>，建議：${map[lab]}</div>`;
  }).join("");
}

// 註冊 Service Worker
if ('serviceWorker' in navigator){
  window.addEventListener('load', ()=>{
    navigator.serviceWorker.register('./sw.js').catch(()=>{});
  });
}
