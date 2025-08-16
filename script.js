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
        // Get theme colors from Strapi API
        const themeColors = (sett.colors && Array.isArray(sett.colors)) ? sett.colors : [
          // Fallback colors if API data is not available
          {
            "id": 87,
            "secondaryColor": "#F7AACC",
            "whiteColor": "#ffffff",
            "blackColor": "#000000",
            "primaryColor": "#F05A70",
            "backgroundColor": "#ffffff",
            "complementary": "#425F93"
          },
          {
            "id": 88,
            "secondaryColor": "#425F93",
            "whiteColor": "#ffffff",
            "blackColor": "#000000",
            "primaryColor": "#D28FB9",
            "backgroundColor": "#ffffff",
            "complementary": "#BDA153"
          },
          {
            "id": 89,
            "secondaryColor": "#F6A9CB",
            "whiteColor": "#ffffff",
            "blackColor": "#000000",
            "primaryColor": "#131313",
            "backgroundColor": "#ffffff",
            "complementary": "#425F93"
          },
          {
            "id": 90,
            "secondaryColor": "#F6A9CB",
            "whiteColor": "#ffffff",
            "blackColor": "#000000",
            "primaryColor": "#F05970",
            "backgroundColor": "#ffffff",
            "complementary": "#425F93"
          },
          {
            "id": 91,
            "secondaryColor": "#F6A9CB",
            "whiteColor": "#ffffff",
            "blackColor": "#000000",
            "primaryColor": "#F15E36",
            "backgroundColor": "#ffffff",
            "complementary": "#10B49F"
          }
        ];

        // Validate theme data
        const isValidTheme = (theme) => {
          return theme && 
                 theme.id && 
                 theme.primaryColor && 
                 theme.secondaryColor && 
                 theme.backgroundColor && 
                 theme.whiteColor && 
                 theme.blackColor && 
                 theme.complementary;
        };

        const validThemes = themeColors.filter(isValidTheme);
        
        if (validThemes.length === 0) {
          console.error('❌ No valid themes found in Strapi API data');
          return;
        }

        console.log(`✅ Found ${validThemes.length} valid themes from Strapi API`);
        console.log('Theme IDs:', validThemes.map(t => t.id).join(', '));
        
        // Use validated themes
        const finalThemeColors = validThemes;

        // Function to apply theme to a main wrapper
        const applyThemeToMainWrapper = (mainWrapper, themeIndex) => {
          const theme = finalThemeColors[themeIndex % finalThemeColors.length];
          if (!mainWrapper || !theme) return;
          
          // Apply theme to the main wrapper itself
          mainWrapper.style.setProperty('--primary-color', theme.primaryColor);
          mainWrapper.style.setProperty('--secondary-color', theme.secondaryColor);
          mainWrapper.style.setProperty('--background-color', theme.backgroundColor);
          mainWrapper.style.setProperty('--text-black', theme.blackColor);
          mainWrapper.style.setProperty('--text-white', theme.whiteColor);
          mainWrapper.style.setProperty('--complementary-color', theme.complementary);
          mainWrapper.style.setProperty('--hover-color', theme.primaryColor);
          mainWrapper.style.setProperty('--accent-color', theme.secondaryColor);
          
          // Apply theme to all sections within this wrapper
          const sections = mainWrapper.querySelectorAll('section, .quad-cta, .top-marquee, .city-story, .about.vision, .pinned, .brand-splash');
          sections.forEach((section) => {
            if (section) {
              section.style.setProperty('--primary-color', theme.primaryColor);
              section.style.setProperty('--secondary-color', theme.secondaryColor);
              section.style.setProperty('--background-color', theme.backgroundColor);
              section.style.setProperty('--text-black', theme.blackColor);
              section.style.setProperty('--text-white', theme.whiteColor);
              section.style.setProperty('--complementary-color', theme.complementary);
              section.style.setProperty('--hover-color', theme.primaryColor);
              section.style.setProperty('--accent-color', theme.secondaryColor);
            }
          });
        };

        // Function to apply themes to all main wrappers (original + clones)
        const applyThemesToAllMainWrappers = () => {
          const mainWrappers = document.querySelectorAll('.main-wrapper');
          console.log(`🎨 Applying themes to ${mainWrappers.length} main wrapper(s) using ${finalThemeColors.length} available themes`);
          
          mainWrappers.forEach((wrapper, index) => {
            // Use a pattern that ensures no two consecutive wrappers have identical themes
            // Modified pattern to show theme change clearly when scrolling backward
            // Original (index 0) gets theme 0, but when scrolling back, show theme 4 (orange)
            let themeIndex;
            if (index === 0) {
              // Original wrapper gets first theme (pink)
              themeIndex = 0;
            } else {
              // All other wrappers get different themes to show change
              // Use a pattern that avoids showing the same theme consecutively
              themeIndex = (index + 1) % finalThemeColors.length;
            }
            
            const theme = finalThemeColors[themeIndex];
            console.log(`🎨 Main wrapper ${index}: applying theme ${theme.id} (${theme.primaryColor}) - showing theme change`);
            applyThemeToMainWrapper(wrapper, themeIndex);
          });
        };

        // Apply themes initially
        applyThemesToAllMainWrappers();

        // Set up observer to apply themes to new clones when they're created
        const themeObserver = new MutationObserver((mutations) => {
          let needsThemeUpdate = false;
          for (const mutation of mutations) {
            mutation.addedNodes.forEach((node) => {
              if (node instanceof Element) {
                if (node.matches && node.matches('.main-wrapper')) {
                  needsThemeUpdate = true;
                }
                if (node.querySelectorAll && node.querySelectorAll('.main-wrapper').length > 0) {
                  needsThemeUpdate = true;
                }
              }
            });
          }
          if (needsThemeUpdate) {
            // Small delay to ensure DOM is fully updated
            setTimeout(applyThemesToAllMainWrappers, 50);
          }
        });
        themeObserver.observe(document.body, { childList: true, subtree: true });

        // Listen for clones-created event to reapply themes
        window.addEventListener('clones-created', () => {
          setTimeout(applyThemesToAllMainWrappers, 100);
        });

        // Set default theme for the entire document (fallback)
        const defaultTheme = finalThemeColors[0];
        if (defaultTheme) {
          const root = document.documentElement;
          const map = {
            "--primary-color": defaultTheme.primaryColor,
            "--secondary-color": defaultTheme.secondaryColor,
            "--background-color": defaultTheme.backgroundColor,
            "--text-black": defaultTheme.blackColor,
            "--text-white": defaultTheme.whiteColor,
            "--complementary-color": defaultTheme.complementary,
            "--hover-color": defaultTheme.primaryColor,
            "--accent-color": defaultTheme.secondaryColor,
          };
          Object.entries(map).forEach(([k, v]) => {
            if (v) root.style.setProperty(k, v);
          });
        }

        // Invert top marquee border if background becomes light
        const top = document.querySelector('.top-marquee');
        if (top && defaultTheme.backgroundColor) {
          const isLight = /^#?([fF]{2}|[eE]{2}|[dD]{2})/.test(defaultTheme.backgroundColor);
          top.style.borderBottomColor = isLight ? 'rgba(0,0,0,0.1)' : 'rgba(255,255,255,0.15)';
        }

        console.log('🎨 Dynamic theme system initialized from Strapi API!');
        console.log(`Available themes: ${finalThemeColors.map(t => `ID ${t.id} (${t.primaryColor})`).join(', ')}`);
        console.log('No two consecutive main wrappers will have identical themes.');
        console.log('Pattern: Original (pink) → Orange → Purple → Black → Red → Orange...');
        console.log('🎨 Theme changes are clearly visible when scrolling backward/forward');
        
        // Expose function for manual theme reapplication (for testing)
        window.reapplyThemes = () => {
          console.log('🔄 Manually reapplying themes...');
          applyThemesToAllMainWrappers();
        };
        
        // Expose function to get current theme info
        window.getThemeInfo = () => {
          const mainWrappers = document.querySelectorAll('.main-wrapper');
          return mainWrappers.map((wrapper, index) => {
            const themeIndex = index % finalThemeColors.length;
            const theme = finalThemeColors[themeIndex];
            return {
              wrapperIndex: index,
              themeId: theme.id,
              primaryColor: theme.primaryColor,
              secondaryColor: theme.secondaryColor
            };
          });
        };
        
        // Expose function to show theme pattern
        window.showThemePattern = (count = 20) => {
          console.log(`🎨 Theme pattern for ${count} wrappers (showing theme changes):`);
          for (let i = 0; i < count; i++) {
            let themeIndex;
            if (i === 0) {
              // Original wrapper gets first theme (pink)
              themeIndex = 0;
            } else {
              // All other wrappers get different themes to show change
              themeIndex = (i + 1) % finalThemeColors.length;
            }
            const theme = finalThemeColors[themeIndex];
            console.log(`  Wrapper ${i}: Theme ${theme.id} (${theme.primaryColor}) - ${i === 0 ? 'ORIGINAL' : 'CHANGED'}`);
          }
        };
        
        console.log('💡 Use window.reapplyThemes() to manually reapply themes');
        console.log('💡 Use window.getThemeInfo() to see current theme assignments');
        console.log('💡 Use window.showThemePattern(20) to see theme pattern for 20 wrappers');
      } catch (e) {
        console.error('Error initializing theme system:', e);
      }



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

      // 4) Opening Hours from website information block
      try {
        const websiteInfoBlock = findBlock(blocks, "block.website-information");
        if (websiteInfoBlock) {
          const openHours = websiteInfoBlock.open || "";
          
          // Update opening hours elements - only show opening hours
          const openElement = document.getElementById('opening-hours-open');
          const closedElement = document.getElementById('opening-hours-closed');
          
          if (openElement && openHours) {
            openElement.textContent = openHours;
            openElement.style.display = 'block';
          } else if (openElement) {
            openElement.style.display = 'none';
          }
          
          // Always hide closed hours
          if (closedElement) {
            closedElement.style.display = 'none';
          }
        }
      } catch (_) {}

      // 5) Navigation links
      try {
        const navBlock = findBlock(blocks, "block.nav-links");
        const navItems = (navBlock && navBlock.navItems) || [];
        
        // Get email from website information block
        const websiteInfoBlock = findBlock(blocks, "block.website-information");
        const contactEmail = (websiteInfoBlock && websiteInfoBlock.email) || "contact@bloemerbar.com";
        
        if (navItems.length > 0) {
          const navHero = document.getElementById('nav-hero');
          if (navHero) {
            const navHtml = navItems.map((item) => {
              let href = item.href || "#";
              const target = item.isExternal ? ' target="_blank"' : '';
              
              // Special handling for Contact link - convert to mailto if it's the contact item
              const isContact = (item.label || '').toLowerCase() === 'contact';
              if (isContact && !href.startsWith('mailto:')) {
                href = `mailto:${contactEmail}`;
              }
              
              const isMailto = href.startsWith('mailto:');
              const dataEmail = isMailto ? ` data-email="${href.replace('mailto:', '')}"` : '';
              const linkClass = isMailto ? 'small-link small-link-contact' : 'small-link';
              
              return `
                <a href="${href}"${target} class="${linkClass}"${dataEmail}>
                  <div class="small-link-text">${item.label || ''}</div>
                  <div class="link-arrow" aria-hidden="true">
                    <svg width="100%" height="100%" viewBox="0 0 17 27" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M3.1836 26.0662C6.32574 20.7266 11.2081 16.5218 16.4082 13.2568C11.1598 10.0406 6.48457 5.68956 3.19051 0.447478L0.0552734 0.447478C3.34243 5.52248 7.30636 9.93614 12.1957 13.2568C7.29945 16.6262 3.1836 21.0886 2.47955e-05 26.0662L3.1905 26.0662L3.1836 26.0662Z" fill="currentColor"></path>
                    </svg>
                  </div>
                </a>
              `;
            }).join('');
            
            navHero.innerHTML = navHtml;
          }
        }
      } catch (_) {}

      // 6) Logo section background text
      try {
        const logoSectionBlock = findBlock(blocks, "block.logo-section");
        if (logoSectionBlock && logoSectionBlock.backgroundText) {
          // Update all bg-title elements (original and clones)
          document.querySelectorAll('.bg-title').forEach((bgTitle) => {
            bgTitle.textContent = logoSectionBlock.backgroundText;
          });
        }
      } catch (_) {}

      // 7) Corner links (Recruitment, etc.)
      try {
        // Handle corner-left recruitment link
        const recruitmentLink = document.querySelector('.corner-left .brand-link .small-link-text');
        if (recruitmentLink) {
          // Try to get recruitment text from global API
          const recruitmentBlock = findBlock(blocks, "block.recruitment");
          const recruitmentText = (recruitmentBlock && recruitmentBlock.title) || 
                                 (global.recruitment && global.recruitment.title) || 
                                 (global.cornerLinks && global.cornerLinks.recruitment) ||
                                 'Recruitment';
          
          recruitmentLink.textContent = recruitmentText;
        }

        // Handle corner-left recruitment link href
        const recruitmentAnchor = document.querySelector('.corner-left .brand-link');
        if (recruitmentAnchor) {
          const recruitmentBlock = findBlock(blocks, "block.recruitment");
          const recruitmentHref = (recruitmentBlock && recruitmentBlock.href) || 
                                 (global.recruitment && global.recruitment.href) || 
                                 (global.cornerLinks && global.cornerLinks.recruitmentHref) ||
                                 '#';
          
          recruitmentAnchor.setAttribute('href', recruitmentHref);
        }
      } catch (_) {}

      // 8) Social links (corner-right)
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

      // 9) Quad-CTA bar and grid (Services first 3, then first Bingo Event)
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

      // 10) City story and About section from information/description
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
        
        // Vision content from description structure
        try {
          const description = infoBlock && infoBlock.description;
          if (description && Array.isArray(description) && description.length >= 1) {
            const paragraph = description[0];
            
            if (paragraph && paragraph.children && paragraph.children[0] && paragraph.children[0].text) {
              const text = paragraph.children[0].text;
              const visionTitle = document.querySelector('.vision .vision-display');
              if (visionTitle) visionTitle.textContent = text;
            }
          }
        } catch (_) {}
        
        // New vision content from booking-section block
        try {
          const bookingBlock = findBlock(blocks, "block.booking-section");
          if (bookingBlock && bookingBlock.description && Array.isArray(bookingBlock.description) && bookingBlock.description.length >= 1) {
            const paragraph = bookingBlock.description[0];
            
            if (paragraph && paragraph.children && paragraph.children[0] && paragraph.children[0].text) {
              const text = paragraph.children[0].text;
              // Target the about-vision section specifically
              const visionTitle = document.querySelector('.about.vision .vision-display');
              if (visionTitle) {
                visionTitle.textContent = text;
                // Apply any additional styling if needed
                visionTitle.style.color = '#000';
                visionTitle.style.fontSize = '40px';
              }
            }
          }
          
          // Update button text and link from booking-section
          if (bookingBlock && bookingBlock.book) {
            const bookButton = document.querySelector('.about.vision .vision-cta');
            if (bookButton) {
              if (bookingBlock.book.label) {
                bookButton.textContent = bookingBlock.book.label;
              }
              // Use hardcoded href instead of fetching from Strapi
              bookButton.setAttribute('href', '#ft-open');
              // Remove external link attributes since we're using a local anchor
              bookButton.removeAttribute('target');
              bookButton.removeAttribute('rel');
            }
          }
        } catch (_) {}
        
        // vision media image from booking-section block
        try {
          const bookingBlock = findBlock(blocks, "block.booking-section");
          if (bookingBlock && bookingBlock.image && bookingBlock.image.url) {
            const img = document.querySelector('.about.vision .vision-media img');
            if (img) {
              img.src = mediaUrl(bookingBlock.image.url);
              img.alt = bookingBlock.image.alternativeText || bookingBlock.image.name || 'Terrace service image';
              img.loading = 'lazy';
              img.decoding = 'async';
            }
          }
        } catch (_) {}
        
        // Fallback to feature-list first item if booking-section image not available
        const featureBlock = findBlock(blocks, "block.feature-list");
        const firstFeature = featureBlock && Array.isArray(featureBlock.features) ? featureBlock.features[0] : null;
        if (firstFeature && firstFeature.image && firstFeature.image.url) {
          const img = document.querySelector('.about.vision .vision-media img');
          if (img) {
            img.src = mediaUrl(firstFeature.image.url);
            img.alt = firstFeature.title || 'Feature image';
            img.loading = 'lazy';
            img.decoding = 'async';
          }
        }
        // Do not override brand-splash from backend
      } catch (_) {}

      // 11) Booking popup content
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
            if (a) {
              // Use hardcoded href instead of fetching from Strapi
              a.setAttribute('href', '#ft-open');
              // Remove external link attributes since we're using a local anchor
              a.removeAttribute('target');
              a.removeAttribute('rel');
              if (cta.label) a.textContent = cta.label;
            }
          }
        }
      } catch (_) {}

      // 12) Pinned section title and cards: titles and images from Gallery (API order)
      try {
        const galleryBlock = findBlock(blocks, "block.gallery-section");
        const gallery = (galleryBlock && galleryBlock.Gallery) || [];
        const titleToImages = Object.fromEntries(
          gallery.map((g) => [g.title, (g.images || []).map((im) => mediaUrl(im && im.url)).filter(Boolean)])
        );

        function renderPinnedSection(pinnedRoot) {
          if (!pinnedRoot) return;
          
          // Set the pinned section title from gallery block
          const pinnedTitle = pinnedRoot.querySelector('#pinned-section-title');
          if (pinnedTitle && galleryBlock && galleryBlock.title) {
            pinnedTitle.textContent = galleryBlock.title;
          }
          
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
          // Opening Hours from website information block
          const websiteInfoBlock = findBlock(blocks, "block.website-information");
          if (websiteInfoBlock) {
            const openHours = websiteInfoBlock.open || "";
            
            // Update opening hours elements in all brand-splash sections - only show opening hours
            document.querySelectorAll('.brand-splash').forEach((brandSplash) => {
              const openElement = brandSplash.querySelector('#opening-hours-open');
              const closedElement = brandSplash.querySelector('#opening-hours-closed');
              
              if (openElement && openHours) {
                openElement.textContent = openHours;
                openElement.style.display = 'block';
              } else if (openElement) {
                openElement.style.display = 'none';
              }
              
              // Always hide closed hours
              if (closedElement) {
                closedElement.style.display = 'none';
              }
            });
          }
        } catch (_) {}

        try {
          // Logo section background text
          const logoSectionBlock = findBlock(blocks, "block.logo-section");
          if (logoSectionBlock && logoSectionBlock.backgroundText) {
            // Update all bg-title elements (original and clones)
            document.querySelectorAll('.bg-title').forEach((bgTitle) => {
              bgTitle.textContent = logoSectionBlock.backgroundText;
            });
          }
        } catch (_) {}

        try {
          // Navigation links
          const navBlock = findBlock(blocks, "block.nav-links");
          const navItems = (navBlock && navBlock.navItems) || [];
          
          // Get email from website information block
          const websiteInfoBlock = findBlock(blocks, "block.website-information");
          const contactEmail = (websiteInfoBlock && websiteInfoBlock.email) || "contact@bloemerbar.com";
          
          if (navItems.length > 0) {
            document.querySelectorAll('#nav-hero').forEach((navHero) => {
              const navHtml = navItems.map((item) => {
                let href = item.href || "#";
                const target = item.isExternal ? ' target="_blank"' : '';
                
                // Special handling for Contact link - convert to mailto if it's the contact item
                const isContact = (item.label || '').toLowerCase() === 'contact';
                if (isContact && !href.startsWith('mailto:')) {
                  href = `mailto:${contactEmail}`;
                }
                
                const isMailto = href.startsWith('mailto:');
                const dataEmail = isMailto ? ` data-email="${href.replace('mailto:', '')}"` : '';
                const linkClass = isMailto ? 'small-link small-link-contact' : 'small-link';
                
                return `
                  <a href="${href}"${target} class="${linkClass}"${dataEmail}>
                    <div class="small-link-text">${item.label || ''}</div>
                    <div class="link-arrow" aria-hidden="true">
                      <svg width="100%" height="100%" viewBox="0 0 17 27" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M3.1836 26.0662C6.32574 20.7266 11.2081 16.5218 16.4082 13.2568C11.1598 10.0406 6.48457 5.68956 3.19051 0.447478L0.0552734 0.447478C3.34243 5.52248 7.30636 9.93614 12.1957 13.2568C7.29945 16.6262 3.1836 21.0886 2.47955e-05 26.0662L3.1905 26.0662L3.1836 26.0662Z" fill="currentColor"></path>
                      </svg>
                    </div>
                  </a>
                `;
              }).join('');
              
              navHero.innerHTML = navHtml;
            });
          }
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
          
          // Vision content from description structure
          try {
            const description = infoBlock && infoBlock.description;
            if (description && Array.isArray(description) && description.length >= 1) {
              const paragraph = description[0];
              
              if (paragraph && paragraph.children && paragraph.children[0] && paragraph.children[0].text) {
                const text = paragraph.children[0].text;
                const visionTitle = document.querySelector('.vision .vision-display');
                if (visionTitle) visionTitle.textContent = text;
              }
            }
          } catch (_) {}
          
          // New vision content from booking-section block
          try {
            const bookingBlock = findBlock(blocks, "block.booking-section");
            if (bookingBlock && bookingBlock.description && Array.isArray(bookingBlock.description) && bookingBlock.description.length >= 1) {
              const paragraph = bookingBlock.description[0];
              
              if (paragraph && paragraph.children && paragraph.children[0] && paragraph.children[0].text) {
                const text = paragraph.children[0].text;
                // Target the about-vision section specifically
                const visionTitle = document.querySelector('.about.vision .vision-display');
                if (visionTitle) {
                  visionTitle.textContent = text;
                  // Apply any additional styling if needed
                  visionTitle.style.color = '#000';
                  visionTitle.style.fontSize = '40px';
                }
              }
            }
            
            // Update button text and link from booking-section
            if (bookingBlock && bookingBlock.book) {
              const bookButton = document.querySelector('.about.vision .vision-cta');
              if (bookButton) {
                if (bookingBlock.book.label) {
                  bookButton.textContent = bookingBlock.book.label;
                }
                // Use hardcoded href instead of fetching from Strapi
                bookButton.setAttribute('href', '#ft-open');
                // Remove external link attributes since we're using a local anchor
                bookButton.removeAttribute('target');
                bookButton.removeAttribute('rel');
              }
            }
          } catch (_) {}
          
          // vision media image from booking-section block
          try {
            const bookingBlock = findBlock(blocks, "block.booking-section");
            if (bookingBlock && bookingBlock.image && bookingBlock.image.url) {
              const img = document.querySelector('.about.vision .vision-media img');
              if (img) {
                img.src = mediaUrl(bookingBlock.image.url);
                img.alt = bookingBlock.image.alternativeText || bookingBlock.image.name || 'Terrace service image';
                img.loading = 'lazy';
                img.decoding = 'async';
              }
            }
          } catch (_) {}
          
          // Fallback to feature-list first item if booking-section image not available
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
          // Pinned section title and cards (idempotent render)
          document.querySelectorAll('.pinned').forEach((section) => {
            const galleryBlock = findBlock(blocks, "block.gallery-section");
            const gallery = (galleryBlock && galleryBlock.Gallery) || [];
            const titleToImages = Object.fromEntries(
              gallery.map((g) => [g.title, (g.images || []).map((im) => mediaUrl(im && im.url)).filter(Boolean)])
            );
            
            // Set the pinned section title from gallery block
            const pinnedTitle = section.querySelector('#pinned-section-title');
            if (pinnedTitle && galleryBlock && galleryBlock.title) {
              pinnedTitle.textContent = galleryBlock.title;
            }
            
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
  // Simple approach: Duplicate the full main wrapper exactly as is
  function createClones() {
    try {
      const main = document.querySelector('.main-wrapper');
      if (!main) return;
      
      const fragment = document.createDocumentFragment();
      const copies = 10; // Increased for better infinite experience
      
      for (let i = 0; i < copies; i++) {
        // Simple deep clone - keep everything exactly the same
        const clone = main.cloneNode(true);
        
        // Only fix SVG ID conflicts to prevent reference issues
        clone.querySelectorAll('svg[id]').forEach((svg) => {
          const newId = 'svg-clone-' + i + '-' + Math.random().toString(36).substr(2, 9);
          svg.setAttribute('id', newId);
        });
        
        fragment.appendChild(clone);
      }
      
      document.body.appendChild(fragment);
      prepareMarquees();
      window.dispatchEvent(new Event('clones-created'));
      
      console.log(`🔄 Created ${copies} clones for infinite experience`);
    } catch (e) {
      console.error('Error creating clones:', e);
    }
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
  const lenis = new Lenis({
    duration: 1.2,
    easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
    orientation: 'vertical',
    gestureOrientation: 'vertical',
    smoothWheel: true,
    wheelMultiplier: 1,
    smoothTouch: false,
    touchMultiplier: 2,
    infinite: false,
  });
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
    
    // Get the current main wrapper that triggered the popup
    const currentMainWrapper = window.currentPopupWrapper || document.querySelector('.main-wrapper:has(.pinned)');
    if (currentMainWrapper) {
      // Apply the theme colors from the current wrapper to the popup
      const computedStyle = getComputedStyle(currentMainWrapper);
      bookPopup.style.setProperty('--primary-color', computedStyle.getPropertyValue('--primary-color'));
      bookPopup.style.setProperty('--secondary-color', computedStyle.getPropertyValue('--secondary-color'));
      bookPopup.style.setProperty('--background-color', computedStyle.getPropertyValue('--background-color'));
      bookPopup.style.setProperty('--text-black', computedStyle.getPropertyValue('--text-black'));
      bookPopup.style.setProperty('--text-white', computedStyle.getPropertyValue('--text-white'));
      bookPopup.style.setProperty('--complementary-color', computedStyle.getPropertyValue('--complementary-color'));
      bookPopup.style.setProperty('--hover-color', computedStyle.getPropertyValue('--hover-color'));
      bookPopup.style.setProperty('--accent-color', computedStyle.getPropertyValue('--accent-color'));
    }
    
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
    
    // Clean up the wrapper reference
    window.currentPopupWrapper = null;
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
      
      // Simple SVG ID fix to prevent conflicts
      try {
        const svg = brandSplashEl.querySelector('.brand-illustration');
        if (svg && svg.querySelector('[id]')) {
          const uid = 'svg' + Math.floor(performance.now()).toString(36) + Math.floor(Math.random() * 1e6).toString(36);
          svg.querySelectorAll('[id]').forEach((el) => {
            const oldId = el.getAttribute('id');
            if (oldId) {
              el.setAttribute('id', `${uid}-${oldId}`);
            }
          });
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
        // Ensure each piece is visible and properly styled
        try { el.style.display = 'block'; } catch (_) {}
        try { el.style.visibility = 'visible'; } catch (_) {}
        try { el.style.fill = 'var(--primary-color)'; } catch (_) {}
      });

      const partyColors = ['#d946ef', '#06b6d4', '#34d399', '#f59e0b', '#ef4444', '#6366f1'];
      
      // Create a global color animation timeline that works for all instances
      if (!window.globalColorAnimation) {
        window.globalColorAnimation = gsap.timeline({ repeat: -1 });
        partyColors.forEach((color) => {
          window.globalColorAnimation.to(
            '.svg-piece',
            {
              duration: 0.7,
              fill: color,
              ease: 'power1.inOut',
              stagger: { each: 0.03, from: 0 },
            },
            '+=0.2'
          );
        });
      }

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
        fill: 'var(--primary-color)',
      });

      function startPartyLights() {
        // Use the global color animation that affects all SVG pieces
        if (window.globalColorAnimation) {
          // Ensure the global animation is running
          if (!window.globalColorAnimation.isActive()) {
            window.globalColorAnimation.play();
          }
        } else {
          // Fallback to local animation
          const colorsTl = gsap.timeline({ repeat: -1 });
          partyColors.forEach((color) => {
            colorsTl.to(
              pieces,
              {
                duration: 0.7,
                fill: color,
                ease: 'power1.inOut',
                stagger: { each: 0.03, from: 0 },
              },
              '+=0.2'
            );
          });
        }
        
        // Ensure the animation starts immediately for all pieces
        setTimeout(() => {
          pieces.forEach((piece) => {
            piece.style.fill = partyColors[0];
          });
        }, 100);
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
      
      // Immediate fallback: Force pieces to final state but preserve color animation
      setTimeout(() => {
        pieces.forEach((piece) => {
          piece.style.opacity = '1';
          piece.style.visibility = 'visible';
          piece.style.display = 'block';
          piece.style.transform = 'scale(1) translate(0, 0) rotate(0deg)';
          // Don't override fill color - let animation handle it
        });
      }, 100);
      
      // Additional fallback: Ensure SVG pieces are visible even if animation fails
      setTimeout(() => {
        pieces.forEach((piece) => {
          piece.style.opacity = '1';
          piece.style.visibility = 'visible';
          piece.style.display = 'block';
          piece.style.transform = 'scale(1) translate(0, 0) rotate(0deg)';
          // Start color animation if it hasn't started
          if (!piece.style.fill || piece.style.fill === 'var(--primary-color)') {
            piece.style.fill = partyColors[0];
          }
        });
      }, 2500);

      initializedBrandSplash.add(brandSplashEl);
      
      // Ensure color animation starts for this instance
      setTimeout(() => {
        if (pieces.length > 0) {
          pieces.forEach((piece, index) => {
            // Set initial color from party colors array
            const initialColor = partyColors[index % partyColors.length];
            piece.style.fill = initialColor;
          });
        }
      }, 3000); // After the assembly animation completes
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

    // Simple re-init after clones are created
    window.addEventListener('clones-created', () => {
      initAllBrandSplash();
      
      // Comprehensive fix: Ensure all brand-illustration SVGs and their pieces are properly styled
      setTimeout(() => {
        document.querySelectorAll('.brand-illustration').forEach((svg) => {
          svg.style.display = 'block';
          svg.style.visibility = 'visible';
          svg.style.opacity = '1';
          
                     // Ensure all SVG pieces are properly styled but preserve color animation
           svg.querySelectorAll('.svg-piece').forEach((piece) => {
             piece.style.display = 'block';
             piece.style.visibility = 'visible';
             piece.style.opacity = '1';
             piece.style.transformOrigin = '50% 50%';
             // Don't override fill color - let animation handle it
           });
        });
      }, 50);
    });

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
      
      // Ensure background is set immediately
      gsap.set(pinnedSection, { 
        background: "linear-gradient(135deg, #fef8dd 0%, #f7aacc 100%)" 
      });

    const stickyHeader = pinnedSection.querySelector(".sticky-header");
    const cards = pinnedSection.querySelectorAll(".card");
    const progressBarContainer = pinnedSection.querySelector(".progress-bar");
    const progressBar = pinnedSection.querySelector(".progress");
    const indicesContainer = pinnedSection.querySelector(".indices");
    const indices = pinnedSection.querySelectorAll(".index");
    const cardCount = cards.length;
    const pinnedHeight = window.innerHeight * (cardCount + 1);
    // Ensure smooth scrolling by adding a small buffer
    const scrollBuffer = 100;

    const startRotations = [0, 5, 0, -5];
    const endRotations = [-10, -5, 10, 5];
    const progressColors = ["#FFD1DC", "#AEC6CF", "#77DD77", "#C5BBDE"];
    const cardImageSequences = [
        // ["./assets/pub_1.jpg", "./assets/pub_2.jpg", "./assets/pub_3.jpg", "./assets/pub_4.jpg"],
        // ["./assets/club_1.jpg", "./assets/club_2.jpg", "./assets/club_3.jpg", "./assets/club_4.jpg"],
        // ["./assets/terrace_1.jpg", "./assets/terrace_2.jpg", "./assets/terrace_3.jpg", "./assets/terrace_4.jpg"],
        // ["./assets/interior_1.jpg", "./assets/interrior_2.jpg", "./assets/interior_1.jpg", "./assets/interrior_2.jpg"],
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
      img.src = sequence[0] || "";
      img.alt = `Card ${index + 1}`;
      img.style.width = "100%";
      img.style.height = "100%";
      img.style.objectFit = "cover";
      img.style.position = "absolute";
      img.style.top = 0;
      img.style.left = 0;
      img.style.zIndex = 0;
      // Ensure smooth image loading to prevent glitches
      img.loading = "eager";
      img.decoding = "async";
      img.onload = () => {
        // Ensure image is properly loaded before showing
        img.style.opacity = "1";
      };
      img.style.opacity = "0";
      img.style.transition = "opacity 0.3s ease";
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
      end: `+=${pinnedHeight + scrollBuffer}`,
      pin: true,
      pinSpacing: true,
      // Ensure smooth scrolling behavior
      anticipatePin: 1,
      onLeave: () => {
        hideProgressAndIndices();
        
        // Only show booking popup on original and first copy
        const mainWrapper = pinnedSection.closest('.main-wrapper');
        if (mainWrapper) {
          const allMainWrappers = document.querySelectorAll('.main-wrapper');
          const currentIndex = Array.from(allMainWrappers).indexOf(mainWrapper);
          
          // Show popup only on original (index 0) and first copy (index 1)
          if (currentIndex <= 1) {
            // Store reference to the current wrapper for popup theming
            window.currentPopupWrapper = mainWrapper;
            openBookPopup();
          }
        }
        
        // Ensure background is maintained when leaving
        gsap.set(pinnedSection, { 
          background: "linear-gradient(135deg, #fef8dd 0%, #f7aacc 100%)" 
        });
      },
      onEnterBack: () => { 
        showProgressAndIndices(); 
        // Ensure background is visible when scrolling back
        gsap.set(pinnedSection, { 
          background: "linear-gradient(135deg, #fef8dd 0%, #f7aacc 100%)" 
        });
      },
      onUpdate: (self) => {
        const sectionProgress = self.progress * (cardCount + 1);
        
        // Ensure background is always visible during scrolling
        gsap.set(pinnedSection, { 
          background: "linear-gradient(135deg, #fef8dd 0%, #f7aacc 100%)" 
        });
        
        // Sticky header is always visible - removed opacity animation
        if (stickyHeader) {
          gsap.set(stickyHeader, { opacity: 1 });
        }
        
        // Handle initial state (before first card)
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
        
        // Show progress and indices when we start card animations
        if (!isProgressBarVisible) { 
          showProgressAndIndices(); 
        }
        
        const progress = sectionProgress - 1;
        const currentCardRaw = Math.floor(progress);
        const currentCard = Math.max(1, currentCardRaw);
        let progressHeight = (progress / cardCount) * 100;
        progressHeight = Math.max(0, Math.min(progressHeight, 100));
        const colorIndex = Math.min(Math.floor(progress), cardCount - 1);
        
        // Update progress bar
        gsap.to(progressBar, { 
          height: `${progressHeight}%`, 
          backgroundColor: progressColors[colorIndex], 
          duration: 0.3, 
          ease: "power1.out" 
        });
        
        if (isProgressBarVisible) { 
          animateIndexOpacity(colorIndex); 
        }
        
        // Handle card animations with smooth transitions
        cards.forEach((card, index) => {
          if (index < currentCard) {
            // Cards that have completed their animation
            gsap.set(card, { top: "50%", rotation: endRotations[index] });
          } else if (index === currentCard) {
            // Currently animating card
            const cardProgress = progress - currentCard;
            const newTop = gsap.utils.interpolate(115, 50, cardProgress);
            const newRotation = gsap.utils.interpolate(startRotations[index], endRotations[index], cardProgress);
            gsap.set(card, { top: `${newTop}%`, rotation: newRotation });
          } else {
            // Cards waiting to animate
            gsap.set(card, { top: "115%", rotation: startRotations[index] });
          }
        });
        
        // Prevent white background flash by ensuring smooth transition to next section
        if (self.progress >= 0.99) {
          // When almost complete, ensure all cards are in final position
          cards.forEach((card, index) => {
            gsap.set(card, { top: "50%", rotation: endRotations[index] });
          });
        }
      },
    });
    }

    document.querySelectorAll(".pinned").forEach((el) => initPinnedSection(el));
    
    // Ensure all pinned sections have proper background on page load
    document.querySelectorAll(".pinned").forEach((section) => {
      gsap.set(section, { 
        background: "linear-gradient(135deg, #fef8dd 0%, #f7aacc 100%)" 
      });
    });
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

    // Cities populated from Strapi (no hardcoded list)
    const cityData = [];

    let index = 0;
    function applyCity(city) {
      overlay.style.backgroundColor = city.bg;
      label.style.color = city.fg;
      label.textContent = city.name;
    }

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
    // Fetch cities from sett API first; start ticker only when data is ready (with a short timeout fallback)
    (async () => {
      const base = (window && window.STRAPI_BASE) ? window.STRAPI_BASE : "http://localhost:1337";
      const timeoutMs = 1500;
      function timeout(promise) {
        return Promise.race([
          promise,
          new Promise((resolve) => setTimeout(() => resolve(null), timeoutMs)),
        ]);
      }
      try {
        const result = await timeout((async () => {
          // Fetch cities from sett API instead of global API
          const settRes = await fetch(`${base}/api/sett`).catch(() => null);
          if (!settRes) return null;
          const settJson = await settRes.json().catch(() => null);
          if (!settJson || !settJson.data) return null;
          
          const cities = Array.isArray(settJson.data.cities) ? settJson.data.cities : [];
          const colors = Array.isArray(settJson.data.colors) ? settJson.data.colors : [];
          const theme = colors && colors.length ? colors[0] : null;

          return { cities, theme };
        })());

        let cities = [];
        let theme = null;
        if (result && Array.isArray(result.cities)) {
          cities = result.cities;
          theme = result.theme || null;
        } else if (window.__STRAPI__ && window.__STRAPI__.sett) {
          // Fallback to already-fetched sett data if available
          const sett = window.__STRAPI__.sett || {};
          cities = Array.isArray(sett.cities) ? sett.cities : [];
          const colors = Array.isArray(sett.colors) ? sett.colors : [];
          theme = colors && colors.length ? colors[0] : null;
        }

        for (const c of cities) {
          const name = c && c.label ? c.label : null;
          if (!name) continue;
          const bg = (c && c.backgroundColor) || (theme && theme.primaryColor) || "#0d47a1";
          const fg = (c && c.color) || (theme && theme.whiteColor) || "#ffffff";
          cityData.push({ name, bg, fg });
        }
      } catch (_) {}

      if (!cityData.length) {
        // No dynamic cities available; skip the ticker
        if (typeof hideOverlay === "function") hideOverlay();
        return;
      }

      applyCity(cityData[0]);
      timerId = setTimeout(step, stepMs);
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

// ===== Audio Player Functionality =====
document.addEventListener('DOMContentLoaded', function() {
  const playButton = document.getElementById('play-button');
  const audio = document.getElementById('background-audio');
  const playIcon = document.querySelector('.play-icon');
  const pauseIcon = document.querySelector('.pause-icon');
  const trackStatus = document.querySelector('.track-status');
  const visualizerBars = document.querySelectorAll('.visualizer-bar');
  
  if (!playButton || !audio) return;
  
  let isPlaying = false;
  let audioContext = null;
  let analyser = null;
  let dataArray = null;
  let animationId = null;
  
  // Initialize audio context for visualizer
  function initAudioContext() {
    if (!audioContext) {
      audioContext = new (window.AudioContext || window.webkitAudioContext)();
      analyser = audioContext.createAnalyser();
      analyser.fftSize = 256;
      const bufferLength = analyser.frequencyBinCount;
      dataArray = new Uint8Array(bufferLength);
      
      const source = audioContext.createMediaElementSource(audio);
      source.connect(analyser);
      analyser.connect(audioContext.destination);
    }
  }
  
  // Update visualizer bars
  function updateVisualizer() {
    if (!analyser || !dataArray) return;
    
    analyser.getByteFrequencyData(dataArray);
    
    visualizerBars.forEach((bar, index) => {
      const value = dataArray[index] || 0;
      const height = Math.max(20, (value / 255) * 100);
      bar.style.height = `${height}%`;
      bar.style.opacity = value > 0 ? 1 : 0.7;
    });
    
    if (isPlaying) {
      animationId = requestAnimationFrame(updateVisualizer);
    }
  }
  
  // Play audio
  function playAudio() {
    if (!audio.src) {
      // If no audio source is set, you can set a default one here
      // audio.src = 'path/to/default-audio.mp3';
      trackStatus.textContent = 'No audio available';
      return;
    }
    
    initAudioContext();
    
    audio.play().then(() => {
      isPlaying = true;
      playIcon.style.display = 'none';
      pauseIcon.style.display = 'inline';
      trackStatus.textContent = 'Now playing';
      updateVisualizer();
    }).catch(error => {
      console.error('Error playing audio:', error);
      trackStatus.textContent = 'Playback error';
    });
  }
  
  // Pause audio
  function pauseAudio() {
    audio.pause();
    isPlaying = false;
    playIcon.style.display = 'inline';
    pauseIcon.style.display = 'none';
    trackStatus.textContent = 'Paused';
    
    if (animationId) {
      cancelAnimationFrame(animationId);
      animationId = null;
    }
    
    // Reset visualizer bars
    visualizerBars.forEach(bar => {
      bar.style.height = '60%';
      bar.style.opacity = '0.7';
    });
  }
  
  // Toggle play/pause
  playButton.addEventListener('click', function() {
    if (isPlaying) {
      pauseAudio();
    } else {
      playAudio();
    }
  });
  
  // Audio event listeners
  audio.addEventListener('ended', function() {
    isPlaying = false;
    playIcon.style.display = 'inline';
    pauseIcon.style.display = 'none';
    trackStatus.textContent = 'Track ended';
    
    if (animationId) {
      cancelAnimationFrame(animationId);
      animationId = null;
    }
  });
  
  audio.addEventListener('error', function() {
    trackStatus.textContent = 'Audio error';
    isPlaying = false;
    playIcon.style.display = 'inline';
    pauseIcon.style.display = 'none';
  });
  
  // Load audio from Strapi API (example)
  async function loadAudioFromStrapi() {
    try {
      const STRAPI_BASE = (window && window.STRAPI_BASE) ? window.STRAPI_BASE : "http://localhost:1337";
      const response = await fetch(`${STRAPI_BASE}/api/audio?populate=*`);
      const data = await response.json();
      
      if (data.data && data.data.attributes && data.data.attributes.audioFile) {
        const audioUrl = data.data.attributes.audioFile.url;
        audio.src = audioUrl.startsWith('http') ? audioUrl : `${STRAPI_BASE}${audioUrl}`;
        trackStatus.textContent = 'Ready to play';
      } else {
        trackStatus.textContent = 'No audio available';
      }
    } catch (error) {
      console.error('Error loading audio from Strapi:', error);
      trackStatus.textContent = 'Failed to load audio';
    }
  }
  
  // Load audio when page loads
  loadAudioFromStrapi();
});
