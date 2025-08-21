// ---- data ----
const CHANNELS = [
  {key:'安住',  tips:'穩住身心，從呼吸開始。'},
  {key:'根基',  tips:'安排可執行的小步驟，站穩今天。'},
  {key:'感受',  tips:'允許情緒流動，寫下現在的感覺。'},
  {key:'行動',  tips:'設定 25 分鐘番茄鐘，專注一件事。'},
  {key:'交流',  tips:'找一個人說說你的進展或卡點。'},
  {key:'洞察',  tips:'把今天的觀察寫成兩句話。'},
  {key:'願景',  tips:'把目標說得更具象：何時、何地、怎麼做。'}
];

// ---- UI ----
const $ = (s, el=document)=>el.querySelector(s);
const sliders = $('#sliders');
CHANNELS.forEach((c,i)=>{
  const row = document.createElement('div'); row.className='slider-row';
  row.innerHTML = `<div class="name">${c.key}</div>
    <input type="range" min="0" max="10" value="5" step="1" id="s${i}">
    <span id="v${i}">5</span>`;
  sliders.appendChild(row);
  $('#s'+i,row).addEventListener('input',e=>$('#v'+i,row).textContent=e.target.value);
});

$('#gen').addEventListener('click', ()=>{
  const scores = CHANNELS.map((_,i)=>+$('#s'+i).value);
  drawRadar(scores);
  const idx = scores.indexOf(Math.min(...scores));
  $('#focus').textContent = `${CHANNELS[idx].key}｜${CHANNELS[idx].tips}`;
  const advice = $('#advice'); advice.innerHTML='';
  CHANNELS.forEach((c,i)=>{
    const p = document.createElement('p'); p.innerHTML = `<b>${c.key}</b>：分數 ${scores[i]}，建議：${c.tips}`;
    advice.appendChild(p);
  });
  $('#result').hidden = false;
  saveHistory(scores);
  renderHistory();
});

// ---- radar ----
function drawRadar(scores){
  const cvs = $('#radar'), ctx = cvs.getContext('2d');
  ctx.clearRect(0,0,cvs.width,cvs.height);
  const cx=cvs.width/2, cy=cvs.height/2, r=140;
  // grid
  ctx.strokeStyle='#2b2741'; ctx.lineWidth=1;
  for(let ring=1; ring<=5; ring++){
    ctx.beginPath(); for(let i=0;i<7;i++){ const a=(i/7)*Math.PI*2 - Math.PI/2;
      const x=cx+Math.cos(a)*r*ring/5, y=cy+Math.sin(a)*r*ring/5; i?ctx.lineTo(x,y):ctx.moveTo(x,y); } ctx.closePath(); ctx.stroke();
  }
  // axes
  ctx.strokeStyle='#3a3558';
  for(let i=0;i<7;i++){ const a=(i/7)*Math.PI*2 - Math.PI/2;
    ctx.beginPath(); ctx.moveTo(cx,cy); ctx.lineTo(cx+Math.cos(a)*r, cy+Math.sin(a)*r); ctx.stroke();
  }
  // polygon
  ctx.beginPath();
  for(let i=0;i<7;i++){ const a=(i/7)*Math.PI*2 - Math.PI/2;
    const rr = r * (scores[i]/10);
    const x=cx+Math.cos(a)*rr, y=cy+Math.sin(a)*rr;
    i?ctx.lineTo(x,y):ctx.moveTo(x,y);
  }
  ctx.closePath();
  ctx.fillStyle='rgba(108,78,244,0.25)';
  ctx.strokeStyle='#6C4EF4'; ctx.lineWidth=2;
  ctx.fill(); ctx.stroke();
}

// ---- history ----
const KEY='enervi7_history';
function saveHistory(scores){
  const h = JSON.parse(localStorage.getItem(KEY)||'[]');
  h.unshift({ t: new Date().toISOString(), s: scores });
  localStorage.setItem(KEY, JSON.stringify(h.slice(0,100)));
}
function renderHistory(){
  const h = JSON.parse(localStorage.getItem(KEY)||'[]');
  const body = $('#history tbody'); body.innerHTML='';
  h.forEach(item=>{
    const tr=document.createElement('tr');
    tr.innerHTML=`<td>${new Date(item.t).toLocaleString()}</td><td>${item.s.join(' / ')}</td>`;
    body.appendChild(tr);
  });
}
$('#save').addEventListener('click', ()=>{
  alert('已儲存到瀏覽器（離線可用）。');
});
$('#export').addEventListener('click', ()=>{
  const h = JSON.parse(localStorage.getItem(KEY)||'[]');
  const rows = [['time', ...CHANNELS.map(c=>c.key)],
    ...h.map(x=>[x.t, ...x.s])];
  const csv = rows.map(r=>r.map(v=>`"${String(v).replaceAll('"','""')}"`).join(',')).join('\n');
  const blob = new Blob([csv], {type:'text/csv;charset=utf-8;'});
  const a=document.createElement('a'); a.href=URL.createObjectURL(blob); a.download='enervi7_history.csv'; a.click();
});

renderHistory();
