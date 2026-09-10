/*

Zakmolanitech Solutions<br />Phase 2A — Main JavaScript

*/

"use strict";

const exploreBtn = document.getElementById("exploreBtn");
const mobileExplore = document.getElementById("mobileExplore");
const closeExplore = document.getElementById("closeExplore");
const explorePanel = document.getElementById("explorePanel");
const panelBackdrop = document.getElementById("panelBackdrop");

function setExplore(open) {
if (!explorePanel) return;

explorePanel.classList.toggle("open", open);
panelBackdrop?.classList.toggle("show", open);
explorePanel.setAttribute("aria-hidden", String(!open));
exploreBtn?.setAttribute("aria-expanded", String(open));
mobileExplore?.setAttribute("aria-expanded", String(open));
document.body.classList.toggle("panel-open", open);

}

function toggleExplore() {
setExplore(!explorePanel?.classList.contains("open"));
}

exploreBtn?.addEventListener("click", toggleExplore);
mobileExplore?.addEventListener("click", toggleExplore);
closeExplore?.addEventListener("click", () => setExplore(false));
panelBackdrop?.addEventListener("click", () => setExplore(false));

document.querySelectorAll(".panel-links a").forEach(link =>
link.addEventListener("click", () => setExplore(false))
);

document.addEventListener("keydown", event => {
if (event.key === "Escape") setExplore(false);
});

window.addEventListener("resize", () => {
if (window.innerWidth > 900 && explorePanel?.classList.contains("open")) {
setExplore(false);
}
});
