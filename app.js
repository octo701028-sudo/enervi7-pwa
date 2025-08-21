
const STAGES = [
  {id:'S1', name:'安住・根基', emoji:'🪨', desc:'穩定、安全、身體覺察與基本支持。', keywords:['安全感','穩定','身體感','界線'], actions:['赤腳接地5分鐘','整理空間10分鐘','完成一件延宕小事']},
  {id:'S2', name:'流動・生命', emoji:'🌊', desc:'情緒流動、愉悅、創造與人際連結。', keywords:['情緒流動','愉悅','關係','創造'], actions:['喝一杯溫水並深呼吸','寫下今天的愉悅清單','做3分鐘扭動伸展']},
  {id:'S3', name:'意志・行動', emoji:'🔥', desc:'自我主張、界線、行動與完成力。', keywords:['界線','主動','完成','紀律'], actions:['設定今日最重要的一件事','做番茄鐘25分鐘','完成後公開回報']},
  {id:'S4', name:'心火・連結', emoji:'💗', desc:'同理、慈悲、給予與接收的平衡。', keywords:['同理','接納','溫柔','界線中的愛'], actions:['寫一則感謝訊息','5次心中心呼吸','擁抱/自我擁抱20秒']},
  {id:'S5', name:'表達・真實', emoji:'🎤', desc:'誠實表達、傾聽、真實溝通。', keywords:['清晰','傾聽','表達','承諾'], actions:['把想說的話寫成3句「我訊息」','練習「我需要…」句型','錄音1分鐘對自己說話']},
  {id:'S6', name:'洞見・覺知', emoji:'👁️', desc:'觀照、洞見、模式辨識與反思。', keywords:['觀照','洞見','模式','覺知'], actions:['寫下一個自動反應與替代選擇','3分鐘凝視點','睡前做1句覺察記錄']},
  {id:'S7', name:'合一・超越', emoji:'✨', desc:'與更大整體的連結、意義感與寬廣。', keywords:['意義','臣服','同在','寬廣'], actions:['1分鐘靜默','為今天設定一個善意行動','寫下此刻最想服務之處']},
];

const $ = (s)=>document.querySelector(s);

function renderSliders(){
  const box = document.getElementById("sliders");
  box.innerHTML = '';
  STAGES.forEach((st,i)=>{
    const id = `rng_${st.id}`;
    const wrap = document.createElement('div');
    wrap.className = 'range';
    wrap.innerHTML = `
      <label for="${id}" style="min-width:120px">${st.emoji} ${st.name}</label>
      <input type="range" id="${id}" min="0" max="10" value="5" step="1">
      <output id="out_${st.id}">5</output>
    `;
    box.appendChild(wrap);
    const input = wrap.querySelector('input');
    const out = wrap.querySelector('output');
    input.addEventListener('input',()=>{ out.value = input.value; });
  });
}

let radarChart = null;
function drawRadar(scores){
  const ctx = document.getElementById("radar").getContext('2d');
  const labels = STAGES.map(s=>`${s.emoji} ${s.name}`);
  if(radarChart) radarChart.destroy();
  radarChart = new Chart(ctx, {
    type: 'radar',
    data: {
      labels,
      datasets: [{
        label: 'Enervi 7',
        data: scores,
        borderWidth: 2,
        pointRadius: 3,
        fill: true
      }]
    },
    options: {
      responsive: true,
      scales: { r: { min:0, max:10, ticks: { stepSize:2 } } },
      plugins: { legend: { display:false } }
    }
  });
}

function gen(){
  const scores = STAGES.map(st => parseInt(document.getElementById(`rng_${st.id}`).value,10));
  drawRadar(scores);
  // focus
  const minIdx = scores.indexOf(Math.min(...scores));
  const st = STAGES[minIdx];
  document.getElementById("focusCard").style.display='block';
  document.getElementById("focusText").innerHTML = `此刻最需要被照顧的是：<b>${st.emoji} ${st.name}</b><br><br>
  關鍵字：<code>${st.keywords.join('、')}</code><br><br>
  建議從以下任務選擇一項立刻行動：<br> - ${st.actions.join('<br> - ')}`;

  // details
  const detailsBox = document.getElementById("details");
  detailsBox.innerHTML = '';
  STAGES.forEach((stage,i)=>{
    const score = scores[i];
    const el = document.createElement('details');
    el.innerHTML = `<summary>${stage.emoji} ${stage.name}｜分數：${score}</summary>
      <div style="margin-top:8px;color:var(--muted)">${stage.desc}</div>
      <div style="margin-top:8px">
        <div class="badge">關鍵字</div> ${stage.keywords.map(k=>`<span class="badge">${k}</span>`).join('')}
      </div>
      <div style="margin-top:8px">
        <div class="badge">行動建議</div>
        <ul>${stage.actions.map(a=>`<li>${a}</li>`).join('')}</ul>
      </div>`;
    detailsBox.appendChild(el);
  });

  // enable save
  document.getElementById("saveBtn").disabled = false;
  window.currentResult = scores;
}

function saveCurrent(){
  if(!window.currentResult) return;
  const name = document.getElementById("userName").value.trim();
  const now = new Date();
  const row = { timestamp: now.toISOString(), user: name || '', };
  STAGES.forEach((s,i)=> row[s.id] = parseInt(window.currentResult[i],10));
  const key = 'enervi7_records';
  const arr = JSON.parse(localStorage.getItem(key) || '[]');
  arr.push(row);
  localStorage.setItem(key, JSON.stringify(arr));
  renderHistory();
  alert('已儲存於本機（localStorage）');
}

function renderHistory(){
  const key = 'enervi7_records';
  const arr = JSON.parse(localStorage.getItem(key) || '[]');
  const box = document.getElementById("history");
  if(arr.length===0){ box.innerHTML = '<div style="opacity:.7">尚無資料。完成一次檢測後按「儲存本次結果」。</div>'; return; }
  let html = '<table><thead><tr><th>時間</th><th>暱稱</th><th>S1</th><th>S2</th><th>S3</th><th>S4</th><th>S5</th><th>S6</th><th>S7</th></tr></thead><tbody>';
  arr.slice().reverse().forEach(r=>{
    const t = new Date(r.timestamp).toLocaleString();
    html += `<tr><td>${t}</td><td>${(r.user||'')}</td><td>${r.S1}</td><td>${r.S2}</td><td>${r.S3}</td><td>${r.S4}</td><td>${r.S5}</td><td>${r.S6}</td><td>${r.S7}</td></tr>`;
  });
  html += '</tbody></table>';
  box.innerHTML = html;
}

function exportCSV(){
  const key = 'enervi7_records';
  const arr = JSON.parse(localStorage.getItem(key) || '[]');
  if(arr.length===0){ alert('目前沒有歷史資料。'); return; }
  const headers = ['timestamp','user','S1','S2','S3','S4','S5','S6','S7'];
  const lines = [headers.join(',')];
  arr.forEach(r=>{
    lines.push([r.timestamp, r.user||'', r.S1,r.S2,r.S3,r.S4,r.S5,r.S6,r.S7].join(','));
  });
  const blob = new Blob([lines.join('\n')], {type:'text/csv;charset=utf-8'});
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = `enervi7_${new Date().toISOString().slice(0,19).replace(/[:T]/g,'-')}.csv`;
  document.body.appendChild(a); a.click(); document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

function clearAll(){
  if(confirm('確定要刪除所有歷史紀錄嗎？（僅刪除此裝置的本機資料）')){
    localStorage.removeItem('enervi7_records');
    renderHistory();
  }
}

function init(){
  renderSliders();
  document.getElementById("genBtn").addEventListener('click', gen);
  document.getElementById("saveBtn").addEventListener('click', saveCurrent);
  document.getElementById("exportBtn").addEventListener('click', exportCSV);
  document.getElementById("clearBtn").addEventListener('click', clearAll);
  document.getElementById('year').textContent = new Date().getFullYear();
  renderHistory();
}
document.addEventListener('DOMContentLoaded', init);
