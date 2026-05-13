# HydraIQ Design System — Masco Intel UI Framework

A complete design system for the Bloomberg Terminal-style procurement intelligence platform.

## Overview

HydraIQ is a dark-mode, data-centric design system built for power users managing complex procurement operations. The design emphasizes clarity, density, and real-time data presentation with AI-assisted insights.

**Design Philosophy:**
- **Dark-first**: Carbon black to steel grey neutrals for extended viewing
- **Data-dense**: High information density for professional users
- **AI-native**: Violet accents signal intelligence/automation
- **Accessible**: Color reinforced with iconography; reduced-motion support
- **Performance**: Minimal motion, utilitarian interactions

---

## 1. Color Palette

### Neutrals (Backgrounds & Text)
All values in oklch format for future-proof theming.

```
Backgrounds (dark → light):
--bg-0: oklch(0.12 0.006 250)   ← Deepest (overlays, highest contrast)
--bg-1: oklch(0.15 0.006 250)   ← Canvas (main background)
--bg-2: oklch(0.18 0.007 250)   ← Surface (cards, panels)
--bg-3: oklch(0.22 0.008 250)   ← Raised (buttons, input focus)
--bg-4: oklch(0.27 0.009 250)   ← Hover (interactive states)

Text/Ink (light → dark):
--ink-0: oklch(0.98 0.003 250)  ← Primary (headlines, body)
--ink-1: oklch(0.82 0.005 250)  ← Secondary (supporting text)
--ink-2: oklch(0.62 0.006 250)  ← Tertiary (labels)
--ink-3: oklch(0.45 0.007 250)  ← Meta (timestamps, hint text)
--ink-4: oklch(0.34 0.008 250)  ← Muted (disabled, very low contrast)

Borders (alpha-based):
--line-1: oklch(1 0 0 / 0.06)   ← Subtle dividers
--line-2: oklch(1 0 0 / 0.10)   ← Chips, inputs
--line-3: oklch(1 0 0 / 0.16)   ← Stronger dividers
```

### Accents (Semantic & Brand)

```
--cyan:          oklch(0.82 0.14 220)   ← Primary data (default KPI color)
--cyan-dim:      oklch(0.62 0.13 220)   ← Dimmed variant
--violet:        oklch(0.68 0.18 295)   ← AI / Intelligence
--violet-dim:    oklch(0.52 0.15 295)   ← Dimmed variant
--copper:        oklch(0.74 0.12 55)    ← Contractor / Trade
--copper-dim:    oklch(0.58 0.11 55)    ← Dimmed variant
--ok:            oklch(0.76 0.14 155)   ← Positive (savings, up)
--warn:          oklch(0.80 0.14 80)    ← Watch (investigate, warning)
--bad:           oklch(0.68 0.18 25)    ← Error / Risk (down, recall)

Brand Gradient:
--grad-iq: linear-gradient(135deg, cyan 0%, violet 100%)
  → Used ONLY on: logo glyph, primary AI CTA, violet-tinted AI panels
```

---

## 2. Typography

### Font Stack
```css
--font-sans:    'Geist', -apple-system, BlinkMacSystemFont, ui-sans-serif, sans-serif;
--font-mono:    'Geist Mono', ui-monospace, monospace;
--font-display: 'Space Grotesk', 'Geist', sans-serif;
```

### Type Scale (13px base)
- **Display**: 32px / Space Grotesk / 600 weight (page titles, hero)
- **Large**: 18px / Geist / 600 weight (section headers)
- **Regular**: 13px / Geist / 400 weight (body text, labels)
- **Small**: 12px / Geist / 500 weight (UI labels)
- **Tiny**: 11px / Geist Mono / 400 weight (metadata, KPI values)

### Utilities
- `.mono` → switch to `--font-mono`
- `.display` → switch to `--font-display`
- `.hq-num` → font-variant-numeric: tabular-nums (for aligned numerics)

---

## 3. Spacing & Radii

### Spacing Scale
4px grid throughout:
- 4px (xs), 8px (sm), 12px (md), 16px (lg), 24px (xl), 32px (2xl)

### Border Radius
```
--r-xs: 4px     ← Inputs, small buttons
--r-sm: 6px     ← Chips, tags
--r-md: 10px    ← Cards, panels (default)
--r-lg: 14px    ← Modals, command palette
--r-xl: 20px    ← Large rounded cards
999px           ← Pills, badges (fully rounded)
```

---

## 4. Shadows

```css
--shadow-glass: 0 1px 0 oklch(1 0 0 / 0.04) inset, 
                0 0 0 1px oklch(1 0 0 / 0.06), 
                0 20px 60px -20px oklch(0 0 0 / 0.6);
  → Cards, default elevated surfaces

--shadow-pop:   0 1px 0 oklch(1 0 0 / 0.05) inset, 
                0 0 0 1px oklch(1 0 0 / 0.08), 
                0 24px 60px -16px oklch(0 0 0 / 0.7), 
                0 8px 24px -8px oklch(0 0 0 / 0.5);
  → Modals, command palette, floating panels (deeper)
```

---

## 5. Components

### Button (`.hq-btn`)
- **Base**: 28px height, 10px padding horizontal, 6px border-radius
- **Typography**: 12px / 500 weight
- **States**:
  - Default: `background: oklch(1 0 0 / 0.04)`, `border: 1px solid --line-2`
  - Primary: light background, dark text, inset highlight + shadow
  - Accent (AI): gradient IQ, white text, shadow-pop

### Chips (`.hq-chip`)
- **Base**: inline-flex, 28px height, 8px padding
- **Border-radius**: 999px (fully rounded)
- **Typography**: 11px / `--font-mono`
- **Variants**: `.hq-chip-{cyan|violet|ok|warn|bad}`
- Always include a leading icon/dot for accessibility

### Cards (`.hq-card`)
- **Background**: gradient (--bg-2 to darker)
- **Border**: 1px solid --line-1
- **Border-radius**: --r-md (10px)
- **Shadow**: var(--shadow-glass)

### Live Indicator (`.hq-dot`)
- **Base**: 6px circle, currentColor, 8px glow
- **With pulse**: `.hq-dot.hq-pulse` → 2s ease-out CSS animation
- Use: connection status, real-time data heartbeat, critical alerts only

### Shimmer (`.hq-shimmer`)
- 1.6s linear infinite animation
- Use ONLY on skeleton placeholders, never on real content

### Status Badge
- Chip + icon: always use semantic color + glyph together
- Example: `<span class="hq-chip hq-chip-bad">⚠ Out of stock</span>`

---

## 6. Data Contracts (TypeScript)

### Product
```typescript
type Product = {
  sku: string;                          // "9159-AR-DST"
  upc?: string;
  title: string;
  brand: string;                        // "Delta Faucet Co."
  oem: string;                          // "Masco Corp."
  tier: 'builder' | 'standard' | 'contractor' | 'pro';
  components: Component[];
  oemLineage: string[];                 // ["Masco","Delta","Cassidy"]
  tracked: boolean;
};
```

### Pricing
```typescript
type PriceSeries = {
  ts: number;                           // timestamp ms
  price: number;
  retailer: string;
  channel: 'retail' | 'trade' | 'intl';
}[];

type RetailerRow = {
  retailer: string;
  channel: 'retail' | 'trade' | 'intl';
  price: number;
  delta24h: number;                     // signed percentage
  stock: 'in_stock' | 'low' | 'bulk' | 'special' | 'out';
  markup: number;                       // 0..1
};
```

### AI Insights
```typescript
type AIInsight = {
  id: string;
  tag: 'GRADE' | 'OEM' | 'FAILURE' | 'PRICING' | 'SOURCE' | 'CONTRACTOR' | 'MARKET' | 'RISK' | 'OPPORTUNITY';
  text: string;
  confidence: number;                   // 0..1
  ts: string;                           // ISO timestamp
  citations?: { label: string; url: string }[];
};
```

### Compatibility Graph
```typescript
type CompatNode = {
  id: string;
  label: string;
  kind: 'self' | 'shared_cartridge' | 'same_oem' | 'cross_brand' | 'aftermarket' | 'discontinued';
};
type CompatEdge = {
  from: string;
  to: string;
  strength: 'solid' | 'dash';
  relation: string;
};
```

---

## 7. AI Surfaces

### Visual Contract
- **AI surfaces** use violet accents + optional gradient IQ on primary CTA
- **Data surfaces** use cyan accents (no gradient except logo)
- This makes "is this a model speaking?" answerable at a glance

### Five AI Entry Points
1. **Daily Digest card** (dashboard) — long-form synthesis
   - Endpoint: `/api/analytics/dashboard/digest`
   - Show as a card with violet top-tint + AI badge
2. **Insight Stream** (product terminal right rail) — tagged one-liners
   - Endpoint: `/api/chatbot/stats` with stream mode
   - Each insight tagged with tag + confidence
3. **AI Console** — turn-by-turn chat with citations
   - Endpoint: `/api/chatbot/conversations/:id/messages`
   - Show model badge (e.g., "Claude Haiku Procurement")
4. **Command Palette ⌘K** — AI suggestion in first row
   - Tools: `pricing-scan`, `oem-tree`, `compat-map`
5. **Chrome Extension** — page-context overlay
   - Same model, scoped to current retailer page

---

## 8. States Checklist

Every list, chart, and detail view **must** ship with:

### Empty State
- Explain **why** (no data yet vs. no matches)
- Offer the most likely next action
- Example: "No products saved yet. Start by [searching](search) or [uploading](upload)."

### Loading State
- Use `.hq-shimmer` skeleton with a single "what we're fetching" line
- Avoid global spinner; show skeletons in place
- Skeleton: striped placeholder, 8px dashed border, --ink-3 label

### Error State
- Keep stale data visible, dimmed to 55% opacity
- Surface error inline with retry button + link to status page
- Example: "Failed to load pricing. [Retry](javascript:void) | [Status](status)"

### Onboarding State
- When user could have data but doesn't (e.g., first login)
- Prefer guided onboarding over bare empty state
- Reference: Artboard 10 in HydraIQ design file

---

## 9. Motion Guidelines

### Primitives

**Pulse (`.hq-dot.hq-pulse`)**
```css
@keyframes hq-pulse {
  0% { transform: scale(0.6); opacity: 0.8; }
  100% { transform: scale(2.4); opacity: 0; }
}
/* 2s ease-out infinite */
```
Use on: live-data heartbeats, critical alerts

**Shimmer (`.hq-shimmer`)**
```css
@keyframes hq-shimmer {
  0% { background-position: -200% 0; }
  100% { background-position: 200% 0; }
}
/* 1.6s linear infinite */
```
Use on: skeleton placeholders only

### Micro-interactions
- **Card hover**: `transform: translateY(-1px)` + shadow glass → pop, 120ms ease-out
- **Panel reveal** (sidecars): width 0 → full, 220ms, `cubic-bezier(.2,.8,.2,1)`
- **Data flash**: 200ms background fade `--cyan / 0.10 → transparent` on row update
- **AI streaming**: trailing dot in model byline pulses while tokens arrive

### Reduced Motion
```css
@media (prefers-reduced-motion: reduce) {
  .hq-dot.hq-pulse::before, .hq-shimmer { animation: none; }
}
```

---

## 10. Accessibility

### Color + Redundancy
- Every semantic use (positive/negative/warning/error) is paired with text + icon
- Example: `+4.2% ↑` not just `+4.2%`
- Trust score: both a letter grade AND a percentage ring

### Minimum Text Sizes
- Body text: 13px sans
- Labels: 12px sans
- Metadata: 11px mono
- Do NOT shrink below these for content density; use scrollable areas instead

### Forced Colors
- Brand gradient on hero headline needs a solid fallback color
- Test with `forced-colors: active` media query

### Focus & Keyboard Navigation
- All interactive elements (buttons, links, inputs) must have visible focus rings
- Support ⌘K (command palette), Escape (close modals)
- Tab order should match visual left-to-right, top-to-bottom

---

## 11. File Organization

```
src/
├── tokens/
│   ├── tokens.css           ← Design tokens (color, type, spacing)
│   └── tokens.ts            ← Codegen'd TypeScript types (optional)
├── components/
│   ├── primitives/
│   │   ├── Logo.tsx
│   │   ├── Button.tsx
│   │   ├── Chip.tsx
│   │   ├── Card.tsx
│   │   ├── KPI.tsx
│   │   ├── Sparkline.tsx
│   │   └── Icons.tsx
│   ├── layout/
│   │   ├── SideNav.tsx
│   │   ├── TopBar.tsx
│   │   └── PageLayout.tsx
│   ├── charts/
│   │   ├── PriceChart.tsx
│   │   ├── Heatmap.tsx
│   │   └── CompatGraph.tsx
│   └── feeds/
│       ├── InsightStream.tsx
│       ├── NotificationFeed.tsx
│       └── AuditLog.tsx
├── views/
│   ├── Landing.tsx
│   ├── ProductTerminal.tsx
│   ├── Dashboard.tsx
│   ├── AIConsole.tsx
│   ├── Compatibility.tsx
│   └── Pricing.tsx
├── features/
│   ├── ai/
│   │   ├── Chat.tsx
│   │   ├── Digest.tsx
│   │   └── CommandPalette.tsx
│   ├── pricing/
│   ├── notifications/
│   └── admin/
└── extension/
    └── manifest.json
```

---

## 12. Implementation Checklist

- [ ] Copy `tokens.css` to project (colors, type, spacing, shadows)
- [ ] Create `primitives/` folder with base components (Button, Chip, Card, KPI, Sparkline)
- [ ] Create `layout/` folder with SideNav, TopBar, PageLayout
- [ ] Create `views/` folder with major screens (Dashboard, ProductTerminal, etc.)
- [ ] Wire AI endpoints: `/api/chatbot/...`, `/api/analytics/dashboard/...`
- [ ] Implement command palette ⌘K with AI suggestions
- [ ] Add state handlers: empty, loading, error, onboarding for every list/chart
- [ ] Test with reduced-motion enabled
- [ ] Audit focus rings and keyboard navigation
- [ ] Test forced-colors mode for a11y compliance

---

## 13. Anti-Patterns (Do NOT Introduce)

❌ Emoji as data icons → Use the icon set in `Icons.tsx`  
❌ Hand-drawn product SVGs → Striped placeholders + monospace only  
❌ Gradient buttons outside AI surfaces → IQ gradient reserved for AI + logo  
❌ Trusted-by logos / third-party trademarks → We are our own thing  
❌ Rainbow left-border card accents → Monochromatic cards only; accent from content  

---

## References

- **Design File**: `/Users/jay/Downloads/masco/project/index.html`
- **Component Library**: `components/` folder in design project
- **Handoff Guide**: `/Users/jay/Downloads/masco/project/HANDOFF.md`

---

**Last Updated**: May 13, 2026 | **Design Version**: HydraIQ v2.4 | **Masco Intel**: v3.0.0
