(function(){
  "use strict";

  function startIntro(){
    const overlay=document.getElementById("zak-home-intro");
    const counter=document.getElementById("zakIntroCountdown");
    const status=document.getElementById("zakIntroStatus");

    if(!overlay||!counter)return;

    document.body.classList.add("zak-intro-active");

    let count=5;

    const messages={
      5:"Initializing digital experience...",
      4:"Connecting innovation...",
      3:"Securing your experience...",
      2:"Preparing digital solutions...",
      1:"Almost ready...",
      0:"Welcome to Zakmolanitech Solutions"
    };

    counter.textContent=count;
    if(status)status.textContent=messages[count];

    const timer=setInterval(function(){
      count--;

      counter.textContent=count;

      if(status){
        status.textContent=messages[count]||"Loading...";
      }

      if(count<=0){
        clearInterval(timer);

        setTimeout(function(){
          overlay.classList.add("zak-intro-hidden");
          document.body.classList.remove("zak-intro-active");

          setTimeout(function(){
            overlay.remove();
          },950);

        },450);
      }
    },1000);
  }

  if(document.readyState==="loading"){
    document.addEventListener("DOMContentLoaded",startIntro);
  }else{
    startIntro();
  }

})();
