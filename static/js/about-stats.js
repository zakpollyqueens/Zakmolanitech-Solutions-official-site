(function(){
  "use strict";

  function startStats(){
    const stats=document.querySelectorAll(".stat-number[data-target]");
    if(!stats.length)return;

    stats.forEach(function(el){
      const target=parseInt(el.dataset.target,10);
      if(!Number.isFinite(target)){
        el.textContent="0";
        return;
      }

      let current=0;
      const duration=1200;
      const start=performance.now();

      function update(now){
        const progress=Math.min((now-start)/duration,1);
        const eased=1-Math.pow(1-progress,3);

        current=Math.round(target*eased);
        el.textContent=current;

        if(progress<1){
          requestAnimationFrame(update);
        }else{
          el.textContent=target;
        }
      }

      requestAnimationFrame(update);
    });
  }

  if(document.readyState==="loading"){
    document.addEventListener("DOMContentLoaded",startStats);
  }else{
    startStats();
  }
})();
