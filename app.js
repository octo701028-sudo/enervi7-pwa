/* =========================================================
 * Enervi 7 — PWA 正式版 app.js
 * - 分頁填寫（14 題，進度條）
 * - 雷達圖：整合(Q+T加權)、僅Q、僅T
 * - 摘要：主導階段、瓶頸轉換（最低兩個T）
 * - 七階行動建議（恆常顯示）
 * - 能量日誌（本地保存）＋ 歷史走勢（近7次）
 * - 一鍵下載結果卡（PNG）
 * 依賴：Chart.js（若未載入會自動以 CDN 載入）
 * ========================================================= */

(() => {
  const $ = (s, r = document) => r.querySelector(s);
  const nowISO = () => new Date().toISOString();
  const clamp = (n,a,b)=>Math.min(Math.max(n,a),b);

  // ===== 0) 若無 Chart.js，動態載入 =====
  function ensureChart() {
    return new Promise((res, rej) => {
      if (window.Chart) return res();
      const s = document.createElement("script");
      s.src = "https://cdn.jsdelivr.net/npm/chart.js";
      s.onload = () => res();
      s.onerror = () => rej(new Error("Chart.js 載入失敗"));
      document.head.appendChild(s);
    });
  }

  // ===== 1) 文案 / 試題 =====
  const Q_TEXTS = {
    Q1:"Q1 覺察：我能清楚覺察自己此刻的情緒、念頭與身體感受。",
    Q2:"Q2 釋放：當我察覺壓力或情緒時，我能有效地鬆開與代謝。",
    Q3:"Q3 信任：我對生活與未來持有信任與安全感，能允許事情順勢發生。",
    Q4:"Q4 行動：我能把想法拆解成最小可行步驟，並付諸行動。",
    Q5:"Q5 流動：我能維持專注與節奏，接受回饋並快速微調。",
    Q6:"Q6 共鳴：我與他人／世界連結感良好，能創造正向回饋與影響。",
    Q7:"Q7 整合：我能總結經驗並固化成結構與習慣，持續複製成果。"
  };
  const T_TEXTS = {
    T1:"T1 覺察→釋放：當我看見情緒或議題時，我能順利進入釋放與鬆綁。",
    T2:"T2 釋放→信任：在放下之後，我能自然進入信任與允許的狀態。",
    T3:"T3 信任→行動：從內在信任轉為具體行動的過程對我來說是順暢的。",
    T4:"T4 行動→流動：從單次行動進入穩定節奏與回饋迭代是順暢的。",
    T5:"T5 流動→共鳴：把成果對外分享並獲得回饋與擴散是順暢的。",
    T6:"T6 共鳴→整合：將被驗證的做法整理成 SOP／習慣是順暢的。",
    T7:"T7 整合→新覺察：結束一輪後回到清明覺察開啟下一輪是順暢的。"
  };
  const STAGE_NAMES = ["覺察","釋放","信任","行動","流動","共鳴","整合"];

  const STAGE_META = {
    S1:{name:"S1 覺察 Awareness",keywords:["覺知當下","辨識情緒","看見模式","誠實面對"],actions:[
      "寫三句『此刻我真實的感受是…』","3 分鐘腹式呼吸（4-4-6）並記錄身體感受","列出 1 個反覆出現的念頭，標記：是事實還是解讀？"
    ]},
    S2:{name:"S2 釋放 Release",keywords:["鬆綁負荷","情緒代謝","放下執著","完成回收"],actions:[
      "做一次『寫了就撕/燒』釋放書寫（2–3 段）","身體掃描，對緊繃部位做 60 秒放鬆","將一件拖延小事今天完成並打勾"
    ]},
    S3:{name:"S3 信任 Trust",keywords:["允許發生","對齊意圖","資源感","安全感"],actions:[
      "用『我允許…』造句 3 句（對應今日焦點）","回顧 1 次被支持的證據，寫下為何可複製","今天主動請求一次幫助（小範圍即可）"
    ]},
    S4:{name:"S4 行動 Action",keywords:["最小步驟","可驗證","節奏","執行力"],actions:[
      "把目標拆成 10 分鐘可完成的一步，現在就做","設定今日 3 件 MIT","完成後『公開回報』給可信任對象"
    ]},
    S5:{name:"S5 流動 Flow",keywords:["專注","回饋循環","韌性","迭代"],actions:[
      "把卡點→調整 1 個微策略（A/B 嘗試）","25 分鐘番茄鐘全程專注","記錄 1 個有效回饋，明天沿用"
    ]},
    S6:{name:"S6 共鳴 Resonance",keywords:["連結","價值感","貢獻","擴散"],actions:[
      "分享一個小成果或洞見到社群／朋友","邀請 1 人給具體回饋（3 句具體描述）","主動建立一個合作可能（發出一則邀請）"
    ]},
    S7:{name:"S7 整合 Integration",keywords:["總結經驗","固化習慣","結構化","長期化"],actions:[
      "用 5 句話摘要本週 3 件學到＋1 改進","把有效步驟寫成 Checklist 並固定到行程","為下個週期設定一個可衡量指標（KPI）"
    ]}
  };
  const TRANS_META = {
    T1:{label:"S1→S2（覺察→釋放）"},
    T2:{label:"S2→S3（釋放→信任）"},
    T3:{label:"S3→S4（信任→行動）"},
    T4:{label:"S4→S5（行動→流動）"},
    T5:{label:"S5→S6（流動→共鳴）"},
    T6:{label:"S6→S7（共鳴→整合）"},
    T7:{label:"S7→S1（整合→新覺察）"},
  };

  // ===== 2) 狀態（LS）=====
  const LS_ANS = "enervi7_ans_v3";
  const LS_JOURNAL = "enervi7_journal_v1";
  const LS_HISTORY = "enervi7_hist_v1"; // [{ts, avg}]
  let answers = load(LS_ANS) || initAnswers(); // 14 sliders 0..10
  let journal = (load(LS_JOURNAL) || "").toString();
  let history = load(LS_HISTORY) || [];
  let step = 0; // 0..(pages-1)

  function initAnswers(){
    const o={};
    for(let i=1;i<=7;i++){ o["Q"+i]=5; o["T"+i]=5; }
    return o;
  }
  function save(k,v){ try{ localStorage.setItem(k, JSON.stringify(v)); }catch{} }
  function load(k){ try{ return JSON.parse(localStorage.getItem(k)||"null"); }catch{ return null; } }

  // ===== 3) 計分 =====
  function compute(answers, usePenalty=false, tau=4.0, delta=0.3){
    const Q = Array.from({length:7},(_,i)=>Number(answers["Q"+(i+1)]||0));
    const T = Array.from({length:7},(_,i)=>Number(answers["T"+(i+1)]||0));
    const wQ=0.60, wPrev=0.20, wNext=0.20;
    const stagesRaw=[];
    for(let i=0;i<7;i++){
      const prev=T[(i+6)%7], next=T[i];
      let v=wQ*Q[i]+wPrev*prev+wNext*next;
      if(usePenalty){
        if(prev<tau) v-=delta;
        if(next<tau) v-=delta;
        v=Math.max(0,v);
      }
      stagesRaw.push(v);
    }
    const integrated = stagesRaw.map(v => +(v*10).toFixed(1)); // 0..100
    const qOnly = Q.map(v => +(v*10).toFixed(1));
    const tOnly = T.map(v => +(v*10).toFixed(1));
    const dominant = integrated.indexOf(Math.max(...integrated));
    const tSorted = tOnly.map((v,i)=>({v,i})).sort((a,b)=>a.v-b.v).slice(0,2).map(x=>x.i);
    const avg = Math.round(integrated.reduce((a,b)=>a+b,0)/7);
    return {integrated,qOnly,tOnly,dominant, tLowIdx: tSorted, avg};
  }

  // ===== 4) 介面 =====
  document.addEventListener("DOMContentLoaded", async () => {
    injectStyle();
    buildShell();
    buildPager();
    buildAdvice();
    // 恢復日誌
    $("#journal").value = journal;

    await ensureChart();
    if (answers) showResult(); // 有舊資料自動出圖
  });

  function injectStyle(){
    const css = `
      :root{--brand:#7a52f4;--bg:#0f1017;--card:#141527;--muted:#aab}
      body{margin:0;background:var(--bg);color:#eef;font-family:-apple-system,BlinkMacSystemFont,"Noto Sans TC","PingFang TC","Segoe UI",system-ui,sans-serif}
      .wrap{max-width:980px;margin:0 auto;padding:16px}
      .header{position:sticky;top:0;z-index:10;background:linear-gradient(180deg,var(--brand),rgba(122,82,244,.5));padding:14px 16px;font-weight:800;border-bottom-left-radius:14px;border-bottom-right-radius:14px}
      .card{background:var(--card);border:1px solid rgba(255,255,255,.06);border-radius:14px;padding:16px;margin:14px 0}
      .title{font-weight:800;font-size:18px;margin-bottom:8px}
      .muted{color:var(--muted)}
      .btn{display:inline-flex;justify-content:center;align-items:center;gap:8px;background:var(--brand);color:#fff;border:0;border-radius:12px;padding:12px 16px;font-weight:800;cursor:pointer;width:100%}
      .row{display:grid;grid-template-columns:1fr;gap:12px}
      @media(min-width:760px){.row.two{grid-template-columns:1fr 1fr}}
      .pill{display:inline-block;background:#e9d9ff;color:#3d2a7a;border-radius:999px;padding:6px 10px;margin:2px 6px 0 0;font-size:12px}
      .progress{height:8px;background:rgba(255,255,255,.08);border-radius:999px;overflow:hidden}
      .bar{height:8px;background:#8f73ff;width:0%}
      .q{margin:10px 0}
      .q label{display:block;margin-bottom:6px}
      .ctrl{display:flex;gap:10px}
      textarea{width:100%;min-height:96px;border-radius:10px;border:1px solid rgba(255,255,255,.1);background:#0f0f19;color:#eef;padding:10px}
      canvas{max-width:100%}
      table{width:100%;border-collapse:collapse}
      td{border-bottom:1px solid rgba(255,255,255,.08);padding:6px 0}
    `;
    const s=document.createElement("style"); s.textContent=css; document.head.appendChild(s);
  }

  function buildShell(){
    const root = $("#app") || document.body.appendChild(Object.assign(document.createElement("div"),{id:"app"}));
    root.innerHTML = `
      <div class="header">Enervi 7 — 每日量測</div>
      <div class="wrap">
        <div class="card" id="wizard">
          <div class="title">填寫 14 題（分頁）</div>
          <div class="muted" style="margin-bottom:8px">0–10 分。完成一頁按「下一步」。</div>
          <div class="progress"><div id="bar" class="bar"></div></div>
          <div id="page"></div>
          <div class="ctrl" style="margin-top:10px">
            <button id="prev" class="btn" style="opacity:.9">⬅ 上一頁</button>
            <button id="next" class="btn">下一步 ➡</button>
          </div>
        </div>

        <div class="card" id="resultCard" style="display:none">
          <div class="title">雷達圖（整合 / Q / T）</div>
          <canvas id="radar" height="340"></canvas>
          <div class="row two" style="margin-top:10px">
            <div>
              <div class="title" style="font-size:16px">七階分數（0–100）</div>
              <div id="stageList"></div>
            </div>
            <div>
              <div class="title" style="font-size:16px">摘要</div>
              <div id="summary"></div>
              <div style="margin-top:10px">
                <button id="dlCard" class="btn">🖼 下載結果卡</button>
              </div>
            </div>
          </div>
          <div style="margin-top:14px">
            <div class="title" style="font-size:16px">歷史走勢（近 7 次平均）</div>
            <canvas id="trend" height="160"></canvas>
          </div>
        </div>

        <div class="card">
          <div class="title">能量日誌（可選）</div>
          <textarea id="journal" placeholder="寫下今天的感受或想做的行動…"></textarea>
          <div class="ctrl" style="margin-top:8px">
            <button id="saveJ" class="btn">💾 保存日誌</button>
          </div>
        </div>

        <div class="card">
          <div class="title">七階關鍵字 × 行動建議（恆常顯示）</div>
          <div id="advice"></div>
        </div>
      </div>
    `;

    $("#prev").addEventListener("click", () => goto(step-1));
    $("#next").addEventListener("click", () => {
      if (step < PAGES.length-1) goto(step+1);
      else { // 完成
        showResult(true);
        $("#resultCard").style.display="";
        $("#resultCard").scrollIntoView({behavior:"smooth", block:"start"});
      }
    });
    $("#saveJ").addEventListener("click", () => {
      journal = $("#journal").value || "";
      save(LS_JOURNAL, journal);
      alert("已保存到本機。");
    });
    $("#dlCard").addEventListener("click", downloadResultCard);
  }

  // ===== 5) 分頁內容 =====
  const PAGES = [
    // Q1–Q3
    ["Q1","Q2","Q3"],
    // Q4–Q7
    ["Q4","Q5","Q6","Q7"],
    // T1–T4
    ["T1","T2","T3","T4"],
    // T5–T7 + 完成
    ["T5","T6","T7"]
  ];

  function buildPager(){ renderPage(); updateBar(); }
  function goto(n){ step = clamp(n,0,PAGES.length-1); renderPage(); updateBar(); }
  function updateBar(){
    const percent = Math.round(((step) / (PAGES.length-1)) * 100);
    $("#bar").style.width = percent + "%";
    $("#prev").disabled = (step===0);
    $("#next").textContent = (step===PAGES.length-1) ? "✨ 產生結果" : "下一步 ➡";
  }
  function renderPage(){
    const box = $("#page"); box.innerHTML="";
    PAGES[step].forEach(k=>{
      const text = (Q_TEXTS[k] || T_TEXTS[k]);
      const val = Number(answers[k] ?? 5);
      const row = document.createElement("div");
      row.className="q";
      row.innerHTML = `
        <label>${text}</label>
        <input type="range" id="${k}" min="0" max="10" step="1" value="${val}">
        <div class="muted">現在分數：<b id="${k}-v">${val}</b></div>
      `;
      box.appendChild(row);
      $("#"+k).addEventListener("input", e => {
        const v = Number(e.target.value);
        answers[k]=v;
        $("#"+k+"-v").textContent = v;
        save(LS_ANS, answers);
      });
    });
  }

  // ===== 6) 繪圖 + 摘要 =====
  let radar, trend;
  async function showResult(pushHist=false){
    await ensureChart();
    const r = compute(answers, false); // 懲罰可選，先關閉以穩定體驗
    drawRadar(r);
    renderStageList(r);
    renderSummary(r);
    $("#resultCard").style.display="";
    if (pushHist) {
      history.push({ts: nowISO(), avg: r.avg});
      if (history.length>30) history = history.slice(-30);
      save(LS_HISTORY, history);
    }
    drawTrend();
  }

  function drawRadar(r){
    const labels = STAGE_NAMES.map((n,i)=>`S${i+1} ${n}`);
    const ctx = $("#radar").getContext("2d");
    if (radar) radar.destroy();
    radar = new Chart(ctx,{
      type:"radar",
      data:{
        labels,
        datasets:[
          {label:"整合",data:r.integrated, borderColor:"#7a52f4", backgroundColor:"rgba(122,82,244,.18)", borderWidth:2, pointRadius:2},
          {label:"僅 Q",data:r.qOnly, borderColor:"#aab", backgroundColor:"rgba(170,170,187,.12)", borderDash:[6,6], borderWidth:2, pointRadius:0},
          {label:"僅 T",data:r.tOnly, borderColor:"#5ad1a6", backgroundColor:"rgba(90,209,166,.12)", borderDash:[3,5], borderWidth:2, pointRadius:0}
        ]
      },
      options:{
        responsive:true, animation:false,
        scales:{ r:{min:0,max:100,ticks:{stepSize:20,color:"#aab",backdropColor:"transparent"},
                    grid:{color:"rgba(255,255,255,.10)"}, angleLines:{color:"rgba(255,255,255,.10)"},
                    pointLabels:{color:"#dde",font:{size:12}} } },
        plugins:{ legend:{labels:{color:"#dde"}} }
      }
    });
  }

  function renderStageList(r){
    const box=$("#stageList"); box.innerHTML="";
    r.integrated.forEach((v,i)=>{
      const level = v<40?"低":(v<70?"中":"高");
      const row = document.createElement("div");
      row.innerHTML = `<table><tr><td>S${i+1} ${STAGE_NAMES[i]}</td><td style="text-align:right">${v.toFixed(1)}（${level}）</td></tr></table>`;
      box.appendChild(row);
    });
  }

  function renderSummary(r){
    const dom = `S${r.dominant+1} ${STAGE_META["S"+(r.dominant+1)].name}`;
    const [t1,t2] = r.tLowIdx.map(i=>`T${i+1} ${TRANS_META["T"+(i+1)].label}`);
    $("#summary").innerHTML = `
      <div class="muted">平均分數：<b>${r.avg}</b></div>
      <div style="margin-top:6px"><b>主導階段：</b>${dom}</div>
      <div style="margin-top:6px"><b>瓶頸轉換：</b>${t1}；<b>次瓶頸：</b>${t2}</div>
      <div class="muted" style="margin-top:6px">解讀：你的能量中心傾向於主導階段；若轉換分數偏低，優先處理瓶頸所對應的行動建議。</div>
    `;
  }

  function drawTrend(){
    const ctx = $("#trend").getContext("2d");
    if (trend) trend.destroy();
    const data = history.slice(-7);
    trend = new Chart(ctx,{
      type:"line",
      data:{
        labels: data.map(d=> d.ts.slice(5,10)), // MM-DD
        datasets:[{label:"平均分數", data:data.map(d=>d.avg), borderWidth:2, tension:.25}]
      },
      options:{
        responsive:true, animation:false,
        scales:{ y:{min:0,max:100,ticks:{color:"#aab"}}, x:{ticks:{color:"#aab"}} },
        plugins:{ legend:{display:false} }
      }
    });
  }

  // ===== 7) 行動建議 =====
  function buildAdvice(){
    const box=$("#advice"); box.innerHTML="";
    ["S1","S2","S3","S4","S5","S6","S7"].forEach(id=>{
      const m = STAGE_META[id];
      const el=document.createElement("div");
      el.className="card";
      el.style.background="#101120";
      el.innerHTML = `
        <div class="title" style="font-size:16px">${m.name}</div>
        <div class="muted">關鍵字：</div>
        <div>${m.keywords.map(k=>`<span class="pill">${k}</span>`).join("")}</div>
        <div class="muted" style="margin-top:8px">行動建議：</div>
        <ul style="margin:6px 0 0 18px;padding:0">${m.actions.map(a=>`<li>${a}</li>`).join("")}</ul>
      `;
      box.appendChild(el);
    });
  }

  // ===== 8) 結果卡下載（合成 PNG） =====
  function downloadResultCard(){
    const w=1024, h=1024;
    const canvas=document.createElement("canvas");
    canvas.width=w; canvas.height=h;
    const ctx=canvas.getContext("2d");

    // 背景
    const grad=ctx.createLinearGradient(0,0,w,h);
    grad.addColorStop(0,"#20164a"); grad.addColorStop(1,"#5b3ee6");
    ctx.fillStyle=grad; ctx.fillRect(0,0,w,h);

    // 標題
    ctx.fillStyle="#fff"; ctx.font="bold 44px system-ui, -apple-system";
    ctx.fillText("Enervi 7 結果卡", 48, 80);

    // 摘要
    const rCanvas = $("#radar");
    if (rCanvas) ctx.drawImage(rCanvas, 48, 120, 640, 540);

    const r = compute(answers,false);
    ctx.font="28px system-ui, -apple-system";
    ctx.fillText(`平均：${r.avg}`, 720, 180);
    ctx.fillText(`主導：S${r.dominant+1} ${STAGE_NAMES[r.dominant]}`, 720, 230);
    ctx.fillText(`瓶頸：T${r.tLowIdx[0]+1}、T${r.tLowIdx[1]+1}`, 720, 280);

    // 建議節錄
    ctx.font="22px system-ui, -apple-system";
    const tips = STAGE_META["S"+(r.dominant+1)].actions.slice(0,2);
    let y=340;
    ctx.fillText("建議（擇一）：", 720, 320);
    tips.forEach(t=>{ wrapText(ctx, "• "+t, 720, y, 280, 26); y+=60; });

    // 署名
    ctx.font="20px system-ui, -apple-system";
    ctx.fillStyle="rgba(255,255,255,.8)";
    ctx.fillText(new Date().toLocaleString(), 720, 540);
    ctx.fillText("enervi7.app (PWA)", 720, 580);

    const url=canvas.toDataURL("image/png");
    const a=document.createElement("a");
    a.href=url; a.download="enervi7_card.png";
    a.click();
  }
  function wrapText(ctx, text, x, y, maxWidth, lineHeight){
    const words = text.split("");
    let line="", yy=y;
    for (let n=0;n<words.length;n++){
      const test=line+words[n];
      if (ctx.measureText(test).width > maxWidth && n>0){
        ctx.fillText(line, x, yy); line=words[n]; yy+=lineHeight;
      } else line=test;
    }
    ctx.fillText(line, x, yy);
  }
})();