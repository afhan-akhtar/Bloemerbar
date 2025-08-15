# Bloemerbar Theme System Documentation

## Overview

The Bloemerbar website now features a comprehensive theme system inspired by [Tripletta Pizza](https://www.triplettapizza.com/) that uses 5 different warm, family-friendly color themes across various sections. The themes are applied using CSS custom properties (variables) and can be dynamically switched. Each theme features warm backgrounds, vibrant gradients, and engaging hover effects that create an inviting, restaurant-like atmosphere.

## Theme Colors

### Theme 1 (ID: 87) - Warm Pink/Red Theme
- **Primary Color**: `#F05A70` (Coral Red)
- **Secondary Color**: `#F7AACC` (Light Pink)
- **Complementary Color**: `#425F93` (Blue)
- **Background**: `#FFF8F0` (Warm Cream)
- **Hover Color**: `#D94A60` (Darker Red)
- **Accent Color**: `#FFE8D6` (Light Peach)
- **Text Colors**: `#000000` (Black) / `#ffffff` (White)

### Theme 2 (ID: 88) - Elegant Purple/Pink Theme
- **Primary Color**: `#D28FB9` (Purple)
- **Secondary Color**: `#425F93` (Blue)
- **Complementary Color**: `#BDA153` (Gold)
- **Background**: `#F0F4FF` (Lavender)
- **Hover Color**: `#B87FA9` (Darker Purple)
- **Accent Color**: `#E8F0FF` (Light Blue)
- **Text Colors**: `#000000` (Black) / `#ffffff` (White)

### Theme 3 (ID: 89) - Bold Black/Pink Theme
- **Primary Color**: `#131313` (Dark Gray/Black)
- **Secondary Color**: `#F6A9CB` (Pink)
- **Complementary Color**: `#425F93` (Blue)
- **Background**: `#F8F8F8` (Light Gray)
- **Hover Color**: `#2A2A2A` (Darker Gray)
- **Accent Color**: `#FFE5F0` (Light Pink)
- **Text Colors**: `#000000` (Black) / `#ffffff` (White)

### Theme 4 (ID: 90) - Vibrant Red/Pink Theme
- **Primary Color**: `#F05970` (Red)
- **Secondary Color**: `#F6A9CB` (Pink)
- **Complementary Color**: `#425F93` (Blue)
- **Background**: `#FFF0F0` (Soft Pink)
- **Hover Color**: `#D94960` (Darker Red)
- **Accent Color**: `#FFE5F0` (Light Pink)
- **Text Colors**: `#000000` (Black) / `#ffffff` (White)

### Theme 5 (ID: 91) - Warm Orange/Pink Theme
- **Primary Color**: `#F15E36` (Orange)
- **Secondary Color**: `#F6A9CB` (Pink)
- **Complementary Color**: `#10B49F` (Teal)
- **Background**: `#FFF5E6` (Peach)
- **Hover Color**: `#D94E26` (Darker Orange)
- **Accent Color**: `#FFE8D6` (Light Peach)
- **Text Colors**: `#000000` (Black) / `#ffffff` (White)

## Implementation

### CSS Variables

The theme system uses the following CSS custom properties:

```css
:root {
  --primary-color: #F05A70;
  --secondary-color: #F7AACC;
  --background-color: #FFF8F0;
  --text-black: #000000;
  --text-white: #ffffff;
  --complementary-color: #425F93;
  --hover-color: #D94A60;
  --accent-color: #FFE8D6;
}
```

### Section-Specific Themes

Different sections of the website use different themes:

1. **Top Marquee**: Theme 1 (Pink/Red)
2. **Brand Splash**: Theme 2 (Purple/Pink)
3. **Quad CTA**: Theme 3 (Black/Pink)
4. **City Story**: Theme 4 (Red/Pink)
5. **About Vision**: Theme 5 (Orange/Pink)
6. **Pinned Section**: Theme 1 (cycles back)

### JavaScript Implementation

The theme system is implemented in `script.js` with the following key functions:

#### `applyThemeToSection(sectionSelector, themeIndex)`
Applies a specific theme to a section by setting CSS variables on the section element.

#### `switchTheme(themeIndex)`
Global function to switch the entire website to a specific theme. Can be called from the browser console:
```javascript
switchTheme(0); // Switch to Theme 1
switchTheme(1); // Switch to Theme 2
// etc.
```

## Usage

### In CSS
Use the CSS variables in your stylesheets:

```css
.my-element {
  background: var(--primary-color);
  color: var(--text-white);
  border: 2px solid var(--secondary-color);
}

.my-element:hover {
  background: var(--complementary-color);
}
```

### In JavaScript
Switch themes programmatically:

```javascript
// Switch to a specific theme
switchTheme(2); // Theme 3

// Get current theme colors
const root = document.documentElement;
const primaryColor = getComputedStyle(root).getPropertyValue('--primary-color');
```

### Theme Demo
Open `theme-demo.html` to see all themes in action with a live theme switcher.

## File Structure

- `index.html` - Main website with theme integration
- `styles.css` - CSS with theme variables and enhanced styling
- `script.js` - JavaScript with theme system implementation
- `theme-demo.html` - Demo page showing all themes
- `THEME_DOCUMENTATION.md` - This documentation

## Integration with Strapi

The theme system is designed to work with Strapi CMS. The colors are defined in the `sett` API endpoint under the `colors` field. The current implementation uses hardcoded themes, but you can modify the JavaScript to fetch themes from your Strapi API:

```javascript
// Replace the hardcoded themeColors array with API call
const settResponse = await fetch(`${STRAPI_BASE}/api/sett`);
const settData = await settResponse.json();
const themeColors = settData.data.colors || [];
```

## Browser Support

The theme system uses CSS custom properties, which are supported in:
- Chrome 49+
- Firefox 31+
- Safari 9.1+
- Edge 15+

For older browsers, consider using a CSS custom properties polyfill.

## Accessibility

The theme system maintains good contrast ratios and follows accessibility guidelines:
- All text colors provide sufficient contrast against their backgrounds
- Interactive elements have hover states
- Color is not the only way information is conveyed

## Future Enhancements

Potential improvements to the theme system:
1. **Dark Mode Support**: Add dark variants of each theme
2. **Seasonal Themes**: Automatically switch themes based on seasons
3. **User Preferences**: Allow users to save their preferred theme
4. **Animation**: Smooth transitions between themes
5. **Custom Themes**: Allow users to create custom color combinations
