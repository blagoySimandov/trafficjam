# Quick Start Guide

## Getting Started in 3 Steps

### 1️⃣ Install Dependencies

**Using Bun (Recommended - ⚡ Super Fast!):**
```bash
cd traffic-jam-ui
bun install
```

**Using npm:**
```bash
cd traffic-jam-ui
npm install
```

### 2️⃣ Start Development Server

**Using Bun:**
```bash
bun run dev
```

**Using npm:**
```bash
npm run dev
```

The app will open at `http://localhost:5173`

### 3️⃣ Build for Production

**Using Bun:**
```bash
bun run build
```

**Using npm:**
```bash
npm run build
```

Output will be in the `dist/` folder.

## Why Bun?

- ⚡ **3x faster** installs than npm
- 🚀 **Built-in** bundler and test runner
- 🔒 **Secure** by default
- 💯 **Drop-in replacement** for npm/yarn

## What You'll See

### Screen Flow
1. **Projects Page** - Create and manage your traffic projects
2. **Map Selection** - Choose your area and network radius
3. **Network Editor** - Edit your traffic network (placeholder ready)
4. **Simulation** - Watch your simulation run in real-time
5. **Results** - Analyze performance metrics and visualizations

## Integration Points

### 🗺️ Add Your Map Editor

In `src/pages/NetworkEditorPage.jsx`, line 59:

```jsx
<div className="editor-viewport glass-morphism">
  {/* REPLACE THIS PLACEHOLDER */}
  <YourMapEditorComponent />
</div>
```

### 🗺️ Add MapBox Visualization

In `src/pages/MapSelectionPage.jsx`, line 48:

```jsx
<div className="map-viewport glass-morphism">
  {/* REPLACE THIS PLACEHOLDER */}
  <YourMapBoxComponent 
    radius={radius}
    location={selectedLocation}
  />
</div>
```

### 📊 Add Results Visualizations

In `src/pages/ResultsPage.jsx`, line 118:

```jsx
{selectedTab === 'performance' && (
  <YourPerformanceVisualization />
)}
```

## Design Tokens

Use these CSS variables for consistency:

```css
/* Colors */
var(--accent-primary)    /* #007aff - Primary blue */
var(--accent-red)        /* #ff3b30 - Danger */
var(--accent-yellow)     /* #ffcc00 - Warning */
var(--accent-purple)     /* #bf5af2 - Secondary */

/* Spacing */
var(--spacing-sm)        /* 8px */
var(--spacing-md)        /* 16px */
var(--spacing-lg)        /* 24px */
var(--spacing-xl)        /* 32px */

/* Transitions */
var(--transition-base)   /* 250ms cubic-bezier */

/* Border Radius */
var(--radius-md)         /* 12px */
var(--radius-lg)         /* 16px */
```

## Components

### Button

```jsx
import Button from './components/Button';

<Button variant="primary" size="large" onClick={handleClick}>
  Click Me
</Button>
```

Variants: `primary`, `secondary`, `danger`, `ghost`
Sizes: `small`, `medium`, `large`

### Page Container

```jsx
import PageContainer from './components/PageContainer';

<PageContainer>
  {/* Your page content */}
</PageContainer>
```

## Tips

- ✅ All pages are responsive
- ✅ Animations are smooth by default
- ✅ Dark theme throughout
- ✅ Glassmorphism effects on cards
- ✅ Abstract art accents (subtle gradients)

## Need Help?

Check the full `README.md` for detailed documentation!
