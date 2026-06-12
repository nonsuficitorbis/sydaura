# Sydaura Project Memory

This file serves as the core context and persistent memory for the Sydaura project. AI agents working on this codebase should read and adhere to these guidelines to maintain architectural and design consistency.

## 1. Tech Stack
- **Framework**: React 18+
- **Build Tool**: Vite (configured to run on port `8080`)
- **Language**: TypeScript (`.tsx` / `.ts`)
- **Styling**: Vanilla CSS with custom CSS variables (No TailwindCSS unless explicitly requested and configured later).

## 2. Design System & Aesthetics

The project prioritizes a highly premium, modern aesthetic avoiding standard neon/purple combinations. We implement a strict Light/Dark mode toggle.

### Color Palettes
**Light Mode (Modern Minimalist)**
- Primary: Slate Blue (`#4A6B82`)
- Accent: Subtle Gold/Mustard (`#D4AF37`)
- Background: Crisp Ivory (`#FFFFF0`)
- Text: Deep Navy/Black (`#1A1A1A`)

**Dark Mode (Dark Mode Luxury)**
- Primary: Deep Emerald Green (`#097969`)
- Accent: Soft Silver/Grey (`#C0C0C0`)
- Background: Onyx Black (`#0F0F0F` / `#121212`)
- Text: Off-white (`#EAEAEA`)

*Implementation Note: Colors are defined as CSS variables in `index.css`. The dark theme is activated via the `[data-theme='dark']` attribute on the `<html>` root element.*

### Typography
- **Primary Font**: `Outfit` (imported via Google Fonts).
- Fallbacks: `-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif`.

## 3. UI/UX Rules & Components

### Glassmorphism
Elements that act as containers, cards, or floating navigations should utilize the `glass-panel` class to achieve a glassmorphic effect:
```css
.glass-panel {
  background: var(--glass-bg); /* Semi-transparent background */
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  border: 1px solid var(--glass-border);
  box-shadow: var(--shadow-md);
  border-radius: 16px;
}
```

### Micro-Animations
Interfaces must feel dynamic and responsive to user interaction.
- Use `.hover-lift` for interactive elements (cards, buttons). It applies a slight negative translateY and increases the box-shadow.
- Use `.animate-fade-in` for elements entering the viewport.
- Transitions should universally use `var(--transition-speed)` which defaults to `0.3s ease`.

### Gradients
- Text gradients can be applied using the `.text-gradient` utility class, which blends the primary and accent colors.

## 4. Development Workflow
- Always start the dev server via `npm run dev`.
- Ensure new components adhere to the existing CSS variable system (`var(--color-bg)`, `var(--color-text)`, etc.) rather than hardcoding hex values.
- Maintain responsive design principles (mobile-first or ensuring graceful degradation on smaller screens).
