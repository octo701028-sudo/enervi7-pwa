// Enervi7 app.js v9
(function(){
  // ---- CDN auto loader for Chart.js and html2canvas ----
  function ensureScript(src){return new Promise((res,rej)=>{const s=document.createElement('script');s.src=src;s.onload=res;s.onerror=rej;document.head.appendChild(s);});}
  const needChart = (typeof window.Chart === 'undefined');
  const needHtml2 = (typeof window.html2canvas === 'undefined');
  const loaders = [];
  if(needChart) loaders.push(ensureScript('https://cdn.jsdelivr.net/npm/chart.js'));
  if(needHtml2) loaders.push(ensureScript('https://cdn.jsdelivr.net/npm/html2canvas@1.4.1/dist/html2canvas.min.js'));
  Promise.all(loaders).then(start).catch(start);

  // ---- constants ----
  const STAGES = ['S1 覺察','S2 釋放','S3 信任','S4 行動','S5 流動','S6 共鳴','S7 整合'];
  const Q_TEXTS = [
    'Q1 覺察：我能清楚覺察自己此刻的情緒、念頭與身體感受。',
    'Q2 釋放：當我察覺壓力或情緒時，我能有效地鬆開與代謝。',
    'Q3 信任：我對生活與未來持有信任與安全感，能允許事情順勢發生。',
    'Q4 行動：我能把想法拆解成最小可行步驟，並付諸行動。',
    'Q5 流動：我能維持專注與節奏，接受回饋並快速微調。',
    'Q6 共鳴：我與他人/世界連結感良好，能創造正向回饋與影響。',
    'Q7 整合：我能總結經驗並固化成結構與習慣，持續複製成果。'
  ];
  const T_TEXTS = [
    'T1 覺察→釋放：看見情緒或議題時，我能順利進入釋放與鬆綁。',
    'T2 釋放→信任：在放下之後，我能自然進入信任與允許的狀態。',
    'T3 信任→行動：從內在信任轉為具體行動的過程對我來說是順暢的。',
    'T4 行動→流動：從單次行動進入穩定節奏與回饋迭代是順暢的。',
    'T5 流動→共鳴：把成果對外分享並獲得回饋與擴散是順暢的。',
    'T6 共鳴→整合：將被驗證的做法整理成 SOP/習慣是順暢的。',
    'T7 整合→新覺察：結束一輪後回到清明覺察開啟下一輪是順暢的。'
  ];

  // ---- UI build sliders ----
  const qGroup = document.getElementById('qGroup');
  const tGroup = document.getElementById('tGroup');
  const bar = document.getElementById('bar');
  function sliderRow(text, id, def=5){
    const wrap = document.createElement('div');
    wrap.className='card';
    wrap.style.padding='10px';
    wrap.innerHTML = `<div style="font-weight:600;margin-bottom:6px">${text}</div>
      <input type="range" min="0" max="10" step="1" value="${def}" id="${id}" oninput="this.nextElementSibling.innerText='目前分數：'+this.value">
      <div class="sub">目前分數：${def}</div>`;
    return wrap;
  }
  for(let i=0;i<7;i++) qGroup.appendChild(sliderRow(Q_TEXTS[i], `Q${i+1}`));
  for(let i=0;i<7;i++) tGroup.appendChild(sliderRow(T_TEXTS[i], `T${i+1}`));
  function updateProgress(){
    // count sliders present
    const sliders = document.querySelectorAll('input[type=range]');
    let filled = 0;
    sliders.forEach(s=>{ if(s.value!=='' ) filled++; });
    bar.style.width = Math.round(filled/(sliders.length||1)*100)+'%';
  }
  document.addEventListener('input', e=>{ if(e.target.type==='range') updateProgress(); });
  updateProgress();

  // ---- compute ----
  function compute(answers, penalty=false, tau=4.0, delta=0.3){
    const Q = Array.from({length:7}, (_,i)=> Number(answers['Q'+(i+1)]||0));
    const T = Array.from({length:7}, (_,i)=> Number(answers['T'+(i+1)]||0));
    const wQ=0.60, wPrev=0.20, wNext=0.20;
    const stagesRaw=[];
    for(let i=0;i<7;i++){
      const prev_t=T[(i+6)%7], next_t=T[i];
      let val = wQ*Q[i] + wPrev*prev_t + wNext*next_t;
      if(penalty){
        if(prev_t<tau) val -= delta;
        if(next_t<tau) val -= delta;
        val = Math.max(0,val);
      }
      stagesRaw.push(val);
    }
    const S = stagesRaw.map(v=> Math.round(v*10)/1 ); // 0..100
    const TT = T.map(v=> Math.round(v*10)/1 );
    const dominant = S.indexOf(Math.max(...S));
    const bottleneckIdx = TT.map((v,i)=>[v,i]).sort((a,b)=>a[0]-b[0]).slice(0,2).map(x=>'T'+(x[1]+1));
    return {S,TT,dominant:'S'+(dominant+1), bottlenecks:bottleneckIdx};
  }

  // ---- advice cards ----
  const adviceWrap = document.getElementById('advice');
  const ADVICE = {
    S1:{k:['覺知當下','辨識情緒','看見模式','誠實面對'], a:['寫三句「此刻我真實的感受是…」','3 分鐘腹式呼吸（4-4-6）','列出 1 個反覆念頭，標記是事實/解讀？']},
    S2:{k:['鬆綁負荷','情緒代謝','放下執著','完成回收'], a:['做一次「寫了就撕/燒」釋放書寫','身體掃描 60 秒放鬆','完成一件拖延小事並打勾']},
    S3:{k:['允許發生','對齊意圖','資源感','安全感'], a:['用「我允許…」造句 3 句','回顧一次被支持的證據','今天主動請求一次幫助']},
    S4:{k:['最小步驟','可驗證','節奏','執行力'], a:['把目標拆成 10 分鐘一步，現在就做','設定今日 3 件 MIT','完成後公開回報給可信任對象']},
    S5:{k:['專注','回饋循環','韌性','迭代'], a:['做 25 分鐘番茄鐘','A/B 嘗試微調一個策略','記錄 1 個有效回饋，明天沿用']},
    S6:{k:['連結','價值感','貢獻','擴散'], a:['分享一個小成果到社群','邀請 1 人給具體回饋','主動建立一個合作可能']},
    S7:{k:['總結經驗','固化習慣','結構化','長期化'], a:['用 5 句話摘要本週重點','把有效步驟寫成 Checklist','為下輪設定一個可衡量指標']}
  };
  function renderAdvice(){
    adviceWrap.innerHTML='';
    const grid=document.createElement('div');grid.className='grid-2';
    ['S1','S2','S3','S4','S5','S6','S7'].forEach(s=>{
      const c=document.createElement('div');c.className='card';
      const k=ADVICE[s];
      c.innerHTML = `<div class="h">${s} ${['覺察','釋放','信任','行動','流動','共鳴','整合'][Number(s[1])-1]}</div>
        <div class="sub">關鍵字：${k.k.join('、')}</div>
        <ul style="margin:8px 0 0 18px">${k.a.map(x=>`<li>${x}</li>`).join('')}</ul>`;
      grid.appendChild(c);
    });
    adviceWrap.appendChild(grid);
  }
  renderAdvice();

  // ---- Render scores and charts ----
  let radarChart=null, trendChart=null;
  function drawRadar(S, Q, T){
    const ctx = document.getElementById('radar').getContext('2d');
    if(radarChart) radarChart.destroy();
    radarChart = new Chart(ctx, {
      type:'radar',
      data:{
        labels: STAGES,
        datasets:[
          {label:'整合', data:S, fill:true, borderColor:'#a48aff', backgroundColor:'rgba(164,138,255,.18)', pointBackgroundColor:'#a48aff'},
          {label:'僅 Q', data:Q.map(x=>x*10), fill:false, borderColor:'#8b819d', backgroundColor:'rgba(0,0,0,0)'},
          {label:'僅 T', data:T.map(x=>x*10), fill:false, borderColor:'rgba(164,138,255,.6)', backgroundColor:'rgba(0,0,0,0)'}
        ]
      },
      options:{
        responsive:true, maintainAspectRatio:false,
        scales:{ r:{ suggestedMin:0, suggestedMax:100, ticks:{ stepSize:20, color:'#bfb7e8' }, grid:{ color:'rgba(255,255,255,.10)' }, angleLines:{ color:'rgba(255,255,255,.12)' } } },
        plugins:{ legend:{ display:false } }
      }
    });
  }

  function renderScores(res){
    const box=document.getElementById('scores');
    let html = '<div class="kv">';
    for(let i=0;i<7;i++){
      const v=res.S[i], level = v<40?'低':(v<70?'中':'高');
      html += `<div class="row"><div>${STAGES[i]}</div><div>${v}</div><div>${level}</div></div>`;
    }
    html+='</div><hr class="sep"><div class="kv">';
    for(let i=0;i<7;i++){
      const v=res.TT[i], level = v<40?'低':(v<70?'中':'高');
      html += `<div class="row"><div>T${i+1}</div><div>${v}</div><div>${level}</div></div>`;
    }
    html+='</div>';
    box.innerHTML = html;
  }

  // ---- History (local) ----
  function loadHist(){ try{ return JSON.parse(localStorage.getItem('enervi7_hist')||'[]'); }catch(e){ return []; } }
  function saveHist(item){
    const hist = loadHist(); hist.unshift(item); while(hist.length>50) hist.pop();
    localStorage.setItem('enervi7_hist', JSON.stringify(hist));
  }
  function drawTrend(){
    const hist = loadHist();
    const ctx = document.getElementById('trend').getContext('2d');
    if(trendChart) trendChart.destroy();
    if(hist.length===0){ ctx.canvas.parentElement.nextElementSibling?.remove(); return; }
    const last7 = hist.slice(0,7);
    const avg = new Array(7).fill(0);
    last7.forEach(h=>h.S.forEach((v,i)=>avg[i]+=v));
    for(let i=0;i<7;i++) avg[i] = Math.round((avg[i]/last7.length)*10)/10;
    trendChart = new Chart(ctx, {
      type:'bar',
      data:{ labels: STAGES, datasets:[{label:'最近 7 次平均', data: avg, backgroundColor:'rgba(127,91,255,.35)', borderColor:'#7f5bff'}] },
      options:{ responsive:true, maintainAspectRatio:false, scales:{ y:{ suggestedMax:100 } }, plugins:{ legend:{ display:false } } }
    });
  }

  // ---- Start button ----
  document.getElementById('startBtn').addEventListener('click', ()=>{
    const ans = {};
    for(let i=1;i<=7;i++){ ans['Q'+i] = Number(document.getElementById('Q'+i).value); }
    for(let i=1;i<=7;i++){ ans['T'+i] = Number(document.getElementById('T'+i).value); }
    const penalty = document.getElementById('penalty').checked;
    const tau = Number(document.getElementById('tau').value);
    const delta = Number(document.getElementById('delta').value);
    const res = compute(ans, penalty, tau, delta);
    const summary = document.getElementById('summary');
    summary.textContent = `主導階段：${res.dominant} ｜ 瓶頸：${res.bottlenecks.join('、')}`;

    renderScores(res);
    drawRadar(res.S, [ans.Q1,ans.Q2,ans.Q3,ans.Q4,ans.Q5,ans.Q6,ans.Q7], [ans.T1,ans.T2,ans.T3,ans.T4,ans.T5,ans.T6,ans.T7]);
    document.getElementById('resultWrap').style.display='block';

    // save history
    saveHist({date:Date.now(), S:res.S, TT:res.TT});
    drawTrend();
  });

  // ---- save PNG ----
  document.getElementById('savePng').addEventListener('click', async ()=>{
    const card = document.getElementById('resultWrap');
    const canvas = await html2canvas(card, {backgroundColor:'#0f0b1c', scale:2});
    const link = document.createElement('a');
    link.download = 'enervi7-result.png';
    link.href = canvas.toDataURL('image/png');
    link.click();
  });

  // ---- Log ----
  document.getElementById('saveLog').addEventListener('click', ()=>{
    const txt = document.getElementById('note').value.trim();
    if(!txt) return alert('請寫點什麼再存～');
    const logs = JSON.parse(localStorage.getItem('enervi7_notes')||'[]');
    logs.unshift({t:Date.now(), note:txt});
    localStorage.setItem('enervi7_notes', JSON.stringify(logs));
    document.getElementById('note').value='';
    alert('已儲存到本地日誌（僅此裝置可見）');
  });

  // ---- SW register + reset hook ----
  if('serviceWorker' in navigator){
    const url = new URL(location.href);
    if(url.searchParams.get('reset')==='1'){
      // unregister & clear caches
      navigator.serviceWorker.getRegistrations().then(rs=>Promise.all(rs.map(r=>r.unregister()))).then(()=>caches.keys().then(keys=>Promise.all(keys.map(k=>caches.delete(k))))).then(()=>location.replace(url.origin+url.pathname));
    }else{
      navigator.serviceWorker.register('./sw.js?v=v9');
    }
  }
})();