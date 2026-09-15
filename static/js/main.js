/* ============================================================
   ZAKMOLANITECH SOLUTIONS
   PHASE 2B — INTERACTION SYSTEM
============================================================ */

document.addEventListener("DOMContentLoaded",async()=>{

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

    try{

    if(!window.supabase){
        await new Promise((resolve,reject)=>{
            const script=document.createElement("script");
            script.src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2";
            script.onload=resolve;
            script.onerror=reject;
            document.head.appendChild(script);
        });
    }

    const{createClient}=window.supabase;

    const updatesDb=createClient(
        "https://julhswsijtcoyjrjrobk.supabase.co",
        "sb_publishable_a0qKsqBB0hR9BOWpP3dkwg_7nUOmXYC"
    );

    const{data:updates,error:updatesError}=await updatesDb
        .from("updates")
        .select("id,title,category,description,button_text,button_url,is_published,published_at,expires_at,sort_order,image_url")
        .eq("is_published",true)
        .order("sort_order",{ascending:true})
        .order("published_at",{ascending:false});

    if(updatesError)throw updatesError;

    const now=Date.now();

    const visibleUpdates=(updates||[]).filter(update=>
        !update.expires_at ||
        new Date(update.expires_at).getTime()>now
    );

    const escapeHtml=value=>String(value??"")
        .replace(/&/g,"&amp;")
        .replace(/</g,"&lt;")
        .replace(/>/g,"&gt;")
        .replace(/"/g,"&quot;")
        .replace(/'/g,"&#039;");

    const safeUrl=value=>{
        const url=String(value??"").trim();
        if(!url)return "";
        if(url.startsWith("/")||url.startsWith("#"))return url;
        if(/^https?:\/\//i.test(url))return url;
        return "";
    };

    if(visibleUpdates.length){

        updatesTrack.innerHTML=visibleUpdates.map(update=>{

            const category=escapeHtml(update.category||"UPDATE");
            const title=escapeHtml(update.title||"Latest Update");
            const description=escapeHtml(update.description||"");
            const buttonText=escapeHtml(update.button_text||"Learn More");
            const buttonUrl=safeUrl(update.button_url);
            const imageUrl=safeUrl(update.image_url);

            const imageClass=
                String(update.category||"update")
                .toLowerCase()
                .replace(/[^a-z0-9_-]/g,"-");

            const imageStyle=imageUrl
                ?` style="background-image:url('${imageUrl}');background-size:cover;background-position:center;"`
                :"";

            return `<article class="update-card">
                <div class="update-image update-${imageClass}"${imageStyle}>
                    <span>${category}</span>
                </div>
                <div class="update-content">
                    <small>${category}</small>
                    <h3>${title}</h3>
                    <p>${description}</p>
                    ${buttonUrl
                        ?`<a href="${buttonUrl}" class="card-link">${buttonText} →</a>`
                        :""}
                </div>
            </article>`;

        }).join("");

    }else{

        updatesTrack.innerHTML=`<article class="update-card">
            <div class="update-image update-software"><span>UPDATES</span></div>
            <div class="update-content">
                <small>UPDATES</small>
                <h3>No new updates yet.</h3>
                <p>Check back soon for the latest news, services, projects and technology announcements.</p>
            </div>
        </article>`;

    }

}catch(error){

    console.error("Homepage updates error:",error);

}

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
   CONTACT FORM
============================================================ */
const contactForm=document.getElementById("contactForm");
const contactStatus=document.getElementById("contactFormStatus");

if(contactForm&&contactStatus){

contactForm.addEventListener("submit",async event=>{
event.preventDefault();

const name=document.getElementById("contactName")?.value.trim()||"";
const phone=document.getElementById("contactPhone")?.value.trim()||"";
const email=document.getElementById("contactEmail")?.value.trim()||"";
const subject=document.getElementById("contactSubject")?.value.trim()||"";
const message=document.getElementById("contactMessage")?.value.trim()||"";

if(!name||!phone||!email||!subject||!message){
contactStatus.textContent="Please complete all required fields before submitting.";
contactStatus.style.color="var(--danger,#ff6b6b)";
return;
}

contactStatus.textContent="Sending your message...";
contactStatus.style.color="var(--cyan)";

const submit=contactForm.querySelector('button[type="submit"]');
if(submit)submit.disabled=true;

try{

if(!window.supabase){
await new Promise((resolve,reject)=>{
const script=document.createElement("script");
script.src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2";
script.onload=resolve;
script.onerror=reject;
document.head.appendChild(script);
});
}

const{createClient}=window.supabase;

const db=createClient(
"https://julhswsijtcoyjrjrobk.supabase.co",
"sb_publishable_a0qKsqBB0hR9BOWpP3dkwg_7nUOmXYC"
);

const{error}=await db.from("contact_messages").insert([{
name,
phone,
email,
subject,
message
}]);

if(error)throw error;

contactStatus.textContent=
"Your message has been sent successfully. We will get back to you soon.";
contactStatus.style.color="var(--cyan)";
contactForm.reset();

}catch(error){

console.error("Contact form submission error:",error);

contactStatus.textContent=
"Sorry, your message could not be sent right now. Please try again.";
contactStatus.style.color="var(--danger,#ff6b6b)";

}finally{

if(submit)submit.disabled=false;

}

});
}

/* ============================================================
   SERVICE REQUEST FORM
============================================================ */
const serviceForm=document.getElementById("serviceRequestForm");
const serviceStatus=document.getElementById("serviceFormStatus");

if(serviceForm&&serviceStatus){
serviceForm.addEventListener("submit",async event=>{
event.preventDefault();

const name=document.getElementById("serviceName")?.value.trim()||"";
const phone=document.getElementById("servicePhone")?.value.trim()||"";
const email=document.getElementById("serviceEmail")?.value.trim()||"";
const service=document.getElementById("serviceType")?.value.trim()||"";
const message=document.getElementById("serviceMessage")?.value.trim()||"";

if(!name||!service||!message){
serviceStatus.textContent="Please complete the required fields before submitting.";
serviceStatus.style.color="var(--danger,#ff6b6b)";
return;
}

serviceStatus.textContent="Sending your service request...";
serviceStatus.style.color="var(--cyan)";

const submit=serviceForm.querySelector('button[type="submit"]');
if(submit)submit.disabled=true;

try{
if(!window.supabase){
await new Promise((resolve,reject)=>{
const script=document.createElement("script");
script.src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2";
script.onload=resolve;
script.onerror=reject;
document.head.appendChild(script);
});
}

const{createClient}=window.supabase;

const db=createClient(
"https://julhswsijtcoyjrjrobk.supabase.co",
"sb_publishable_a0qKsqBB0hR9BOWpP3dkwg_7nUOmXYC"
);

const{error}=await db.from("service_requests").insert([{
name,
phone,
email,
service,
message
}]);

if(error)throw error;

serviceStatus.textContent="Your service request has been sent successfully. We will get back to you soon.";
serviceStatus.style.color="var(--cyan)";
serviceForm.reset();

}catch(error){
console.error("Service request submission error:",error);
serviceStatus.textContent="Sorry, your request could not be sent right now. Please try again.";
serviceStatus.style.color="var(--danger,#ff6b6b)";
}finally{
if(submit)submit.disabled=false;
}
});
}


});
