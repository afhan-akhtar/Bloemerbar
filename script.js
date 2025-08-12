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

  // flicker animation: intro text
  function flickerAnimation(targets, toOpacity) {
    gsap.to(targets, {
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
  gsap.to(".img-1 img", {
    scale: 1.125,
    ease: "none",
    scrollTrigger: {
      trigger: stickySection,
      start: "top top",
      end: () => `+=${window.innerHeight}`,
      scrub: true,
    },
  });

  // animate img-2's clip-path
  gsap.to(".img-2", {
    clipPath: "polygon(0% 0%, 100% 0%, 100% 100%, 0% 100%)",
    ease: "none",
    scrollTrigger: {
      trigger: stickySection,
      start: "top top",
      end: () => `+=${window.innerHeight}`,
      scrub: true,
      onUpdate: (self) => {
        const progress = self.progress;
        gsap.set(".img-2", {
          clipPath: `polygon(
        ${gsap.utils.interpolate(40, 0, progress)}% ${gsap.utils.interpolate(
            25,
            0,
            progress
          )}%,
        ${gsap.utils.interpolate(60, 100, progress)}% ${gsap.utils.interpolate(
            25,
            0,
            progress
          )}%,
        ${gsap.utils.interpolate(60, 100, progress)}% ${gsap.utils.interpolate(
            75,
            100,
            progress
          )}%,
        ${gsap.utils.interpolate(40, 0, progress)}% ${gsap.utils.interpolate(
            75,
            100,
            progress
          )}%
      )`,
        });
      },
    },
  });

  // spinning effect on img-2
  gsap.to(".img-2 img", {
    scale: 1.125,
    rotation: 360,
    ease: "none",
    scrollTrigger: {
      trigger: stickySection,
      start: "top top",
      end: () => `+=${window.innerHeight}`,
      scrub: true,
    },
  });

  // animate img-3's clip-path
  gsap.to(".img-3", {
    clipPath: "polygon(0% 0%, 100% 0%, 100% 100%, 0% 100%)",
    ease: "none",
    scrollTrigger: {
      trigger: stickySection,
      start: () => `${window.innerHeight * 3}`,
      end: () => `${window.innerHeight * 4}`,
      scrub: true,
      onUpdate: (self) => {
        const progress = self.progress;
        gsap.set(".img-3", {
          clipPath: `polygon(
          ${gsap.utils.interpolate(50, 0, progress)}% ${gsap.utils.interpolate(
            50,
            0,
            progress
          )}%,
          ${gsap.utils.interpolate(
            50,
            100,
            progress
          )}% ${gsap.utils.interpolate(50, 0, progress)}%,
          ${gsap.utils.interpolate(
            50,
            100,
            progress
          )}% ${gsap.utils.interpolate(50, 100, progress)}%,
          ${gsap.utils.interpolate(50, 0, progress)}% ${gsap.utils.interpolate(
            50,
            100,
            progress
          )}%
        )`,
        });
      },
    },
  });

  // continue img-2's scale
  gsap.fromTo(
    ".img-2 img",
    { scale: 1.125 },
    {
      scale: 1.25,
      rotation: 360,
      ease: "none",
      scrollTrigger: {
        trigger: stickySection,
        start: () => `${window.innerHeight * 3}`,
        end: () => `${window.innerHeight * 4}`,
        scrub: true,
      },
    }
  );

  // scale img-3
  gsap.to(".img-3 img", {
    scale: 2.9,
    ease: "none",
    scrollTrigger: {
      trigger: stickySection,
      start: () => `${window.innerHeight * 3}`,
      end: () => `${window.innerHeight * 4}`,
      scrub: true,
    },
  });

  // reset img-3's scale
  gsap.fromTo(
    ".img-3 img",
    { scale: 2.9 },
    {
      scale: 1,
      ease: "none",
      scrollTrigger: {
        trigger: stickySection,
        start: () => `${window.innerHeight * 4}`,
        end: () => `${window.innerHeight * 6}`,
        scrub: true,
      },
    }
  );

  // final copy reveal
  let tl = gsap.timeline({
    scrollTrigger: {
      trigger: stickySection,
      start: () => `${window.innerHeight * 4.5}`,
      end: () => `${window.innerHeight * 5.5}`,
      scrub: true,
      toggleActions: "play reverse play reverse",
    },
  });
  tl.to(".copy", {
    display: "block",
    rotateY: 0,
    scale: 1,
    duration: 1,
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

    // Show loader only on real reloads, not during infinite scroll or bfcache restores
    const navEntry = performance && performance.getEntriesByType
      ? performance.getEntriesByType("navigation")[0]
      : null;
    const isReload = navEntry && navEntry.type === "reload";
    const isBFCache = false; // pageshow handler below guards bfcache; keep simple here
    if (!isReload) {
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
      "border:6px solid #0d47a1",
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
      "font-weight:800",
      "will-change:transform,opacity",
    ].join(";");

    frame.appendChild(label);
    overlay.appendChild(frame);
    body.appendChild(overlay);

    // Lock scroll and offset content for entrance
    const previousOverflow = body.style.overflow;
    body.style.overflow = "hidden";
    const container = document.querySelector(".container");
    if (container) {
      container.style.transform = "translateY(-40px)";
      container.style.opacity = "0";
    }

    const localThreshold = 5;

    const cityData = [
      { name: "Bordeaux", bg: "#e3f2fd", fg: "#0d47a1", border: "#0d47a1" },
      { name: "Versailles", bg: "#fff3e0", fg: "#e65100", border: "#e65100" },
      { name: "Lille", bg: "#f3e5f5", fg: "#6a1b9a", border: "#6a1b9a" },
      { name: "Rennes", bg: "#ede7f6", fg: "#311b92", border: "#311b92" },
      { name: "Toulouse", bg: "#f1f8e9", fg: "#1b5e20", border: "#1b5e20" },
      { name: "Lyon", bg: "#fff8e1", fg: "#f57f17", border: "#f57f17" },
      { name: "Marseille", bg: "#e0f7fa", fg: "#006064", border: "#006064" },
      { name: "Paris", bg: "#ffebee", fg: "#b71c1c", border: "#b71c1c" },
    ];

    let index = 0;
    function applyCity(city) {
      overlay.style.backgroundColor = city.bg;
      frame.style.borderColor = city.border;
      label.style.color = city.fg;
      label.textContent = city.name;
    }
    applyCity(cityData[0]);

    // Animate ticker every ~350ms
    let intervalId = null;
    intervalId = setInterval(() => {
      index = (index + 1) % cityData.length;
      const next = cityData[index];
      if (window.gsap) {
        gsap.to(label, {
          y: 10,
          opacity: 0,
          duration: 0.12,
          ease: "power1.in",
          onComplete: () => {
            applyCity(next);
            gsap.fromTo(
              label,
              { y: -10, opacity: 0 },
              { y: 0, opacity: 1, duration: 0.18, ease: "power1.out" }
            );
          },
        });
        gsap.to(overlay, {
          backgroundColor: next.bg,
          duration: 0.2,
          ease: "power1.out",
        });
        gsap.to(frame, {
          borderColor: next.border,
          duration: 0.2,
          ease: "power1.out",
        });
      } else {
        applyCity(next);
      }
    }, 350);

    // Hide overlay after window load + 5s
    function hideOverlay() {
      if (intervalId) clearInterval(intervalId);
      if (window.gsap) {
        gsap.to(overlay, {
          opacity: 0,
          duration: 0.6,
          ease: "power2.out",
          onComplete: () => {
            overlay.remove();
            body.style.overflow = previousOverflow;
            // Ensure we start at the top section after loader
            try {
              window.scrollTo(0, localThreshold + 1);
            } catch (e) {}
            if (container) {
              gsap.fromTo(
                container,
                { y: -40, opacity: 0 },
                {
                  y: 0,
                  opacity: 1,
                  duration: 0.8,
                  ease: "power2.out",
                  onComplete: () => {
                    container.style.transform = "";
                    container.style.opacity = "";
                  },
                }
              );
            }
          },
        });
      } else {
        overlay.style.opacity = "0";
        setTimeout(() => {
          overlay.remove();
          body.style.overflow = previousOverflow;
          try {
            window.scrollTo(0, localThreshold + 1);
          } catch (e) {}
          if (container) {
            container.style.transition = "transform 0.8s ease, opacity 0.8s ease";
            container.style.transform = "translateY(0)";
            container.style.opacity = "1";
            setTimeout(() => {
              container.style.transition = "";
              container.style.transform = "";
              container.style.opacity = "";
            }, 850);
          }
        }, 600);
      }
    }

    if (document.readyState === "complete") {
      setTimeout(hideOverlay, 5000);
    } else {
      window.addEventListener("load", () => setTimeout(hideOverlay, 5000), {
        once: true,
      });
    }
  } catch (err) {
    const existing = document.getElementById("preloader");
    if (existing) existing.remove();
  }
})();
