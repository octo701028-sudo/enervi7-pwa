/* Enervi7 PWA — app.js (正式版)
 * 功能：14 題分頁填寫＋進度、雷達圖(整合/Q/T)、
 * 摘要（主導階段＋前3瓶頸）、恆常行動建議、能量日誌(localStorage)、
 * 歷史走勢（近7次整合總分）、下載結果卡(PNG)。
 * 若未載入 Chart.js / html2canvas，會自動以 CDN 載入。
 * Build: 2025-08-22 11:30
 */
(() => {
  console.log('Enervi7 app.js build: 2025-08-22 11:30');

  // ---------- 工具：載入外部腳本 ----------
  const loadScript = (src) =>
    new Promise((res, rej) => {
      if ([...document.scripts].some(s => s.src.includes(src))) return res();
      const el = document.createElement('script');
      el.src = src; el.async = true;
      el.onload = res; el.onerror = () => rej(new Error(`load fail: ${src}`));
      document.head.appendChild(el);
    });

  async function ensureDeps() {
    if (!window.Chart) {
      await loadScript('https://cdn.jsdelivr.net/npm/chart.js@4.4.1/dist/chart.umd.min.js');
    }
    if (!window.html2canvas) {
      await loadScript('https://cdn.jsdelivr.net/npm/html2canvas@1.4.1/dist/html2canvas.min.js');
    }
  }

  // ---------- 題目文字 ----------
  const Q_TEXTS = [
    "Q1 覺察：我能清楚覺察自己此刻的情緒、念頭與身體感受。",
    "Q2 釋放：當我察覺壓力或情緒時，我能有效地鬆開與代謝。",
    "Q3 信任：我對生活與未來持有信任與安全感，能允許事情順勢發生。",
    "Q4 行動：我能把想法拆解成最小可行步驟，並付諸行動。",
    "Q5 流動：我能維持專注與節奏，接受回饋並快速微調。",
    "Q6 共鳴：我與他人／世界連結感良好，能創造正向回饋與影響。",
    "Q7 整合：我能總結經驗並固化成結構與習慣，持續複製成果。"
  ];
  const T_TEXTS = [
    "T1 覺察→釋放：看見情緒/議題時，我能順利進入釋放鬆綁。",
    "T2 釋放→信任：在放下之後，我能自然進入信任與允許。",
    "T3 信任→行動：把內在信任轉為具體行動的過程是順暢的。",
    "T4 行動→流動：從單次行動進入穩定節奏與回饋迭代是順暢的。",
    "T5 流動→共鳴：對外分享並獲得回饋與擴散是順暢的。",
    "T6 共鳴→整合：將被驗證的做法整理成 SOP/習慣是順暢的。",
    "T7 整合→新覺察：結束一輪後回到清明覺察開啟下一輪是順暢的。"
  ];

  // ---------- 七階/轉換 行動建議 ----------
  const STAGE_META = {
    S1: { name: "S1 覺察", keywords: ["覺知當下","辨識情緒","看見模式","誠實面對"],
      actions: ["寫三句『此刻我真實的感受是…』",
                "3 分鐘腹式呼吸（4-4-6）並記錄身體感受",
                "列出 1 個反覆念頭，標記：是事實還是解讀？"]},
    S2: { name: "S2 釋放", keywords: ["鬆綁負荷","情緒代謝","放下執著","完成回收"],
      actions: ["做一次『寫了就撕/燒』釋放書寫（2–3 段）",
                "身體掃描放鬆緊繃區(60 秒)",
                "將一件拖延小事今天完成並打勾"]},
    S3: { name: "S3 信任", keywords: ["允許發生","對齊意圖","資源感","安全感"],
      actions: ["用『我允許…』造句 3 句（對應今日焦點）",
                "回顧 1 次被支持的證據，寫下可複製點",
                "主動請求一次幫助（小範圍即可）"]},
    S4: { name: "S4 行動", keywords: ["最小步驟","可驗證","節奏","執行力"],
      actions: ["把目標拆成 10 分鐘可完成的一步，現在就做",
                "設定今日 3 件 MIT",
                "完成後『公開回報』給可信任對象"]},
    S5: { name: "S5 流動", keywords: ["專注","回饋循環","韌性","迭代"],
      actions: ["卡點→調整 1 個微策略（A/B 嘗試）",
                "25 分鐘番茄鐘全程專注",
                "記錄 1 個有效回饋，明天沿用"]},
    S6: { name: "S6 共鳴", keywords: ["連結","價值感","貢獻","擴散"],
      actions: ["分享一個小成果/洞見到社群",
                "邀請 1 人給具體回饋（3 句描述）",
                "發出一則合作邀請"]},
    S7: { name: "S7 整合", keywords: ["總結經驗","固化習慣","結構化","長期化"],
      actions: ["用 5 句話摘要本週 3 件學到＋1 改進",
                "把有效步驟寫成 Checklist 並固定到行程",
                "為下個週期設定 1 個可衡量指標（KPI）"]}
  };
  const TRANS_META = {
    T1: { label: "S1→S2（覺察→釋放）",
      tips: ["把『我觀察到…』改寫成『我願意放下…』×3","情緒書寫後做 60 秒身體放鬆"]},
    T2: { label: "S2→S3（釋放→信任）",
      tips: ["列 3 個現有資源（人/物/技能）","寫一段：若一切對我有利，今天我允許什麼？"]},
    T3: { label: "S3→S4（信任→行動）",
      tips: ["產出『最小可行步驟』並 10 分鐘內啟動","預約 1 個行動時段，只做準備清單"]},
    T4: { label: "S4→S5（行動→流動）",
      tips: ["記錄今日回饋並做 1 次微調","建立 25 分鐘專注儀式，結束回顧 2 分鐘"]},
    T5: { label: "S5→S6（流動→共鳴）",
      tips: ["公開分享 1 個進展，索取具體回饋","辨識最被共鳴的價值，明天主打"]},
    T6: { label: "S6→S7（共鳴→整合）",
      tips: ["把有效做法寫成 SOP/Checklist","選一個可持續節奏放進行事曆"]},
    T7: { label: "S7→S1（整合→新覺察）",
      tips: ["本週回顧 3 句＋下一輪新意圖 1 句","挑 1 個要精進的指標，設置觀測方式"]}
  };

  // ---------- Root 容器 ----------
  const host =
    document.getElementById('app') ||
    document.getElementById('enervi') ||
    document.querySelector('main') ||
    (() => { const d = document.createElement('div'); document.body.appendChild(d); return d; })();
  host.innerHTML = ""; // 清空舊內容
  const app = document.createElement('div');
  app.id = 'enervi-app';
  host.appendChild(app);

  // ---------- 狀態 ----------
  const state = {
    Q: Array(7).fill(5),
    T: Array(7).fill(5),
    touched: Array(14).fill(false),
    page: 1, // 1: Q, 2: T
    result: null,
    charts: { radar: null, trend: null }
  };

  // ---------- UI：標頭 + 分頁 ----------
  app.insertAdjacentHTML('afterbegin', `
    <style>
      .ev-container{max-width:1000px;margin:0 auto;padding:16px;}
      .ev-card{background:rgba(255,255,255,0.04);border-radius:14px;padding:16px;margin:12px 0;}
      .ev-row{display:flex;gap:12px;flex-wrap:wrap;}
      .ev-col{flex:1 1 300px}
      .ev-title{font-size:20px;font-weight:700;margin-bottom:8px}
      .ev-sub{opacity:.8;margin:6px 0 10px}
      .ev-tabs{display:flex;gap:10px; margin-bottom:8px; flex-wrap:wrap}
      .ev-tab{padding:8px 12px;border-radius:10px;background:rgba(255,255,255,.06);cursor:pointer;user-select:none}
      .ev-tab.active{background:#6b5bff;color:#fff}
      .ev-btn{padding:10px 14px;border-radius:10px;background:#6b5bff;color:#fff;border:none;cursor:pointer}
      .ev-btn.ghost{background:transparent;border:1px solid #6b5bff;color:#6b5bff}
      .ev-progress{height:8px;background:rgba(255,255,255,.08);border-radius:999px;overflow:hidden}
      .ev-progress > span{display:block;height:100%;background:#6b5bff;width:0%}
      .ev-slider{width:100%}
      .ev-mono{font-family:ui-monospace, SFMono-Regular, Menlo, Consolas, monospace}
      .ev-small{opacity:.8;font-size:12px}
      canvas{max-width:100%}
      .ev-kv{display:flex;gap:8px;flex-wrap:wrap}
      .ev-k{opacity:.8}
      .ev-v{font-weight:700}
      .ev-badge{display:inline-block;background:rgba(255,255,255,.08);padding:4px 8px;border-radius:8px;margin:2px 4px 0 0}
      .ev-list{margin:0;padding-left:16px}
      .ev-note{width:100%;min-height:110px;border-radius:12px;border:1px solid rgba(255,255,255,.12);background:transparent;color:inherit;padding:10px}
      .ev-right{display:flex;gap:8px;justify-content:flex-end;flex-wrap:wrap}
      .ev-muted{opacity:.7}
      .ev-danger{color:#ff7b7b}
      .ev-success{color:#73e673}
      .ev-link{color:#9ad; text-decoration:underline; cursor:pointer}
    </style>
    <div class="ev-container">
      <div class="ev-tabs" id="ev-tabs">
        <div class="ev-tab active" data-tab="fill">填題</div>
        <div class="ev-tab" data-tab="result">結果</div>
        <div class="ev-tab" data-tab="advice">建議</div>
        <div class="ev-tab" data-tab="journal">日誌</div>
      </div>
      <div id="ev-views"></div>
    </div>
  `);

  const views = document.getElementById('ev-views');

  // ---------- 視圖：填題 ----------
  function renderFill() {
    views.innerHTML = "";
    const total = 14;
    const answered = state.touched.reduce((a,b)=>a+(b?1:0),0);
    const progress = Math.round(answered/total*100);
    const pageTitle = state.page === 1 ? "七階題 Q1–Q7" : "七個轉換 T1–T7";
    const items = state.page === 1 ? Q_TEXTS : T_TEXTS;

    const card = document.createElement('div');
    card.className = 'ev-card';
    card.innerHTML = `
      <div class="ev-title">填寫 14 題</div>
      <div class="ev-sub">0–10 分。按「開始測驗」後立即顯示雷達圖、分數與瓶頸摘要。下方恆常顯示七階關鍵字／行動建議。</div>
      <div class="ev-progress" aria-label="progress"><span style="width:${progress}%"></span></div>
      <div class="ev-row" style="margin-top:8px">
        <div class="ev-col">
          <div class="ev-title">${pageTitle}</div>
          <div id="ev-sliders"></div>
          <div class="ev-right" style="margin-top:10px">
            ${state.page===2?'<button class="ev-btn ghost" id="ev-prev">上一頁</button>':''}
            ${state.page===1?'<button class="ev-btn" id="ev-next">下一頁</button>':'<button class="ev-btn" id="ev-submit">開始測驗</button>'}
          </div>
        </div>
      </div>
    `;
    views.appendChild(card);

    const wrap = document.getElementById('ev-sliders');
    items.forEach((text, idx) => {
      const gIdx = state.page===1 ? idx : (7+idx);
      const value = state.page===1 ? state.Q[idx] : state.T[idx];
      const id = `ev-range-${gIdx}`;
      const block = document.createElement('div');
      block.className = 'ev-card';
      block.innerHTML = `
        <div style="font-weight:600;margin-bottom:6px">${text}</div>
        <input type="range" min="0" max="10" step="1" value="${value}" class="ev-slider" id="${id}">
        <div class="ev-small">現在分數：<span class="ev-mono" id="${id}-v">${value}</span></div>
      `;
      wrap.appendChild(block);

      const rng = block.querySelector(`#${id}`);
      const label = block.querySelector(`#${id}-v`);
      rng.addEventListener('input', (e) => {
        const v = parseInt(e.target.value,10);
        label.textContent = v;
        if (state.page===1) state.Q[idx]=v; else state.T[idx]=v;
        state.touched[gIdx]=true;
        // 更新進度條
        const prog = document.querySelector('.ev-progress > span');
        const ans = state.touched.reduce((a,b)=>a+(b?1:0),0);
        prog.style.width = Math.round(ans/total*100)+'%';
      });
    });

    if (state.page===1) {
      document.getElementById('ev-next').onclick = () => { state.page=2; renderFill(); };
    } else {
      document.getElementById('ev-prev').onclick = () => { state.page=1; renderFill(); };
      document.getElementById('ev-submit').onclick = async () => {
        await onSubmit();
        switchTab('result');
      };
    }
  }

  // ---------- 計分 ----------
  function computeResult(Q, T) {
    // scale: 0..10 → 0..100
    const s = (x) => Math.round(x*10);
    // 整合：60% Q + 20% 前一轉換 + 20% 當前轉換
    const integ = Array(7).fill(0).map((_,i)=>{
      const prev = T[(i+6)%7], cur = T[i];
      return s(0.6*Q[i] + 0.2*prev + 0.2*cur);
    });
    const qOnly = Q.map(s);
    const tProj = Array(7).fill(0).map((_,i)=> s((T[(i+6)%7] + T[i]) / 2)); // 轉換投影到各階

    // 主導階段 & 前3瓶頸（轉換分最低）
    const dominant = integ
      .map((v,i)=>({i,v})).sort((a,b)=>b.v-a.v)[0].i; // index 0..6
    const bottle3 = T.map((v,i)=>({i,v:s(v)}))
      .sort((a,b)=>a.v-b.v).slice(0,3).map(x=>x.i); // indices

    return {
      radar:{integ,qOnly,tProj},
      dominant, bottle3,
      stages: integ,
      transitions: T.map(s),
      total: Math.round(integ.reduce((a,b)=>a+b,0)/7) // 整合總分（平均）
    };
  }

  // ---------- 提交 → 畫圖 + 儲存 ----------
  async function onSubmit() {
    await ensureDeps();
    state.result = computeResult(state.Q, state.T);
    drawResult();
    saveLog();
  }

  // ---------- 視圖：結果 ----------
  function renderResult() {
    views.innerHTML = `
      <div class="ev-card" id="result-card">
        <div class="ev-title">雷達圖（整合 / Q / T）</div>
        <div class="ev-small ev-muted">紫：整合（Q + 轉入/轉出加權）；灰：僅 Q；淡紫：僅 T 投影。</div>
        <canvas id="ev-radar" height="380"></canvas>
        <div class="ev-row">
          <div class="ev-col">
            <div class="ev-title" style="margin-top:6px">摘要</div>
            <div id="ev-summary"></div>
          </div>
          <div class="ev-col">
            <div class="ev-title" style="margin-top:6px">歷史走勢（近 7 次整合總分）</div>
            <canvas id="ev-trend" height="180"></canvas>
          </div>
        </div>
      </div>
      <div class="ev-right">
        <button class="ev-btn" id="ev-download">下載結果卡（PNG）</button>
        <button class="ev-btn ghost" id="ev-back">回到填題</button>
      </div>
    `;

    if (state.result) drawResult();
    document.getElementById('ev-download').onclick = downloadCard;
    document.getElementById('ev-back').onclick = () => switchTab('fill');
  }

  // ---------- 畫圖/摘要 ----------
  function drawResult() {
    const labels = ["安住","根基","感受","行動","交流","洞察","願景"]; // 依視覺順時針
    // Radar
    const ctx = document.getElementById('ev-radar').getContext('2d');
    if (state.charts.radar) { state.charts.radar.destroy(); }
    state.charts.radar = new Chart(ctx, {
      type:'radar',
      data:{
        labels,
        datasets:[
          {label:'整合', data:cycle(state.result.radar.integ),
           fill:true, borderColor:'#8b7bff', backgroundColor:'rgba(139,123,255,.22)', pointRadius:2, borderWidth:2},
          {label:'僅 Q', data:cycle(state.result.radar.qOnly),
           fill:false, borderColor:'#bbb', pointRadius:0, borderWidth:1},
          {label:'僅 T', data:cycle(state.result.radar.tProj),
           fill:false, borderColor:'rgba(139,123,255,.6)', borderDash:[6,4], pointRadius:0, borderWidth:1.5}
        ]
      },
      options:{
        responsive:true, maintainAspectRatio:false,
        scales:{ r:{ min:0, max:100, ticks:{ backdropColor:'transparent', color:'inherit' } } },
        plugins:{ legend:{ display:false } }
      }
    });

    // 摘要
    const domName = ["S1 覺察","S2 釋放","S3 信任","S4 行動","S5 流動","S6 共鳴","S7 整合"];
    const domId = ['S1','S2','S3','S4','S5','S6','S7'][state.result.dominant];
    const sumEl = document.getElementById('ev-summary');
    const bottle = state.result.bottle3.map(i=>`T${i+1} ${TRANS_META['T'+(i+1)].label}`).join('、 ');
    sumEl.innerHTML = `
      <div class="ev-kv"><span class="ev-k">主導階段：</span>
        <span class="ev-v">${domName[state.result.dominant]}</span>
        <span class="ev-badge">${STAGE_META[domId].keywords.join('、')}</span>
      </div>
      <div class="ev-kv"><span class="ev-k">瓶頸（前 3）：</span>
        <span class="ev-v">${bottle}</span></div>
      <div class="ev-small ev-muted" style="margin-top:6px">
        建議優先處理瓶頸轉換，搭配主導階段的關鍵字與行動，以形成正循環。
      </div>
    `;

    // 走勢（近 7 次整合總分）
    const logs = getLogs();
    const trend = logs.slice(-7).map(l=>l.total);
    const labelsT = logs.slice(-7).map(l=> timeLabel(l.ts));
    const tctx = document.getElementById('ev-trend').getContext('2d');
    if (state.charts.trend) state.charts.trend.destroy();
    state.charts.trend = new Chart(tctx, {
      type:'line',
      data:{ labels: labelsT, datasets:[{ data: trend, borderColor:'#8b7bff', backgroundColor:'rgba(139,123,255,.18)', fill:true, tension:.3, pointRadius:2 }]},
      options:{ scales:{y:{min:0,max:100}}, plugins:{legend:{display:false}}, responsive:true, maintainAspectRatio:false }
    });
  }
  const cycle = (arr)=>arr; // Chart.js 會自動首尾相接

  // ---------- 視圖：建議（恆常顯示） ----------
  function renderAdvice() {
    views.innerHTML = '';
    const card = document.createElement('div');
    card.className = 'ev-card';
    card.innerHTML = `<div class="ev-title">七階關鍵字 × 行動建議</div>`;
    views.appendChild(card);

    const wrap = document.createElement('div'); wrap.className = 'ev-row';
    card.appendChild(wrap);

    Object.keys(STAGE_META).forEach(k=>{
      const m = STAGE_META[k];
      const col = document.createElement('div'); col.className = 'ev-col ev-card';
      col.innerHTML = `
        <div class="ev-title">${m.name}</div>
        <div class="ev-small ev-muted">關鍵字</div>
        <div style="margin-bottom:6px">${m.keywords.map(x=>`<span class="ev-badge">${x}</span>`).join('')}</div>
        <div class="ev-small ev-muted">行動建議</div>
        <ul class="ev-list">${m.actions.map(a=>`<li>${a}</li>`).join('')}</ul>
      `;
      wrap.appendChild(col);
    });

    const trans = document.createElement('div');
    trans.className = 'ev-card';
    trans.innerHTML = `<div class="ev-title">瓶頸轉換的解卡建議（參考）</div>`;
    trans.innerHTML += Object.keys(TRANS_META).map(t=>{
      const m = TRANS_META[t];
      return `<div style="margin:8px 0"><div style="font-weight:600">${m.label}</div>
        <ul class="ev-list">${m.tips.map(x=>`<li>${x}</li>`).join('')}</ul></div>`;
    }).join('');
    views.appendChild(trans);
  }

  // ---------- 視圖：日誌 ----------
  function renderJournal() {
    views.innerHTML = `
      <div class="ev-card">
        <div class="ev-title">能量日誌</div>
        <div class="ev-sub ev-muted">會儲存在本機（localStorage）。先產生結果再保存，可一併記錄本次分數。</div>
        <textarea class="ev-note" id="ev-note" placeholder="想記下什麼？（可留空）"></textarea>
        <div class="ev-right" style="margin-top:8px">
          <button class="ev-btn" id="ev-save">保存日誌</button>
          <button class="ev-btn ghost" id="ev-clear">清空全部日誌</button>
        </div>
      </div>
      <div class="ev-card">
        <div class="ev-title">歷史紀錄</div>
        <div id="ev-logs" class="ev-small"></div>
      </div>
    `;
    document.getElementById('ev-save').onclick = () => {
      const msg = document.getElementById('ev-note').value.trim();
      if (!state.result) { alert("請先完成一次『開始測驗』再保存日誌喔！"); return; }
      saveLog(msg, true);
      renderJournal();
      alert('已保存到本機。');
    };
    document.getElementById('ev-clear').onclick = () => {
      if (confirm('確定清空所有本機日誌？此動作無法復原。')) {
        localStorage.removeItem('enervi7_logs');
        renderJournal();
      }
    };
    // 列表
    const logs = getLogs().slice().reverse();
    const box = document.getElementById('ev-logs');
    if (!logs.length) { box.innerHTML = '<div class="ev-muted">尚無資料。</div>'; return; }
    box.innerHTML = logs.map(l=> {
      const tag = l.note ? ` — <span class="ev-muted">${escapeHTML(l.note).slice(0,40)}</span>` : '';
      return `<div style="margin:6px 0">
        <span class="ev-mono">${timeLabel(l.ts)}</span>
        <span class="ev-badge">整合 ${l.total}</span>${tag}
      </div>`;
    }).join('');
  }

  // ---------- 儲存/讀取 log ----------
  function saveLog(note = '', addNow = false) {
    const logs = getLogs();
    const rec = {
      ts: Date.now(),
      Q: state.Q.slice(),
      T: state.T.slice(),
      stages: state.result.stages,
      transitions: state.result.transitions,
      total: state.result.total,
      note: note || ''
    };
    if (addNow) logs.push(rec);
    else {
      // 自動保存（提交時）也要留，但不覆蓋手寫 note
      logs.push(rec);
    }
    // 只保留最近 50 筆
    while (logs.length > 50) logs.shift();
    localStorage.setItem('enervi7_logs', JSON.stringify(logs));
  }
  function getLogs() {
    try {
      return JSON.parse(localStorage.getItem('enervi7_logs') || '[]');
    } catch { return []; }
  }
  function timeLabel(ts) {
    const d = new Date(ts);
    const z = (n)=> String(n).padStart(2,'0');
    return `${d.getFullYear()}-${z(d.getMonth()+1)}-${z(d.getDate())} ${z(d.getHours())}:${z(d.getMinutes())}`;
  }
  const escapeHTML = s => s.replace(/[&<>"']/g, c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));

  // ---------- 下載結果卡 ----------
  async function downloadCard() {
    await ensureDeps();
    const node = document.getElementById('result-card');
    html2canvas(node, {scale:2, backgroundColor:null}).then(cv=>{
      const a = document.createElement('a');
      a.download = `Enervi7_${timeLabel(Date.now()).replace(/[: ]/g,'-')}.png`;
      a.href = cv.toDataURL('image/png');
      a.click();
    });
  }

  // ---------- 分頁切換 ----------
  function switchTab(tab) {
    // tab header
    document.querySelectorAll('#ev-tabs .ev-tab').forEach(el=>{
      el.classList.toggle('active', el.dataset.tab === tab);
    });
    if (tab === 'fill') renderFill();
    if (tab === 'result') renderResult();
    if (tab === 'advice') renderAdvice();
    if (tab === 'journal') renderJournal();
    window.scrollTo({top:0,behavior:'smooth'});
  }
  document.getElementById('ev-tabs').addEventListener('click', e=>{
    const t = e.target.closest('.ev-tab'); if (!t) return;
    switchTab(t.dataset.tab);
  });

  // ---------- 初始化 ----------
  renderFill();
})();