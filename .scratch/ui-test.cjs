const WebSocket = require("/workspace/jevbench/.scratch/node_modules/ws");
const CDP = "http://127.0.0.1:9231";

function sleep(ms){ return new Promise(r=>setTimeout(r,ms)); }

(async () => {
  const page = await fetch(`${CDP}/json/new?https://jevbench.dev/%23use-cases`, {method:"PUT"}).then(r=>r.json());
  if (!page.webSocketDebuggerUrl) throw new Error("no ws: "+JSON.stringify(page));
  const ws = new WebSocket(page.webSocketDebuggerUrl);
  let id=0; const pending=new Map();
  function send(method, params={}){
    const i=++id;
    return new Promise((resolve,reject)=>{
      pending.set(i,{resolve,reject});
      ws.send(JSON.stringify({id:i,method,params}));
      setTimeout(()=>{ if(pending.has(i)){ pending.delete(i); reject(new Error("timeout "+method)); } }, 30000);
    });
  }
  ws.on("message", (buf)=>{
    const msg=JSON.parse(buf.toString());
    if (msg.id && pending.has(msg.id)){
      const {resolve}=pending.get(msg.id); pending.delete(msg.id); resolve(msg.result);
    }
  });
  await new Promise((res,rej)=>{ ws.on("open",res); ws.on("error",rej); });
  await send("Page.enable");
  await send("Runtime.enable");
  // wait for load
  for (let i=0;i<40;i++){
    await sleep(250);
    try {
      const ready = await send("Runtime.evaluate",{expression:"document.readyState", returnByValue:true});
      if (ready?.result?.value === "complete") break;
    } catch {}
  }
  await sleep(1500);

  async function ev(expr){
    const r = await send("Runtime.evaluate", {expression: expr, awaitPromise: true, returnByValue: true});
    if (r?.exceptionDetails) throw new Error(JSON.stringify(r.exceptionDetails));
    return r?.result?.value ?? null;
  }

  const boot = await ev(`!!document.getElementById('jev-suit') && !!document.querySelector('[data-jev-suit-begin]')`);
  console.log("ui_boot", boot);
  if (!boot) {
    const snip = await ev(`document.body?.innerText?.slice(0,200)`);
    console.log("body_snip", snip);
  }

  await ev(`document.getElementById('jev-suit')?.scrollIntoView({block:'center'}); document.querySelector('[data-jev-suit-begin]')?.click()`);
  await sleep(2500);

  async function clickOpt(reSrc){
    return ev(`(() => {
      const re = ${reSrc};
      const btns=[...document.querySelectorAll('.jev-suit-opt')];
      const b=btns.find(x=>re.test(x.textContent)) || btns[0];
      if(!b) return null;
      b.click();
      return b.textContent.trim();
    })()`);
  }

  console.log("ans1", await clickOpt("/Support/"));
  await sleep(1800);
  console.log("ans2", await clickOpt("/Chat/"));
  await sleep(1800);
  console.log("ans3", await clickOpt("/Route/"));
  await sleep(1800);
  console.log("ans4", await clickOpt("/Batch/"));

  let summary=null, hasCopy=false, err=null;
  for (let i=0;i<50;i++){
    await sleep(400);
    const st = await ev(`({
      summary: document.querySelector('.jev-suit-summary')?.textContent || null,
      copyPlain: !!document.querySelector('[data-copy-kind="plain"]'),
      copyMd: !!document.querySelector('[data-copy-kind="md"]'),
      err: document.querySelector('[data-jev-suit-error]:not([hidden])')?.textContent || null,
      loading: !!document.querySelector('.jev-suit-loading')
    })`);
    if (st?.err) { err=st.err; break; }
    if (st?.summary) { summary=st.summary; hasCopy=!!(st.copyPlain && st.copyMd); break; }
  }
  console.log("ui_error", err);
  console.log("ui_summary_snip", summary ? summary.slice(0,220) : null);
  console.log("ui_copy_buttons", hasCopy);

  if (hasCopy) {
    const s1 = await ev(`(async()=>{ const b=document.querySelector('[data-copy-kind="plain"]'); b.click(); await new Promise(r=>setTimeout(r,600)); return b.textContent; })()`);
    const s2 = await ev(`(async()=>{ const b=document.querySelector('[data-copy-kind="md"]'); b.click(); await new Promise(r=>setTimeout(r,600)); return b.textContent; })()`);
    console.log("copy_plain_btn_state", s1);
    console.log("copy_md_btn_state", s2);
  }

  // close tab
  try { await fetch(`${CDP}/json/close/${page.id}`, {method:"GET"}); } catch {}
  try { ws.close(); } catch {}
  process.exit(0);
})().catch((e)=>{ console.error("fail", e && e.stack || e); process.exit(1); });
