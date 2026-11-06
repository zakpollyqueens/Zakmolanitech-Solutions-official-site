(()=>{"use strict";
const KEY="zakitech.portal.appearance.v1";
const defaults={theme:"light",accent:"cyan",wallpaper:"aurora",density:"comfortable",reduceMotion:false,customWallpaper:""};
const wallpapers={
 aurora:"radial-gradient(ellipse at 12% 8%,#d8f3fa 0%,transparent 42%),radial-gradient(ellipse at 90% 12%,#e6eaff 0%,transparent 38%),linear-gradient(145deg,#f5fbff,#edf4fb 60%,#f8fbff)",
 ocean:"radial-gradient(ellipse at 8% 0%,#c5f0f5 0%,transparent 48%),linear-gradient(145deg,#eaf8fc,#e8f0fb 55%,#f5f9ff)",
 sunrise:"radial-gradient(ellipse at 88% 8%,#ffe1c9 0%,transparent 43%),radial-gradient(ellipse at 8% 0%,#f8dff1 0%,transparent 42%),linear-gradient(145deg,#fff8f1,#f6effa)",
 forest:"radial-gradient(ellipse at 12% 5%,#d5f1df 0%,transparent 45%),linear-gradient(145deg,#f0faf3,#eaf5f1 60%,#f7fbf8)",
 midnight:"radial-gradient(ellipse at 15% 5%,#173d63 0%,transparent 44%),radial-gradient(ellipse at 90% 0%,#173b58 0%,transparent 40%),linear-gradient(145deg,#071321,#0d1d32 65%,#101a2d)"
};
const accents={cyan:"#078da9",blue:"#2868c5",violet:"#7958c7",emerald:"#16866b",rose:"#c45d86"};
function read(){try{return {...defaults,...JSON.parse(localStorage.getItem(KEY)||"{}")}}catch(_){return {...defaults}}}
function apply(){
 const p=read(),root=document.documentElement,body=document.body;
 root.dataset.portalTheme=p.theme==="system"?(matchMedia("(prefers-color-scheme: dark)").matches?"dark":"light"):p.theme;
 root.dataset.portalDensity=p.density;
 root.style.setProperty("--portal-accent",accents[p.accent]||accents.cyan);
 const wallpaper=p.customWallpaper||wallpapers[p.wallpaper]||wallpapers.aurora;
 let style=document.getElementById("portalAppearanceRuntime");
 if(!style){style=document.createElement("style");style.id="portalAppearanceRuntime";document.head.appendChild(style)}
 style.textContent=".client-portal .portal-main,.client-portal .settings-page,.client-portal .profile-page,.client-portal .dashboard-page,.client-portal .projects-page,.client-portal .messages-page,.client-portal .notifications-page,.client-portal .support-page{background:"+(p.customWallpaper?"url("+JSON.stringify(p.customWallpaper)+") center/cover fixed no-repeat":wallpaper+" fixed") +"!important}"+
 ".client-portal .btn-primary,.client-portal .new-btn,.client-portal .send-btn{background:linear-gradient(130deg,var(--portal-accent),#286abd)!important}"+
 (root.dataset.portalTheme==="dark"?".client-portal .settings-card,.client-portal .profile-card,.client-portal .preference-card,.client-portal .preference-head,.client-portal .support-card,.client-portal .message-panel,.client-portal .notification,.client-portal .community-selector{background:#13263a!important;color:#e7f0f7!important;border-color:#29445d!important}.client-portal .settings-card h2,.client-portal .profile-card h2,.client-portal .settings-head h1,.client-portal .profile-head h1,.client-portal .support-header h1{color:#eff7ff!important}.client-portal .settings-card p,.client-portal .settings-head p,.client-portal .profile-head p,.client-portal .settings-security-help{color:#a9bdcc!important}.client-portal .form-field input,.client-portal .composer textarea,.client-portal .form-input{background:#0d1d2e!important;color:#edf6ff!important;border-color:#34516b!important}.client-portal .portal-topbar{background:#102238!important;border-color:#29445d!important}.client-portal .portal-topbar,.client-portal .breadcrumb,.client-portal .topbar-user{color:#dbe9f4!important}.client-portal .settings-head,.client-portal .profile-head,.client-portal .support-header,.client-portal .messages-head,.client-portal .notifications-head{background:linear-gradient(120deg,#142b41,#18334a)!important;border-color:#29445d!important}.client-portal .settings-page,.client-portal .profile-page,.client-portal .preference-page{color:#e7f0f7!important}.client-portal .preference-head{background:linear-gradient(120deg,#142b41,#18334a)!important;border-color:#29445d!important}.client-portal .preference-head h1,.client-portal .preference-card h2{color:#eff7ff!important}.client-portal .preference-head p,.client-portal .preference-card p{color:#a9bdcc!important}.client-portal .preference-option{background:#0d1d2e!important;color:#dbe9f4!important;border-color:#34516b!important}.client-portal .preference-row{color:#c0d0dc!important;border-color:#29445d!important}":"")+
 (p.density==="compact"?".client-portal .settings-card,.client-portal .profile-card,.client-portal .notification{padding:17px!important;margin-bottom:12px!important}.client-portal .form-field{margin-bottom:11px!important}.client-portal .preference-row{padding:8px 0!important}":"")+
 (p.reduceMotion?"*,*::before,*::after{scroll-behavior:auto!important;animation-duration:.01ms!important;animation-iteration-count:1!important;transition-duration:.01ms!important}":"");
 if(body)body.dataset.portalAppearance="ready";
}
window.ZakiPortalAppearance={read,save(patch){const next={...read(),...patch};localStorage.setItem(KEY,JSON.stringify(next));apply();return next},reset(){localStorage.removeItem(KEY);apply()},wallpapers:Object.keys(wallpapers),accents:Object.keys(accents),key:KEY,apply};
apply();window.addEventListener("storage",e=>{if(e.key===KEY)apply()});window.matchMedia("(prefers-color-scheme: dark)").addEventListener?.("change",()=>{if(read().theme==="system")apply()});
})();