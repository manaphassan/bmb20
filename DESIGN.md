---
name: Nemesis Blue LCARS
colors:
  surface: '#131319'
  surface-dim: '#131319'
  surface-bright: '#39383f'
  surface-container-lowest: '#0e0e14'
  surface-container-low: '#1b1b21'
  surface-container: '#1f1f25'
  surface-container-high: '#2a2930'
  surface-container-highest: '#35343b'
  on-surface: '#e4e1ea'
  on-surface-variant: '#c7c5d4'
  inverse-surface: '#e4e1ea'
  inverse-on-surface: '#303036'
  outline: '#918f9d'
  outline-variant: '#464552'
  surface-tint: '#c2c1ff'
  primary: '#c2c1ff'
  on-primary: '#231f83'
  primary-container: '#9999ff'
  on-primary-container: '#2d2b8c'
  inverse-primary: '#5353b3'
  secondary: '#adc6ff'
  on-secondary: '#002e69'
  secondary-container: '#1e4585'
  on-secondary-container: '#93b5fc'
  tertiary: '#e1c639'
  on-tertiary: '#393000'
  tertiary-container: '#bca30e'
  on-tertiary-container: '#443900'
  error: '#ffb4ab'
  on-error: '#690005'
  error-container: '#93000a'
  on-error-container: '#ffdad6'
  primary-fixed: '#e2dfff'
  primary-fixed-dim: '#c2c1ff'
  on-primary-fixed: '#0b006b'
  on-primary-fixed-variant: '#3b3a9a'
  secondary-fixed: '#d8e2ff'
  secondary-fixed-dim: '#adc6ff'
  on-secondary-fixed: '#001a41'
  on-secondary-fixed-variant: '#1e4585'
  tertiary-fixed: '#ffe253'
  tertiary-fixed-dim: '#e1c639'
  on-tertiary-fixed: '#211b00'
  on-tertiary-fixed-variant: '#524600'
  background: '#131319'
  on-background: '#e4e1ea'
  surface-variant: '#35343b'
typography:
  display-lg:
    fontFamily: Anton
    fontSize: 48px
    fontWeight: '400'
    lineHeight: '1.1'
    letterSpacing: 0.05em
  headline-md:
    fontFamily: Anton
    fontSize: 32px
    fontWeight: '400'
    lineHeight: '1.2'
  headline-sm:
    fontFamily: Anton
    fontSize: 24px
    fontWeight: '400'
    lineHeight: '1.2'
  body-md:
    fontFamily: JetBrains Mono
    fontSize: 16px
    fontWeight: '400'
    lineHeight: '1.5'
  body-sm:
    fontFamily: JetBrains Mono
    fontSize: 14px
    fontWeight: '400'
    lineHeight: '1.4'
  label-caps:
    fontFamily: Space Mono
    fontSize: 12px
    fontWeight: '700'
    lineHeight: '1'
    letterSpacing: 0.1em
  data-mono:
    fontFamily: JetBrains Mono
    fontSize: 13px
    fontWeight: '500'
    lineHeight: '1.2'
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  unit: 4px
  gutter: 8px
  margin-main: 24px
  hop-radius: 24px
  border-thin: 1px
---

## Brand & Style
This design system captures a high-fidelity, retro-futuristic terminal aesthetic inspired by late-era starship interfaces. It prioritizes high information density, technical precision, and a cinematic "command center" atmosphere.

The style is a fusion of **Modern-Brutalism** and **Tactile-Futurism**. It utilizes the iconic "L-frame" or "hop" layouts to categorize data streams, accented by subtle scanline overlays and data cascades. The emotional response is one of authority, advanced capability, and focused mission-critical operation. The interface should feel like a specialized hardware terminal rather than a generic web application.

## Colors
The palette is rooted in a "Deep Space" tonal range. The background utilizes a near-black navy to maximize the perceived glow of interactive elements.

- **Primary & Secondary:** These are "Nemesis Blue" variants. Use the Primary (#9999FF) for active states, key headers, and critical paths. Use Secondary (#6688CC) for structural frames and persistent UI chrome.
- **Functional Colors:** Use the status palette strictly for data integrity. Success, Warning, and Error colors should have a slight "outer glow" or "bloom" effect in high-fidelity renders to simulate CRT phosphors.
- **Accents:** High-contrast white (#FFFFFF) is reserved for small technical readouts within larger color-coded blocks to ensure legibility.

## Typography
Typography is a critical structural element. Large headers use **Anton** for impact and the "LCARS" aesthetic, while all functional data uses **JetBrains Mono** or **Space Mono** (substituted for Share Tech Mono for enhanced terminal readability).

- **Headings:** Must always be uppercase. They act as "caps" for the layout blocks.
- **Technical Data:** Use monospaced fonts for all numerical values, status logs, and ID tags to ensure vertical alignment in data tables.
- **Mobile scaling:** For small screens, `display-lg` should scale down to 32px and `headline-md` to 24px to maintain the rigid "block" appearance without breaking the layout.

## Layout & Spacing
The layout follows a **Fixed-Modular Grid**. It is defined by the "LCARS L-Frame" (the "hop").

- **The Hop:** A distinctive architectural element consisting of a vertical sidebar that "hops" into a horizontal top bar. This corner must use the `hop-radius` on the inner and outer turns.
- **Information Blocks:** Content is divided into rectangular "pills" or blocks separated by a consistent 8px gutter. 
- **Reflow:** On desktop, use a multi-column layout (12 cols). On mobile, the L-frame collapses into a "U-frame" header and footer, stacking the modular blocks vertically.
- **Scanlines:** A global overlay of 1px horizontal lines at 50% opacity should be applied to the entire viewport to reinforce the CRT aesthetic.

## Elevation & Depth
Depth is achieved through **Glow and Contrast** rather than traditional shadows.

- **Surface Layers:** The background is the lowest level. Content sits on "Surface" (#000033) blocks.
- **Luminance:** Higher priority items do not rise in Z-space; they increase in brightness. An "active" button should have a `#9999FF` background with a subtle outer bloom (blur: 8px, spread: 0).
- **Glassmorphism:** Use selective backdrop blurs (10px) only on temporary modal overlays to maintain the "solid state" feel of the primary interface.
- **Interaction:** On hover, elements should flicker briefly or shift to a higher luminosity state.

## Shapes
Shapes are defined by the "Elbow" and the "Pill".

- **Structural Elbows:** The primary layout frames use large, sweeping curves (1.5rem / 24px) on one side and sharp 90-degree angles on the other.
- **Interactive Elements:** Buttons and input fields use the **Pill** shape (rounded-full) or the "Stump" (rounded only on the left or right side) to indicate directionality within a sequence.
- **Dividers:** Use 1px or 2px solid lines. Never use dashed lines.

## Components
- **The LCARS Button:** Rectangular or pill-shaped blocks of solid color. Text is always right-aligned for buttons on the left sidebar and left-aligned for buttons on the right. Use the `label-caps` style.
- **Data Readouts:** Small, high-density clusters of monospaced text. Key-value pairs should be separated by a thin secondary-color vertical line.
- **Status Indicators:** Small square "pips" that toggle between the neutral navy and the status colors (Success/Warning/Error).
- **Input Fields:** Minimalist. A thin 1px bottom border in `secondary_color_hex`. When focused, the border glows and a small "caret" block appears.
- **Cards/Panels:** These are not floating; they are integrated into the L-frame. Use a "Header Stump" (a colored block at the top left) to title each panel.
- **Data Cascades:** A decorative component for empty states or loading, featuring scrolling columns of random hex code in the `secondary_color` at 30% opacity.