# HydraIQ Design System Integration

## Overview

The **HydraIQ** design system from Claude Design has been integrated into the Masco Intel platform. This represents a complete, professional UI framework for a "Bloomberg Terminal-style" procurement intelligence platform.

## What's Been Integrated

### 1. Design Tokens (`apps/dashboard/src/tokens.css`)
- Complete color palette (dark mode: bg-0 to bg-4, ink-0 to ink-4)
- Accent colors: cyan (data), violet (AI), copper (contractor), semantic (ok/warn/bad)
- Typography stack: Geist, Geist Mono, Space Grotesk
- Spacing scale: 4px grid
- Border radii: 4px to 20px
- Shadows: glass and pop variants
- Motion primitives: pulse and shimmer

### 2. Design System Documentation (`apps/dashboard/HYDRAIQ_DESIGN_SYSTEM.md`)
Complete reference guide including:
- Color palette with oklch values
- Typography specifications
- Component contracts (Button, Chip, Card, KPI, Sparkline)
- Data contract types (Product, Pricing, AIInsight, CompatNode)
- AI surface guidelines
- State patterns (empty, loading, error, onboarding)
- Motion guidelines
- Accessibility requirements
- Anti-patterns to avoid

### 3. Design Assets Available
Located at: `/Users/jay/Downloads/masco/project/`

**Artboards:**
1. **Landing Page** - Marketing hero + capability grid
2. **Product Intelligence Terminal** - Live pricing, retailer comp, OEM, AI insights
3. **Dashboard Home** - Procurement overview, watchlist, AI digest, heatmap
4. **AI Console + Command Palette** - Conversational copilot (⌘K)
5. **Chrome Extension** - Inline overlay, floating sidecar, popup
6. **Compatibility Graph** - Full-screen radial graph + OEM tree
7. **Notifications + Admin** - Center with critical-recall + SSO admin
8. **Pricing Page** - 3-tier pricing + feature matrix
9. **Mobile** - Dashboard, scan, AI chat (iOS bezels)
10. **Shared States** - Empty, loading, error, onboarding patterns
11. **Design System** - Tokens, type, components, icons

**Component Sources:**
- `components/landing.jsx` - Landing page
- `components/product-terminal.jsx` - **Flagship** product intelligence view
- `components/dashboard.jsx` - Main dashboard
- `components/assistant.jsx` - AI console + command palette
- `components/extension.jsx` - Chrome extension UIs
- `components/compatibility.jsx` - Compatibility graph
- `components/mobile.jsx` - Mobile screens
- `components/primitives.jsx` - Shared components (Logo, SideNav, TopBar, KPI, Sparkline, Icons)

## How to Use

### For Dashboard Development
1. Reference `apps/dashboard/HYDRAIQ_DESIGN_SYSTEM.md` for all styling decisions
2. Use `tokens.css` custom properties for colors, spacing, shadows
3. Import component patterns from the design file for reference
4. Follow the data contracts specified in the system docs

### For Visual Fidelity
1. Open `/Users/jay/Downloads/masco/project/index.html` in a browser to see all artboards
2. Each artboard shows pixel-perfect design with interactive patterns
3. Inspect HTML/CSS in browser dev tools to understand implementation details
4. Use as visual reference while building actual components

### For Feature Implementation
The design specifies:

**Product Terminal (Section 02)**
- SKU lookup with live price data
- Retailer comparison table
- Component hierarchy
- OEM lineage
- AI insight stream
- Tracked products toggle

**Dashboard (Section 03)**
- KPI cards (procurement metrics)
- Watchlist with price alerts
- Daily AI digest
- Category heatmap
- Quick actions

**AI Console (Section 04)**
- Turn-by-turn chat interface
- Tool calls for pricing-scan, oem-tree, compat-map
- Citation formatting
- Model badge (show which model/version)

**Command Palette (Section 04)**
- ⌘K to open
- AI suggestion in first row
- Keyboard-driven search and navigation

## Integration Timeline

### Immediate (Week 1)
- ✅ Copy tokens.css to dashboard
- ✅ Document design system
- [ ] Create primitive components (Button, Chip, Card, KPI, Sparkline)
- [ ] Implement SideNav + TopBar layout components
- [ ] Wire up token colors in existing dashboard

### Phase 2 (Week 2-3)
- [ ] Build ProductTerminal view (flagship feature)
- [ ] Implement AI Console + Command Palette
- [ ] Create Compatibility Graph visualization
- [ ] Build Pricing page

### Phase 3 (Week 3-4)
- [ ] Polish Dashboard with full HydraIQ styling
- [ ] Implement all state patterns (empty/loading/error/onboarding)
- [ ] Chrome extension UI reskin
- [ ] Mobile view optimization

### Phase 4 (Week 4-5)
- [ ] Accessibility audit (a11y compliance)
- [ ] Performance optimization
- [ ] Motion & interaction polish
- [ ] Cross-browser testing

## Feasibility Assessment

### What's Ready to Build Now
- ✅ Landing page (static marketing)
- ✅ Dashboard layout + KPI cards
- ✅ Pricing page
- ✅ Basic navigation (SideNav + TopBar)
- ✅ Component library (buttons, chips, cards)
- ✅ State patterns (skeletons, empty states)

### What Needs API Integration
- 🔄 Product Terminal (requires product + pricing endpoints)
- 🔄 Compatibility Graph (requires OEM relationship data)
- 🔄 AI Console (requires `/api/chatbot/...` endpoints)
- 🔄 Notifications (requires `/api/notifications/...`)

### What Needs External Libraries
- Chart library (e.g., Recharts, Chart.js) for sparklines + heatmaps
- Graph library (e.g., d3-force) for compatibility graph
- Code highlighting (e.g., Prism) for code snippets in console

## Key Design Decisions

### 1. Dark Mode First
- Optimized for extended viewing
- Reduces eye strain for power users
- Aligns with "Bloomberg Terminal" aesthetic

### 2. AI-Native
- Violet color signals all AI outputs
- AI surfaces separate from data surfaces
- "Is this a model speaking?" should be obvious at a glance

### 3. Density > Whitespace
- 13px base font size (not 16px)
- Tight vertical spacing
- High information density
- Optimized for power users, not casual browsers

### 4. Utilitarian Motion
- No spring physics
- Minimal animations (pulse, shimmer)
- Respects `prefers-reduced-motion`
- Motion is functional, not decorative

## Recommended Next Steps

1. **Build a landing page** using `components/landing.jsx` as reference
   - Estimated effort: 4-6 hours
   - Returns: Marketing presence + first visual touchpoint

2. **Create primitive components** (Button, Chip, Card, KPI)
   - Estimated effort: 6-8 hours
   - Returns: Reusable component library for all screens

3. **Build ProductTerminal** (the flagship view)
   - Estimated effort: 12-16 hours
   - Returns: Core user-facing feature, highest impact

4. **Implement AI Console**
   - Estimated effort: 8-10 hours
   - Returns: Differentiator vs. generic procurement tools

## Questions for Clarification

1. **React or Vue?** - Design is React-native but can be adapted to Vue
2. **Component library?** - Use Headless UI, shadcn, or build custom?
3. **Chart libraries?** - Recharts (React), Chart.js (agnostic), or Plotly?
4. **Graph rendering?** - d3 (steep learning curve) or Cytoscape.js?
5. **Mobile strategy?** - React Native, Flutter, or responsive web?

---

**Design File Source**: `/Users/jay/Downloads/masco/project/index.html`  
**Integrated**: May 13, 2026  
**Status**: Ready for implementation  
**Velocity Potential**: 3-5x acceleration with component library + design consistency
