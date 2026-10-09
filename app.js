(() => {
  "use strict";

  const VERSION = "0.1.0";
  const STORAGE_KEY = "ORG_FESTSTOFF_LAB_STATE_v0_1";
  const els = {};
  let db = null;
  let model = null;
  let state = null;
  let bridgeMode = bridgeRequested();
  let bridgeRun = null;
  let bridgeInput = null;

  document.addEventListener("DOMContentLoaded", init);

  function bridgeRequested(){
    return new URLSearchParams(window.location.search).get("bridge")==="1";
  }

  function storageKey(){
    return bridgeMode && bridgeRun ? STORAGE_KEY+"_HUB_"+bridgeRun.run_id : STORAGE_KEY;
  }

  async function init(){
    bindEls();
    bindEvents();
    const response = await fetch("data/models.json",{cache:"no-store"});
    if(!response.ok) return fatal("data/models.json konnte nicht geladen werden.");
    db = await response.json();

    if(bridgeMode) await initBridge();
    else initSingleMode();

    if(model && state) render();
  }

  function bindEls(){
    [
      "modeLabel","bridgeContext","bridgeSampleLabel","bridgeRunLabel","bridgeMessage","bridgeReturnBtn",
      "sampleTitle","sampleIntro","progressBadge","methodGrid","journal","resetBtn","summarizeBtn",
      "summaryHint","featureGrid","identityGuard","bridgeSubmitBtn"
    ].forEach(id=>els[id]=document.getElementById(id));
  }

  function bindEvents(){
    els.resetBtn.addEventListener("click",resetState);
    els.summarizeBtn.addEventListener("click",summarizeFindings);
    els.bridgeSubmitBtn.addEventListener("click",sendBridgeResult);
    els.bridgeReturnBtn.addEventListener("click",()=>{
      if(window.AnalytikBridge && bridgeRun) window.AnalytikBridge.returnToHub(bridgeRun);
    });
  }

  function loadBridgeScript(){
    if(window.AnalytikBridge) return Promise.resolve(window.AnalytikBridge);
    return new Promise((resolve,reject)=>{
      const script=document.createElement("script");
      script.src=new URL("../CHEMIE_ANALYTIK_HUB/bridge/chemie-analytik-bridge.js",window.location.href).toString();
      script.onload=()=>window.AnalytikBridge?resolve(window.AnalytikBridge):reject(new Error("Bridge-API fehlt."));
      script.onerror=()=>reject(new Error("CHEMIE_ANALYTIK_BRIDGE konnte nicht geladen werden."));
      document.head.appendChild(script);
    });
  }

  async function initBridge(){
    try{
      const runId=new URLSearchParams(window.location.search).get("run");
      if(!runId) throw new Error("run-Parameter fehlt.");
      await loadBridgeScript();
      const run=window.AnalytikBridge.getRun(runId);
      if(!run) throw new Error("Analyse-Run wurde nicht gefunden.");
      if(run.app_id!=="ORG_FESTSTOFF_LAB") throw new Error("Der Run ist nicht für ORG_FESTSTOFF_LAB bestimmt.");
      if(!run.input || run.input.mode!=="qualitative_screening") throw new Error("Unbekannter Analyseauftrag.");

      bridgeRun=run;
      bridgeInput=run.input;
      model=findModel(bridgeInput.model_ref);
      if(!model) throw new Error("Das angeforderte Feststoffmodell ist nicht vorhanden.");

      state=loadState()||freshState();
      els.modeLabel.textContent="Analytik-Hub";
      els.bridgeContext.classList.add("active");
      els.bridgeSampleLabel.textContent=bridgeInput.display_label||model.display_label;
      els.bridgeRunLabel.textContent=run.run_id;
      els.bridgeMessage.textContent="Nur allgemeine Strukturmerkmale zurückgeben – keine Stoffidentität.";
      els.bridgeSubmitBtn.hidden=false;
    }catch(err){
      els.bridgeContext.classList.add("active","error");
      els.bridgeMessage.textContent="Hub-Verbindung fehlgeschlagen: "+err.message;
      els.bridgeSubmitBtn.hidden=false;
      els.bridgeSubmitBtn.disabled=true;
    }
  }

  function initSingleMode(){
    model=db.models[0];
    state=loadState()||freshState();
    els.modeLabel.textContent="Single-Mode";
  }

  function findModel(id){
    return db.models.find(x=>x.id===id)||null;
  }

  function freshState(){
    return {completedMethods:[],observations:{},summarized:false,supportedFeatures:{}};
  }

  function loadState(){
    try{
      const parsed=JSON.parse(localStorage.getItem(storageKey()));
      return parsed&&typeof parsed==="object"?Object.assign(freshState(),parsed):null;
    }catch(_){return null;}
  }

  function saveState(){
    localStorage.setItem(storageKey(),JSON.stringify(state));
  }

  function allowedMethods(){
    const requested=bridgeInput&&Array.isArray(bridgeInput.allowed_methods)?bridgeInput.allowed_methods:model.default_allowed_methods;
    return requested.filter(id=>model.methods[id]);
  }

  function requiredEvidence(){
    const requested=bridgeInput&&Array.isArray(bridgeInput.required_evidence)?bridgeInput.required_evidence:model.default_required_evidence;
    return requested.filter(id=>model.methods[id]);
  }

  function methodAvailable(id){
    const m=model.methods[id];
    return (m.requires||[]).every(req=>state.completedMethods.includes(req));
  }

  function runMethod(id){
    if(state.completedMethods.includes(id)||!methodAvailable(id)) return;
    const m=model.methods[id];
    state.completedMethods.push(id);
    state.observations[id]=m.measurement;
    state.summarized=false;
    state.supportedFeatures={};
    saveState();
    render();
  }

  function summarizeFindings(){
    if(!requiredEvidence().every(id=>state.completedMethods.includes(id))) return;
    const features={};
    Object.entries(model.feature_rules).forEach(([id,rule])=>{
      if(rule.evidence.every(ev=>state.completedMethods.includes(ev))){
        features[id]={strength:rule.strength,label_de:rule.label_de,note_de:rule.note_de};
      }
    });
    state.supportedFeatures=features;
    state.summarized=true;
    saveState();
    render();
  }

  function resetState(){
    state=freshState();
    saveState();
    render();
  }

  function render(){
    els.sampleTitle.textContent=(bridgeInput&&bridgeInput.display_label)||model.display_label;
    els.sampleIntro.textContent=model.intro_de;
    renderMethods();
    renderJournal();
    renderSummary();
  }

  function renderMethods(){
    const allowed=allowedMethods();
    els.progressBadge.textContent=state.completedMethods.length+" von "+allowed.length+" durchgeführt";
    els.methodGrid.innerHTML="";
    allowed.forEach(id=>{
      const m=model.methods[id];
      const done=state.completedMethods.includes(id);
      const available=methodAvailable(id);
      const card=document.createElement("article");
      card.className="method-card "+(done?"done ":"")+(available?"":"locked");
      card.innerHTML="<div><h3>"+escapeHtml(m.title_de)+"</h3><p>"+escapeHtml(m.description_de)+"</p></div>";
      const btn=document.createElement("button");
      btn.type="button";
      btn.textContent=done?"Durchgeführt":available?"Untersuchen":"zuerst "+(m.requires||[]).map(x=>model.methods[x].title_de).join(", ");
      btn.disabled=done||!available;
      btn.addEventListener("click",()=>runMethod(id));
      card.appendChild(btn);
      els.methodGrid.appendChild(card);
    });
  }

  function renderJournal(){
    if(!state.completedMethods.length){
      els.journal.innerHTML='<div class="journal-empty">Noch keine Untersuchung durchgeführt.</div>';
      return;
    }
    els.journal.innerHTML=state.completedMethods.map(id=>{
      const m=model.methods[id];
      return '<article class="journal-entry"><strong>'+escapeHtml(m.title_de)+'</strong>'+
        '<div class="observation">'+escapeHtml(m.observation_de)+'</div>'+
        '<div class="detail">'+escapeHtml(m.detail_de)+'</div></article>';
    }).join("");
  }

  function renderSummary(){
    const ready=requiredEvidence().every(id=>state.completedMethods.includes(id));
    els.summarizeBtn.disabled=!ready;
    els.summaryHint.textContent=ready
      ? (state.summarized?"Die Befunde sind zu allgemeinen Strukturmerkmalen zusammengeführt.":"Die Kernbefunde liegen vor. Jetzt können sie zusammengefasst werden.")
      : "Für eine belastbare Zusammenfassung fehlen noch: "+requiredEvidence().filter(id=>!state.completedMethods.includes(id)).map(id=>model.methods[id].title_de).join(", ")+".";
    els.featureGrid.innerHTML="";
    els.identityGuard.hidden=!state.summarized;
    els.bridgeSubmitBtn.disabled=!(bridgeMode&&state.summarized);

    if(!state.summarized) return;
    Object.values(state.supportedFeatures).forEach(feature=>{
      const card=document.createElement("article");
      card.className="feature-card";
      card.innerHTML="<strong>"+escapeHtml(feature.label_de)+"</strong><span>"+escapeHtml(strengthLabel(feature.strength))+" · "+escapeHtml(feature.note_de)+"</span>";
      els.featureGrid.appendChild(card);
    });
  }

  function strengthLabel(value){
    return ({strong:"stark gestützt",supported:"gestützt",indication:"Hinweis",observed:"beobachtet"})[value]||value;
  }

  function sendBridgeResult(){
    if(!bridgeMode||!bridgeRun||!window.AnalytikBridge||!state.summarized) return;

    const result={
      result_id:"RES_"+Date.now()+"_"+Math.random().toString(36).slice(2,7),
      run_id:bridgeRun.run_id,
      case_id:bridgeRun.case_id,
      sample_id:bridgeRun.sample_id,
      app_id:"ORG_FESTSTOFF_LAB",
      app_version:VERSION,
      analysis_type:"ORGANIC_SOLID_SCREENING",
      status:"completed",
      source:"app",
      measurement:{
        methods_completed:state.completedMethods.slice(),
        observations:Object.assign({},state.observations)
      },
      evaluation:{
        supported_features:Object.fromEntries(Object.entries(state.supportedFeatures).map(([id,v])=>[id,{strength:v.strength,note_de:v.note_de}]))
      },
      created_at:new Date().toISOString()
    };

    const completed=window.AnalytikBridge.completeRun(bridgeRun.run_id,result);
    window.AnalytikBridge.returnToHub(completed);
  }

  function escapeHtml(value){
    return String(value).replaceAll("&","&amp;").replaceAll("<","&lt;").replaceAll(">","&gt;").replaceAll('"',"&quot;").replaceAll("'","&#039;");
  }

  function fatal(message){
    document.body.innerHTML='<main class="wrap" style="padding:40px 0"><section class="card"><h1>ORG_FESTSTOFF_LAB konnte nicht gestartet werden</h1><p>'+escapeHtml(message)+'</p></section></main>';
  }
})();
