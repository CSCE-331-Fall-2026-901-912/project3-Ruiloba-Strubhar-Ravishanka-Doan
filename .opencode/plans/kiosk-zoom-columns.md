# Plan: Reduce kiosk drink-grid columns when text is zoomed

## Problem
On the customer kiosk page, drink cards are laid out in a fixed 3-column grid (`.pg-drinks { grid-template-columns: repeat(3, ...) }`). When the user increases text size via the FontSizeControl (CSS `zoom`), the drink names wrap every 2–3 letters. We want the grid to use fewer columns as text size increases, ending at 1 column at max zoom so a single name fits per card.

## Scope
Only `src/` (CSS + JSX). No other files.

## Changes

### 1. `src/App.jsx`
Pass `fontScale` down to the rendered page:
```jsx
<Page
  isHighContrast={isHighContrast}
  setIsHighContrast={setIsHighContrast}
  fontScale={fontScale}
/>
```

### 2. `src/pages/CustomerKioskPage.jsx`
- Accept `fontScale` prop (default 1).
- Pass it to `<KioskDrinkMenu ... fontScale={fontScale} />`.

### 3. `src/components/KioskDrinkMenu.jsx`
- Accept `fontScale` prop (default 1).
- Compute columns:
  - `fontScale >= 1.3` → `1fr` (1 column)
  - `fontScale >= 1.1` → `repeat(2, minmax(0, 1fr))`
  - else → leave undefined (CSS default 3)
- Apply inline style on the `.pg-drinks` container:
  ```jsx
  <div className="pg-drinks" style={drinkGridStyle}>
  ```
- Also soften `overflow-wrap: anywhere` on `.pg-drink-copy strong` is CSS-side (see below).

### 4. `src/pages/customer-kiosk.css`
- Change `.pg-drink-copy strong { overflow-wrap: anywhere }` → `overflow-wrap: break-word` (avoid mid-word breaks when space allows).
- Add `!important` to the media-query `.pg-drinks` column rules so small viewports still collapse to 2/1 columns even when an inline zoom style is set:
  - `@media(max-width:1100px)`: `.pg-drinks { grid-template-columns: repeat(2, minmax(0,1fr)) !important; }`
  - `@media(max-width:760px)`: `.pg-drinks { grid-template-columns: repeat(2, minmax(0,1fr)) !important; }`
  - `@media(max-width:470px)`: `.pg-drinks { grid-template-columns: 1fr !important; }`

## Verification
- Run `npm run build` (Vite) to ensure no JSX/CSS syntax errors.
- Manual: open kiosk, click A+ several times; drink grid should drop to 2 then 1 columns and names stop wrapping every 2–3 letters. Mobile breakpoints still collapse columns.

## Notes
- Inline style (no `!important`) is overridden by the `!important` media-query rules, preserving mobile responsiveness.
- High-contrast CSS is untouched (only color/border rules).