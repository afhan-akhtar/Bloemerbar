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
  // === Strapi dynamic content integration ===
  (async function integrateStrapi() {
    const STRAPI_BASE = (window && window.STRAPI_BASE) ? window.STRAPI_BASE : "http://localhost:1337";
    const endpoints = {
      sett: "/api/sett",
      global: "/api/global",
    };
    const mediaUrl = (url) => {
      if (!url) return "";
      return url.startsWith("http") ? url : `${STRAPI_BASE}${url}`;
    };
    const safeTextFromRich = (nodes) => {
      try {
        if (!Array.isArray(nodes)) return "";
        return nodes
          .map((n) => {
            if (!n || !n.children) return "";
            return n.children.map((c) => (c && c.text) || "").join("");
          })
          .filter(Boolean)
          .join("\n\n");
      } catch (e) {
        return "";
      }
    };
    const findBlock = (blocks, type) => {
      try {
        return (blocks || []).find((b) => b && b.__component === type) || null;
      } catch (_) {
        return null;
      }
    };
    try {
      const [settRes, globalRes] = await Promise.all([
        fetch(`${STRAPI_BASE}${endpoints.sett}`),
        fetch(`${STRAPI_BASE}${endpoints.global}`),
      ]);
      const [settJson, globalJson] = await Promise.all([
        settRes.json().catch(() => ({})),
        globalRes.json().catch(() => ({})),
      ]);
      const sett = (settJson && settJson.data) || {};
      const global = (globalJson && globalJson.data) || {};
      const blocks = global.blocks || [];

      // 1) Meta: title, description, robots, favicon, lang
      try {
        const metaTitle = (sett.metaData && sett.metaData.metaTitle) || global.title || document.title;
        const metaDesc = (sett.metaData && sett.metaData.metaDescription) || global.description || "";
        if (metaTitle) document.title = metaTitle;
        if (metaDesc) {
          let metaTag = document.querySelector('meta[name="description"]');
          if (!metaTag) {
            metaTag = document.createElement("meta");
            metaTag.setAttribute("name", "description");
            document.head.appendChild(metaTag);
          }
          metaTag.setAttribute("content", metaDesc);
        }
        const robots = sett.metaData && sett.metaData.metaRobots;
        if (robots) {
          let robotsTag = document.querySelector('meta[name="robots"]');
          if (!robotsTag) {
            robotsTag = document.createElement("meta");
            robotsTag.setAttribute("name", "robots");
            document.head.appendChild(robotsTag);
          }
          robotsTag.setAttribute("content", robots);
        }
        const lang = sett.metaData && sett.metaData.language;
        if (lang) {
          const html = document.documentElement;
          if (html) html.setAttribute("lang", lang);
        }
        const fav = sett.metaData && sett.metaData.favIcon && sett.metaData.favIcon.url;
        if (fav) {
          let link = document.querySelector('link[rel="icon"]');
          if (!link) {
            link = document.createElement("link");
            link.setAttribute("rel", "icon");
            document.head.appendChild(link);
          }
          link.setAttribute("href", mediaUrl(fav));
        }
      } catch (_) {}

      // 2) Theme colors → CSS variables
      try {
        const theme = Array.isArray(sett.colors) && sett.colors.length ? sett.colors[0] : null;
        if (theme) {
          const root = document.documentElement;
          const map = {
            "--primary-color": theme.primaryColor,
            "--secondary-color": theme.secondaryColor,
            "--background-color": theme.backgroundColor,
            "--text-black": theme.blackColor,
            "--text-white": theme.whiteColor,
          };
          Object.entries(map).forEach(([k, v]) => {
            if (v) root.style.setProperty(k, v);
          });
          // Invert top marquee border if background becomes light
          const top = document.querySelector('.top-marquee');
          if (top && theme.backgroundColor) {
            const isLight = /^#?([fF]{2}|[eE]{2}|[dD]{2})/.test(theme.backgroundColor);
            top.style.borderBottomColor = isLight ? 'rgba(0,0,0,0.1)' : 'rgba(255,255,255,0.15)';
          }
        }
      } catch (_) {}

      // 3) Top marquees (cities)
      try {
        const citiesBlock = findBlock(blocks, "block.cities");
        const cities = (citiesBlock && citiesBlock.cities) || sett.cities || [];
        const makeCityItem = (label, imageUrl) => {
          const imgPart = imageUrl ? `<img src="${mediaUrl(imageUrl)}" alt="${label}" class="img-ville" />` : "";
          return `<div class="collection-item"><h2 class="heading-city">${label}</h2>${imgPart}</div>`;
        };
        const html = cities.map((c) => makeCityItem(c.label || "", c.image && c.image.url)).join("");
        document.querySelectorAll('.top-marquee .marquee__wrapper').forEach((track) => {
          const lists = track.querySelectorAll('.list');
          if (!lists.length) return;
          // Source list
          lists[0].innerHTML = html;
          // Keep the clone list in sync if already present
          if (lists[1]) lists[1].innerHTML = html;
        });
      } catch (_) {}

      // 4) Social links (corner-right)
      try {
        const socialBlock = findBlock(blocks, "block.social-links");
        const socials = (socialBlock && socialBlock.Social) || [];
        const byLabel = (name) => socials.find((s) => (s.label || "").toLowerCase() === name);
        const map = {
          instagram: byLabel("instagram"),
          facebook: byLabel("facebook"),
          tiktok: byLabel("tiktok"),
        };
        document.querySelectorAll('.corner-right.social-icons').forEach((wrap) => {
          const anchors = Array.from(wrap.querySelectorAll('a.social-link'));
          anchors.forEach((a) => {
            const label = (a.getAttribute('aria-label') || '').toLowerCase();
            const entry = map[label];
            if (entry && entry.href) {
              a.setAttribute('href', entry.href);
              if (entry.isExternal) a.setAttribute('target', '_blank');
            }
          });
        });
      } catch (_) {}

      // 5) Quad-CTA bar and grid (Services first 3, then first Bingo Event)
      try {
        const servicesBlock = findBlock(blocks, "block.service-list");
        const eventsBlock = findBlock(blocks, "block.event-list");
        const services = (servicesBlock && servicesBlock.Services) || [];
        const events = (eventsBlock && eventsBlock.bingoEvents) || [];
        const items = [services[0], services[1], services[2], events[0]];
        document.querySelectorAll('.quad-cta').forEach((section) => {
          const barLinks = section.querySelectorAll('.quad-cta__bar .quad-cta__link');
          const gridImgs = section.querySelectorAll('.quad-cta__grid .quad-cta__item img');
          // Fill titles/images; hide unused slots
          barLinks.forEach((link, i) => {
            const item = items[i];
            const span = link && link.querySelector('.quad-cta__text');
            if (item && span) {
              span.textContent = item.title || '';
              link.style.display = '';
            } else if (link) {
              link.style.display = 'none';
            }
          });
          gridImgs.forEach((img, i) => {
            const item = items[i];
            const parent = img && img.closest('.quad-cta__item');
            const imageUrl = item && item.image && item.image.url ? mediaUrl(item.image.url) : '';
            if (item && imageUrl) {
              img.src = imageUrl;
              img.alt = item.title || '';
              img.loading = 'lazy';
              img.decoding = 'async';
              if (parent) parent.style.display = '';
            } else if (parent) {
              parent.style.display = 'none';
            }
          });
        });
      } catch (_) {}

      // 6) City story and About section from information/description
      try {
        const infoBlock = findBlock(blocks, "block.information-section");
        const infoText = safeTextFromRich(infoBlock && infoBlock.description);
        const globalDesc = typeof global.description === 'string' ? global.description : safeTextFromRich(global.description);
        const text = infoText || globalDesc || "";
        if (text) {
          document.querySelectorAll('.city-story__text p').forEach((p) => (p.textContent = text));
          const visionDesc = document.querySelector('.vision .vision-desc');
          if (visionDesc) visionDesc.textContent = text;
        }
        // vision media image from feature-list first item
        const featureBlock = findBlock(blocks, "block.feature-list");
        const firstFeature = featureBlock && Array.isArray(featureBlock.features) ? featureBlock.features[0] : null;
        if (firstFeature && firstFeature.image && firstFeature.image.url) {
          const img = document.querySelector('.vision .vision-media img');
          if (img) {
            img.src = mediaUrl(firstFeature.image.url);
            img.alt = firstFeature.title || 'Feature image';
            img.loading = 'lazy';
            img.decoding = 'async';
          }
        }
        // Do not override brand-splash from backend
      } catch (_) {}

      // 7) Booking popup content
      try {
        const booking = findBlock(blocks, "block.booking-section");
        if (booking) {
          const title = booking.title || "";
          const desc = safeTextFromRich(booking.description) || "";
          const cta = booking.book || {};
          const pop = document.getElementById('book-now-popup');
          if (pop) {
            const t = pop.querySelector('.book-popup__title');
            const d = pop.querySelector('.book-popup__desc');
            const a = pop.querySelector('.book-popup__cta');
            if (t && title) t.textContent = title;
            if (d && desc) d.textContent = desc;
            if (a && cta.href) {
              a.setAttribute('href', cta.href);
              if (cta.isExternal) a.setAttribute('target', '_blank');
              if (cta.label) a.textContent = cta.label;
            }
          }
        }
      } catch (_) {}

      // 8) Pinned cards: titles and images from Gallery (API order)
      try {
        const galleryBlock = findBlock(blocks, "block.gallery-section");
        const gallery = (galleryBlock && galleryBlock.Gallery) || [];
        const titleToImages = Object.fromEntries(
          gallery.map((g) => [g.title, (g.images || []).map((im) => mediaUrl(im && im.url)).filter(Boolean)])
        );

        function renderPinnedSection(pinnedRoot) {
          if (!pinnedRoot) return;
          const cards = pinnedRoot.querySelectorAll('.card');
          cards.forEach((card, idx) => {
            const g = gallery[idx];
            const title = g && g.title ? g.title : '';
            const images = title ? (titleToImages[title] || []) : [];
            const titleEl = card.querySelector('.card-title h1');
            if (titleEl) titleEl.textContent = title || '';
            const img = card.querySelector('img');
            if (img && images[0]) {
              img.src = images[0];
              img.alt = title || img.alt || '';
            }
            card.dataset.images = JSON.stringify(images);
            card.style.visibility = title ? '' : 'hidden';
          });
        }

        // Render into all current pinned sections (original and any existing clones)
        document.querySelectorAll('.pinned').forEach((section) => renderPinnedSection(section));

        // Observe for dynamically added pinned sections (future clones)
        const pinnedObserver = new MutationObserver((mutations) => {
          for (const mutation of mutations) {
            mutation.addedNodes.forEach((node) => {
              if (!(node instanceof Element)) return;
              if (node.matches && node.matches('.pinned')) {
                renderPinnedSection(node);
              }
              node.querySelectorAll && node.querySelectorAll('.pinned').forEach((el) => renderPinnedSection(el));
            });
          }
        });
        pinnedObserver.observe(document.body, { childList: true, subtree: true });
      } catch (_) {}

      // Expose for debugging if needed
      window.__STRAPI__ = { sett, global, blocks };

      // Expose a renderer that (re)applies backend data to all current DOM nodes (original + clones)
      window.__STRAPI_RENDER_ALL = function renderAllFromBackend() {
        try {
          // Top marquees (cities)
          const citiesBlock = findBlock(blocks, "block.cities");
          const cities = (citiesBlock && citiesBlock.cities) || sett.cities || [];
          const makeCityItem = (label, imageUrl) => {
            const imgPart = imageUrl ? `<img src="${mediaUrl(imageUrl)}" alt="${label}" class="img-ville" />` : "";
            return `<div class="collection-item"><h2 class="heading-city">${label}</h2>${imgPart}</div>`;
          };
          const html = cities.map((c) => makeCityItem(c.label || "", c.image && c.image.url)).join("");
          document.querySelectorAll('.top-marquee .marquee__wrapper').forEach((track) => {
            const lists = track.querySelectorAll('.list');
            if (!lists.length) return;
            lists[0].innerHTML = html;
            if (lists[1]) lists[1].innerHTML = html;
          });
        } catch (_) {}

        try {
          // Social links (corner-right)
          const socialBlock = findBlock(blocks, "block.social-links");
          const socials = (socialBlock && socialBlock.Social) || [];
          const byLabel = (name) => socials.find((s) => (s.label || "").toLowerCase() === name);
          const map = {
            instagram: byLabel("instagram"),
            facebook: byLabel("facebook"),
            tiktok: byLabel("tiktok"),
          };
          document.querySelectorAll('.corner-right.social-icons').forEach((wrap) => {
            const anchors = Array.from(wrap.querySelectorAll('a.social-link'));
            anchors.forEach((a) => {
              const label = (a.getAttribute('aria-label') || '').toLowerCase();
              const entry = map[label];
              if (entry && entry.href) {
                a.setAttribute('href', entry.href);
                if (entry.isExternal) a.setAttribute('target', '_blank');
              }
            });
          });
        } catch (_) {}

        try {
          // Quad-CTA bar and grid
          const servicesBlock = findBlock(blocks, "block.service-list");
          const eventsBlock = findBlock(blocks, "block.event-list");
          const services = (servicesBlock && servicesBlock.Services) || [];
          const events = (eventsBlock && eventsBlock.bingoEvents) || [];
          const items = [services[0], services[1], services[2], events[0]];
          document.querySelectorAll('.quad-cta').forEach((section) => {
            const barLinks = section.querySelectorAll('.quad-cta__bar .quad-cta__link');
            const gridImgs = section.querySelectorAll('.quad-cta__grid .quad-cta__item img');
            barLinks.forEach((link, i) => {
              const item = items[i];
              const span = link && link.querySelector('.quad-cta__text');
              if (item && span) {
                span.textContent = item.title || '';
                link.style.display = '';
              } else if (link) {
                link.style.display = 'none';
              }
            });
            gridImgs.forEach((img, i) => {
              const item = items[i];
              const parent = img && img.closest('.quad-cta__item');
              const imageUrl = item && item.image && item.image.url ? mediaUrl(item.image.url) : '';
              if (item && imageUrl) {
                img.src = imageUrl;
                img.alt = item.title || '';
                img.loading = 'lazy';
                img.decoding = 'async';
                if (parent) parent.style.display = '';
              } else if (parent) {
                parent.style.display = 'none';
              }
            });
          });
        } catch (_) {}

        try {
          // City story and About section from information/description
          const infoBlock = findBlock(blocks, "block.information-section");
          const infoText = safeTextFromRich(infoBlock && infoBlock.description);
          const globalDesc = typeof global.description === 'string' ? global.description : safeTextFromRich(global.description);
          const text = infoText || globalDesc || "";
          if (text) {
            document.querySelectorAll('.city-story__text p').forEach((p) => (p.textContent = text));
            const visionDesc = document.querySelector('.vision .vision-desc');
            if (visionDesc) visionDesc.textContent = text;
          }
          const featureBlock = findBlock(blocks, "block.feature-list");
          const firstFeature = featureBlock && Array.isArray(featureBlock.features) ? featureBlock.features[0] : null;
          if (firstFeature && firstFeature.image && firstFeature.image.url) {
            const img = document.querySelector('.vision .vision-media img');
            if (img) {
              img.src = mediaUrl(firstFeature.image.url);
              img.alt = firstFeature.title || 'Feature image';
              img.loading = 'lazy';
              img.decoding = 'async';
            }
          }
          // Do not override brand-splash from backend
        } catch (_) {}

        try {
          // Pinned cards (idempotent render)
          document.querySelectorAll('.pinned').forEach((section) => {
            const galleryBlock = findBlock(blocks, "block.gallery-section");
            const gallery = (galleryBlock && galleryBlock.Gallery) || [];
            const titleToImages = Object.fromEntries(
              gallery.map((g) => [g.title, (g.images || []).map((im) => mediaUrl(im && im.url)).filter(Boolean)])
            );
            const cards = section.querySelectorAll('.card');
            cards.forEach((card, idx) => {
              const g = gallery[idx];
              const title = g && g.title ? g.title : '';
              const images = title ? (titleToImages[title] || []) : [];
              const titleEl = card.querySelector('.card-title h1');
              if (titleEl) titleEl.textContent = title || '';
              const img = card.querySelector('img');
              if (img && images[0]) {
                img.src = images[0];
                img.alt = title || img.alt || '';
              }
              card.dataset.images = JSON.stringify(images);
              card.style.visibility = title ? '' : 'hidden';
            });
          });
        } catch (_) {}
      };

      // Signal that backend data has been applied so clones can be created afterwards
      window.__STRAPI_READY__ = true;
      window.dispatchEvent(new Event('strapi-ready'));
    } catch (err) {
      // Fail silently; keep static content
    }
  })();
  // Prepare all marquees for a seamless infinite loop (two identical lists per track)
  function prepareMarquees() {
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
  }
  prepareMarquees();

  // Use Lenis-based wrap for infinite experience without duplicating the main wrapper
  // Duplicate the full main wrapper for long page length (Lenis will wrap)
  function createClones() {
    try {
      const main = document.querySelector('.main-wrapper');
      if (!main) return;
      const fragment = document.createDocumentFragment();
      const copies = 5; // adjust as needed
      for (let i = 0; i < copies; i++) {
        const clone = main.cloneNode(true);
        // Ensure cloned SVGs are deep-copied with fresh nodes to avoid shared state
        clone.querySelectorAll('svg').forEach((svg) => {
          svg.replaceWith(svg.cloneNode(true));
        });
        fragment.appendChild(clone);
      }
      document.body.appendChild(fragment);
      // Ensure marquees inside newly added clones are correctly prepared
      prepareMarquees();
      // Notify interested modules that clones were created
      window.dispatchEvent(new Event('clones-created'));
    } catch (e) {}
  }
  function onReadyCreateAndRender() {
    // Ensure brand-splash animation init runs at least once before cloning
    window.requestAnimationFrame(() => {
      createClones();
      if (typeof window.__STRAPI_RENDER_ALL === 'function') {
        window.__STRAPI_RENDER_ALL();
        prepareMarquees();
      }
    });
  }
  if (window.__STRAPI_READY__) {
    onReadyCreateAndRender();
  } else {
    window.addEventListener('strapi-ready', onReadyCreateAndRender, { once: true });
  }
  const stickySection = document.querySelector(".sticky");
  const totalStickyHeight = window.innerHeight * 6; // ensure enough height for looping

  // lenis smooth scroll
  const lenis = new Lenis();
  lenis.on("scroll", ScrollTrigger.update);
  gsap.ticker.add((time) => {
    lenis.raf(time * 1000);
  });
  gsap.ticker.lagSmoothing(0);

  // Book Now Popup controls (single instance outside clones)
  const bookPopup = document.getElementById("book-now-popup");
  let isBookPopupOpen = false;
  let previouslyFocusedElement = null;
  const focusableSelectors = [
    'a[href]','area[href]','input:not([disabled])','select:not([disabled])','textarea:not([disabled])',
    'button:not([disabled])','iframe','object','embed','[contenteditable]','[tabindex]:not([tabindex="-1"])'
  ].join(',');
  const getFocusable = (root) => Array.from((root || document).querySelectorAll(focusableSelectors))
    .filter(el => el.offsetParent !== null || el === document.activeElement);
  const isFocusWithin = (root) => root && root.contains(document.activeElement);
  const setInert = (el, value) => {
    if (!el) return;
    if (value) {
      el.setAttribute('inert', '');
      el.setAttribute('aria-hidden', 'true');
    } else {
      el.removeAttribute('inert');
      // leave aria-hidden control to caller for modal itself
    }
  };
  function inertBackground(enable) {
    const bodyChildren = Array.from(document.body.children);
    bodyChildren.forEach((child) => {
      if (child === bookPopup) return;
      setInert(child, enable);
    });
  }

  function openBookPopup() {
    if (!bookPopup || isBookPopupOpen) return;
    previouslyFocusedElement = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    inertBackground(true);
    bookPopup.removeAttribute('inert');
    bookPopup.setAttribute("aria-hidden", "false");
    isBookPopupOpen = true;
    const focusables = getFocusable(bookPopup);
    const target = bookPopup.querySelector('.book-popup__close') || focusables[0];
    if (target && typeof target.focus === 'function') target.focus();
  }

  function closeBookPopup() {
    if (!bookPopup) return;
    // If focus is inside, move it out before hiding from AT
    if (isFocusWithin(bookPopup)) {
      let moved = false;
      if (previouslyFocusedElement && typeof previouslyFocusedElement.focus === 'function') {
        try { previouslyFocusedElement.focus({ preventScroll: true }); moved = true; } catch (e) {}
      }
      if (!moved) {
        try {
          const hadTabindex = document.body.hasAttribute('tabindex');
          if (!hadTabindex) document.body.setAttribute('tabindex', '-1');
          document.body.focus({ preventScroll: true });
          if (!hadTabindex) document.body.removeAttribute('tabindex');
          moved = true;
        } catch (e) {}
      }
      // As a last resort, blur the active element
      if (bookPopup.contains(document.activeElement) && document.activeElement && document.activeElement.blur) {
        try { document.activeElement.blur(); } catch (e) {}
      }
    }
    bookPopup.setAttribute("aria-hidden", "true");
    bookPopup.setAttribute('inert', '');
    inertBackground(false);
    isBookPopupOpen = false;
  }

  try {
    if (bookPopup) {
      const closeBtn = bookPopup.querySelector(".book-popup__close");
      if (closeBtn) closeBtn.addEventListener("click", closeBookPopup);
      // Simple focus trap
      bookPopup.addEventListener('keydown', (e) => {
        if (!isBookPopupOpen || e.key !== 'Tab') return;
        const focusables = getFocusable(bookPopup);
        if (!focusables.length) return;
        const first = focusables[0];
        const last = focusables[focusables.length - 1];
        const active = document.activeElement;
        if (e.shiftKey) {
          if (active === first || !bookPopup.contains(active)) {
            e.preventDefault();
            last.focus();
          }
        } else {
          if (active === last || !bookPopup.contains(active)) {
            e.preventDefault();
            first.focus();
          }
        }
      });
      bookPopup.addEventListener("click", (evt) => {
        if (evt.target === bookPopup) closeBookPopup();
      });
      document.addEventListener("keydown", (evt) => {
        if (evt.key === "Escape" && isBookPopupOpen) closeBookPopup();
      });
    }
  } catch (e) {}

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

  // Feature flag: show brand-splash static in original and clones
  const BRAND_SPLASH_ANIMATION_ENABLED = true;

  // --- Minimalist SVG Animation on all brand-splash instances (including clones) ---
  if (BRAND_SPLASH_ANIMATION_ENABLED) try {
    const initializedBrandSplash = new WeakSet();

    function initBrandSplashAnimation(brandSplashEl) {
      if (!brandSplashEl) return;
      if (initializedBrandSplash.has(brandSplashEl)) return;
      // Fix defs/filters/clipPath id collisions across clones so references resolve
      try {
        const svg = brandSplashEl.querySelector('.brand-illustration');
        if (svg && svg.querySelector('[id]')) {
          const uid = 'svg' + Math.floor(performance.now()).toString(36) + Math.floor(Math.random() * 1e6).toString(36);
          const idMap = new Map();
          svg.querySelectorAll('[id]').forEach((el) => {
            const oldId = el.getAttribute('id');
            if (!oldId) return;
            const newId = `${uid}-${oldId}`;
            idMap.set(oldId, newId);
            el.setAttribute('id', newId);
          });
          if (idMap.size) {
            const ATTRS = ['fill','stroke','filter','clip-path','mask','marker-start','marker-mid','marker-end','href','xlink:href'];
            svg.querySelectorAll('*').forEach((node) => {
              for (const attr of ATTRS) {
                const val = node.getAttribute(attr);
                if (!val) continue;
                let newVal = val;
                idMap.forEach((mapped, from) => {
                  newVal = newVal
                    .replace(new RegExp(`url\\(#${from}\\)`, 'g'), `url(#${mapped})`)
                    .replace(new RegExp(`^#${from}$`), `#${mapped}`);
                });
                if (newVal !== val) node.setAttribute(attr, newVal);
              }
              const styleVal = node.getAttribute('style');
              if (styleVal) {
                let newStyle = styleVal;
                idMap.forEach((mapped, from) => {
                  newStyle = newStyle.replace(new RegExp(`url\\(#${from}\\)`, 'g'), `url(#${mapped})`);
                });
                if (newStyle !== styleVal) node.setAttribute('style', newStyle);
              }
            });
          }
        }
      } catch (e) {}
      const pieces = brandSplashEl.querySelectorAll('.svg-piece');
      if (!pieces || !pieces.length) return;

      // Reset any inherited transforms/opacities from cloned originals
      try {
        gsap.killTweensOf(pieces);
      } catch (e) {}
      pieces.forEach((el) => {
        try { el.style.transform = ''; } catch (_) {}
        try { el.style.opacity = ''; } catch (_) {}
        try { el.removeAttribute('transform'); } catch (_) {}
      });

      const partyColors = ['#d946ef', '#06b6d4', '#34d399', '#f59e0b', '#ef4444', '#6366f1'];

      // Stateless deterministic PRNG based on index so clones match 1:1
      const randForIndex = (i, salt) => {
        const x = Math.sin(i * 374761393 + (salt || 0) * 668265263) * 43758.5453123;
        return x - Math.floor(x);
      };

      gsap.set(pieces, {
        autoAlpha: 0,
        scale: 0.2,
        transformOrigin: '50% 50%',
        x: (i) => (randForIndex(i, 0) - 0.5) * 400,
        y: (i) => (randForIndex(i, 1) - 0.5) * 400,
        rotation: (i) => (randForIndex(i, 2) - 0.5) * 360,
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
              // deterministic stagger so clones match
              stagger: { each: 0.03, from: 0 },
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
        // deterministic stagger so clones match
        stagger: { each: 0.05, from: 0 },
      });

      initializedBrandSplash.add(brandSplashEl);
    }

    const initAllBrandSplash = () => {
      // Always initialize originals first, then clones, to ensure identical timelines
      const all = Array.from(document.querySelectorAll('.brand-splash'));
      const originalsFirst = all.sort((a, b) => {
        const aClone = a.closest('.main-wrapper') && a.closest('.main-wrapper').previousElementSibling ? 1 : 0;
        const bClone = b.closest('.main-wrapper') && b.closest('.main-wrapper').previousElementSibling ? 1 : 0;
        return aClone - bClone;
      });
      originalsFirst.forEach((el) => initBrandSplashAnimation(el));
    };
    initAllBrandSplash();

    // Re-init after clones are created
    window.addEventListener('clones-created', initAllBrandSplash);

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

  // ===== Gallery (Pinned Cards) ===== ensure clones get identical animations
  try {
    const initializedPinned = new WeakSet();

    function initPinnedSection(pinnedSection) {
      if (!pinnedSection || initializedPinned.has(pinnedSection)) return;
      initializedPinned.add(pinnedSection);

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
    const cardImageSequences = [
        ["./assets/pub_1.jpg", "./assets/pub_2.jpg", "./assets/pub_3.jpg", "./assets/pub_4.jpg"],
        ["./assets/club_1.jpg", "./assets/club_2.jpg", "./assets/club_3.jpg", "./assets/club_4.jpg"],
        ["./assets/terrace_1.jpg", "./assets/terrace_2.jpg", "./assets/terrace_3.jpg", "./assets/terrace_4.jpg"],
        ["./assets/interior_1.jpg", "./assets/interrior_2.jpg", "./assets/interior_1.jpg", "./assets/interrior_2.jpg"],
      ];

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
      function getDynamicSequence() {
        try {
          if (card.dataset && card.dataset.images) {
            const arr = JSON.parse(card.dataset.images);
            if (Array.isArray(arr) && arr.length) return arr;
          }
        } catch (_) {}
        return cardImageSequences[index] || [];
      }
      let sequence = getDynamicSequence();
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

      let frameIndex = 0;
      let intervalId = null;
      const frameMs = 300;
      function startHoverAnimation() {
        sequence = getDynamicSequence();
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
            gsap.to(indexElem, { opacity: i === newIndex ? 1 : 0.25, duration: 0.5, ease: "power2.out" });
        });
        currentActiveIndex = newIndex;
      }
    }
    function showProgressAndIndices() {
        gsap.to([progressBarContainer, indicesContainer], { opacity: 1, duration: 0.5, ease: "power2.out" });
      isProgressBarVisible = true;
    }
    function hideProgressAndIndices() {
        gsap.to([progressBarContainer, indicesContainer], { opacity: 0, duration: 0.5, ease: "power2.out" });
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
        openBookPopup();
      },
        onEnterBack: () => { showProgressAndIndices(); },
      onUpdate: (self) => {
        const sectionProgress = self.progress * (cardCount + 1);
        if (stickyHeader) {
          if (sectionProgress <= 1) {
              gsap.to(stickyHeader, { opacity: 1 - sectionProgress, duration: 0.1, ease: "none" });
          } else {
            gsap.set(stickyHeader, { opacity: 0 });
          }
        }
        if (sectionProgress <= 1) {
          if (isProgressBarVisible) hideProgressAndIndices();
          cards.forEach((card, index) => {
            if (index === 0) {
              gsap.set(card, { top: "50%", rotation: endRotations[0] });
            } else {
              gsap.set(card, { top: "115%", rotation: startRotations[index] });
            }
          });
          return;
        }
          if (!isProgressBarVisible) { showProgressAndIndices(); }
          const progress = sectionProgress - 1;
        const currentCardRaw = Math.floor(progress);
        const currentCard = Math.max(1, currentCardRaw);
        let progressHeight = (progress / cardCount) * 100;
        progressHeight = Math.max(0, Math.min(progressHeight, 100));
        const colorIndex = Math.min(Math.floor(progress), cardCount - 1);
          gsap.to(progressBar, { height: `${progressHeight}%`, backgroundColor: progressColors[colorIndex], duration: 0.3, ease: "power1.out" });
          if (isProgressBarVisible) { animateIndexOpacity(colorIndex); }
        cards.forEach((card, index) => {
          if (index < currentCard) {
            gsap.set(card, { top: "50%", rotation: endRotations[index] });
          } else if (index === currentCard) {
              const cardProgress = progress - currentCard;
            const newTop = gsap.utils.interpolate(115, 50, cardProgress);
              const newRotation = gsap.utils.interpolate(startRotations[index], endRotations[index], cardProgress);
            gsap.set(card, { top: `${newTop}%`, rotation: newRotation });
          } else {
            gsap.set(card, { top: "115%", rotation: startRotations[index] });
          }
        });
      },
    });
    }

    document.querySelectorAll(".pinned").forEach((el) => initPinnedSection(el));
    const pinnedAnimObserver = new MutationObserver((mutations) => {
      for (const mutation of mutations) {
        mutation.addedNodes.forEach((node) => {
          if (!(node instanceof Element)) return;
          if (node.matches && node.matches('.pinned')) initPinnedSection(node);
          node.querySelectorAll && node.querySelectorAll('.pinned').forEach((el) => initPinnedSection(el));
        });
      }
    });
    pinnedAnimObserver.observe(document.body, { childList: true, subtree: true });
  } catch (e) {}

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

    // Original static list + non-blocking Strapi name enrichment
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

    // Non-blocking fetch of cities (names and bg/fg colors) from Strapi
    (async () => {
      try {
        const base = (window && window.STRAPI_BASE) ? window.STRAPI_BASE : "http://localhost:1337";
        const res = await fetch(`${base}/api/global`);
        const json = await res.json();
        const blocks = (json && json.data && json.data.blocks) || [];
        const citiesBlock = blocks.find && blocks.find((b) => b && b.__component === 'block.cities');
        const cities = (citiesBlock && citiesBlock.cities) || [];

        // Try to also read theme for fallback colors
        let theme = null;
        try {
          const settRes = await fetch(`${base}/api/sett`);
          const settJson = await settRes.json();
          const colors = settJson && settJson.data && Array.isArray(settJson.data.colors) ? settJson.data.colors : [];
          theme = colors && colors.length ? colors[0] : null;
        } catch (_) {}

        // Update or extend cityData with Strapi labels and colors
        const count = Math.max(cities.length, cityData.length);
        for (let i = 0; i < count; i++) {
          const city = cities[i];
          const name = city && city.label ? city.label : (cityData[i] ? cityData[i].name : undefined);
          const bg = (city && city.backgroundColor) || (theme && theme.primaryColor) || (cityData[i] && cityData[i].bg) || "#0d47a1";
          const fg = (city && city.color) || (theme && theme.whiteColor) || (cityData[i] && cityData[i].fg) || "#ffffff";
          if (cityData[i]) {
            if (name) cityData[i].name = name;
            cityData[i].bg = bg;
            cityData[i].fg = fg;
          } else if (name) {
            cityData.push({ name, bg, fg });
          }
        }
      } catch (_) {}
    })();

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
