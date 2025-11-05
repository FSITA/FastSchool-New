# Home Page Redesign - Documentation

## Overview
The main page (`src/app/page.tsx`) has been redesigned with a minimal, professional, and modern interface. The design features white backgrounds, bold black text, clean spacing, subtle shadows, and micro-interactions with brand blue (#0E85F2) as the accent color.

## Icon Placement

All tool icons should be placed in the `/public/icons/` directory. The icons should be:
- Full-color SVG files
- Vibrant and saturated to stand out against white cards
- Named according to the following mapping:

### Icon Files Required:
- `/public/icons/quiz.svg` - Quiz Generator
- `/public/icons/lesson.svg` - Lesson Generator
- `/public/icons/presentation.svg` - Presentation Generator
- `/public/icons/flashcard.svg` - Flashcard Generator
- `/public/icons/planner.svg` - Lesson Planner
- `/public/icons/diagram.svg` - Diagram Generator
- `/public/icons/summary.svg` - Summary Generator
- `/public/icons/outline.svg` - Outline Generator
- `/public/icons/chart.svg` - Chart Generator (Coming Soon)
- `/public/icons/chat-pdf.svg` - Chat with PDF (Coming Soon)
- `/public/icons/fill-blanks.svg` - Fill in the Blanks (Coming Soon)
- `/public/icons/true-false.svg` - True or False Questions (Coming Soon)
- `/public/icons/worksheet.svg` - Worksheet Generator (Coming Soon)

## ToolCard Component

The `ToolCard` component (`src/components/ui/ToolCard.tsx`) is used to display all tools on the homepage.

### Props:
- `title` (string, required): Italian label for the tool
- `subtitle` (string, optional): Small description text
- `icon` (string, required): Path to icon SVG (e.g., "/icons/quiz.svg")
- `href` (string, optional): Link destination (required for active tools)
- `disabled` (boolean, optional): Set to true to disable the card
- `comingSoon` (boolean, optional): Shows "COMING SOON" badge and disables the card
- `featured` (boolean, optional): Makes the card larger (240px height vs 200px)
- `className` (string, optional): Additional CSS classes

### Marking a Card as Disabled/Coming Soon:

```tsx
// Coming Soon card (recommended)
<ToolCard
  title="Generatore di Grafici"
  icon="/icons/chart.svg"
  comingSoon={true}
/>

// Disabled card
<ToolCard
  title="Tool Name"
  icon="/icons/tool.svg"
  disabled={true}
/>

// Active card
<ToolCard
  title="Generatore di Quiz"
  icon="/icons/quiz.svg"
  href="/quiz-generator"
/>
```

## Design Specifications

### Colors:
- **Black Text**: `#0A0A0A`
- **White Background**: `#FFFFFF`
- **Brand Blue**: `#0E85F2` (accent color)
- **Border**: `rgba(0, 0, 0, 0.06)` (6% opacity black)

### Typography:
- **Font**: GeistSans (clean geometric sans)
- **Body Text**: 16px, leading-6
- **Section Headings**: 24-28px, uppercase, tracking-tight
- **Card Titles**: 18-20px (featured) or 16px (regular), bold

### Spacing:
- **Page Container**: max-width 1200px, centered, px-6 on mobile
- **Vertical Spacing**: py-20 (top 80px, bottom 80px)
- **Grid Gaps**: 24px-32px between cards
- **Card Padding**: p-6 (24px)
- **Border Radius**: 8px (rounded-lg)

### Card States:

#### Active Card:
- White background with subtle border
- Hover: lifts 4px, scales to 1.01, shadow-lg, border changes to brand blue (2px)
- Icon gets radial glow on hover
- Chevron arrow appears on hover
- Keyboard focusable with visible focus ring

#### Disabled/Coming Soon Card:
- 60% opacity
- Cursor: not-allowed
- Pointer events disabled
- "COMING SOON" badge in top-right corner
- Tooltip on hover: "In arrivo — verrà abilitato presto."
- Not in tab order (tabIndex="-1")

### Micro-interactions:
- Card hover: `translateY(-4px)` + `scale(1.01)` + shadow increase
- Border color change to brand blue on hover
- Icon glow effect (6-8% radial glow using brand blue)
- Chevron arrow fade-in on hover
- Active state: quick scale-down on click (`scale(0.98)`)

## Responsive Behavior

- **Desktop**: 3 columns for featured tools, 3 columns for all tools
- **Tablet (md)**: 3 columns for featured, 2 columns for all tools
- **Mobile**: Single column stacking for both sections

## Accessibility Features

- ARIA labels: `aria-label="Apri {tool name}"` on active cards
- Keyboard navigation: Enter/Space to activate cards
- Focus states: Visible brand blue ring on keyboard focus
- Semantic HTML: `<section>`, `<h2>`, proper heading hierarchy
- Disabled state: `aria-disabled="true"` and `tabIndex="-1"` for disabled cards
- Alt text: All icons include descriptive alt text

## Section Headings (Italian)

- **Featured Tools**: "Strumenti Popolari"
- **All Tools**: "Tutti gli Strumenti"

## Tool Labels (Italian)

All tool names are in Italian:
- Generatore di Quiz
- Generatore di Lezioni
- Generatore di Presentazioni (Beta)
- Generatore di Flashcard
- Pianificatore di Lezioni AI
- Generatore di Diagrammi
- Generatore di Riassunti
- Generatore di Outline
- Generatore di Grafici (Coming Soon)
- Chat con PDF (Coming Soon)
- Completa gli Spazi (Coming Soon)
- Vero o Falso (Coming Soon)
- Generatore di Schede di Lavoro (Coming Soon)

## Brand Color Configuration

The brand blue color (#0E85F2) is configured in:
- `tailwind.config.ts`: Added as `brandBlue` color
- `src/app/globals.css`: Added as CSS variable `--brand-blue`

Use it in Tailwind as: `text-brandBlue`, `border-brandBlue`, `bg-brandBlue`, etc.

## Testing Checklist

- [ ] All icons load correctly from `/public/icons/`
- [ ] Active cards are clickable and navigate correctly
- [ ] Disabled cards show proper opacity and cursor
- [ ] Coming soon cards show badge and tooltip
- [ ] Hover states work on all active cards
- [ ] Keyboard navigation works (Tab, Enter, Space)
- [ ] Focus rings are visible on keyboard focus
- [ ] Mobile layout stacks correctly
- [ ] All Italian labels are correct
- [ ] Color contrast meets WCAG AA standards

