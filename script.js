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
  
  // === Mobile Menu Toggle Functionality ===
  function initializeMobileMenu() {
    // Get all mobile menu toggles and nav-hero elements
    const mobileMenuToggles = document.querySelectorAll('.mobile-menu-toggle');
    const navHeroes = document.querySelectorAll('.nav-hero');
    
    // Function to close all mobile menus
    function closeAllMobileMenus() {
      mobileMenuToggles.forEach(toggle => {
        toggle.setAttribute('aria-expanded', 'false');
      });
      navHeroes.forEach(nav => {
        nav.classList.remove('mobile-open');
      });
      document.body.style.overflow = '';
    }
    
    // Add click event listeners to all mobile menu toggles
    mobileMenuToggles.forEach(toggle => {
      // Remove existing listeners to prevent duplicates
      toggle.removeEventListener('click', toggle.clickHandler);
      
      toggle.clickHandler = () => {
        const isExpanded = toggle.getAttribute('aria-expanded') === 'true';
        
        // Close all other menus first
        closeAllMobileMenus();
        
        if (!isExpanded) {
          // Find the corresponding nav-hero (closest one in the same top-marquee)
          const topMarquee = toggle.closest('.top-marquee');
          const navHero = topMarquee ? topMarquee.querySelector('.nav-hero') : null;
          
          if (navHero) {
            toggle.setAttribute('aria-expanded', 'true');
            navHero.classList.add('mobile-open');
            document.body.style.overflow = 'hidden';
          }
        }
      };
      
      toggle.addEventListener('click', toggle.clickHandler);
    });
    
    // Close menu when clicking outside (using event delegation)
    document.removeEventListener('click', document.outsideClickHandler);
    document.outsideClickHandler = (e) => {
      const isToggleClick = e.target.closest('.mobile-menu-toggle');
      const isNavClick = e.target.closest('.nav-hero');
      
      if (!isToggleClick && !isNavClick) {
        closeAllMobileMenus();
      }
    };
    document.addEventListener('click', document.outsideClickHandler);
    
    // Close menu on window resize if screen becomes larger
    window.removeEventListener('resize', window.resizeHandler);
    window.resizeHandler = () => {
      if (window.innerWidth > 900) {
        closeAllMobileMenus();
      }
    };
    window.addEventListener('resize', window.resizeHandler);
    
    // Close menu when pressing Escape key
    document.removeEventListener('keydown', document.escapeHandler);
    document.escapeHandler = (e) => {
      if (e.key === 'Escape') {
        closeAllMobileMenus();
      }
    };
    document.addEventListener('keydown', document.escapeHandler);
  }
  
  // Initialize mobile menu on page load
  initializeMobileMenu();
  
  // Initialize enhanced bg-title effects
  function initializeEnhancedBgTitle() {
    document.querySelectorAll('.bg-title').forEach((bgTitle) => {
      // Apply theme color to bg-title
      const mainWrapper = bgTitle.closest('.main-wrapper');
      if (mainWrapper) {
        const computedStyle = getComputedStyle(mainWrapper);
        const primaryColor = computedStyle.getPropertyValue('--primary-color').trim();
        
        // Update color with current theme primary color
        bgTitle.style.color = primaryColor;
        
        // Add scroll-based blur effect
        const updateBlurEffect = () => {
          const scrollY = window.scrollY;
          const maxBlur = 6;
          const minBlur = 1;
          const blurValue = Math.max(minBlur, Math.min(maxBlur, scrollY / 50));
          bgTitle.style.filter = `blur(${blurValue}px)`;
        };
        
        // Initial blur effect
        updateBlurEffect();
        
        // Add scroll listener for dynamic blur
        window.addEventListener('scroll', updateBlurEffect, { passive: true });
      }
    });
  }
  
  // Initialize enhanced bg-title effects
  initializeEnhancedBgTitle();
  
  // Close mobile menus on scroll
  let scrollTimeout;
  window.addEventListener('scroll', () => {
    clearTimeout(scrollTimeout);
    scrollTimeout = setTimeout(() => {
      const mobileMenuToggles = document.querySelectorAll('.mobile-menu-toggle');
      const navHeroes = document.querySelectorAll('.nav-hero');
      
      // Close all mobile menus
      mobileMenuToggles.forEach(toggle => {
        toggle.setAttribute('aria-expanded', 'false');
      });
      navHeroes.forEach(nav => {
        nav.classList.remove('mobile-open');
      });
      document.body.style.overflow = '';
    }, 100);
  });
  
  // Re-initialize mobile menu when new elements are added (for cloned content)
  const observer = new MutationObserver((mutations) => {
    let shouldReinitialize = false;
    let shouldReinitializeBgTitle = false;
    
    mutations.forEach((mutation) => {
      if (mutation.type === 'childList') {
        mutation.addedNodes.forEach((node) => {
          if (node.nodeType === Node.ELEMENT_NODE) {
            if (node.matches && (node.matches('.mobile-menu-toggle') || node.matches('.nav-hero') || node.querySelector('.mobile-menu-toggle') || node.querySelector('.nav-hero'))) {
              shouldReinitialize = true;
            }
            if (node.matches && node.matches('.bg-title') || node.querySelector && node.querySelector('.bg-title')) {
              shouldReinitializeBgTitle = true;
            }
            if (node.querySelectorAll) {
              const toggles = node.querySelectorAll('.mobile-menu-toggle');
              const navs = node.querySelectorAll('.nav-hero');
              const bgTitles = node.querySelectorAll('.bg-title');
              if (toggles.length > 0 || navs.length > 0) {
                shouldReinitialize = true;
              }
              if (bgTitles.length > 0) {
                shouldReinitializeBgTitle = true;
              }
            }
          }
        });
      }
    });
    
    if (shouldReinitialize) {
      // Small delay to ensure DOM is fully updated
      setTimeout(initializeMobileMenu, 10);
    }
    
    if (shouldReinitializeBgTitle) {
      // Small delay to ensure DOM is fully updated
      setTimeout(initializeEnhancedBgTitle, 10);
    }
  });
  
  observer.observe(document.body, {
    childList: true,
    subtree: true
  });
  
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
            "primaryColor": "#736fa1",
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
          },
          {
            "id": 92,
            "secondaryColor": "#98D2B3",
            "whiteColor": "#ffffff",
            "blackColor": "#000000",
            "primaryColor": "#15B29F",
            "backgroundColor": "#ffffff",
            "complementary": "#F15E36"
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
        
        // Use validated themes and add hardcoded teal theme
        const finalThemeColors = [...validThemes];
        
        // Add hardcoded teal theme if not already present
        const tealThemeExists = finalThemeColors.some(theme => theme.id === 92);
        if (!tealThemeExists) {
          finalThemeColors.push({
            "id": 92,
            "secondaryColor": "#98D2B3",
            "whiteColor": "#ffffff",
            "blackColor": "#000000",
            "primaryColor": "#15B29F",
            "backgroundColor": "#ffffff",
            "complementary": "#F15E36"
          });
        }
        
        console.log(`🎨 Final theme count: ${finalThemeColors.length} (including teal theme)`);
        console.log('Final Theme IDs:', finalThemeColors.map(t => t.id).join(', '));

        // Function to apply theme to a main wrapper
        const applyThemeToMainWrapper = (mainWrapper, themeIndex) => {
          const theme = finalThemeColors[themeIndex % finalThemeColors.length];
          if (!mainWrapper || !theme) return;
          
          // Debug logging for teal theme
          if (theme.id === 92) {
            console.log('🎨 Applying TEAL theme:', theme);
            console.log('🎨 Teal theme colors:', {
              primary: theme.primaryColor,
              secondary: theme.secondaryColor,
              background: theme.backgroundColor,
              complementary: theme.complementary
            });
          }
          
          // Apply theme to the main wrapper itself
          mainWrapper.style.setProperty('--primary-color', theme.primaryColor);
          mainWrapper.style.setProperty('--secondary-color', theme.secondaryColor);
          mainWrapper.style.setProperty('--background-color', theme.backgroundColor);
          mainWrapper.style.setProperty('--text-black', theme.blackColor);
          mainWrapper.style.setProperty('--text-white', theme.whiteColor);
          mainWrapper.style.setProperty('--complementary-color', theme.complementary);
          mainWrapper.style.setProperty('--hover-color', theme.primaryColor);
          mainWrapper.style.setProperty('--accent-color', theme.secondaryColor);
          mainWrapper.style.setProperty('--theme-gradient', `linear-gradient(135deg, ${theme.primaryColor} 0%, ${theme.secondaryColor} 100%)`);
          mainWrapper.style.setProperty('--theme-shadow', `0 8px 32px ${theme.primaryColor}20`);
          
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
              section.style.setProperty('--theme-gradient', `linear-gradient(135deg, ${theme.primaryColor} 0%, ${theme.secondaryColor} 100%)`);
              section.style.setProperty('--theme-shadow', `0 8px 32px ${theme.primaryColor}20`);
            }
          });
          
          // Apply theme color to bg-title elements in this wrapper
          const bgTitles = mainWrapper.querySelectorAll('.bg-title');
          bgTitles.forEach((bgTitle) => {
            bgTitle.style.color = theme.primaryColor;
          });
          
          // Update Lottie colors if the update function exists
          if (mainWrapper._updateLottieColors) {
            mainWrapper._updateLottieColors();
          }
        };

        // Function to update pinned section backgrounds with theme-specific gradients
        const updatePinnedSectionBackgrounds = () => {
          const pinnedSections = document.querySelectorAll('.pinned');
          pinnedSections.forEach(pinnedSection => {
            // Get the current theme colors from the pinned section's computed styles
            const primaryColor = getComputedStyle(pinnedSection).getPropertyValue('--primary-color').trim() || '#F05A70';
            const secondaryColor = getComputedStyle(pinnedSection).getPropertyValue('--secondary-color').trim() || '#F7AACC';
            const backgroundColor = getComputedStyle(pinnedSection).getPropertyValue('--background-color').trim() || '#ffffff';
            
            // Create theme-specific gradient based on primary color
            let gradient;
            
            // Convert hex to RGB for better color analysis
            const hexToRgb = (hex) => {
              const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
              return result ? {
                r: parseInt(result[1], 16),
                g: parseInt(result[2], 16),
                b: parseInt(result[3], 16)
              } : null;
            };
            
            const rgb = hexToRgb(primaryColor);
            
            if (rgb) {
              // Pink theme detection (high red, medium green, medium blue)
              if (rgb.r > 200 && rgb.g > 80 && rgb.g < 180 && rgb.b > 100 && rgb.b < 200) {
                gradient = `linear-gradient(135deg, #FFE8F0 0%, ${primaryColor} 50%, ${secondaryColor} 100%)`;
              }
              // Orange theme detection (high red, medium green, low blue)
              else if (rgb.r > 200 && rgb.g > 100 && rgb.g < 200 && rgb.b < 100) {
                gradient = `linear-gradient(135deg, #FFF8F0 0%, ${primaryColor} 50%, #FFB366 100%)`;
              }
              // Black theme detection (low values)
              else if (rgb.r < 50 && rgb.g < 50 && rgb.b < 50) {
                gradient = `linear-gradient(135deg, #2a2a2a 0%, ${primaryColor} 50%, #4a4a4a 100%)`;
              }
              // Purple theme detection (medium red, low green, high blue) - including #736fa1
              else if ((rgb.r > 100 && rgb.r < 200 && rgb.g < 100 && rgb.b > 100) || 
                       (rgb.r === 115 && rgb.g === 111 && rgb.b === 161)) {
                gradient = `linear-gradient(135deg, #F0E8FF 0%, ${primaryColor} 50%, ${secondaryColor} 100%)`;
              }
              // Teal theme detection (#15B29F) - medium red, high green, medium blue
              else if ((rgb.r === 21 && rgb.g === 178 && rgb.b === 159) || 
                       (rgb.r > 15 && rgb.r < 30 && rgb.g > 170 && rgb.g < 185 && rgb.b > 150 && rgb.b < 165)) {
                gradient = `linear-gradient(135deg, #E8FFFD 0%, ${primaryColor} 50%, ${secondaryColor} 100%)`;
              }
              // Red theme detection (high red, low green, low blue)
              else if (rgb.r > 200 && rgb.g < 100 && rgb.b < 100) {
                gradient = `linear-gradient(135deg, #FFE8E8 0%, ${primaryColor} 50%, #FFB3B3 100%)`;
              }
              // Blue theme detection (low red, low green, high blue)
              else if (rgb.r < 100 && rgb.g < 100 && rgb.b > 150) {
                gradient = `linear-gradient(135deg, #E8F0FF 0%, ${primaryColor} 50%, #B3D9FF 100%)`;
              }
              // Green theme detection (low red, high green, low blue)
              else if (rgb.r < 100 && rgb.g > 150 && rgb.b < 100) {
                gradient = `linear-gradient(135deg, #E8FFE8 0%, ${primaryColor} 50%, #B3FFB3 100%)`;
              }
              // Default theme - use primary and secondary colors
              else {
                gradient = `linear-gradient(135deg, ${backgroundColor} 0%, ${primaryColor} 50%, ${secondaryColor} 100%)`;
              }
            } else {
              // Fallback for invalid colors
              gradient = `linear-gradient(135deg, ${backgroundColor} 0%, ${primaryColor} 50%, ${secondaryColor} 100%)`;
            }
            
            // Update both CSS and GSAP background
            pinnedSection.style.background = gradient;
            pinnedSection.style.backgroundImage = gradient;
            gsap.set(pinnedSection, { background: gradient });
          });
        };

        // Function to apply themes to all main wrappers (original + clones)
        const applyThemesToAllMainWrappers = () => {
          const mainWrappers = document.querySelectorAll('.main-wrapper');
          console.log(`🎨 Applying themes to ${mainWrappers.length} main wrapper(s) using ${finalThemeColors.length} available themes`);
          
          // Define the specific theme sequence: Pink → Black → Orange → Purple → Teal → repeat
          const themeSequence = [0, 2, 4, 1, 5, 0, 2, 4, 1, 5, 0, 2, 4, 1, 5]; // 0=pink, 2=black, 4=orange, 1=purple, 5=teal
          
          mainWrappers.forEach((wrapper, index) => {
            let themeIndex;
            
            // Handle backward scrolling logic
            if (index < 0) {
              // Backward scrolling: -1=teal, -2=purple, -3=orange, -4=black, -5=pink, then repeat
              const backwardIndex = Math.abs(index) % 5;
              const backwardSequence = [5, 1, 4, 2, 0]; // teal, purple, orange, black, pink
              themeIndex = backwardSequence[backwardIndex];
            } else {
              // Forward scrolling: normal sequence
              const sequenceIndex = index % themeSequence.length;
              themeIndex = themeSequence[sequenceIndex];
            }
            
            const themeForLogging = finalThemeColors[themeIndex % finalThemeColors.length];
            console.log(`🎨 Main wrapper ${index}: applying theme ${themeForLogging.id} (${themeForLogging.primaryColor}) - ${index < 0 ? 'BACKWARD' : 'FORWARD'} scrolling`);
            applyThemeToMainWrapper(wrapper, themeIndex);
          });
          
          // Update pinned section backgrounds after theme changes
          setTimeout(updatePinnedSectionBackgrounds, 50);
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
          // Also update pinned sections for new clones
          setTimeout(updatePinnedSectionBackgrounds, 150);
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
        console.log('Theme sequence: Pink → Black → Orange → Purple → Teal → repeat');
        console.log('🎨 Backward scrolling: -1=Teal, -2=Purple, -3=Orange, -4=Black, -5=Pink → repeat');
        console.log('🎨 Forward scrolling: 0=Pink, 1=Black, 2=Orange, 3=Purple, 4=Teal → repeat');
        
        // Expose function for manual theme reapplication (for testing)
        window.reapplyThemes = () => {
          console.log('🔄 Manually reapplying themes...');
          applyThemesToAllMainWrappers();
          updatePinnedSectionBackgrounds();
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
          console.log(`🎨 Theme pattern for ${count} wrappers (forward and backward sequences):`);
          console.log('📈 Forward: 0=Pink, 1=Black, 2=Orange, 3=Purple, 4=Teal → repeat');
          console.log('📉 Backward: -1=Teal, -2=Purple, -3=Orange, -4=Black, -5=Pink → repeat');
          
          const themeSequence = [0, 2, 4, 1, 5, 0, 2, 4, 1, 5, 0, 2, 4, 1, 5]; // 0=pink, 2=black, 4=orange, 1=purple, 5=teal
          const backwardSequence = [5, 1, 4, 2, 0]; // teal, purple, orange, black, pink
          const themeNames = ['Pink', 'Black', 'Orange', 'Purple', 'Teal'];
          
          for (let i = 0; i < count; i++) {
            let themeIndex;
            let themeName;
            
            if (i < 0) {
              // Backward scrolling
              const backwardIndex = Math.abs(i) % 5;
              themeIndex = backwardSequence[backwardIndex];
              themeName = themeNames[themeIndex];
            } else {
              // Forward scrolling
              const sequenceIndex = i % themeSequence.length;
              themeIndex = themeSequence[sequenceIndex];
              themeName = themeNames[themeIndex % 5];
            }
            
            const theme = finalThemeColors[themeIndex];
            console.log(`  Wrapper ${i}: Theme ${theme.id} (${theme.primaryColor}) - ${themeName} ${i < 0 ? '(BACKWARD)' : '(FORWARD)'}`);
          }
        };
        
        // Expose function to test the current theme sequence
        window.testThemeSequence = () => {
          console.log('🧪 Testing current theme sequence (forward and backward)...');
          const mainWrappers = document.querySelectorAll('.main-wrapper');
          const themeSequence = [0, 2, 4, 1, 5, 0, 2, 4, 1, 5, 0, 2, 4, 1, 5];
          const backwardSequence = [5, 1, 4, 2, 0]; // teal, purple, orange, black, pink
          const themeNames = ['Pink', 'Black', 'Orange', 'Purple', 'Teal'];
          
          mainWrappers.forEach((wrapper, index) => {
            let themeIndex;
            let themeName;
            
            if (index < 0) {
              // Backward scrolling
              const backwardIndex = Math.abs(index) % 5;
              themeIndex = backwardSequence[backwardIndex];
              themeName = themeNames[themeIndex];
            } else {
              // Forward scrolling
              const sequenceIndex = index % themeSequence.length;
              themeIndex = themeSequence[sequenceIndex];
              themeName = themeNames[themeIndex % 5];
            }
            
            const theme = finalThemeColors[themeIndex];
            const actualColor = getComputedStyle(wrapper).getPropertyValue('--primary-color').trim();
            
            console.log(`  Wrapper ${index}: Expected ${themeName} (${theme.primaryColor}), Actual: ${actualColor} - ${actualColor === theme.primaryColor ? '✅' : '❌'} ${index < 0 ? '(BACKWARD)' : '(FORWARD)'}`);
          });
        };
        
        // Expose function to test backward scrolling specifically
        window.testBackwardScrolling = () => {
          console.log('🔄 Testing backward scrolling sequence...');
          const backwardSequence = [5, 1, 4, 2, 0]; // teal, purple, orange, black, pink
          const themeNames = ['Teal', 'Purple', 'Orange', 'Black', 'Pink'];
          
          for (let i = -1; i >= -8; i--) {
            const backwardIndex = Math.abs(i) % 5;
            const themeIndex = backwardSequence[backwardIndex];
            const theme = finalThemeColors[themeIndex];
            const themeName = themeNames[backwardIndex];
            
            console.log(`  Wrapper ${i}: ${themeName} (${theme.primaryColor})`);
          }
        };
        
        // Apply theme colors to bg-title elements after theme changes
        const applyThemeToBgTitle = () => {
          document.querySelectorAll('.bg-title').forEach((bgTitle) => {
            const mainWrapper = bgTitle.closest('.main-wrapper');
            if (mainWrapper) {
              const computedStyle = getComputedStyle(mainWrapper);
              const primaryColor = computedStyle.getPropertyValue('--primary-color').trim();
              bgTitle.style.color = primaryColor;
            }
          });
          
          // Update Lottie colors for all main wrappers
          document.querySelectorAll('.main-wrapper').forEach((mainWrapper) => {
            if (mainWrapper._updateLottieColors) {
              mainWrapper._updateLottieColors();
            }
          });
        };
        
        // Apply theme colors to bg-title after theme application
        setTimeout(applyThemeToBgTitle, 100);
        
        console.log('💡 Use window.reapplyThemes() to manually reapply themes');
        console.log('💡 Use window.getThemeInfo() to see current theme assignments');
        console.log('💡 Use window.showThemePattern(20) to see theme pattern for 20 wrappers');
        console.log('💡 Use window.testThemeSequence() to test if current sequence is correct');
        console.log('💡 Use window.testBackwardScrolling() to test backward scrolling sequence');
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
              let href = item.href || "";
              const target = item.isExternal ? ' target="_blank"' : '';
              
              // Special handling for Contact link - convert to mailto if it's the contact item
              const isContact = (item.label || '').toLowerCase() === 'contact';
              if (isContact && !href.startsWith('mailto:')) {
                href = `mailto:${contactEmail}`;
              }
              
              const isMailto = href.startsWith('mailto:');
              const dataEmail = isMailto ? ` data-email="${href.replace('mailto:', '')}"` : '';
              const linkClass = isMailto ? 'small-link small-link-contact' : 'small-link';
              
              // Remove href attribute for recruitment, loyalty, and terms links
              const isRecruitment = (item.label || '').toLowerCase() === 'recruitment';
              const isLoyalty = (item.label || '').toLowerCase() === 'loyalty';
              const isTerms = (item.label || '').toLowerCase().includes('terms');
              const shouldRemoveHref = isRecruitment || isLoyalty || isTerms;
              
              const hrefAttr = shouldRemoveHref ? '' : `href="${href}"`;
              
              return `
                <a ${hrefAttr}${target} class="${linkClass}"${dataEmail}>
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

      // 6) Logo section background text with theme color
      try {
        const logoSectionBlock = findBlock(blocks, "block.logo-section");
        if (logoSectionBlock && logoSectionBlock.backgroundText) {
          // Update all bg-title elements (original and clones) with theme color
          document.querySelectorAll('.bg-title').forEach((bgTitle) => {
            bgTitle.textContent = logoSectionBlock.backgroundText;
            
            // Apply theme color to bg-title
            const mainWrapper = bgTitle.closest('.main-wrapper');
            if (mainWrapper) {
              const computedStyle = getComputedStyle(mainWrapper);
              const primaryColor = computedStyle.getPropertyValue('--primary-color').trim();
              
              // Update color with current theme primary color
              bgTitle.style.color = primaryColor;
              
              // Add scroll-based blur effect
              const updateBlurEffect = () => {
                const scrollY = window.scrollY;
                const maxBlur = 6;
                const minBlur = 1;
                const blurValue = Math.max(minBlur, Math.min(maxBlur, scrollY / 50));
                bgTitle.style.filter = `blur(${blurValue}px)`;
              };
              
              // Initial blur effect
              updateBlurEffect();
              
              // Add scroll listener for dynamic blur
              window.addEventListener('scroll', updateBlurEffect, { passive: true });
            }
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
                                 '';
          
          // Remove href attribute completely for recruitment links
          if (recruitmentHref && recruitmentHref.trim() !== '') {
            recruitmentAnchor.setAttribute('href', recruitmentHref);
          } else {
            recruitmentAnchor.removeAttribute('href');
          }
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
                // Use hardcoded "Reserveer" instead of fetching from Strapi
                bookButton.textContent = 'Reserveer';
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
              // Use hardcoded "Reserveer" instead of fetching from Strapi
              a.textContent = 'Reserveer';
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
          // Logo section background text with enhanced blur effects
          const logoSectionBlock = findBlock(blocks, "block.logo-section");
          if (logoSectionBlock && logoSectionBlock.backgroundText) {
            // Update all bg-title elements (original and clones) with enhanced blur effects
            document.querySelectorAll('.bg-title').forEach((bgTitle) => {
              bgTitle.textContent = logoSectionBlock.backgroundText;
              
              // Add dynamic blur effect based on theme colors
              const mainWrapper = bgTitle.closest('.main-wrapper');
              if (mainWrapper) {
                const computedStyle = getComputedStyle(mainWrapper);
                const primaryColor = computedStyle.getPropertyValue('--primary-color').trim();
                
                // Update color with current theme primary color
                bgTitle.style.color = primaryColor;
                
                // Add scroll-based blur effect
                const updateBlurEffect = () => {
                  const scrollY = window.scrollY;
                  const maxBlur = 6;
                  const minBlur = 1;
                  const blurValue = Math.max(minBlur, Math.min(maxBlur, scrollY / 50));
                  bgTitle.style.filter = `blur(${blurValue}px)`;
                };
                
                // Initial blur effect
                updateBlurEffect();
                
                // Add scroll listener for dynamic blur
                window.addEventListener('scroll', updateBlurEffect, { passive: true });
              }
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
                let href = item.href || "";
                const target = item.isExternal ? ' target="_blank"' : '';
                
                // Special handling for Contact link - convert to mailto if it's the contact item
                const isContact = (item.label || '').toLowerCase() === 'contact';
                if (isContact && !href.startsWith('mailto:')) {
                  href = `mailto:${contactEmail}`;
                }
                
                const isMailto = href.startsWith('mailto:');
                const dataEmail = isMailto ? ` data-email="${href.replace('mailto:', '')}"` : '';
                const linkClass = isMailto ? 'small-link small-link-contact' : 'small-link';
                
                // Remove href attribute for recruitment, loyalty, and terms links
                const isRecruitment = (item.label || '').toLowerCase() === 'recruitment';
                const isLoyalty = (item.label || '').toLowerCase() === 'loyalty';
                const isTerms = (item.label || '').toLowerCase().includes('terms');
                const shouldRemoveHref = isRecruitment || isLoyalty || isTerms;
                
                const hrefAttr = shouldRemoveHref ? '' : `href="${href}"`;
                
                return `
                  <a ${hrefAttr}${target} class="${linkClass}"${dataEmail}>
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
                // Use hardcoded "Reserveer" instead of fetching from Strapi
                bookButton.textContent = 'Reserveer';
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
        
        // Fix SVG ID conflicts to prevent reference issues
        clone.querySelectorAll('svg[id]').forEach((svg) => {
          const newId = 'svg-clone-' + i + '-' + Math.random().toString(36).substr(2, 9);
          svg.setAttribute('id', newId);
        });
        
        // Fix mobile menu toggle ID conflicts
        clone.querySelectorAll('.mobile-menu-toggle[id]').forEach((toggle) => {
          const newId = 'mobile-menu-toggle-clone-' + i + '-' + Math.random().toString(36).substr(2, 9);
          toggle.setAttribute('id', newId);
        });
        
        // Fix nav-hero ID conflicts
        clone.querySelectorAll('.nav-hero[id]').forEach((nav) => {
          const newId = 'nav-hero-clone-' + i + '-' + Math.random().toString(36).substr(2, 9);
          nav.setAttribute('id', newId);
        });
        
        fragment.appendChild(clone);
      }
      
      document.body.appendChild(fragment);
      prepareMarquees();
      window.dispatchEvent(new Event('clones-created'));
      
      // Initialize enhanced bg-title effects for new clones
      setTimeout(initializeEnhancedBgTitle, 50);
      
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

      // Use theme primary color for all SVG pieces
      const themePrimaryColor = getComputedStyle(brandSplashEl).getPropertyValue('--primary-color').trim();
      
      // Set all SVG pieces to use the theme's primary color
      pieces.forEach((piece) => {
        try { piece.style.fill = themePrimaryColor; } catch (_) {}
      });

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
        fill: themePrimaryColor,
      });

      function startPartyLights() {
        // Keep all SVG pieces using the theme's primary color
        const themePrimaryColor = getComputedStyle(brandSplashEl).getPropertyValue('--primary-color').trim();
        
        // Ensure all pieces maintain the theme color
        pieces.forEach((piece) => {
          try { piece.style.fill = themePrimaryColor; } catch (_) {}
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
            // Color animation will be handled by CSS or other animation logic
          }
        });
      }, 2500);

      initializedBrandSplash.add(brandSplashEl);
      
      // Color animation will be handled by CSS or other animation logic
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
      
      // Helper function to get theme-specific gradient
      function getThemeGradient() {
        const primaryColor = getComputedStyle(pinnedSection).getPropertyValue('--primary-color').trim() || '#F05A70';
        const secondaryColor = getComputedStyle(pinnedSection).getPropertyValue('--secondary-color').trim() || '#F7AACC';
        const backgroundColor = getComputedStyle(pinnedSection).getPropertyValue('--background-color').trim() || '#ffffff';
        
        // Convert hex to RGB for better color analysis
        const hexToRgb = (hex) => {
          const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
          return result ? {
            r: parseInt(result[1], 16),
            g: parseInt(result[2], 16),
            b: parseInt(result[3], 16)
          } : null;
        };
        
        const rgb = hexToRgb(primaryColor);
        
        if (rgb) {
          // Pink theme detection (high red, medium green, medium blue)
          if (rgb.r > 200 && rgb.g > 80 && rgb.g < 180 && rgb.b > 100 && rgb.b < 200) {
            return `linear-gradient(135deg, #FFE8F0 0%, ${primaryColor} 50%, ${secondaryColor} 100%)`;
          }
          // Orange theme detection (high red, medium green, low blue)
          else if (rgb.r > 200 && rgb.g > 100 && rgb.g < 200 && rgb.b < 100) {
            return `linear-gradient(135deg, #FFF8F0 0%, ${primaryColor} 50%, #FFB366 100%)`;
          }
          // Black theme detection (low values)
          else if (rgb.r < 50 && rgb.g < 50 && rgb.b < 50) {
            return `linear-gradient(135deg, #2a2a2a 0%, ${primaryColor} 50%, #4a4a4a 100%)`;
          }
          // Purple theme detection (medium red, low green, high blue) - including #736fa1
          else if ((rgb.r > 100 && rgb.r < 200 && rgb.g < 100 && rgb.b > 100) || 
                   (rgb.r === 115 && rgb.g === 111 && rgb.b === 161)) {
            return `linear-gradient(135deg, #F0E8FF 0%, ${primaryColor} 50%, ${secondaryColor} 100%)`;
          }
          // Red theme detection (high red, low green, low blue)
          else if (rgb.r > 200 && rgb.g < 100 && rgb.b < 100) {
            return `linear-gradient(135deg, #FFE8E8 0%, ${primaryColor} 50%, #FFB3B3 100%)`;
          }
          // Blue theme detection (low red, low green, high blue)
          else if (rgb.r < 100 && rgb.g < 100 && rgb.b > 150) {
            return `linear-gradient(135deg, #E8F0FF 0%, ${primaryColor} 50%, #B3D9FF 100%)`;
          }
          // Green theme detection (low red, high green, low blue)
          else if (rgb.r < 100 && rgb.g > 150 && rgb.b < 100) {
            return `linear-gradient(135deg, #E8FFE8 0%, ${primaryColor} 50%, #B3FFB3 100%)`;
          }
          // Default theme - use primary and secondary colors
          else {
            return `linear-gradient(135deg, ${backgroundColor} 0%, ${primaryColor} 50%, ${secondaryColor} 100%)`;
          }
        } else {
          // Fallback for invalid colors
          return `linear-gradient(135deg, ${backgroundColor} 0%, ${primaryColor} 50%, ${secondaryColor} 100%)`;
        }
      }
      
      // Ensure background is set immediately with dynamic theme colors
      gsap.set(pinnedSection, { 
        background: getThemeGradient() 
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
      // Set initial positions immediately to prevent cards from appearing at top first
      if (index === 0) {
        gsap.set(card, { 
          rotation: endRotations[0],
          top: "50%",
          opacity: 1
        });
      } else {
        gsap.set(card, { 
          rotation: startRotations[index],
          top: "115%",
          opacity: 1
        });
      }
      
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

    // Single scroll trigger for the entire pinned section with one-card-per-scroll animation
    ScrollTrigger.create({
      trigger: pinnedSection,
      start: "top top",
      end: `+=${pinnedHeight + scrollBuffer}`,
      pin: true,
      pinSpacing: true,
      anticipatePin: 1,
      // Add a small delay to prevent initial jumping
      onRefresh: () => {
        // Ensure cards are in correct initial positions after refresh
        cards.forEach((card, index) => {
          if (index === 0) {
            gsap.to(card, { 
              rotation: endRotations[0],
              top: "50%",
              opacity: 1,
              duration: 0.3,
              ease: "power2.out"
            });
          } else {
            gsap.to(card, { 
              rotation: startRotations[index],
              top: "115%",
              opacity: 1,
              duration: 0.3,
              ease: "power2.out"
            });
          }
        });
      },
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
        
        // Ensure background is maintained when leaving with dynamic theme colors
        gsap.set(pinnedSection, { 
          background: getThemeGradient() 
        });
      },
      onEnterBack: () => { 
        showProgressAndIndices(); 
        // Ensure background is visible when scrolling back with dynamic theme colors
        gsap.set(pinnedSection, { 
          background: getThemeGradient() 
        });
      },
      onUpdate: (self) => {
        const sectionProgress = self.progress * (cardCount + 1);
        
        // Ensure background is always visible during scrolling with dynamic theme colors
        gsap.set(pinnedSection, { 
          background: getThemeGradient() 
        });
        
        // Sticky header is always visible
        if (stickyHeader) {
          gsap.set(stickyHeader, { opacity: 1 });
        }
        
        // Handle initial state (before first card)
        if (sectionProgress <= 1) {
          if (isProgressBarVisible) hideProgressAndIndices();
          cards.forEach((card, index) => {
            if (index === 0) {
              gsap.set(card, { 
                top: "50%", 
                rotation: endRotations[0], 
                opacity: 1
              });
            } else {
              gsap.set(card, { 
                top: "115%", 
                rotation: startRotations[index], 
                opacity: 1
              });
            }
          });
          return;
        }
        
        // Show progress and indices when we start card animations
        if (!isProgressBarVisible) { 
          showProgressAndIndices(); 
        }
        
        const progress = sectionProgress - 1;
        
        // One-card-per-scroll logic: Each card gets exactly one scroll section
        const cardIndex = Math.floor(progress);
        const cardProgress = progress - cardIndex;
        
        // Update progress bar to show current card progress
        const progressHeight = (cardProgress * 100);
        const colorIndex = Math.min(cardIndex, cardCount - 1);
        
        // Update progress bar to show current card progress
        gsap.to(progressBar, { 
          height: `${progressHeight}%`, 
          backgroundColor: progressColors[colorIndex], 
          duration: 0.3, 
          ease: "power2.out" 
        });
        
        if (isProgressBarVisible) { 
          animateIndexOpacity(colorIndex); 
        }
        
        // Handle card animations with one-card-per-scroll approach
        cards.forEach((card, index) => {
          if (index === 0) {
            // First card always stays at center (already visible)
            gsap.set(card, { 
              top: "50%", 
              rotation: endRotations[0], 
              opacity: 1
            });
          } else if (index <= cardIndex) {
            // Cards that have completed their animation - keep them at center
            gsap.set(card, { 
              top: "50%", 
              rotation: endRotations[index], 
              opacity: 1
            });
          } else if (index === cardIndex + 1 && cardProgress > 0) {
            // Current card animates from bottom to center based on scroll progress
            const easedValue = gsap.utils.clamp(0, 1, cardProgress);
            
            const newTop = gsap.utils.interpolate(115, 50, easedValue);
            const newRotation = gsap.utils.interpolate(startRotations[index], endRotations[index], easedValue);
            
            // Animate only this card
            gsap.to(card, { 
              top: `${newTop}%`, 
              rotation: newRotation,
              opacity: 1,
              duration: 0.3,
              ease: "power2.out"
            });
          } else {
            // Cards waiting to animate - keep them at bottom
            gsap.set(card, { 
              top: "115%", 
              rotation: startRotations[index],
              opacity: 1
            });
          }
        });
        
        // Ensure all cards are in final position when section is complete
        if (self.progress >= 0.99) {
          cards.forEach((card, index) => {
            gsap.to(card, { 
              top: "50%", 
              rotation: endRotations[index],
              opacity: 1,
              duration: 0.3,
              ease: "power2.out"
            });
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
    overlay.className = "preloader-overlay";
    overlay.style.cssText = [
      "background:#e3f2fd",
      "opacity:1",
      "transition:opacity 0.6s ease",
    ].join(";");

    // Ticker frame
    const frame = document.createElement("div");
    frame.className = "preloader-frame";
    frame.style.cssText = [
      "background:transparent",
    ].join(";");

    // Current name
    const label = document.createElement("span");
    label.className = "preloader-label";
    label.style.cssText = [
      "color:#0d47a1",
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

  // ===== Scroll-Triggered Dynamic Lottie Reserveer Animation =====
  // COMMENTED OUT: Dynamic lottie functionality disabled
  // Global state to track which floating animation should be visible
  /*
  window.floatingLottieState = {
    activeWrapperIndex: -1,
    activeContainer: null
  };
  */
  
  /*
  function initScrollTriggeredLottieReserveer() {
    const mainWrappers = document.querySelectorAll('.main-wrapper');
    
    mainWrappers.forEach((mainWrapper, wrapperIndex) => {
      // Find the city-story__badge in this wrapper
      const badgeContainer = mainWrapper.querySelector('.city-story__badge');
      if (!badgeContainer) return;
      
      // Remove any existing content
      badgeContainer.innerHTML = '';
      
      // Get theme colors from the current wrapper
      const computedStyle = getComputedStyle(mainWrapper);
      const primaryColor = computedStyle.getPropertyValue('--primary-color').trim() || '#F05A70';
      const secondaryColor = computedStyle.getPropertyValue('--secondary-color').trim() || '#F7AACC';
      const textColor = computedStyle.getPropertyValue('--text-white').trim() || '#ffffff';
      
      // Create unique ID for this instance
      const uniqueId = `scroll-lottie-reserveer-${wrapperIndex}-${Date.now()}`;
      
      // Create the animated "Reserveer" SVG with wine glasses and music theme
      const reserveerSVG = `
        <a href="#ft-open" style="display: block; text-decoration: none; cursor: pointer;">
          <svg width="200" height="200" viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg" 
               style="cursor: pointer; transition: transform 0.2s ease;" class="scroll-reserveer-svg">
            <defs>
              <!-- Button gradient using theme colors -->
              <radialGradient id="buttonGrad-${uniqueId}" cx="50%" cy="30%">
                <stop offset="0%" style="stop-color:${primaryColor};stop-opacity:1" />
                <stop offset="100%" style="stop-color:${secondaryColor};stop-opacity:1" />
              </radialGradient>
              <!-- Glow effect with theme color -->
              <filter id="glow-${uniqueId}">
                <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
                <feMerge> 
                  <feMergeNode in="coloredBlur"/>
                  <feMergeNode in="SourceGraphic"/>
                </feMerge>
              </filter>
              <!-- Shadow effect -->
              <filter id="shadow-${uniqueId}">
                <feDropShadow dx="0" dy="3" stdDeviation="6" flood-color="rgba(0,0,0,0.3)"/>
              </filter>
            </defs>
            
            <!-- Main circular button with pulse animation -->
            <circle cx="100" cy="100" r="90" fill="url(#buttonGrad-${uniqueId})" stroke="${textColor}" stroke-width="2" 
                    class="main-button">
              <animate attributeName="r" values="90;95;90" dur="3s" repeatCount="indefinite" ease="easeInOut"/>
              <animate attributeName="opacity" values="0.9;1;0.9" dur="3s" repeatCount="indefinite" ease="easeInOut"/>
            </circle>
            
            <!-- Inner circle for depth -->
            <circle cx="100" cy="100" r="80" fill="none" stroke="${textColor}" stroke-width="1" opacity="0.3" class="inner-ring">
              <animateTransform attributeName="transform" type="rotate" values="0 100 100;360 100 100" 
                                dur="10s" repeatCount="indefinite"/>
            </circle>
            
            <!-- Wine glasses with animation -->
            <g transform="translate(60, 50)" class="wine-glasses">
              <!-- Left wine glass -->
              <path d="M 5 0 L 15 0 L 14 12.5 L 6 12.5 Z" fill="${textColor}" class="glass-left">
                <animate attributeName="opacity" values="0.8;1;0.8" dur="2s" repeatCount="indefinite"/>
              </path>
              <rect x="9" y="12.5" width="2" height="15" fill="${textColor}" class="stem-left"/>
              <ellipse cx="10" cy="29" rx="6" ry="1.5" fill="${textColor}" class="base-left"/>
              <!-- Wine in left glass using theme primary color -->
              <path d="M 6 7.5 L 14 7.5 L 13.25 12.5 L 6.75 12.5 Z" fill="${primaryColor}" class="wine-left">
                <animate attributeName="opacity" values="0.7;1;0.7" dur="2.5s" repeatCount="indefinite"/>
              </path>
            </g>
            
            <g transform="translate(120, 50)" class="wine-glasses">
              <!-- Right wine glass -->
              <path d="M 5 0 L 15 0 L 14 12.5 L 6 12.5 Z" fill="${textColor}" class="glass-right">
                <animate attributeName="opacity" values="0.8;1;0.8" dur="2s" repeatCount="indefinite" begin="0.5s"/>
              </path>
              <rect x="9" y="12.5" width="2" height="15" fill="${textColor}" class="stem-right"/>
              <ellipse cx="10" cy="29" rx="6" ry="1.5" fill="${textColor}" class="base-right"/>
              <!-- Wine in right glass using theme secondary color -->
              <path d="M 6 6 L 14 6 L 13.5 12.5 L 6.5 12.5 Z" fill="${secondaryColor}" class="wine-right">
                <animate attributeName="opacity" values="0.7;1;0.7" dur="2.5s" repeatCount="indefinite" begin="0.5s"/>
              </path>
            </g>
            
            <!-- Musical notes with animation -->
            <g transform="translate(40, 100)" class="music-notes">
              <circle cx="0" cy="10" r="4" fill="${textColor}" class="note-1">
                <animate attributeName="opacity" values="0.6;1;0.6" dur="1.5s" repeatCount="indefinite"/>
              </circle>
              <rect x="4" y="2.5" width="1.5" height="7.5" fill="${textColor}" class="stem-1"/>
              <path d="M 4 2.5 Q 7.5 0 11 2.5 L 11 7.5 Q 7.5 5 4 7.5" fill="none" stroke="${textColor}" stroke-width="1" class="flag-1">
                <animate attributeName="opacity" values="0.6;1;0.6" dur="1.5s" repeatCount="indefinite"/>
              </path>
            </g>
            
            <g transform="translate(150, 100)" class="music-notes">
              <circle cx="0" cy="7.5" r="3" fill="${textColor}" class="note-2">
                <animate attributeName="opacity" values="0.6;1;0.6" dur="1.5s" repeatCount="indefinite" begin="0.3s"/>
              </circle>
              <rect x="3" y="2.5" width="1" height="5" fill="${textColor}" class="stem-2"/>
              <circle cx="7.5" cy="5" r="2.5" fill="${textColor}" class="note-3">
                <animate attributeName="opacity" values="0.6;1;0.6" dur="1.5s" repeatCount="indefinite" begin="0.6s"/>
              </circle>
              <rect x="10" y="1" width="1" height="4" fill="${textColor}" class="stem-3"/>
            </g>
            
            <!-- Main text "RESERVEER" with sophisticated animation -->
            <text x="100" y="140" text-anchor="middle" fill="${textColor}" 
                  font-family="Arial, sans-serif" font-size="14" font-weight="bold" 
                  letter-spacing="1px" class="reserveer-text" filter="url(#shadow-${uniqueId})">
              <tspan x="100" dy="0">RESERVEER</tspan>
              <animate attributeName="opacity" values="0.8;1;0.8" dur="2s" repeatCount="indefinite" ease="easeInOut"/>
            </text>
            
            <!-- Decorative music staff lines -->
            <g opacity="0.2" class="staff-lines">
              <line x1="30" y1="165" x2="70" y2="165" stroke="${textColor}" stroke-width="0.5" class="staff-1">
                <animate attributeName="opacity" values="0.1;0.3;0.1" dur="3s" repeatCount="indefinite"/>
              </line>
              <line x1="30" y1="170" x2="70" y2="170" stroke="${textColor}" stroke-width="0.5" class="staff-2">
                <animate attributeName="opacity" values="0.1;0.3;0.1" dur="3s" repeatCount="indefinite" begin="0.5s"/>
              </line>
              <line x1="30" y1="175" x2="70" y2="175" stroke="${textColor}" stroke-width="0.5" class="staff-3">
                <animate attributeName="opacity" values="0.1;0.3;0.1" dur="3s" repeatCount="indefinite" begin="1s"/>
              </line>
              <line x1="130" y1="165" x2="170" y2="165" stroke="${textColor}" stroke-width="0.5" class="staff-4">
                <animate attributeName="opacity" values="0.1;0.3;0.1" dur="3s" repeatCount="indefinite" begin="1.5s"/>
              </line>
              <line x1="130" y1="170" x2="170" y2="170" stroke="${textColor}" stroke-width="0.5" class="staff-5">
                <animate attributeName="opacity" values="0.1;0.3;0.1" dur="3s" repeatCount="indefinite" begin="2s"/>
              </line>
              <line x1="130" y1="175" x2="170" y2="175" stroke="${textColor}" stroke-width="0.5" class="staff-6">
                <animate attributeName="opacity" values="0.1;0.3;0.1" dur="3s" repeatCount="indefinite" begin="2.5s"/>
              </line>
            </g>
            
            <!-- Corner accent dots -->
            <circle cx="100" cy="25" r="2" fill="${textColor}" opacity="0.6" class="corner-dot-1">
              <animate attributeName="opacity" values="0.3;0.8;0.3" dur="2s" repeatCount="indefinite"/>
            </circle>
            <circle cx="100" cy="175" r="2" fill="${textColor}" opacity="0.6" class="corner-dot-2">
              <animate attributeName="opacity" values="0.3;0.8;0.3" dur="2s" repeatCount="indefinite" begin="1s"/>
            </circle>
            
            <!-- Floating sparkles -->
            <circle cx="30" cy="30" r="1" fill="${textColor}" opacity="0.7" class="sparkle-1">
              <animate attributeName="opacity" values="0.3;1;0.3" dur="2s" repeatCount="indefinite"/>
              <animate attributeName="r" values="1;1.5;1" dur="2s" repeatCount="indefinite"/>
            </circle>
            <circle cx="170" cy="30" r="1.5" fill="${textColor}" opacity="0.7" class="sparkle-2">
              <animate attributeName="opacity" values="0.3;1;0.3" dur="2s" repeatCount="indefinite" begin="0.5s"/>
              <animate attributeName="r" values="1.5;2;1.5" dur="2s" repeatCount="indefinite" begin="0.5s"/>
            </circle>
            <circle cx="30" cy="170" r="1.2" fill="${textColor}" opacity="0.7" class="sparkle-3">
              <animate attributeName="opacity" values="0.3;1;0.3" dur="2s" repeatCount="indefinite" begin="1s"/>
              <animate attributeName="r" values="1.2;1.8;1.2" dur="2s" repeatCount="indefinite" begin="1s"/>
            </circle>
            <circle cx="170" cy="170" r="1" fill="${textColor}" opacity="0.7" class="sparkle-4">
              <animate attributeName="opacity" values="0.3;1;0.3" dur="2s" repeatCount="indefinite" begin="1.5s"/>
              <animate attributeName="r" values="1;1.6;1" dur="2s" repeatCount="indefinite" begin="1.5s"/>
            </circle>
          </svg>
        </a>
      `;
      
      badgeContainer.innerHTML = reserveerSVG;
      
      // Get the anchor tag and SVG for hover effects
      const anchor = badgeContainer.querySelector('a[href="#ft-open"]');
      const svg = badgeContainer.querySelector('.scroll-reserveer-svg');
      
      if (anchor && svg) {
        // Add hover effect to the anchor
        anchor.addEventListener('mouseenter', function() {
          svg.style.transform = 'scale(1.05)';
        });
        
        anchor.addEventListener('mouseleave', function() {
          svg.style.transform = 'scale(1)';
        });
      }
      
      // Create a floating container for dynamic movement
      const floatingContainer = document.createElement('div');
      floatingContainer.className = 'floating-lottie-container';
      floatingContainer.dataset.wrapperIndex = wrapperIndex;
      floatingContainer.style.cssText = `
        position: absolute;
        width: 200px;
        height: 200px;
        pointer-events: none;
        z-index: 100;
        opacity: 0;
        transition: opacity 0.3s ease;
      `;
      
      // Create anchor tag wrapper for the floating container
      const floatingAnchor = document.createElement('a');
      floatingAnchor.href = '#ft-open';
      floatingAnchor.style.cssText = `
        display: block;
        width: 100%;
        height: 100%;
        text-decoration: none;
        cursor: pointer;
        pointer-events: auto;
      `;
      
      // Clone the SVG for the floating container
      const floatingSVG = svg.cloneNode(true);
      floatingSVG.style.cssText = `
        width: 100%;
        height: 100%;
        cursor: pointer;
      `;
      
      floatingAnchor.appendChild(floatingSVG);
      floatingContainer.appendChild(floatingAnchor);
      mainWrapper.appendChild(floatingContainer);
      
      // Track animation state
      let isAnimationActive = false;
      let hasBeenVisible = false;
      
      // Function to hide all other floating containers
      function hideOtherFloatingContainers() {
        document.querySelectorAll('.floating-lottie-container').forEach(container => {
          if (container !== floatingContainer) {
            gsap.set(container, {
              opacity: 0,
              duration: 0.3,
              ease: "power2.out"
            });
          }
        });
      }
      
      // Function to show this floating container
      function showThisFloatingContainer() {
        window.floatingLottieState.activeWrapperIndex = wrapperIndex;
        window.floatingLottieState.activeContainer = floatingContainer;
        hideOtherFloatingContainers();
      }
      
      // Function to update Lottie colors when theme changes
      function updateLottieColors() {
        const computedStyle = getComputedStyle(mainWrapper);
        const primaryColor = computedStyle.getPropertyValue('--primary-color').trim() || '#F05A70';
        const secondaryColor = computedStyle.getPropertyValue('--secondary-color').trim() || '#F7AACC';
        const textColor = computedStyle.getPropertyValue('--text-white').trim() || '#ffffff';
        
        // Update all SVG elements in both the badge container and floating container
        const allSVGs = [
          badgeContainer.querySelector('.scroll-reserveer-svg'),
          floatingContainer.querySelector('.scroll-reserveer-svg')
        ].filter(Boolean);
        
        allSVGs.forEach(svg => {
          // Update gradient colors
          const gradient = svg.querySelector(`#buttonGrad-${uniqueId}`);
          if (gradient) {
            const stops = gradient.querySelectorAll('stop');
            if (stops[0]) stops[0].setAttribute('style', `stop-color:${primaryColor};stop-opacity:1`);
            if (stops[1]) stops[1].setAttribute('style', `stop-color:${secondaryColor};stop-opacity:1`);
          }
          
          // Update all text color elements
          const textElements = svg.querySelectorAll('[fill="#eee"], [stroke="#eee"]');
          textElements.forEach(el => {
            if (el.getAttribute('fill') === '#eee') el.setAttribute('fill', textColor);
            if (el.getAttribute('stroke') === '#eee') el.setAttribute('stroke', textColor);
          });
          
          // Update wine colors
          const wineLeft = svg.querySelector('.wine-left');
          if (wineLeft) wineLeft.setAttribute('fill', primaryColor);
          
          const wineRight = svg.querySelector('.wine-right');
          if (wineRight) wineRight.setAttribute('fill', secondaryColor);
          
          // Update text color
          const textElement = svg.querySelector('.reserveer-text');
          if (textElement) textElement.setAttribute('fill', textColor);
        });
      }
      
      // Store the update function on the wrapper for theme changes
      mainWrapper._updateLottieColors = updateLottieColors;
      
      // Create scroll trigger for the badge visibility
      ScrollTrigger.create({
        trigger: badgeContainer,
        start: "top 80%", // When badge is 80% visible
        end: "bottom 20%",
        onEnter: () => {
          hasBeenVisible = true;
          // Start subtle floating animation on the badge
          gsap.to(svg, {
            y: -10,
            duration: 2,
            ease: "power1.inOut",
            yoyo: true,
            repeat: -1
          });
        },
        onLeave: () => {
          // Stop floating animation when leaving
          gsap.killTweensOf(svg, "y");
          gsap.set(svg, { y: 0 });
        },
        onEnterBack: () => {
          // Resume floating animation when coming back
          gsap.to(svg, {
            y: -10,
            duration: 2,
            ease: "power1.inOut",
            yoyo: true,
            repeat: -1
          });
        },
        onLeaveBack: () => {
          // Stop floating animation when going back up
          gsap.killTweensOf(svg, "y");
          gsap.set(svg, { y: 0 });
        }
      });
      
      // Create scroll trigger for dynamic movement after badge has been seen
      ScrollTrigger.create({
        trigger: mainWrapper,
        start: "top top",
        end: "bottom bottom",
        scrub: 1,
        onUpdate: (self) => {
          // Only start dynamic movement after badge has been visible
          if (!hasBeenVisible) return;
          
          const progress = self.progress;
          
          // Get the initial badge position
          const cityStorySection = mainWrapper.querySelector('.city-story');
          if (!cityStorySection) return;
          
          const cityStoryTop = cityStorySection.offsetTop;
          const cityStoryHeight = cityStorySection.offsetHeight;
          const cityStoryWidth = cityStorySection.offsetWidth;
          const initialBadgeTop = cityStoryTop + (cityStoryHeight * 0.5) - 100;
          const initialBadgeLeft = Math.max(0, cityStoryWidth * 0.75 - 100);
          
          // Calculate movement ranges
          const wrapperHeight = mainWrapper.offsetHeight;
          const wrapperWidth = mainWrapper.offsetWidth;
          
          // Start from badge position and move throughout the wrapper
          const finalY = wrapperHeight - 200;
          const finalX = wrapperWidth - 200;
          
          // Check if scroll is complete (progress >= 0.95)
          if (progress >= 0.95) {
            // Scroll is complete - hide floating container and show static badge
            gsap.set(floatingContainer, {
              opacity: 0,
              duration: 0.3,
              ease: "power2.out"
            });
            
            // Clear active state
            if (window.floatingLottieState.activeWrapperIndex === wrapperIndex) {
              window.floatingLottieState.activeWrapperIndex = -1;
              window.floatingLottieState.activeContainer = null;
            }
            
            // Show the original badge when scroll is complete
            if (isAnimationActive) {
              isAnimationActive = false;
              gsap.to(svg, {
                opacity: 1,
                duration: 0.5,
                ease: "power2.out"
              });
            }
            return;
          }
          
          // Normal animation when scroll is not complete
          // Smooth movement from badge position to full wrapper
          const y = gsap.utils.interpolate(initialBadgeTop, finalY, progress);
          const x = gsap.utils.interpolate(initialBadgeLeft, finalX, progress);
          
          // Smooth rotation with easing
          const rotation = gsap.utils.interpolate(0, 360, progress);
          
          // Gentle scale effect
          const scale = gsap.utils.interpolate(1, 1.2, progress);
          
          // Opacity (always visible)
          const opacity = 1;
          
          // Add some floating movement
          const floatY = Math.sin(progress * Math.PI * 3) * 15;
          
          // Update floating container position
          gsap.set(floatingContainer, {
            top: y + floatY,
            left: x,
            rotation: rotation,
            scale: scale,
            opacity: opacity
          });
          
          // Hide the original badge when floating animation starts
          if (progress > 0.1 && !isAnimationActive) {
            isAnimationActive = true;
            showThisFloatingContainer(); // Show this container and hide others
            gsap.to(svg, {
              opacity: 0,
              duration: 0.5,
              ease: "power2.out"
            });
          }
          
          // Show the original badge when going back up
          if (progress < 0.1 && isAnimationActive) {
            isAnimationActive = false;
            // Hide this floating container when going back up
            gsap.set(floatingContainer, {
              opacity: 0,
              duration: 0.3,
              ease: "power2.out"
            });
            
            // Clear active state
            if (window.floatingLottieState.activeWrapperIndex === wrapperIndex) {
              window.floatingLottieState.activeWrapperIndex = -1;
              window.floatingLottieState.activeContainer = null;
            }
            
            gsap.to(svg, {
              opacity: 1,
              duration: 0.5,
              ease: "power2.out"
            });
          }
        }
      });
    });
  }
  */
  
  // COMMENTED OUT: Initialize scroll-triggered Lottie Reserveer animations
  // initScrollTriggeredLottieReserveer();
  
  /*
  // Function to ensure only one floating animation is visible
  function ensureSingleFloatingAnimation() {
    const floatingContainers = document.querySelectorAll('.floating-lottie-container');
    if (floatingContainers.length > 0) {
      // Hide all floating containers initially
      floatingContainers.forEach(container => {
        gsap.set(container, {
          opacity: 0,
          duration: 0.3,
          ease: "power2.out"
        });
      });
      
      // Reset global state
      window.floatingLottieState.activeWrapperIndex = -1;
      window.floatingLottieState.activeContainer = null;
    }
  }
  
  // Function to clean up floating animations
  function cleanupFloatingAnimations() {
    // Kill any existing GSAP animations on floating containers
    const floatingContainers = document.querySelectorAll('.floating-lottie-container');
    floatingContainers.forEach(container => {
      gsap.killTweensOf(container);
    });
    
    // Reset all floating containers to hidden state
    ensureSingleFloatingAnimation();
  }
  
  // Ensure single animation on page load
  ensureSingleFloatingAnimation();
  
  // Add scroll listener to manage floating animations
  window.addEventListener('scroll', () => {
    // Debounce scroll events
    clearTimeout(window.scrollTimeout);
    window.scrollTimeout = setTimeout(() => {
      const floatingContainers = document.querySelectorAll('.floating-lottie-container');
      if (floatingContainers.length > 1) {
        // Find the container that should be most visible based on scroll position
        const scrollY = window.scrollY;
        const windowHeight = window.innerHeight;
        
        let mostVisibleContainer = null;
        let maxVisibility = 0;
        
        floatingContainers.forEach(container => {
          const wrapper = container.closest('.main-wrapper');
          if (wrapper) {
            const rect = wrapper.getBoundingClientRect();
            const visibility = Math.max(0, Math.min(1, 
              (windowHeight - Math.abs(rect.top)) / windowHeight
            ));
            
            if (visibility > maxVisibility) {
              maxVisibility = visibility;
              mostVisibleContainer = container;
            }
          }
        });
        
        // Show only the most visible container
        floatingContainers.forEach(container => {
          if (container === mostVisibleContainer && maxVisibility > 0.3) {
            gsap.set(container, { opacity: 1 });
            const wrapperIndex = parseInt(container.dataset.wrapperIndex);
            window.floatingLottieState.activeWrapperIndex = wrapperIndex;
            window.floatingLottieState.activeContainer = container;
          } else {
            gsap.set(container, { opacity: 0 });
          }
        });
      }
    }, 100);
  });
  
  // Add resize listener to manage floating animations
  window.addEventListener('resize', () => {
    // Debounce resize events
    clearTimeout(window.resizeTimeout);
    window.resizeTimeout = setTimeout(() => {
      cleanupFloatingAnimations();
      ensureSingleFloatingAnimation();
    }, 200);
  });
  */
  
  // COMMENTED OUT: Re-initialize when clones are created
  /*
  window.addEventListener('clones-created', () => {
    setTimeout(() => {
      cleanupFloatingAnimations(); // Clean up first
      initScrollTriggeredLottieReserveer();
      ensureSingleFloatingAnimation();
    }, 100);
  });
  */

  // ===== Static Lottie Reserveer Animation with Dynamic Colors =====
  function initStaticLottieReserveer() {
    const mainWrappers = document.querySelectorAll('.main-wrapper');
    
    mainWrappers.forEach((mainWrapper, wrapperIndex) => {
      // Find the city-story__badge in this wrapper
      const badgeContainer = mainWrapper.querySelector('.city-story__badge');
      if (!badgeContainer) return;
      
      // Remove any existing content
      badgeContainer.innerHTML = '';
      
      // Get theme colors from the current wrapper
      const computedStyle = getComputedStyle(mainWrapper);
      const primaryColor = computedStyle.getPropertyValue('--primary-color').trim() || '#F05A70';
      const secondaryColor = computedStyle.getPropertyValue('--secondary-color').trim() || '#F7AACC';
      const textColor = computedStyle.getPropertyValue('--text-white').trim() || '#ffffff';
      
      // Create unique ID for this instance
      const uniqueId = `static-lottie-reserveer-${wrapperIndex}-${Date.now()}`;
      
      // Create the static "Reserveer" SVG with wine glasses and music theme
      const reserveerSVG = `
        <a href="#ft-open" style="display: block; text-decoration: none; cursor: pointer;">
          <svg width="320" height="320" viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg" 
               style="cursor: pointer; transition: transform 0.2s ease; max-width: 100%; height: auto;" class="static-reserveer-svg">
            <defs>
              <!-- Button gradient using theme colors -->
              <radialGradient id="buttonGrad-${uniqueId}" cx="50%" cy="30%">
                <stop offset="0%" style="stop-color:${primaryColor};stop-opacity:1" />
                <stop offset="100%" style="stop-color:${secondaryColor};stop-opacity:1" />
              </radialGradient>
              <!-- Glow effect with theme color -->
              <filter id="glow-${uniqueId}">
                <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
                <feMerge> 
                  <feMergeNode in="coloredBlur"/>
                  <feMergeNode in="SourceGraphic"/>
                </feMerge>
              </filter>
              <!-- Shadow effect -->
              <filter id="shadow-${uniqueId}">
                <feDropShadow dx="0" dy="3" stdDeviation="6" flood-color="rgba(0,0,0,0.3)"/>
              </filter>
            </defs>
            
            <!-- Main circular button with pulse animation -->
            <circle cx="100" cy="100" r="90" fill="url(#buttonGrad-${uniqueId})" stroke="${textColor}" stroke-width="2" 
                    class="main-button">
              <animate attributeName="r" values="90;95;90" dur="3s" repeatCount="indefinite" ease="easeInOut"/>
              <animate attributeName="opacity" values="0.9;1;0.9" dur="3s" repeatCount="indefinite" ease="easeInOut"/>
            </circle>
            
            <!-- Inner circle for depth -->
            <circle cx="100" cy="100" r="80" fill="none" stroke="${textColor}" stroke-width="1" opacity="0.3" class="inner-ring">
              <animateTransform attributeName="transform" type="rotate" values="0 100 100;360 100 100" 
                                dur="10s" repeatCount="indefinite"/>
            </circle>
            
            <!-- Wine glasses with animation -->
            <g transform="translate(60, 50)" class="wine-glasses">
              <!-- Left wine glass -->
              <path d="M 5 0 L 15 0 L 14 12.5 L 6 12.5 Z" fill="${textColor}" class="glass-left">
                <animate attributeName="opacity" values="0.8;1;0.8" dur="2s" repeatCount="indefinite"/>
              </path>
              <rect x="9" y="12.5" width="2" height="15" fill="${textColor}" class="stem-left"/>
              <ellipse cx="10" cy="29" rx="6" ry="1.5" fill="${textColor}" class="base-left"/>
              <!-- Wine in left glass using theme primary color -->
              <path d="M 6 7.5 L 14 7.5 L 13.25 12.5 L 6.75 12.5 Z" fill="${primaryColor}" class="wine-left">
                <animate attributeName="opacity" values="0.7;1;0.7" dur="2.5s" repeatCount="indefinite"/>
              </path>
            </g>
            
            <g transform="translate(120, 50)" class="wine-glasses">
              <!-- Right wine glass -->
              <path d="M 5 0 L 15 0 L 14 12.5 L 6 12.5 Z" fill="${textColor}" class="glass-right">
                <animate attributeName="opacity" values="0.8;1;0.8" dur="2s" repeatCount="indefinite" begin="0.5s"/>
              </path>
              <rect x="9" y="12.5" width="2" height="15" fill="${textColor}" class="stem-right"/>
              <ellipse cx="10" cy="29" rx="6" ry="1.5" fill="${textColor}" class="base-right"/>
              <!-- Wine in right glass using theme secondary color -->
              <path d="M 6 6 L 14 6 L 13.5 12.5 L 6.5 12.5 Z" fill="${secondaryColor}" class="wine-right">
                <animate attributeName="opacity" values="0.7;1;0.7" dur="2.5s" repeatCount="indefinite" begin="0.5s"/>
              </path>
            </g>
            
            <!-- Musical notes with animation -->
            <g transform="translate(40, 100)" class="music-notes">
              <circle cx="0" cy="10" r="4" fill="${textColor}" class="note-1">
                <animate attributeName="opacity" values="0.6;1;0.6" dur="1.5s" repeatCount="indefinite"/>
              </circle>
              <rect x="4" y="2.5" width="1.5" height="7.5" fill="${textColor}" class="stem-1"/>
              <path d="M 4 2.5 Q 7.5 0 11 2.5 L 11 7.5 Q 7.5 5 4 7.5" fill="none" stroke="${textColor}" stroke-width="1" class="flag-1">
                <animate attributeName="opacity" values="0.6;1;0.6" dur="1.5s" repeatCount="indefinite"/>
              </path>
            </g>
            
            <g transform="translate(150, 100)" class="music-notes">
              <circle cx="0" cy="7.5" r="3" fill="${textColor}" class="note-2">
                <animate attributeName="opacity" values="0.6;1;0.6" dur="1.5s" repeatCount="indefinite" begin="0.3s"/>
              </circle>
              <rect x="3" y="2.5" width="1" height="5" fill="${textColor}" class="stem-2"/>
              <circle cx="7.5" cy="5" r="2.5" fill="${textColor}" class="note-3">
                <animate attributeName="opacity" values="0.6;1;0.6" dur="1.5s" repeatCount="indefinite" begin="0.6s"/>
              </circle>
              <rect x="10" y="1" width="1" height="4" fill="${textColor}" class="stem-3"/>
            </g>
            
            <!-- Main text "RESERVEER" with sophisticated animation -->
            <text x="100" y="140" text-anchor="middle" fill="${textColor}" 
                  font-family="Arial, sans-serif" font-size="14" font-weight="bold" 
                  letter-spacing="1px" class="reserveer-text" filter="url(#shadow-${uniqueId})">
              <tspan x="100" dy="0">RESERVEER</tspan>
              <animate attributeName="opacity" values="0.8;1;0.8" dur="2s" repeatCount="indefinite" ease="easeInOut"/>
            </text>
            
            <!-- Decorative music staff lines -->
            <g opacity="0.2" class="staff-lines">
              <line x1="30" y1="165" x2="70" y2="165" stroke="${textColor}" stroke-width="0.5" class="staff-1">
                <animate attributeName="opacity" values="0.1;0.3;0.1" dur="3s" repeatCount="indefinite"/>
              </line>
              <line x1="30" y1="170" x2="70" y2="170" stroke="${textColor}" stroke-width="0.5" class="staff-2">
                <animate attributeName="opacity" values="0.1;0.3;0.1" dur="3s" repeatCount="indefinite" begin="0.5s"/>
              </line>
              <line x1="30" y1="175" x2="70" y2="175" stroke="${textColor}" stroke-width="0.5" class="staff-3">
                <animate attributeName="opacity" values="0.1;0.3;0.1" dur="3s" repeatCount="indefinite" begin="1s"/>
              </line>
              <line x1="130" y1="165" x2="170" y2="165" stroke="${textColor}" stroke-width="0.5" class="staff-4">
                <animate attributeName="opacity" values="0.1;0.3;0.1" dur="3s" repeatCount="indefinite" begin="1.5s"/>
              </line>
              <line x1="130" y1="170" x2="170" y2="170" stroke="${textColor}" stroke-width="0.5" class="staff-5">
                <animate attributeName="opacity" values="0.1;0.3;0.1" dur="3s" repeatCount="indefinite" begin="2s"/>
              </line>
              <line x1="130" y1="175" x2="170" y2="175" stroke="${textColor}" stroke-width="0.5" class="staff-6">
                <animate attributeName="opacity" values="0.1;0.3;0.1" dur="3s" repeatCount="indefinite" begin="2.5s"/>
              </line>
            </g>
            
            <!-- Corner accent dots -->
            <circle cx="100" cy="25" r="2" fill="${textColor}" opacity="0.6" class="corner-dot-1">
              <animate attributeName="opacity" values="0.3;0.8;0.3" dur="2s" repeatCount="indefinite"/>
            </circle>
            <circle cx="100" cy="175" r="2" fill="${textColor}" opacity="0.6" class="corner-dot-2">
              <animate attributeName="opacity" values="0.3;0.8;0.3" dur="2s" repeatCount="indefinite" begin="1s"/>
            </circle>
            
            <!-- Floating sparkles -->
            <circle cx="30" cy="30" r="1" fill="${textColor}" opacity="0.7" class="sparkle-1">
              <animate attributeName="opacity" values="0.3;1;0.3" dur="2s" repeatCount="indefinite"/>
              <animate attributeName="r" values="1;1.5;1" dur="2s" repeatCount="indefinite"/>
            </circle>
            <circle cx="170" cy="30" r="1.5" fill="${textColor}" opacity="0.7" class="sparkle-2">
              <animate attributeName="opacity" values="0.3;1;0.3" dur="2s" repeatCount="indefinite" begin="0.5s"/>
              <animate attributeName="r" values="1.5;2;1.5" dur="2s" repeatCount="indefinite" begin="0.5s"/>
            </circle>
            <circle cx="30" cy="170" r="1.2" fill="${textColor}" opacity="0.7" class="sparkle-3">
              <animate attributeName="opacity" values="0.3;1;0.3" dur="2s" repeatCount="indefinite" begin="1s"/>
              <animate attributeName="r" values="1.2;1.8;1.2" dur="2s" repeatCount="indefinite" begin="1s"/>
            </circle>
            <circle cx="170" cy="170" r="1" fill="${textColor}" opacity="0.7" class="sparkle-4">
              <animate attributeName="opacity" values="0.3;1;0.3" dur="2s" repeatCount="indefinite" begin="1.5s"/>
              <animate attributeName="r" values="1;1.6;1" dur="2s" repeatCount="indefinite" begin="1.5s"/>
            </circle>
          </svg>
        </a>
      `;
      
      badgeContainer.innerHTML = reserveerSVG;
      
      // Get the anchor tag and SVG for hover effects
      const anchor = badgeContainer.querySelector('a[href="#ft-open"]');
      const svg = badgeContainer.querySelector('.static-reserveer-svg');
      
      if (anchor && svg) {
        // Add hover effect to the anchor
        anchor.addEventListener('mouseenter', function() {
          svg.style.transform = 'scale(1.05)';
        });
        
        anchor.addEventListener('mouseleave', function() {
          svg.style.transform = 'scale(1)';
        });
      }
      
      // Function to update colors when theme changes
      function updateStaticLottieColors() {
        const computedStyle = getComputedStyle(mainWrapper);
        const primaryColor = computedStyle.getPropertyValue('--primary-color').trim() || '#F05A70';
        const secondaryColor = computedStyle.getPropertyValue('--secondary-color').trim() || '#F7AACC';
        const textColor = computedStyle.getPropertyValue('--text-white').trim() || '#ffffff';
        
        const svg = badgeContainer.querySelector('.static-reserveer-svg');
        if (!svg) return;
        
        // Update gradient colors
        const gradient = svg.querySelector(`#buttonGrad-${uniqueId}`);
        if (gradient) {
          const stops = gradient.querySelectorAll('stop');
          if (stops[0]) stops[0].setAttribute('style', `stop-color:${primaryColor};stop-opacity:1`);
          if (stops[1]) stops[1].setAttribute('style', `stop-color:${secondaryColor};stop-opacity:1`);
        }
        
        // Update all text color elements
        const textElements = svg.querySelectorAll('[fill="#eee"], [stroke="#eee"]');
        textElements.forEach(el => {
          if (el.getAttribute('fill') === '#eee') el.setAttribute('fill', textColor);
          if (el.getAttribute('stroke') === '#eee') el.setAttribute('stroke', textColor);
        });
        
        // Update wine colors
        const wineLeft = svg.querySelector('.wine-left');
        if (wineLeft) wineLeft.setAttribute('fill', primaryColor);
        
        const wineRight = svg.querySelector('.wine-right');
        if (wineRight) wineRight.setAttribute('fill', secondaryColor);
        
        // Update text color
        const textElement = svg.querySelector('.reserveer-text');
        if (textElement) textElement.setAttribute('fill', textColor);
      }
      
      // Store the update function on the wrapper for theme changes
      mainWrapper._updateLottieColors = updateStaticLottieColors;
      
      // Add subtle floating animation
      ScrollTrigger.create({
        trigger: badgeContainer,
        start: "top 80%",
        end: "bottom 20%",
        onEnter: () => {
          gsap.to(svg, {
            y: -10,
            duration: 2,
            ease: "power1.inOut",
            yoyo: true,
            repeat: -1
          });
        },
        onLeave: () => {
          gsap.killTweensOf(svg, "y");
          gsap.set(svg, { y: 0 });
        },
        onEnterBack: () => {
          gsap.to(svg, {
            y: -10,
            duration: 2,
            ease: "power1.inOut",
            yoyo: true,
            repeat: -1
          });
        },
        onLeaveBack: () => {
          gsap.killTweensOf(svg, "y");
          gsap.set(svg, { y: 0 });
        }
      });
    });
  }
  
  // Initialize static Lottie Reserveer animations
  initStaticLottieReserveer();
  
  // Re-initialize when clones are created
  window.addEventListener('clones-created', () => {
    setTimeout(() => {
      initStaticLottieReserveer();
    }, 100);
  });

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
