// Ensure we don't start at absolute 0 to avoid immediate wrap flicker
try {
  if ("scrollRestoration" in history) {
    history.scrollRestoration = "manual";
  }
} catch (e) {}
// Small nudge away from 0 before DOM is ready
window.scrollTo(0, 10);

document.addEventListener("DOMContentLoaded", () => {
  gsap.registerPlugin(ScrollTrigger);
  // Use Lenis-based wrap for infinite experience without duplicating the main wrapper
    // Duplicate the full main wrapper for long page length (Lenis will wrap)
    try {
      const main = document.querySelector('.main-wrapper');
      if (main) {
        const fragment = document.createDocumentFragment();
        // create several copies to ensure enough scroll distance
        const copies = 5; // adjust as needed
        for (let i = 0; i < copies; i++) {
          const clone = main.cloneNode(true);
          fragment.appendChild(clone);
        }
        document.body.appendChild(fragment);
      }
    } catch (e) {}
  // Prepare all marquees for a seamless infinite loop (two identical lists per track)
  try {
    document.querySelectorAll('.marquee__wrapper').forEach((track) => {
      const lists = Array.from(track.querySelectorAll('.list'));
      if (!lists.length) return;
      const source = lists[0];
      let second = lists[1];
      if (!second) {
        second = source.cloneNode(true);
        second.setAttribute('aria-hidden', 'true');
        track.appendChild(second);
      } else {
        second.innerHTML = source.innerHTML;
        second.setAttribute('aria-hidden', 'true');
      }
      for (let i = 2; i < lists.length; i++) {
        lists[i].remove();
      }
    });
  } catch (e) {}
  const stickySection = document.querySelector(".sticky");
  const totalStickyHeight = window.innerHeight * 6; // ensure enough height for looping

  // lenis smooth scroll
  const lenis = new Lenis();
  lenis.on("scroll", ScrollTrigger.update);
  gsap.ticker.add((time) => {
    lenis.raf(time * 1000);
  });
  gsap.ticker.lagSmoothing(0);

  // helper func: split text into letters
  const introParagraphs = document.querySelectorAll(".intro-col p");
  introParagraphs.forEach((paragraph) => {
    const text = paragraph.textContent;
    paragraph.innerHTML = text
      .split(/(\s+)/)
      .map((part) => {
        if (part.trim() === "") {
          return part;
        } else {
          return part
            .split("")
            .map(
              (char) =>
                `<span style="opacity: 0; display: inline-block;">${char}</span>`
            )
            .join("");
        }
      })
      .join("");
  });

  // flicker animation: intro text (safeguarded if targets missing)
  function flickerAnimation(targets, toOpacity) {
    const elements = typeof targets === "string" ? document.querySelectorAll(targets) : targets;
    if (!elements || elements.length === 0) return;
    gsap.to(elements, {
      opacity: toOpacity,
      duration: 0.05,
      stagger: {
        amount: 0.3,
        from: "random",
      },
    });
  }

  ScrollTrigger.create({
    trigger: stickySection,
    start: "top top",
    end: () => `${window.innerHeight * 3}`,
    onEnter: () => flickerAnimation(".intro-col p span", 1),
    onLeave: () => flickerAnimation(".intro-col p span", 0),
    onEnterBack: () => flickerAnimation(".intro-col p span", 1),
    onLeaveBack: () => flickerAnimation(".intro-col p span", 0),
  });

  // pin the sticky section
  ScrollTrigger.create({
    trigger: stickySection,
    start: "top top",
    end: () => `+=${totalStickyHeight}`,
    pin: true,
    pinSpacing: true,
  });

  // scale img-1
  // gsap.to(".img-1 img", {
  //   scale: 1.125,
  //   ease: "none",
  //   scrollTrigger: {
  //     trigger: stickySection,
  //     start: "top top",
  //     end: () => `+=${window.innerHeight}`,
  //     scrub: true,
  //   },
  // });

  // // animate img-2's clip-path
  // gsap.to(".img-2", {
  //   clipPath: "polygon(0% 0%, 100% 0%, 100% 100%, 0% 100%)",
  //   ease: "none",
  //   scrollTrigger: {
  //     trigger: stickySection,
  //     start: "top top",
  //     end: () => `+=${window.innerHeight}`,
  //     scrub: true,
  //     onUpdate: (self) => {
  //       const progress = self.progress;
  //       gsap.set(".img-2", {
  //         clipPath: `polygon(
  //       ${gsap.utils.interpolate(40, 0, progress)}% ${gsap.utils.interpolate(
  //           25,
  //           0,
  //           progress
  //         )}%,
  //       ${gsap.utils.interpolate(60, 100, progress)}% ${gsap.utils.interpolate(
  //           25,
  //           0,
  //           progress
  //         )}%,
  //       ${gsap.utils.interpolate(60, 100, progress)}% ${gsap.utils.interpolate(
  //           75,
  //           100,
  //           progress
  //         )}%,
  //       ${gsap.utils.interpolate(40, 0, progress)}% ${gsap.utils.interpolate(
  //           75,
  //           100,
  //           progress
  //         )}%
  //     )`,
  //       });
  //     },
  //   },
  // });

  // // spinning effect on img-2
  // gsap.to(".img-2 img", {
  //   scale: 1.125,
  //   rotation: 360,
  //   ease: "none",
  //   scrollTrigger: {
  //     trigger: stickySection,
  //     start: "top top",
  //     end: () => `+=${window.innerHeight}`,
  //     scrub: true,
  //   },
  // });

  // // animate img-3's clip-path
  // gsap.to(".img-3", {
  //   clipPath: "polygon(0% 0%, 100% 0%, 100% 100%, 0% 100%)",
  //   ease: "none",
  //   scrollTrigger: {
  //     trigger: stickySection,
  //     start: () => `${window.innerHeight * 3}`,
  //     end: () => `${window.innerHeight * 4}`,
  //     scrub: true,
  //     onUpdate: (self) => {
  //       const progress = self.progress;
  //       gsap.set(".img-3", {
  //         clipPath: `polygon(
  //         ${gsap.utils.interpolate(50, 0, progress)}% ${gsap.utils.interpolate(
  //           50,
  //           0,
  //           progress
  //         )}%,
  //         ${gsap.utils.interpolate(
  //           50,
  //           100,
  //           progress
  //         )}% ${gsap.utils.interpolate(50, 0, progress)}%,
  //         ${gsap.utils.interpolate(
  //           50,
  //           100,
  //           progress
  //         )}% ${gsap.utils.interpolate(50, 100, progress)}%,
  //         ${gsap.utils.interpolate(50, 0, progress)}% ${gsap.utils.interpolate(
  //           50,
  //           100,
  //           progress
  //         )}%
  //       )`,
  //       });
  //     },
  //   },
  // });

  // // continue img-2's scale
  // gsap.fromTo(
  //   ".img-2 img",
  //   { scale: 1.125 },
  //   {
  //     scale: 1.25,
  //     rotation: 360,
  //     ease: "none",
  //     scrollTrigger: {
  //       trigger: stickySection,
  //       start: () => `${window.innerHeight * 3}`,
  //       end: () => `${window.innerHeight * 4}`,
  //       scrub: true,
  //     },
  //   }
  // );

  // // scale img-3
  // gsap.to(".img-3 img", {
  //   scale: 2.9,
  //   ease: "none",
  //   scrollTrigger: {
  //     trigger: stickySection,
  //     start: () => `${window.innerHeight * 3}`,
  //     end: () => `${window.innerHeight * 4}`,
  //     scrub: true,
  //   },
  // });

  // // reset img-3's scale
  // gsap.fromTo(
  //   ".img-3 img",
  //   { scale: 2.9 },
  //   {
  //     scale: 1,
  //     ease: "none",
  //     scrollTrigger: {
  //       trigger: stickySection,
  //       start: () => `${window.innerHeight * 4}`,
  //       end: () => `${window.innerHeight * 6}`,
  //       scrub: true,
  //     },
  //   }
  // );

  // final copy reveal
  // let tl = gsap.timeline({
  //   scrollTrigger: {
  //     trigger: stickySection,
  //     start: () => `${window.innerHeight * 4.5}`,
  //     end: () => `${window.innerHeight * 5.5}`,
  //     scrub: true,
  //     toggleActions: "play reverse play reverse",
  //   },
  // });
  // tl.to(".copy", {
  //   display: "block",
  //   rotateY: 0,
  //   scale: 1,
  //   duration: 1,
  // });

  // --- Minimalist SVG Animation on all brand-splash instances (including clones) ---
  try {
    const initializedBrandSplash = new WeakSet();

    function initBrandSplashAnimation(brandSplashEl) {
      if (!brandSplashEl) return;
      if (initializedBrandSplash.has(brandSplashEl)) return;
      const pieces = brandSplashEl.querySelectorAll('.svg-piece');
      if (!pieces || !pieces.length) return;

      const partyColors = ['#d946ef', '#06b6d4', '#34d399', '#f59e0b', '#ef4444', '#6366f1'];

      gsap.set(pieces, {
        autoAlpha: 0,
        scale: 0.2,
        transformOrigin: '50% 50%',
        x: () => (Math.random() - 0.5) * 400,
        y: () => (Math.random() - 0.5) * 400,
        rotation: () => (Math.random() - 0.5) * 360,
      });

      function startPartyLights() {
        const colorsTl = gsap.timeline({ repeat: -1 });
        partyColors.forEach((color) => {
          colorsTl.to(
            pieces,
            {
              duration: 0.7,
              fill: color,
              ease: 'power1.inOut',
              stagger: { each: 0.03, from: 'random' },
            },
            '+=0.2'
          );
        });
      }

      const assembleTl = gsap.timeline({ onComplete: startPartyLights });
      assembleTl.to(pieces, {
        duration: 2,
        autoAlpha: 1,
        scale: 1,
        x: 0,
        y: 0,
        rotation: 0,
        ease: 'power3.out',
        stagger: { each: 0.05, from: 'random' },
      });

      initializedBrandSplash.add(brandSplashEl);
    }

    document.querySelectorAll('.brand-splash').forEach((el) => initBrandSplashAnimation(el));

    // Observe for dynamically added brand-splash elements (e.g., when cloning for infinite scroll)
    const observer = new MutationObserver((mutations) => {
      for (const mutation of mutations) {
        mutation.addedNodes.forEach((node) => {
          if (!(node instanceof Element)) return;
          if (node.matches && node.matches('.brand-splash')) {
            initBrandSplashAnimation(node);
          }
          node.querySelectorAll && node.querySelectorAll('.brand-splash').forEach((el) => initBrandSplashAnimation(el));
        });
      }
    });
    observer.observe(document.body, { childList: true, subtree: true });
  } catch (e) {}

  // ===== Gallery (Pinned Cards) =====
  document.querySelectorAll(".pinned").forEach((pinnedSection) => {
    const stickyHeader = pinnedSection.querySelector(".sticky-header");
    const cards = pinnedSection.querySelectorAll(".card");
    const progressBarContainer = pinnedSection.querySelector(".progress-bar");
    const progressBar = pinnedSection.querySelector(".progress");
    const indicesContainer = pinnedSection.querySelector(".indices");
    const indices = pinnedSection.querySelectorAll(".index");
    const cardCount = cards.length;
    const pinnedHeight = window.innerHeight * (cardCount + 1);

    const startRotations = [0, 5, 0, -5];
    const endRotations = [-10, -5, 10, 5];
    const progressColors = ["#FFD1DC", "#AEC6CF", "#77DD77", "#C5BBDE"];
    // Image sequences per card for fast hover animation (Pub, Club, Terrace, Streetfood)
    const cardImageSequences = [
      [
        "./assets/pub_1.jpg",
        "./assets/pub_2.jpg",
        "./assets/pub_3.jpg",
        "./assets/pub_4.jpg",
      ],
      [
        "./assets/club_1.jpg",
        "./assets/club_2.jpg",
        "./assets/club_3.jpg",
        "./assets/club_4.jpg",
      ],
      [
        "./assets/terrace_1.jpg",
        "./assets/terrace_2.jpg",
        "./assets/terrace_3.jpg",
        "./assets/terrace_4.jpg",
      ],
      [
        "./assets/interior_1.jpg",
        "./assets/interrior_2.jpg",
        "./assets/interior_1.jpg",
        "./assets/interrior_2.jpg",
      ],
    ];

    // Preload all images to avoid flicker on hover
    try {
      cardImageSequences.flat().forEach((src) => {
        const im = new Image();
        im.decoding = "async";
        im.loading = "eager";
        im.src = src;
      });
    } catch (e) {}

    let isProgressBarVisible = false;
    let currentActiveIndex = -1;

    cards.forEach((card, index) => {
      gsap.set(card, { rotation: startRotations[index] });

      const sequence = cardImageSequences[index] || [];
      const img = document.createElement("img");
      img.src = sequence[0] || "./assets/Animation1.gif";
      img.alt = `Card ${index + 1}`;
      img.style.width = "100%";
      img.style.height = "100%";
      img.style.objectFit = "cover";
      img.style.position = "absolute";
      img.style.top = 0;
      img.style.left = 0;
      img.style.zIndex = 0;
      card.appendChild(img);

      // Fast hover animation: cycle through category images
      let frameIndex = 0;
      let intervalId = null;
      const frameMs = 300;

      function startHoverAnimation() {
        if (!sequence || sequence.length <= 1 || intervalId) return;
        intervalId = setInterval(() => {
          frameIndex = (frameIndex + 1) % sequence.length;
          img.src = sequence[frameIndex];
        }, frameMs);
      }

      function stopHoverAnimation() {
        if (intervalId) {
          clearInterval(intervalId);
          intervalId = null;
        }
        frameIndex = 0;
        if (sequence[0]) img.src = sequence[0];
      }

      card.addEventListener("mouseenter", startHoverAnimation);
      card.addEventListener("mouseleave", stopHoverAnimation);
      card.addEventListener("touchstart", startHoverAnimation, { passive: true });
      card.addEventListener("touchend", stopHoverAnimation);
    });

    function animateIndexOpacity(newIndex) {
      if (newIndex !== currentActiveIndex) {
        indices.forEach((indexElem, i) => {
          gsap.to(indexElem, {
            opacity: i === newIndex ? 1 : 0.25,
            duration: 0.5,
            ease: "power2.out",
          });
        });
        currentActiveIndex = newIndex;
      }
    }

    function showProgressAndIndices() {
      gsap.to([progressBarContainer, indicesContainer], {
        opacity: 1,
        duration: 0.5,
        ease: "power2.out",
      });
      isProgressBarVisible = true;
    }

    function hideProgressAndIndices() {
      gsap.to([progressBarContainer, indicesContainer], {
        opacity: 0,
        duration: 0.5,
        ease: "power2.out",
      });
      isProgressBarVisible = false;
      animateIndexOpacity(-1);
    }

    ScrollTrigger.create({
      trigger: pinnedSection,
      start: "top top",
      end: `+=${pinnedHeight}`,
      pin: true,
      pinSpacing: true,
      onLeave: () => {
        hideProgressAndIndices();
      },
      onEnterBack: () => {
        showProgressAndIndices();
      },
      onUpdate: (self) => {
        const sectionProgress = self.progress * (cardCount + 1);

        // Handle sticky header fade during the intro phase (0 → 1)
        if (stickyHeader) {
          if (sectionProgress <= 1) {
            gsap.to(stickyHeader, {
              opacity: 1 - sectionProgress,
              duration: 0.1,
              ease: "none",
            });
          } else {
            gsap.set(stickyHeader, { opacity: 0 });
          }
        }

        // Keep cards offscreen during the intro/empty phase
        if (sectionProgress <= 1) {
          if (isProgressBarVisible) hideProgressAndIndices();
          cards.forEach((card, index) => {
            if (index === 0) {
              // Keep the first card visible and centered during intro
              gsap.set(card, { top: "50%", rotation: endRotations[0] });
            } else {
              gsap.set(card, { top: "115%", rotation: startRotations[index] });
            }
          });
          return;
        }

        // After intro, show progress/indices and drive cards
        if (!isProgressBarVisible) {
          showProgressAndIndices();
        }

        const progress = sectionProgress - 1; // 0 → cardCount
        const currentCardRaw = Math.floor(progress);
        // Treat the first card as already completed once we enter the gallery section
        const currentCard = Math.max(1, currentCardRaw);

        let progressHeight = (progress / cardCount) * 100;
        progressHeight = Math.max(0, Math.min(progressHeight, 100));
        const colorIndex = Math.min(Math.floor(progress), cardCount - 1);

        gsap.to(progressBar, {
          height: `${progressHeight}%`,
          backgroundColor: progressColors[colorIndex],
          duration: 0.3,
          ease: "power1.out",
        });

        if (isProgressBarVisible) {
          animateIndexOpacity(colorIndex);
        }

        cards.forEach((card, index) => {
          if (index < currentCard) {
            gsap.set(card, { top: "50%", rotation: endRotations[index] });
          } else if (index === currentCard) {
            const cardProgress = progress - currentCard; // 0 → 1 within the current card
            const newTop = gsap.utils.interpolate(115, 50, cardProgress);
            const newRotation = gsap.utils.interpolate(
              startRotations[index],
              endRotations[index],
              cardProgress
            );
            gsap.set(card, { top: `${newTop}%`, rotation: newRotation });
          } else {
            gsap.set(card, { top: "115%", rotation: startRotations[index] });
          }
        });
      },
    });
  });

  // --- Fixed Infinite Loop ---
// --- Fixed Infinite Loop with Lenis-native detection ---
const threshold = 5;

// Start slightly away from 0 to avoid flicker
requestAnimationFrame(() => {
  if ((window.scrollY || window.pageYOffset) <= threshold) {
    lenis.scrollTo(threshold + 1, { immediate: true });
  }
});

lenis.on("scroll", ({ scroll, limit }) => {
  // Wrap from top → bottom
  if (scroll <= threshold) {
    lenis.scrollTo(limit - threshold - 1, { immediate: true });
  }
  // Wrap from bottom → top
  else if (scroll >= limit - threshold) {
    lenis.scrollTo(threshold + 1, { immediate: true });
  }
});

});


  // Inject a Tripletta-like loader without changing existing HTML/CSS
(function () {
  try {
    const body = document.body;
    if (!body) return;

    // Show loader on first navigation and reload, but skip bfcache/back-forward restores
    const navEntry = performance && performance.getEntriesByType
      ? performance.getEntriesByType("navigation")[0]
      : null;
    const navType = (navEntry && navEntry.type) || (performance.navigation && performance.navigation.type);
    const isBackForward = navType === "back_forward" || navType === 2; // 2 is legacy back_forward
    if (isBackForward) {
      return;
    }

    // Create overlay
    const overlay = document.createElement("div");
    overlay.id = "preloader";
    overlay.setAttribute("role", "status");
    overlay.setAttribute("aria-live", "polite");
    overlay.style.cssText = [
      "position:fixed",
      "inset:0",
      "display:flex",
      "align-items:center",
      "justify-content:center",
      "z-index:9999",
      "background:#e3f2fd",
      "opacity:1",
      "transition:opacity 0.6s ease",
    ].join(";");

    // Ticker frame
    const frame = document.createElement("div");
    frame.style.cssText = [
      "display:inline-flex",
      "align-items:center",
      "justify-content:center",
      "padding:6px 18px",
      "border-radius:999px",
      "background:transparent",
    ].join(";");

    // Current name
    const label = document.createElement("span");
    label.style.cssText = [
      "font-size:clamp(48px,18vw,200px)",
      "color:#0d47a1",
      "letter-spacing:0.01em",
      "text-transform:uppercase",
      "line-height:1",
      "font-weight:900",
      "will-change:transform,opacity",
    ].join(";");

    frame.appendChild(label);
    overlay.appendChild(frame);
    body.appendChild(overlay);

    // Lock scroll during loader
    const previousOverflow = body.style.overflow;
    body.style.overflow = "hidden";
    // Do not fade or offset the main content; leave it as-is under the overlay

    const localThreshold = 5;

    const cityData = [
      { name: "Bordeaux", bg: "#0d47a1", fg: "#e3f2fd" },
      { name: "Versailles", bg: "#e65100", fg: "#fff3e0" },
      { name: "Lille", bg: "#6a1b9a", fg: "#f3e5f5" },
      { name: "Rennes", bg: "#311b92", fg: "#ede7f6" },
      { name: "Toulouse", bg: "#1b5e20", fg: "#f1f8e9" },
      { name: "Lyon", bg: "#f57f17", fg: "#fff8e1" },
      { name: "Marseille", bg: "#006064", fg: "#e0f7fa" },
      { name: "Paris", bg: "#b71c1c", fg: "#ffebee" },
    ];

    let index = 0;
    function applyCity(city) {
      overlay.style.backgroundColor = city.bg;
      label.style.color = city.fg;
      label.textContent = city.name;
    }
    applyCity(cityData[0]);

    // Animate ticker once over the city list (no repeats)
    let timerId = null;
    const stepMs = 200;
    function step() {
      index += 1;
      if (index >= cityData.length) {
        timerId = null;
        // Briefly show the last city, then hide the overlay
        if (typeof hideOverlay === "function") {
          setTimeout(hideOverlay, 400);
        }
        return;
      }
      const next = cityData[index];
      if (window.gsap) {
        gsap.to(label, {
          y: 10,
          opacity: 0,
          duration: 0.08,
          ease: "power1.in",
          onComplete: () => {
            applyCity(next);
            gsap.fromTo(
              label,
              { y: -10, opacity: 0 },
              { y: 0, opacity: 1, duration: 0.12, ease: "power1.out" }
            );
          },
        });
        gsap.to(overlay, {
          backgroundColor: next.bg,
          duration: 0.15,
          ease: "power1.out",
        });
      } else {
        applyCity(next);
      }
      timerId = setTimeout(step, stepMs);
    }
    timerId = setTimeout(step, stepMs);

    // Hide overlay when ticker finishes
    function hideOverlay() {
      if (timerId) clearTimeout(timerId);
      if (window.gsap) {
        gsap.to(overlay, {
          yPercent: -100,
          duration: 0.6,
          ease: "power2.inOut",
          onComplete: () => {
            overlay.remove();
            body.style.overflow = previousOverflow;
            // Ensure we start at the top section after loader
            try {
              window.scrollTo(0, localThreshold + 1);
            } catch (e) {}
          },
        });
      } else {
        // Fallback: slide the overlay up using CSS transitions
        overlay.style.transition = "transform 0.6s ease";
        overlay.style.transform = "translateY(-100%)";
        setTimeout(() => {
          overlay.remove();
          body.style.overflow = previousOverflow;
          try {
            window.scrollTo(0, localThreshold + 1);
          } catch (e) {}
        }, 600);
      }
    }
    // hideOverlay is invoked by the ticker when it completes one full pass
  } catch (err) {
    const existing = document.getElementById("preloader");
    if (existing) existing.remove();
  }
})();
