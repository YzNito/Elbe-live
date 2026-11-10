/* ELBE LIVE | Daten ausschließlich von der offiziellen PEGELONLINE REST-API v2.
   Dokumentation: https://pegelonline.wsv.de/webservice/dokuRestapi
   Messstelle HAMBURG ST. PAULI: d488c5cc-4de9-4631-8ce1-0db0e700b546
   Pegelstand in cm über dem Pegelnullpunkt: keine Wassertiefe, keine Hochwasserwarnung.
*/
(() => {
  'use strict';
  const ID = 'd488c5cc-4de9-4631-8ce1-0db0e700b546';
  const API = `https://pegelonline.wsv.de/webservices/rest-api/v2/stations/${ID}/W`;
  const CURRENT_URL = `${API}/currentmeasurement.json`;
  const HISTORY_URL = `${API}/measurements.json?start=P30D`;
  const REFRESH_MS = 5 * 60 * 1000;
  const $ = selector => document.querySelector(selector);
  const $$ = selector => [...document.querySelectorAll(selector)];
  const set = (id, text) => $$(`[data-${id}]`).forEach(node => { node.textContent = text; });
  const de = new Intl.NumberFormat('de-DE', {maximumFractionDigits:0});
  const dateFull = new Intl.DateTimeFormat('de-DE',{timeZone:'Europe/Berlin',day:'2-digit',month:'2-digit',year:'numeric',hour:'2-digit',minute:'2-digit'});
  const dateShort = new Intl.DateTimeFormat('de-DE',{timeZone:'Europe/Berlin',day:'2-digit',month:'2-digit',hour:'2-digit',minute:'2-digit'});
  const timeShort = new Intl.DateTimeFormat('de-DE',{timeZone:'Europe/Berlin',hour:'2-digit',minute:'2-digit'});
  const fmt = time => dateFull.format(new Date(time)) + ' Uhr';
  const NS='http://www.w3.org/2000/svg';
  const DAY = 86400000;
  const app = { current:null, all:[], visible:[], chosen:0, period:1, playTimer:null, fetching:false, plot:null };

  function status(kind, message) {
    const node = $('[data-status]');
    if(node) { node.dataset.state = kind; node.setAttribute('role', kind === 'error' ? 'alert' : 'status'); }
    set('status-text', message);
    set('status-kind', kind === 'ready' ? 'DATEN GELADEN' : kind === 'error' ? 'VERBINDUNGSPROBLEM' : 'LADE LIVE-DATEN');
  }
  async function json(url) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 18000);
    try {
      const response = await fetch(url,{cache:'no-store',signal:controller.signal,headers:{'Accept':'application/json'}});
      if(!response.ok) throw new Error(`API: HTTP ${response.status}`);
      return await response.json();
    } finally { clearTimeout(timeout); }
  }
  function parseMeasurement(item) {
    if(!item || !Number.isFinite(item.value) || typeof item.timestamp !== 'string') return null;
    const t = Date.parse(item.timestamp);
    if(!Number.isFinite(t)) return null;
    return {time:t, value:item.value};
  }
  function normalize(raw) {
    if(!Array.isArray(raw)) throw Error('Die Messreihe enthält kein JSON-Array.');
    const cutoff = Date.now() - 31 * DAY;
    const sorted = raw.map(parseMeasurement).filter(Boolean).filter(p => p.time >= cutoff && p.time < Date.now()+3600000).sort((a,b)=>a.time-b.time);
    return sorted.filter((p,i)=>i===0 || p.time!==sorted[i-1].time);
  }
  function trend(p, points) {
    const baseline = [...points].reverse().find(x => x.time <= p.time-30*60000);
    if(!baseline || p.time-baseline.time > 120*60000) return {kind:'unknown',name:'Noch unklar',detail:'Zu wenige Vergleichsdaten'};
    const diff = Math.round(p.value-baseline.value);
    return diff > 2 ? {kind:'rising',name:'Steigend',detail:`+${diff} cm seit ${Math.round((p.time-baseline.time)/60000)} Min.`} :
      diff < -2 ? {kind:'falling',name:'Fallend',detail:`${diff} cm seit ${Math.round((p.time-baseline.time)/60000)} Min.`} :
      {kind:'steady',name:'Nahezu konstant',detail:`${diff > 0 ? '+':''}${diff} cm seit ${Math.round((p.time-baseline.time)/60000)} Min.`};
  }
  function updateCurrent() {
    const p = app.current;
    if(!p) return;
    const history = app.all.filter(x => x.time<=p.time);
    const t = trend(p, history);
    set('level',de.format(p.value));
    set('measurement-time',fmt(p.time));
    set('trend',t.name);
    set('trend-detail',t.detail);
    document.body.dataset.currentTrend = t.kind;
    const delay = Date.now() - p.time;
    if(delay > 3*3600000) status('error','Hinweis: Die letzte veröffentlichte Messung ist älter als drei Stunden.');
    else status('ready','Aktueller Messwert erfolgreich von PEGELONLINE geladen.');
  }
  function stop() {
    if(app.playTimer) clearInterval(app.playTimer);
    app.playTimer = null;
    const button = $('[data-play]');
    if(button){button.setAttribute('aria-pressed','false');button.innerHTML='<span aria-hidden="true">▶</span> Verlauf abspielen';}
  }
  function showRange(days, keepSelection=false) {
    stop();
    app.period=days;
    $$('[data-period]').forEach(b => {const active=Number(b.dataset.period)===days;b.setAttribute('aria-pressed',String(active));b.classList.toggle('active',active);});
    if(!app.all.length) return;
    // Die Grenze bezieht sich auf die reale Uhrzeit des Seitenaufrufs.
    const cutoff=Date.now()-days*DAY;
    app.visible=app.all.filter(p=>p.time>=cutoff);
    if(keepSelection && app.visible.length) app.chosen=Math.min(app.chosen,app.visible.length-1);
    else app.chosen=Math.max(0,app.visible.length-1);
    const slider=$('[data-scrubber]');
    if(slider){ slider.min='0';slider.max=String(Math.max(0,app.visible.length-1));slider.value=String(app.chosen);slider.disabled=app.visible.length<2; }
    const play=$('[data-play]'); if(play) play.disabled=app.visible.length<2;
    renderTimeline();
  }
  function makeSvg(tag,attrs,parent) {
    const n=document.createElementNS(NS,tag);
    for(const [name,value] of Object.entries(attrs||{})) n.setAttribute(name,String(value));
    parent.appendChild(n);return n;
  }
  function chart() {
    const svg=$('[data-chart]');
    if(!svg) return;
    svg.replaceChildren();
    const points=app.visible;
    if(points.length<2){
      makeSvg('text',{x:50,y:135,class:'chart-fallback'},svg).textContent='Für diesen Zeitraum liegen derzeit keine Messwerte vor.';
      svg.setAttribute('aria-label','Messreihe momentan nicht verfügbar.');
      app.plot=null;
      return;
    }
    const W=1000,H=290,left=32,right=26,top=24,bottom=38;
    const minT=points[0].time,maxT=points[points.length-1].time;
    const minV=Math.min(...points.map(p=>p.value)),maxV=Math.max(...points.map(p=>p.value));
    const pad=Math.max(15,(maxV-minV)*.12),low=minV-pad,high=maxV+pad;
    const x=t=>left+(t-minT)/(maxT-minT||1)*(W-left-right);
    const y=v=>top+(high-v)/(high-low||1)*(H-top-bottom);
    const size=Math.max(1,Math.ceil(points.length/650));
    const sampled=points.filter((p,i)=>i%size===0);
    if(sampled[sampled.length-1]!==points[points.length-1]) sampled.push(points[points.length-1]);
    const trace=sampled.map((p,i)=>(i?'L':'M')+x(p.time).toFixed(2)+','+y(p.value).toFixed(2)).join(' ');
    for(let i=0;i<4;i++){
      const yy=top+i*(H-top-bottom)/3;
      makeSvg('line',{x1:left,x2:W-right,y1:yy,y2:yy,class:'grid-line'},svg);
    }
    makeSvg('path',{d:`${trace} L${x(maxT).toFixed(2)},${H-bottom} L${x(minT).toFixed(2)},${H-bottom} Z`,class:'chart-fill'},svg);
    makeSvg('path',{d:trace,class:'chart-trace'},svg);
    const progress=sampled.filter(p=>p.time<=points[app.chosen].time);
    if(progress.length>1) makeSvg('path',{d:progress.map((p,i)=>(i?'L':'M')+x(p.time).toFixed(2)+','+y(p.value).toFixed(2)).join(' '),class:'chart-progress'},svg);
    for(let i=0;i<=4;i++){
      const f=i/4,t=minT+f*(maxT-minT);
      const node=makeSvg('text',{x:x(t),y:H-8,'text-anchor':i===0?'start':i===4?'end':'middle',class:'axis-label'},svg);
      node.textContent=app.period===1? timeShort.format(new Date(t)):new Intl.DateTimeFormat('de-DE',{day:'2-digit',month:'2-digit',timeZone:'Europe/Berlin'}).format(new Date(t));
    }
    const p=points[app.chosen];
    makeSvg('line',{x1:x(p.time),x2:x(p.time),y1:top,y2:H-bottom,class:'cursor-line'},svg);
    makeSvg('circle',{cx:x(p.time),cy:y(p.value),r:7,class:'cursor-halo'},svg);
    makeSvg('circle',{cx:x(p.time),cy:y(p.value),r:4,class:'cursor-dot'},svg);
    svg.setAttribute('viewBox',`0 0 ${W} ${H}`);
    svg.setAttribute('aria-label',`Echte Wasserstandsmessungen im gewählten Zeitraum, Minimum ${de.format(minV)}, Maximum ${de.format(maxV)} Zentimeter. Die Zeitposition kann durch Berührung oder Ziehen geändert werden.`);
    app.plot={xMin:left,xMax:W-right,tMin:minT,tMax:maxT};
  }
  function renderTimeline() {
    const points=app.visible;
    if(!points.length){
      set('selected-level','—');set('selected-time','Messwerte noch nicht verfügbar');
      set('selected-description','Der Zeitverlauf kann gerade nicht angezeigt werden.');
      set('min','—');set('max','—');set('average','—');set('point-count','0');
      const svg=$('[data-chart]'); if(svg){svg.replaceChildren();makeSvg('text',{x:55,y:150,class:'chart-fallback'},svg).textContent='Messreihe noch nicht verfügbar.';}
      return;
    }
    app.chosen=Math.max(0,Math.min(app.chosen,points.length-1));
    const p=points[app.chosen];
    const min=Math.min(...points.map(x=>x.value)),max=Math.max(...points.map(x=>x.value));
    const avg=points.reduce((s,x)=>s+x.value,0)/points.length;
    set('selected-level',de.format(p.value));
    set('selected-time',fmt(p.time));
    set('selected-description',app.chosen===points.length-1?'Neuester Wert im gewählten Zeitraum':'Historische Messung · mit dem Regler ausgewählt');
    set('min',de.format(min));set('max',de.format(max));set('average',de.format(avg));set('point-count',de.format(points.length));
    set('range-start',dateShort.format(new Date(points[0].time)));
    set('range-end',dateShort.format(new Date(points[points.length-1].time)));
    const percent=24+62*(p.value-min)/(max-min||1);
    document.documentElement.style.setProperty('--water-height',percent.toFixed(2)+'%');
    const wave=$('[data-water-visual]');
    if(wave) wave.setAttribute('aria-label',`Grafische Veranschaulichung des relativen Pegelstands: ${de.format(p.value)} Zentimeter. Höhe innerhalb der ausgewählten Messspanne skaliert.`);
    const slider=$('[data-scrubber]'); if(slider) slider.value=String(app.chosen);
    chart();
  }
  function selectIndex(index) { app.chosen=Math.max(0,Math.min(Number(index)||0,app.visible.length-1));renderTimeline(); }
  function connect() {
    $$('[data-period]').forEach(b=>b.addEventListener('click',()=>showRange(Number(b.dataset.period))));
    const slider=$('[data-scrubber]'); if(slider) slider.addEventListener('input',e=>{stop();selectIndex(e.target.value);});
    const play=$('[data-play]'); if(play) play.addEventListener('click',()=>{
      if(app.playTimer){stop();return;}
      if(app.visible.length<2)return;
      if(app.chosen>=app.visible.length-1)app.chosen=0;
      play.setAttribute('aria-pressed','true');play.innerHTML='<span aria-hidden="true">Ⅱ</span> Pause';
      const step=Math.max(1,Math.ceil(app.visible.length/180));
      app.playTimer=setInterval(()=>{
        if(document.hidden){stop();return;}
        const next=Math.min(app.visible.length-1,app.chosen+step);
        selectIndex(next);
        if(next===app.visible.length-1)stop();
      },75);
    });
    $$('[data-refresh]').forEach(b=>b.addEventListener('click',load));
    const svg=$('[data-chart]');
    if(svg){
      let pressed=false;
      const seek=e=>{
        if(!app.plot||app.visible.length<2)return;
        const box=svg.getBoundingClientRect();
        const logical=1000*(e.clientX-box.left)/(box.width||1);
        const {xMin,xMax,tMin,tMax}=app.plot;
        const wanted=tMin+(Math.max(xMin,Math.min(xMax,logical))-xMin)/(xMax-xMin)*(tMax-tMin);
        let lo=0,hi=app.visible.length-1;
        while(lo<hi){const mid=Math.floor((lo+hi)/2);if(app.visible[mid].time<wanted)lo=mid+1;else hi=mid;}
        const chosen=lo>0 && Math.abs(app.visible[lo-1].time-wanted)<Math.abs(app.visible[lo].time-wanted)?lo-1:lo;
        stop();selectIndex(chosen);
      };
      svg.addEventListener('pointerdown',e=>{pressed=true;try{svg.setPointerCapture(e.pointerId);}catch(_){}seek(e);});
      svg.addEventListener('pointermove',e=>{if(pressed)seek(e);});
      svg.addEventListener('pointerup',()=>{pressed=false;});
      svg.addEventListener('pointercancel',()=>{pressed=false;});
    }
    document.addEventListener('visibilitychange',()=>{if(!document.hidden)load();else stop();});
    setInterval(()=>{if(!document.hidden)load();},REFRESH_MS);
  }
  async function load() {
    if(app.fetching)return;
    app.fetching=true;
    $$('[data-refresh]').forEach(b=>b.disabled=true);
    if(!app.current) status('loading','Aktuelle Messdaten werden geladen …');
    try {
      const [currentResult, historyResult]=await Promise.allSettled([json(CURRENT_URL),json(HISTORY_URL)]);
      if(currentResult.status==='fulfilled') {
        const p=parseMeasurement(currentResult.value);
        if(p){app.current=p;updateCurrent();}
        else status('error','Die API hat keinen gültigen aktuellen Messwert geliefert.');
      } else { console.warn('PEGELONLINE current:',currentResult.reason);status('error',app.current?'Aktualisierung fehlgeschlagen · letzter geladener Stand bleibt sichtbar.':'Aktuelle Wasserstandsdaten sind vorübergehend nicht erreichbar.'); }
      if(historyResult.status==='fulfilled') {
        try {
          app.all=normalize(historyResult.value);
          if(app.current && !app.all.some(p=>p.time===app.current.time)){
            app.all.push(app.current);app.all.sort((a,b)=>a.time-b.time);
          }
          showRange(app.period);
          if(app.current) updateCurrent();
        } catch(error){console.warn('PEGELONLINE history:',error);set('history-status','Messreihe derzeit nicht verfügbar.');if(!app.all.length)renderTimeline();}
      } else { console.warn('PEGELONLINE history:',historyResult.reason);set('history-status','Messreihe derzeit nicht verfügbar. Aktueller Pegel wird separat angezeigt.');if(!app.all.length)renderTimeline(); }
      if(app.all.length) set('history-status',`${de.format(app.all.length)} echte API-Messwerte geladen · Zeitraum bis 30 Tage`);
      set('sync-time',timeShort.format(new Date())+' Uhr');
    } finally {
      app.fetching=false;
      $$('[data-refresh]').forEach(b=>b.disabled=false);
    }
  }
  document.addEventListener('DOMContentLoaded',()=>{
    connect();
    load();
  });
})();
