/* ============================================================
   ZAKMOLANITECH SOLUTIONS
   PHASE 2B — INTERACTION SYSTEM
============================================================ */

document.addEventListener("DOMContentLoaded", () => {


    /* ========================================================
       ELEMENTS
    ========================================================= */

    const exploreToggle =
        document.getElementById("exploreToggle");

    const explorePanel =
        document.getElementById("explorePanel");

    const navigationBackdrop =
        document.getElementById("navigationBackdrop");


    /* ========================================================
       EXPLORE NAVIGATION
    ======================================================== */

    function openMenu() {

        if (!explorePanel || !exploreToggle) return;

        explorePanel.classList.add("is-open");

        navigationBackdrop?.classList.add("is-visible");

        exploreToggle.classList.add("is-open");

        exploreToggle.setAttribute(
            "aria-expanded",
            "true"
        );

        explorePanel.setAttribute(
            "aria-hidden",
            "false"
        );

        exploreToggle.querySelector(".explore-text").textContent =
            "Close";

        document.body.classList.add("menu-open");

    }


    function closeMenu() {

        if (!explorePanel || !exploreToggle) return;

        explorePanel.classList.remove("is-open");

        navigationBackdrop?.classList.remove("is-visible");

        exploreToggle.classList.remove("is-open");

        exploreToggle.setAttribute(
            "aria-expanded",
            "false"
        );

        explorePanel.setAttribute(
            "aria-hidden",
            "true"
        );

        exploreToggle.querySelector(".explore-text").textContent =
            "Explore";

        document.body.classList.remove("menu-open");

    }


    function toggleMenu() {

        if (
            explorePanel?.classList.contains("is-open")
        ) {

            closeMenu();

        } else {

            openMenu();

        }

    }


    exploreToggle?.addEventListener(
        "click",
        toggleMenu
    );


    navigationBackdrop?.addEventListener(
        "click",
        closeMenu
    );


    /* ========================================================
       ESCAPE KEY
    ======================================================== */

    document.addEventListener(
        "keydown",
        (event) => {

            if (
                event.key === "Escape" &&
                explorePanel?.classList.contains("is-open")
            ) {

                closeMenu();

                exploreToggle?.focus();

            }

        }
    );


    /* ========================================================
       CLOSE MENU AFTER NAVIGATION
    ======================================================== */

    document
        .querySelectorAll(".explore-link")
        .forEach((link) => {

            link.addEventListener(
                "click",
                () => {

                    closeMenu();

                }
            );

        });


    /* ========================================================
       SCROLL REVEAL
    ======================================================== */

    const revealElements =
        document.querySelectorAll(".reveal");


    if (
        "IntersectionObserver" in window
    ) {

        const observer =
            new IntersectionObserver(
                (entries, observerInstance) => {

                    entries.forEach((entry) => {

                        if (
                            entry.isIntersecting
                        ) {

                            entry.target.classList.add(
                                "visible"
                            );

                            observerInstance.unobserve(
                                entry.target
                            );

                        }

                    });

                },
                {
                    threshold: 0.12,
                    rootMargin: "0px 0px -40px 0px"
                }
            );


        revealElements.forEach(
            (element) => observer.observe(element)
        );

    } else {

        revealElements.forEach(
            (element) =>
                element.classList.add("visible")
        );

    }


    /* ========================================================
       COUNTER ANIMATION
    ======================================================== */

    const counters =
        document.querySelectorAll(".counter");


    function animateCounter(counter) {

        const target =
            Number(counter.dataset.target || 0);

        const duration = 1100;

        const startTime =
            performance.now();


        function update(currentTime) {

            const progress =
                Math.min(
                    (currentTime - startTime) /
                    duration,
                    1
                );


            const eased =
                1 -
                Math.pow(
                    1 - progress,
                    3
                );


            const current =
                Math.floor(
                    target * eased
                );


            counter.textContent =
                current;


            if (progress < 1) {

                requestAnimationFrame(update);

            } else {

                counter.textContent =
                    target;

            }

        }


        requestAnimationFrame(update);

    }


    if (
        "IntersectionObserver" in window
    ) {

        const counterObserver =
            new IntersectionObserver(
                (entries, observerInstance) => {

                    entries.forEach((entry) => {

                        if (
                            entry.isIntersecting
                        ) {

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
                    threshold: 0.7
                }
            );


        counters.forEach(
            (counter) =>
                counterObserver.observe(counter)
        );

    } else {

        counters.forEach(
            (counter) => {

                counter.textContent =
                    counter.dataset.target || "0";

            }
        );

    }


    /* ========================================================
       CARD POINTER EFFECT
       Desktop only
    ======================================================== */

    const supportsFinePointer =
        window.matchMedia(
            "(hover: hover) and (pointer: fine)"
        ).matches;


    if (supportsFinePointer) {

        document
            .querySelectorAll(".service-card")
            .forEach((card) => {

                card.addEventListener(
                    "pointermove",
                    (event) => {

                        const rect =
                            card.getBoundingClientRect();


                        const x =
                            event.clientX -
                            rect.left;

                        const y =
                            event.clientY -
                            rect.top;


                        const rotateY =
                            ((x / rect.width) - 0.5) * 4;

                        const rotateX =
                            ((y / rect.height) - 0.5) * -4;


                        card.style.transform =
                            `translateY(-8px)
                             perspective(900px)
                             rotateX(${rotateX}deg)
                             rotateY(${rotateY}deg)`;

                    }
                );


                card.addEventListener(
                    "pointerleave",
                    () => {

                        card.style.transform = "";

                    }
                );

            });

    }


    /* ========================================================
       HEADER SCROLL STATE
    ======================================================== */

    let lastScrollY =
        window.scrollY;


    window.addEventListener(
        "scroll",
        () => {

            const currentScroll =
                window.scrollY;


            const header =
                document.querySelector(
                    ".site-header"
                );


            if (!header) return;


            if (currentScroll > 20) {

                header.style.borderBottomColor =
                    "rgba(100, 170, 220, 0.14)";

            } else {

                header.style.borderBottomColor =
                    "rgba(100, 170, 220, 0.08)";

            }


            lastScrollY =
                currentScroll;

        },
        {
            passive: true
        }
    );


    /* ========================================================
       WINDOW RESIZE
    ======================================================== */

    window.addEventListener(
        "resize",
        () => {

            if (
                window.innerWidth > 1000 &&
                explorePanel?.classList.contains("is-open")
            ) {

                closeMenu();

            }

        }
    );


    /* ========================================================
       INITIAL STATE
    ======================================================== */

    explorePanel?.setAttribute(
        "aria-hidden",
        "true"
    );


});
