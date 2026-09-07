import './styles.css';

const STORAGE_KEY = 'evidence-roadmap-v1';
const horizonOrder = ['history','now','next','later'];
const riskKeys = ['value','usability','feasibility','viability'];

const seed = [
  {
    id: crypto.randomUUID(), isSample:true, horizon:'now', status:'active',
    outcome:'Reduce enterprise onboarding time', why:'Onboarding duration is constraining activation and expansion.',
    metric:'Median onboarding days', baseline:'21', target:'10', owner:'Activation Team',
    opportunities:'Migration friction; admin configuration complexity',
    solution:'Self-service legacy data migration', window:'Q4 2026', dependencies:'Data Platform; Security',
    scope:'Salesforce, HubSpot and Dynamics migrations', residual:'Large migrations remain excluded; unit economics monitored after launch.',
    problemEvidence:'Customer interviews, implementation data, support cases.',
    risks:{
      value:{status:'Strong', text:'8/10 admins identified migration as a major delay.', links:'', files:[]},
      usability:{status:'Strong', text:'7/8 users completed the latest prototype without assistance.', links:'', files:[]},
      feasibility:{status:'Strong', text:'Engineering spike validated the three supported schema paths.', links:'', files:[]},
      viability:{status:'Moderate', text:'Security/support model reviewed; post-launch cost assumptions remain.', links:'', files:[]}
    }, history:[{date:new Date().toISOString().slice(0,10), note:'Seeded as current evidence-backed solution bet.'}]
  },
  {
    id: crypto.randomUUID(), isSample:true, horizon:'next', status:'active',
    outcome:'Improve first-90-day activation', why:'A meaningful segment of new accounts fails to reach repeat product use.',
    metric:'90-day activation rate', baseline:'', target:'', owner:'Growth Product Team',
    opportunities:'Setup confusion; admin education; integration friction', solution:'', window:'Next', dependencies:'', scope:'', residual:'Solution intentionally not committed.',
    problemEvidence:'Usage analysis plus early customer interviews.', risks:blankRisks(), history:[]
  },
  {
    id: crypto.randomUUID(), isSample:true, horizon:'later', status:'active',
    outcome:'Increase enterprise self-service', why:'Service-intensive growth will not scale with the enterprise customer base.',
    metric:'', baseline:'', target:'', owner:'', opportunities:'', solution:'', window:'Later', dependencies:'', scope:'', residual:'High uncertainty is expected at this horizon.',
    problemEvidence:'Strategic signal from service load and growth plans.', risks:blankRisks(), history:[]
  }
];

function blankRisks(){ return Object.fromEntries(riskKeys.map(k=>[k,{status:'Moderate',text:'',links:'',files:[]}])) }
function load(){ try { const saved=localStorage.getItem(STORAGE_KEY); return saved ? JSON.parse(saved) : seed; } catch { return seed; } }
let bets = load();
function save(){ localStorage.setItem(STORAGE_KEY, JSON.stringify(bets)); }
function esc(s=''){ return String(s).replace(/[&<>'"]/g,c=>({ '&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;' }[c])); }
function byHorizon(h){ return bets.filter(b=>b.horizon===h && b.status==='active'); }
function historyBets(){ return bets.filter(b=>b.status!=='active'); }
function statusClass(s){ return (s||'Moderate').toLowerCase(); }
function riskChip(name,r){ return `<div class="risk-chip"><span>${name}</span><strong class="${statusClass(r.status)}">${esc(r.status)}</strong></div>`; }

const app = document.querySelector('#app');
app.innerHTML = `
<div class="app-shell">
  <div class="topbar">
    <div class="brand"><h1>Evidence-Backed Product Roadmap</h1><p>Now / Next / Later for empowered product teams. Future bets require less detail; current bets expose the evidence behind the team's solution choice.</p></div>
    <div class="toolbar">
      <button class="btn" id="exportBtn">Export JSON</button>
      <button class="btn" id="importBtn">Import JSON</button>
      <input type="file" id="importFile" accept="application/json" hidden />
      <button class="btn primary" id="globalAdd">+ Add roadmap bet</button>
    </div>
  </div>
  <div class="status-row"><p class="status-note">Data is saved in this browser. Export JSON before switching devices or browsers.</p><div id="sampleNotice"></div></div>
  <div id="roadmap"></div>
  <footer>MVP persistence uses localStorage. Attachments are stored as filenames/metadata only; connect object storage later for real file persistence.</footer>
</div>
<div id="overlay"></div>`;

function renderRoadmap(){
  const roadmap = document.querySelector('#roadmap');
  const history = historyBets();
  roadmap.innerHTML = `<div class="roadmap">
    ${renderHistory(history)}
    ${renderHorizon('now','NOW','Current outcome ownership + evidence-backed solution bets','Most detail')}
    ${renderHorizon('next','NEXT','Validated problems/opportunities; solution optional','Less detail')}
    ${renderHorizon('later','LATER','Strategically important future outcomes/problem spaces','Sparse by design')}
  </div>`;
  document.querySelectorAll('[data-add]').forEach(b=>b.addEventListener('click',()=>openEditor(null,b.dataset.add)));
  document.querySelectorAll('[data-inspect]').forEach(b=>b.addEventListener('click',()=>openInspect(b.dataset.inspect)));
  document.querySelectorAll('[data-history]').forEach(b=>b.addEventListener('click',()=>openInspect(b.dataset.history)));
  document.querySelectorAll('[data-remove-sample]').forEach(b=>b.addEventListener('click',()=>removeSample(b.dataset.removeSample)));
  renderSampleNotice();
}

function renderSampleNotice(){
  const sampleCount=bets.filter(b=>b.isSample===true).length;
  document.querySelector('#sampleNotice').innerHTML=sampleCount ? `<div class="sample-notice"><span>Showing ${sampleCount} sample bet${sampleCount===1?'':'s'} to demonstrate Now / Next / Later.</span><button class="btn" id="removeSamples">Remove sample bets</button></div>` : '';
  const removeButton=document.querySelector('#removeSamples');
  if(removeButton) removeButton.onclick=removeAllSamples;
}

function removeSample(id){
  bets=bets.filter(b=>!(b.id===id && b.isSample===true));
  save();
  renderRoadmap();
}

function removeAllSamples(){
  bets=bets.filter(b=>b.isSample!==true);
  save();
  renderRoadmap();
}

function renderHistory(items){
  return `<section class="horizon history"><div class="horizon-head"><div class="horizon-title">HISTORY</div><div class="horizon-sub">Completed, stopped, superseded</div></div><div class="horizon-body">
    <div class="history-stat">${items.length} closed bet${items.length===1?'':'s'}</div>
    ${items.length ? items.slice(-8).reverse().map(b=>`<div class="bet-card compact history-card"><h3>${esc(b.outcome)}</h3><div class="meta">${esc(b.status)}${b.actual ? ` · ${esc(b.actual)}`:''}</div><div class="card-actions"><button class="btn" data-history="${b.id}">View</button></div></div>`).join('') : '<div class="empty">No closed bets yet.</div>'}
  </div></section>`;
}

function renderHorizon(key,title,sub,detail){
  const items = byHorizon(key);
  return `<section class="horizon ${key}"><div class="horizon-head"><div><div class="horizon-title">${title}</div><div class="horizon-sub">${sub}<br><strong>${detail}</strong></div></div><button class="btn" data-add="${key}">+ Add</button></div><div class="horizon-body">
    ${items.length ? items.map(b=>renderCard(b)).join('') : '<div class="empty">No bets here yet.</div>'}
  </div></section>`;
}

function renderCard(b){
  const sample = b.isSample===true ? '<div class="sample-label">SAMPLE</div><div class="sample-copy">Example Now bet<br><span>This is example data to show how a Now bet works.</span></div>' : '';
  const remove = b.isSample===true ? `<button class="btn" data-remove-sample="${b.id}">Remove sample</button>` : '';
  const common = `${sample}<h3>${esc(b.outcome)}</h3><div class="meta">${esc(b.owner || 'Owner TBD')} · ${esc(b.window || b.horizon.toUpperCase())}</div>`;
  if(b.horizon==='later') return `<article class="bet-card${b.isSample===true?' sample-card':''}">${common}<div class="metric"><strong>Why it matters</strong><br>${esc(b.why)}</div><div class="meta">Solution intentionally not required.</div><div class="card-actions"><button class="btn" data-inspect="${b.id}">Inspect</button>${remove}</div></article>`;
  if(b.horizon==='next') return `<article class="bet-card${b.isSample===true?' sample-card':''}">${common}<div class="metric"><strong>Problem evidence</strong><br>${esc(b.problemEvidence || 'Not yet recorded')}</div>${b.opportunities?`<div class="solution"><strong>Known opportunities</strong><br>${esc(b.opportunities)}</div>`:''}${b.solution?`<div class="solution"><strong>Solution hypothesis</strong><br>${esc(b.solution)}</div>`:'<div class="meta">No committed solution.</div>'}<div class="card-actions"><button class="btn" data-inspect="${b.id}">Inspect</button>${remove}</div></article>`;
  return `<article class="bet-card${b.isSample===true?' sample-card':''}">${common}${b.metric?`<div class="metric"><strong>${esc(b.metric)}</strong>${b.baseline||b.target?` · ${esc(b.baseline||'?')} → ${esc(b.target||'?')}`:''}</div>`:''}<div class="solution"><strong>Current solution bet</strong><br>${esc(b.solution || 'Missing')}</div><div class="risk-row">${riskChip('Value',b.risks.value)}${riskChip('Usability',b.risks.usability)}${riskChip('Feasibility',b.risks.feasibility)}${riskChip('Viability',b.risks.viability)}</div><div class="card-actions"><button class="btn" data-inspect="${b.id}">Inspect evidence</button>${remove}</div></article>`;
}

function requiredFor(h,b){
  const missing=[];
  if(!b.outcome) missing.push('Outcome / problem');
  if(!b.why) missing.push('Why it matters');
  if(!b.problemEvidence) missing.push('Problem/outcome evidence');
  if(h==='next' || h==='now') { if(!b.metric) missing.push('Success measure'); if(!b.owner) missing.push('Team owner'); }
  if(h==='now') {
    if(!b.target) missing.push('Outcome target');
    if(!b.solution) missing.push('Current solution bet');
    if(!b.scope) missing.push('Committed scope');
    if(!b.residual) missing.push('Residual uncertainty');
    riskKeys.forEach(k=>{ if(!b.risks?.[k]?.text) missing.push(`${k} evidence`); });
  }
  return missing;
}

function openEditor(id=null,horizon='later'){
  const existing = id ? bets.find(b=>b.id===id) : null;
  const b = existing ? structuredClone(existing) : {id:crypto.randomUUID(),isSample:false,horizon,status:'active',outcome:'',why:'',metric:'',baseline:'',target:'',owner:'',opportunities:'',solution:'',window:horizon==='now'?'Current':'',dependencies:'',scope:'',residual:'',problemEvidence:'',risks:blankRisks(),history:[]};
  const overlay=document.querySelector('#overlay');
  overlay.innerHTML=`<div class="drawer-backdrop"><div class="drawer"><div class="topbar"><div><h2>${existing?'Edit':'Add'} ${b.horizon.toUpperCase()} bet</h2><p class="lead">The form asks for only the level of certainty appropriate to this horizon.</p></div><button class="btn" id="closeDrawer">Close</button></div>
  <div class="section"><div class="field"><label>Horizon</label><select id="f_horizon"><option value="later" ${b.horizon==='later'?'selected':''}>Later</option><option value="next" ${b.horizon==='next'?'selected':''}>Next</option><option value="now" ${b.horizon==='now'?'selected':''}>Now</option></select><div class="helper">Changing horizon changes the required information.</div></div></div>
  <div id="dynamicForm"></div>
  <div class="section"><div id="validation" class="notice"></div><div class="card-actions"><button class="btn primary" id="saveBet">Save bet</button>${existing?'<button class="btn" id="deleteBet">Delete</button>':''}</div></div>
  </div></div>`;
  const renderForm=()=>{
    const h=document.querySelector('#f_horizon').value; b.horizon=h;
    document.querySelector('#dynamicForm').innerHTML=formFor(b,h);
    bindFileInputs(b);
  };
  document.querySelector('#f_horizon').addEventListener('change',renderForm); renderForm();
  document.querySelector('#closeDrawer').onclick=()=>overlay.innerHTML='';
  document.querySelector('#saveBet').onclick=()=>{
    collectForm(b);
    const missing=requiredFor(b.horizon,b);
    const v=document.querySelector('#validation');
    if(missing.length){ v.textContent='Still required for '+b.horizon.toUpperCase()+': '+missing.join(', ')+'.'; return; }
    b.history=b.history||[]; b.history.push({date:new Date().toISOString().slice(0,10), note:`Saved in ${b.horizon.toUpperCase()}.`});
    const idx=bets.findIndex(x=>x.id===b.id); if(idx>=0) bets[idx]=b; else bets.push(b); save(); overlay.innerHTML=''; renderRoadmap();
  };
  if(existing) document.querySelector('#deleteBet').onclick=()=>{ if(confirm('Delete this roadmap bet?')){ bets=bets.filter(x=>x.id!==b.id); save(); overlay.innerHTML=''; renderRoadmap(); } };
}

function formFor(b,h){
  const base=`<div class="section"><h3>Outcome / problem bet</h3><div class="form-grid">
    ${field('Outcome / problem','outcome',b.outcome,true,'textarea')}${field('Why this matters','why',b.why,true,'textarea')}
    ${field('Problem / outcome evidence','problemEvidence',b.problemEvidence,true,'textarea')}${field('Time horizon / window','window',b.window,false,'input')}
  </div></div>`;
  if(h==='later') return base+`<div class="notice">Later is intentionally sparse. A solution, exact target, dependencies and four-risk solution evidence are not required.</div>`;
  const mid=`<div class="section"><h3>Outcome definition</h3><div class="form-grid">${field('Success measure','metric',b.metric,true,'input')}${field('Team owner','owner',b.owner,true,'input')}${field('Baseline','baseline',b.baseline,false,'input')}${field('Target','target',b.target,h==='now','input')}</div>${field('Known opportunities','opportunities',b.opportunities,false,'textarea')}</div>`;
  if(h==='next') return base+mid+`<div class="section"><h3>Optional solution hypothesis</h3>${field('Current solution hypothesis','solution',b.solution,false,'textarea')}<div class="helper">Next can remain solution-free. If you already have a hypothesis, record it without treating it as a commitment.</div></div>`;
  const risks=riskKeys.map(k=>riskEditor(k,b.risks[k])).join('');
  return base+mid+`<div class="section"><h3>Current solution bet</h3><div class="form-grid">${field('Solution','solution',b.solution,true,'textarea')}${field('Dependencies','dependencies',b.dependencies,false,'textarea')}${field('Committed scope','scope',b.scope,true,'textarea')}${field('Residual uncertainty','residual',b.residual,true,'textarea')}</div></div><div class="section"><h3>Solution evidence</h3><div class="evidence-grid">${risks}</div><div class="helper">Uploaded files are recorded by filename in this MVP. Replace this with S3/Supabase/Vercel Blob later for durable attachments.</div></div>`;
}
function field(label,id,value,req,type='input'){
  const ctl=type==='textarea'?`<textarea id="f_${id}" rows="3">${esc(value)}</textarea>`:`<input id="f_${id}" value="${esc(value)}">`;
  return `<div class="field"><label>${label}${req?' *':''}</label>${ctl}</div>`;
}
function riskEditor(k,r){ return `<div class="evidence-card"><h4>${k[0].toUpperCase()+k.slice(1)}</h4><div class="field"><label>Evidence strength</label><select id="f_${k}_status"><option ${r.status==='Strong'?'selected':''}>Strong</option><option ${r.status==='Moderate'?'selected':''}>Moderate</option><option ${r.status==='Weak'?'selected':''}>Weak</option></select></div><div class="field"><label>Finding / evidence *</label><textarea id="f_${k}_text" rows="3">${esc(r.text)}</textarea></div><div class="field"><label>Links</label><input id="f_${k}_links" value="${esc(r.links)}" placeholder="URLs or references"></div><div class="field"><label>Supporting files</label><input type="file" id="f_${k}_files" multiple></div><div class="file-list" id="files_${k}">${(r.files||[]).map(x=>`<span class="file-pill">${esc(x)}</span>`).join('')}</div></div>`; }
function collectForm(b){
  b.horizon=document.querySelector('#f_horizon').value;
  ['outcome','why','problemEvidence','window','metric','owner','baseline','target','opportunities','solution','dependencies','scope','residual'].forEach(k=>{ const el=document.querySelector('#f_'+k); if(el) b[k]=el.value.trim(); });
  if(b.horizon==='now') riskKeys.forEach(k=>{ b.risks[k].status=document.querySelector('#f_'+k+'_status').value; b.risks[k].text=document.querySelector('#f_'+k+'_text').value.trim(); b.risks[k].links=document.querySelector('#f_'+k+'_links').value.trim(); });
}
function bindFileInputs(b){
  if(b.horizon!=='now') return;
  riskKeys.forEach(k=>{ const el=document.querySelector('#f_'+k+'_files'); if(!el) return; el.addEventListener('change',()=>{ b.risks[k].files=[...(b.risks[k].files||[]),...Array.from(el.files).map(f=>f.name)]; document.querySelector('#files_'+k).innerHTML=b.risks[k].files.map(x=>`<span class="file-pill">${esc(x)}</span>`).join(''); }); });
}

function openInspect(id){
  const b=bets.find(x=>x.id===id); if(!b) return;
  const overlay=document.querySelector('#overlay');
  const riskHtml=b.horizon==='now'?`<div class="section"><h3>Solution evidence</h3><div class="evidence-grid">${riskKeys.map(k=>{const r=b.risks[k];return `<div class="evidence-card"><h4>${k[0].toUpperCase()+k.slice(1)} · <span class="${statusClass(r.status)}">${esc(r.status)}</span></h4><div>${esc(r.text||'No evidence recorded')}</div>${r.links?`<div class="helper">Links: ${esc(r.links)}</div>`:''}${(r.files||[]).length?`<div class="file-list">${r.files.map(x=>`<span class="file-pill">${esc(x)}</span>`).join('')}</div>`:''}</div>`}).join('')}</div></div>`:'';
  const promote = b.status==='active' && b.horizon!=='now' ? `<button class="btn primary" id="promoteBtn">Promote toward ${b.horizon==='later'?'NEXT':'NOW'}</button>`:'';
  const close = b.status==='active' ? `<button class="btn" id="closeBetBtn">Close / complete bet</button>`:'';
  overlay.innerHTML=`<div class="drawer-backdrop"><div class="drawer"><div class="topbar"><div><h2>${esc(b.outcome)}</h2><p class="lead">${esc(b.horizon.toUpperCase())} · ${esc(b.owner||'Owner TBD')}</p></div><button class="btn" id="closeDrawer">Close</button></div>
    <div class="detail-grid"><div class="detail-box"><h4>Why this matters</h4>${esc(b.why)}</div><div class="detail-box"><h4>Problem/outcome evidence</h4>${esc(b.problemEvidence)}</div></div>
    ${b.metric?`<div class="section"><h3>Outcome definition</h3><div class="detail-grid"><div class="detail-box"><h4>Measure</h4>${esc(b.metric)}${b.baseline||b.target?`<br>${esc(b.baseline||'?')} → ${esc(b.target||'?')}`:''}</div><div class="detail-box"><h4>Window</h4>${esc(b.window||b.horizon)}</div></div></div>`:''}
    ${b.solution?`<div class="section"><h3>Current solution bet</h3><div class="detail-grid"><div class="detail-box"><h4>Solution</h4>${esc(b.solution)}</div><div class="detail-box"><h4>Scope / residual uncertainty</h4>${esc(b.scope||'No scope recorded')}<br><br>${esc(b.residual||'No residual uncertainty recorded')}</div></div></div>`:''}
    ${riskHtml}
    <div class="section"><h3>Decision history</h3><div class="timeline-row">${(b.history||[]).length?b.history.map(x=>`<span class="timeline-pill">${esc(x.date)} · ${esc(x.note)}</span>`).join(''):'<span class="muted">No history recorded.</span>'}</div></div>
    <div class="section"><div class="card-actions"><button class="btn" id="editBtn">Edit bet</button>${promote}${close}</div></div>
  </div></div>`;
  document.querySelector('#closeDrawer').onclick=()=>overlay.innerHTML='';
  document.querySelector('#editBtn').onclick=()=>openEditor(b.id,b.horizon);
  if(document.querySelector('#promoteBtn')) document.querySelector('#promoteBtn').onclick=()=>promoteBet(b);
  if(document.querySelector('#closeBetBtn')) document.querySelector('#closeBetBtn').onclick=()=>closeBet(b);
}
function promoteBet(b){
  const targetH=b.horizon==='later'?'next':'now';
  const candidate=structuredClone(b); candidate.horizon=targetH;
  const missing=requiredFor(targetH,candidate);
  if(missing.length){ alert(`This bet has not earned ${targetH.toUpperCase()} yet. Missing: ${missing.join(', ')}.`); openEditor(b.id,targetH); document.querySelector('#f_horizon').value=targetH; document.querySelector('#f_horizon').dispatchEvent(new Event('change')); return; }
  b.horizon=targetH; b.history.push({date:new Date().toISOString().slice(0,10),note:`Promoted to ${targetH.toUpperCase()}.`}); save(); document.querySelector('#overlay').innerHTML=''; renderRoadmap();
}
function closeBet(b){
  const result=prompt('Close as: achieved, partial, not-achieved, stopped, or superseded','achieved'); if(!result) return;
  const allowed=['achieved','partial','not-achieved','stopped','superseded']; if(!allowed.includes(result)){ alert('Use one of: achieved, partial, not-achieved, stopped, superseded.'); return; }
  const actual=prompt('Actual result / short outcome summary',''); const learning=prompt('What did the team learn?','');
  b.status=result; b.actual=actual||''; b.learning=learning||''; b.horizon='history'; b.history.push({date:new Date().toISOString().slice(0,10),note:`Closed as ${result}. ${learning||''}`}); save(); document.querySelector('#overlay').innerHTML=''; renderRoadmap();
}

document.querySelector('#globalAdd').onclick=()=>openEditor(null,'later');
document.querySelector('#exportBtn').onclick=()=>{ const exportBets=bets.filter(b=>b.isSample!==true); const blob=new Blob([JSON.stringify(exportBets,null,2)],{type:'application/json'}); const a=document.createElement('a'); a.href=URL.createObjectURL(blob); a.download='roadmap-data.json'; a.click(); URL.revokeObjectURL(a.href); };
document.querySelector('#importBtn').onclick=()=>document.querySelector('#importFile').click();
document.querySelector('#importFile').addEventListener('change',async e=>{ const f=e.target.files[0]; if(!f) return; try{ const data=JSON.parse(await f.text()); if(!Array.isArray(data)) throw new Error(); bets=data; save(); renderRoadmap(); }catch{ alert('That file is not a valid roadmap export.'); } e.target.value=''; });

renderRoadmap();
