/* ============================================================
   ZAKMOLANITECH SOLUTIONS
   PHASE 2B — INTERACTION SYSTEM
============================================================ */

document.addEventListener("DOMContentLoaded",()=>{

/* ============================================================
   ELEMENTS
============================================================ */

const exploreToggle=document.getElementById("exploreToggle"),
      explorePanel=document.getElementById("explorePanel"),
      navigationBackdrop=document.getElementById("navigationBackdrop");


/* ============================================================
   EXPLORE NAVIGATION
============================================================ */

function openMenu(){
    if(!explorePanel||!exploreToggle)return;

    explorePanel.classList.add("is-open");
    navigationBackdrop?.classList.add("is-visible");
    exploreToggle.classList.add("is-open");

    exploreToggle.setAttribute("aria-expanded","true");
    explorePanel.setAttribute("aria-hidden","false");

    const text=exploreToggle.querySelector(".explore-text");
    if(text)text.textContent="Close";

    document.body.classList.add("menu-open");
}

function closeMenu(){
    if(!explorePanel||!exploreToggle)return;

    explorePanel.classList.remove("is-open");
    navigationBackdrop?.classList.remove("is-visible");
    exploreToggle.classList.remove("is-open");

    exploreToggle.setAttribute("aria-expanded","false");
    explorePanel.setAttribute("aria-hidden","true");

    const text=exploreToggle.querySelector(".explore-text");
    if(text)text.textContent="Explore";

    document.body.classList.remove("menu-open");
}

function toggleMenu(){
    if(explorePanel?.classList.contains("is-open")){
        closeMenu();
    }else{
        openMenu();
    }
}

exploreToggle?.addEventListener("click",toggleMenu);
navigationBackdrop?.addEventListener("click",closeMenu);


/* ============================================================
   ESCAPE KEY
============================================================ */

document.addEventListener("keydown",event=>{
    if(
        event.key==="Escape" &&
        explorePanel?.classList.contains("is-open")
    ){
        closeMenu();
        exploreToggle?.focus();
    }
});


/* ============================================================
   CLOSE MENU AFTER NAVIGATION
============================================================ */

document.querySelectorAll(".explore-link").forEach(link=>{
    link.addEventListener("click",closeMenu);
});


/* ============================================================
   HIDDEN ADMIN LOGIN
   5 QUICK TAPS ON COMPANY LOGO
============================================================ */

const adminTrigger=document.getElementById("adminTrigger");

if(adminTrigger){

    let taps=0;
    let tapTimer=null;

    adminTrigger.addEventListener("click",event=>{

        event.preventDefault();
        event.stopPropagation();

        taps++;

        clearTimeout(tapTimer);

        tapTimer=setTimeout(()=>{
            taps=0;
        },1500);

        if(taps>=5){

            taps=0;

            const adminPath=
                window.location.pathname.includes("/templates/")
                ? "admin-login.html"
                : "templates/admin-login.html";

            window.location.href=adminPath;
        }

    });

}


/* ============================================================
   SCROLL REVEAL
============================================================ */

const revealElements=document.querySelectorAll(".reveal");

if("IntersectionObserver" in window){

    const observer=new IntersectionObserver(
        (entries,observerInstance)=>{

            entries.forEach(entry=>{

                if(entry.isIntersecting){

                    entry.target.classList.add("visible");

                    observerInstance.unobserve(
                        entry.target
                    );

                }

            });

        },
        {
            threshold:.12,
            rootMargin:"0px 0px -40px 0px"
        }
    );

    revealElements.forEach(
        element=>observer.observe(element)
    );

}else{

    revealElements.forEach(
        element=>element.classList.add("visible")
    );

}


/* ============================================================
   COUNTER ANIMATION
============================================================ */

const counters=document.querySelectorAll(".counter");

function animateCounter(counter){

    const target=Number(
        counter.dataset.target||0
    );

    const duration=1100;
    const startTime=performance.now();

    function update(currentTime){

        const progress=Math.min(
            (currentTime-startTime)/duration,
            1
        );

        const eased=
            1-Math.pow(1-progress,3);

        counter.textContent=
            Math.floor(target*eased);

        if(progress<1){

            requestAnimationFrame(update);

        }else{

            counter.textContent=target;

        }

    }

    requestAnimationFrame(update);
}

if("IntersectionObserver" in window){

    const counterObserver=new IntersectionObserver(
        (entries,observerInstance)=>{

            entries.forEach(entry=>{

                if(entry.isIntersecting){

                    animateCounter(
                        entry.target
                    );

                    observerInstance.unobserve(
                        entry.target
                    );

                }

            });

        },
        {
            threshold:.7
        }
    );

    counters.forEach(
        counter=>counterObserver.observe(counter)
    );

}else{

    counters.forEach(counter=>{
        counter.textContent=
            counter.dataset.target||"0";
    });

}


/* ============================================================
   CARD POINTER EFFECT
   DESKTOP / FINE POINTER ONLY
============================================================ */

const supportsFinePointer=
    window.matchMedia(
        "(hover: hover) and (pointer: fine)"
    ).matches;

if(supportsFinePointer){

    document.querySelectorAll(".service-card")
    .forEach(card=>{

        card.addEventListener(
            "pointermove",
            event=>{

                const rect=
                    card.getBoundingClientRect();

                const x=
                    event.clientX-rect.left;

                const y=
                    event.clientY-rect.top;

                const rotateY=
                    ((x/rect.width)-.5)*4;

                const rotateX=
                    ((y/rect.height)-.5)*-4;

                card.style.transform=
                    `translateY(-8px)
                     perspective(900px)
                     rotateX(${rotateX}deg)
                     rotateY(${rotateY}deg)`;
            }
        );

        card.addEventListener(
            "pointerleave",
            ()=>{
                card.style.transform="";
            }
        );

    });

}


/* ============================================================
   HEADER SCROLL STATE
============================================================ */

window.addEventListener(
    "scroll",
    ()=>{

        const header=
            document.querySelector(".site-header");

        if(!header)return;

        if(window.scrollY>20){

            header.style.borderBottomColor=
                "rgba(100,170,220,.14)";

        }else{

            header.style.borderBottomColor=
                "rgba(100,170,220,.08)";

        }

    },
    {
        passive:true
    }
);


/* ============================================================
   WINDOW RESIZE
============================================================ */

window.addEventListener(
    "resize",
    ()=>{

        if(
            window.innerWidth>1000 &&
            explorePanel?.classList.contains("is-open")
        ){
            closeMenu();
        }

    }
);


/* ============================================================
   LIVE UPDATES SLIDER
============================================================ */

const updatesTrack=
        document.getElementById("updatesTrack"),

      updatesPrev=
        document.getElementById("updatesPrev"),

      updatesNext=
        document.getElementById("updatesNext"),

      updatesDots=
        document.getElementById("updatesDots");


if(
    updatesTrack &&
    updatesPrev &&
    updatesNext &&
    updatesDots
){

    const cards=[
        ...updatesTrack.querySelectorAll(".update-card")
    ];

    if(cards.length){

        let current=0;
        let timer=null;

        const reducedMotion=
            window.matchMedia(
                "(prefers-reduced-motion: reduce)"
            ).matches;


        function perView(){

            if(window.innerWidth<=680){
                return 1;
            }

            if(window.innerWidth<=1000){
                return 2;
            }

            return 3;
        }


        function maxIndex(){

            return Math.max(
                0,
                cards.length-perView()
            );
        }


        function renderDots(){

            updatesDots.innerHTML="";

            for(
                let i=0;
                i<=maxIndex();
                i++
            ){

                const dot=
                    document.createElement("button");

                dot.className=
                    "update-dot"+
                    (i===current?" active":"");

                dot.type="button";

                dot.setAttribute(
                    "aria-label",
                    "Show update "+(i+1)
                );

                dot.addEventListener(
                    "click",
                    ()=>{
                        goTo(i);
                        restartAuto();
                    }
                );

                updatesDots.appendChild(dot);
            }
        }


        function goTo(index){

            current=Math.max(
                0,
                Math.min(index,maxIndex())
            );

            const cardWidth=
                cards[0].getBoundingClientRect().width;

            const gap=
                parseFloat(
                    getComputedStyle(
                        updatesTrack
                    ).gap
                )||0;

            updatesTrack.style.transform=
                `translateX(-${
                    current*(cardWidth+gap)
                }px)`;

            renderDots();
        }


        function next(){

            goTo(
                current>=maxIndex()
                ?0
                :current+1
            );
        }


        function prev(){

            goTo(
                current<=0
                ?maxIndex()
                :current-1
            );
        }


        function startAuto(){

            if(reducedMotion)return;

            clearInterval(timer);

            if(maxIndex()>0){

                timer=
                    setInterval(
                        next,
                        5000
                    );
            }
        }


        function restartAuto(){

            if(reducedMotion)return;

            startAuto();
        }


        updatesNext.addEventListener(
            "click",
            ()=>{
                next();
                restartAuto();
            }
        );


        updatesPrev.addEventListener(
            "click",
            ()=>{
                prev();
                restartAuto();
            }
        );


        window.addEventListener(
            "resize",
            ()=>{
                current=
                    Math.min(
                        current,
                        maxIndex()
                    );

                goTo(current);
                startAuto();
            }
        );


        updatesTrack.addEventListener(
            "mouseenter",
            ()=>{
                clearInterval(timer);
            }
        );


        updatesTrack.addEventListener(
            "mouseleave",
            startAuto
        );


        updatesTrack.addEventListener(
            "touchstart",
            ()=>{
                clearInterval(timer);
            },
            {
                passive:true
            }
        );


        updatesTrack.addEventListener(
            "touchend",
            startAuto,
            {
                passive:true
            }
        );


        renderDots();
        goTo(0);
        startAuto();

    }

}


/* ============================================================
   SERVICE REQUEST FORM
============================================================ */

const serviceForm=
        document.getElementById(
            "serviceRequestForm"
        ),

      serviceStatus=
        document.getElementById(
            "serviceFormStatus"
        );


if(serviceForm&&serviceStatus){

    serviceForm.addEventListener(
        "submit",
        event=>{

            event.preventDefault();

            serviceStatus.textContent=
                "Service request received on this page. Backend submission will be connected in the next phase.";

            serviceStatus.style.color=
                "var(--cyan)";

            serviceForm.reset();

        }
    );

}

});
