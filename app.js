const labels = ["安住","根基","流動","心火","交流","洞察","願景"];
const canvas = document.getElementById('radarChart');
const ctx = canvas.getContext('2d');

function drawRadar(values){
  const cx = canvas.width/2, cy = canvas.height/2;
  const r = 120;
  const step = (Math.PI*2)/labels.length;
  ctx.clearRect(0,0,canvas.width,canvas.height);
  ctx.strokeStyle = "#6f42c1"; ctx.fillStyle="rgba(111,66,193,0.3)";

  // 畫多邊形
  ctx.beginPath();
  values.forEach((v,i)=>{
    const angle = step*i - Math.PI/2;
    const x = cx + Math.cos(angle) * r * v/5;
    const y = cy + Math.sin(angle) * r * v/5;
    if(i===0) ctx.moveTo(x,y); else ctx.lineTo(x,y);
  });
  ctx.closePath(); ctx.fill(); ctx.stroke();

  // 畫標籤
  ctx.fillStyle="#fff"; ctx.font="14px sans-serif"; ctx.textAlign="center";
  labels.forEach((lab,i)=>{
    const angle = step*i - Math.PI/2;
    const x = cx + Math.cos(angle) * (r+20);
    const y = cy + Math.sin(angle) * (r+20);
    ctx.fillText(lab,x,y);
  });
}
drawRadar([3,4,5,2,4,3,5]);