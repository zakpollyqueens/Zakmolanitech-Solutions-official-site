(()=> {
  const STORAGE_KEY="zakitech.portal.quick-lock.v1";
  const SESSION_KEY="zakitech.portal.quick-lock-unlocked.v1";
  const IDLE_MS=5*60*1000;
  let idleTimer=null,overlay=null;
  const enc=new TextEncoder();
  const hex=b=>Array.from(new Uint8Array(b)).map(x=>x.toString(16).padStart(2,"0")).join("");
  const unhex=s=>new Uint8Array((s.match(/.{1,2}/g)||[]).map(x=>parseInt(x,16)));
  async function digest(pin,salt){
    const key=await crypto.subtle.importKey("raw",enc.encode(pin),"PBKDF2",false,["deriveBits"]);
    return await crypto.subtle.deriveBits({name:"PBKDF2",salt,iterations:180000,hash:"SHA-256"},key,256);
  }
  function config(){try{return JSON.parse(localStorage.getItem(STORAGE_KEY)||"null")}catch(_){return null}}
  async function matches(pin,cfg){
    if(!cfg||!/^\d{6,12}$/.test(pin))return false;
    const actual=hex(await digest(pin,unhex(cfg.salt))),expected=cfg.hash||"";
    if(actual.length!==expected.length)return false;
    let diff=0;for(let i=0;i<actual.length;i++)diff|=actual.charCodeAt(i)^expected.charCodeAt(i);
    return diff===0;
  }
  function styleOverlay(){
    if(document.getElementById("zakPortalLockStyles"))return;
    const style=document.createElement("style");style.id="zakPortalLockStyles";
    style.textContent="#zakPortalLock{position:fixed;inset:0;z-index:2147483000;display:grid;place-items:center;padding:22px;background:radial-gradient(circle at 15% 10%,#1b6d91 0,transparent 38%),linear-gradient(145deg,#071a2e,#0b2340 58%,#071326);font-family:Arial,sans-serif;color:#fff}#zakPortalLock .lock-card{width:min(100%,390px);padding:30px;border:1px solid #ffffff30;border-radius:24px;background:#ffffff12;box-shadow:0 25px 80px #0007;backdrop-filter:blur(18px);text-align:center}#zakPortalLock .lock-icon{width:62px;height:62px;margin:0 auto 18px;display:grid;place-items:center;border-radius:20px;background:linear-gradient(145deg,#1b9cba,#2866c0);font-size:27px}#zakPortalLock h2{margin:0 0 8px;font-size:23px}#zakPortalLock p{margin:0 0 20px;color:#c6d7e6;font-size:13px;line-height:1.6}#zakPortalLock input{width:100%;height:52px;padding:0 15px;border:1px solid #ffffff3d;border-radius:12px;background:#07182c;color:#fff;text-align:center;font-size:22px;letter-spacing:8px;outline:0}#zakPortalLock button{width:100%;height:50px;margin-top:13px;border:0;border-radius:12px;background:linear-gradient(110deg,#0795b4,#3267ce);color:white;font-weight:800;font-size:14px;cursor:pointer}#zakPortalLock .lock-error{min-height:18px;margin-top:10px;color:#ffbaba;font-size:12px}";
    document.head.append(style);
  }
  function showOverlay(){
    if(overlay)return;
    styleOverlay();
    overlay=document.createElement("div");overlay.id="zakPortalLock";
    const card=document.createElement("div");card.className="lock-card";
    const icon=document.createElement("div");icon.className="lock-icon";icon.textContent="🔒";
    const title=document.createElement("h2");title.textContent="Workspace locked";
    const note=document.createElement("p");note.textContent="Enter your quick-lock PIN to continue to your ZakiTech workspace.";
    const form=document.createElement("form");
    const input=document.createElement("input");input.type="password";input.inputMode="numeric";input.autocomplete="current-password";input.maxLength=12;input.placeholder="••••••";input.setAttribute("aria-label","Workspace PIN");input.required=true;
    const button=document.createElement("button");button.type="submit";button.textContent="Unlock workspace";
    const error=document.createElement("div");error.className="lock-error";error.setAttribute("role","alert");
    form.append(input,button);card.append(icon,title,note,form,error);overlay.append(card);document.body.append(overlay);
    form.addEventListener("submit",async e=>{
      e.preventDefault();button.disabled=true;button.textContent="Checking…";error.textContent="";
      try{
        if(await matches(input.value.trim(),config())){
          sessionStorage.setItem(SESSION_KEY,"1");overlay.remove();overlay=null;input.value="";startIdleTimer();
        }else{error.textContent="That PIN is not correct. Try again.";input.value="";input.focus()}
      }catch(_){error.textContent="This browser could not verify the PIN. Please reload and try again."}
      finally{button.disabled=false;button.textContent="Unlock workspace"}
    });
    input.focus();
  }
  function clearIdleTimer(){if(idleTimer)clearTimeout(idleTimer);idleTimer=null}
  function startIdleTimer(){
    clearIdleTimer();if(!config()||sessionStorage.getItem(SESSION_KEY)!=="1")return;
    idleTimer=setTimeout(()=>api.lockNow(),IDLE_MS);
  }
  function activity(){if(!overlay)startIdleTimer()}
  const api={
    isEnabled:()=>!!config(),
    async setPin(pin){
      if(!/^\d{6,12}$/.test(pin))throw new Error("Use a PIN containing 6 to 12 digits.");
      if(!crypto||!crypto.subtle)throw new Error("Secure PIN storage is not available in this browser.");
      const salt=crypto.getRandomValues(new Uint8Array(16)),hash=hex(await digest(pin,salt));
      localStorage.setItem(STORAGE_KEY,JSON.stringify({salt:hex(salt),hash,version:1}));
      sessionStorage.setItem(SESSION_KEY,"1");startIdleTimer();return true;
    },
    async disable(pin){
      if(!await matches(pin,config()))throw new Error("The current PIN is not correct.");
      localStorage.removeItem(STORAGE_KEY);sessionStorage.removeItem(SESSION_KEY);clearIdleTimer();return true;
    },
    lockNow(){
      if(!config())return;
      sessionStorage.removeItem(SESSION_KEY);clearIdleTimer();showOverlay();
    }
  };
  window.ZakiPortalLock=api;
  if(config()){
    if(sessionStorage.getItem(SESSION_KEY)==="1")startIdleTimer();
    else showOverlay();
    ["pointerdown","keydown","touchstart","mousemove"].forEach(name=>window.addEventListener(name,activity,{passive:true}));
  }
})();