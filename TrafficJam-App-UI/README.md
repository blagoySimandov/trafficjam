# Traffic Jam - Network Builder UI

A beautiful, Apple-inspired interface for traffic simulation with subtle abstract art influences.

## 🎨 Design Philosophy

- **Apple-esque smoothness**: Clean layouts, smooth animations, and intuitive interactions
- **Abstract art accents**: Subtle color gradients inspired by Kandinsky and Mondrian
- **Dark theme**: Professional dark interface with glassmorphism effects
- **Fluid animations**: Powered by Framer Motion for butter-smooth transitions

## 📦 Installation

**Using Bun (Recommended - Fast!):**
```bash
# Navigate to project directory
cd traffic-jam-ui

# Install dependencies with Bun
bun install

# Start development server
bun run dev
```

**Using npm (Alternative):**
```bash
npm install
npm run dev
```

## 🏗️ Project Structure

```
traffic-jam-ui/
├── src/
│   ├── components/          # Reusable UI components
│   │   ├── Button.jsx
│   │   ├── Button.css
│   │   ├── ProjectCard.jsx
│   │   ├── ProjectCard.css
│   │   ├── PageContainer.jsx
│   │   └── PageContainer.css
│   ├── pages/              # Page components
│   │   ├── ProjectsPage.jsx       # Screen 1: Project selection
│   │   ├── MapSelectionPage.jsx   # Screen 2: Map selection
│   │   ├── NetworkEditorPage.jsx  # Screen 3: Network editor (placeholder)
│   │   ├── SimulationPage.jsx     # Screen 4: Simulation running
│   │   └── ResultsPage.jsx        # Screen 5: Results view
│   ├── styles/             # Global styles
│   │   └── globals.css
│   ├── App.jsx             # Main app with routing
│   └── main.jsx            # Entry point
└── package.json
```

## 🔌 Integration Points

### Map Editor (Screen 3)
Replace the placeholder in `NetworkEditorPage.jsx`:

```jsx
// In NetworkEditorPage.jsx, replace this section:
<div className="editor-viewport glass-morphism">
  {/* Your map editor component here */}
  <YourMapEditor />
</div>
```

### Map Selection Visualization (Screen 2)
Replace the placeholder in `MapSelectionPage.jsx`:

```jsx
// In MapSelectionPage.jsx, replace:
<div className="map-viewport glass-morphism">
  {/* Your MapBox component here */}
  <YourMapBoxComponent />
</div>
```

### Results Visualizations (Screen 5)
Add your visualization components in `ResultsPage.jsx`:

```jsx
// In ResultsPage.jsx, add custom visualizations for each tab
{selectedTab === 'performance' && <YourPerformanceChart />}
{selectedTab === 'routes' && <YourRouteAnalysis />}
{selectedTab === 'comparison' && <YourComparisonHeatmap />}
```

## 🎯 Features

### ✅ Completed
- Project management (create, delete, select)
- Map selection interface
- Network editor layout with side panel
- Simulation progress tracking
- Results dashboard with multiple tabs
- Smooth page transitions
- Responsive design
- Glassmorphism effects
- Abstract art accents

### 🔌 Ready for Integration
- Map editor component slot
- MapBox visualization slot
- Results visualization slots
- Data persistence layer

## 🎨 Design System

### Colors
```css
--accent-primary: #007aff    /* Primary blue */
--accent-red: #ff3b30        /* Danger/alerts */
--accent-yellow: #ffcc00     /* Warnings */
--accent-blue: #0a84ff       /* Info */
--accent-purple: #bf5af2     /* Secondary accent */
```

### Typography
- System font stack: `-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto`
- Title sizes: 48px (large), 36px (medium), 24px (small)
- Body: 15px regular, 13px small

### Spacing
- xs: 4px, sm: 8px, md: 16px, lg: 24px, xl: 32px, 2xl: 48px

### Border Radius
- sm: 8px, md: 12px, lg: 16px, xl: 24px

## 📱 Responsive Breakpoints

- Desktop: > 1024px
- Tablet: 768px - 1024px
- Mobile: < 768px

## 🚀 Key Components

### Button
```jsx
<Button variant="primary|secondary|danger|ghost" size="small|medium|large">
  Click me
</Button>
```

### ProjectCard
```jsx
<ProjectCard 
  project={projectData}
  index={0}
  onSelect={() => {}}
  onDelete={() => {}}
/>
```

### PageContainer
```jsx
<PageContainer>
  {/* Your page content */}
</PageContainer>
```

## 🔄 Routing

- `/` → Redirects to `/projects`
- `/projects` → Project selection
- `/projects/:id/map-selection` → Map selection
- `/projects/:id/network-editor` → Network editor
- `/projects/:id/simulation` → Simulation running
- `/projects/:id/results` → Results view

## 🎭 Animation Patterns

All animations use Framer Motion:
- Page transitions: Fade + scale
- Card interactions: Hover lift, tap scale
- Progress indicators: Smooth width transitions
- Abstract shapes: Slow, continuous rotation

## 💡 Tips for Team Integration

1. **Keep the design language**: Use existing color variables and components
2. **Match animations**: Use `var(--transition-base)` for consistency
3. **Respect glassmorphism**: Use `.glass-morphism` class for panels
4. **Mobile-first**: Test on all breakpoints
5. **Abstract accents**: Keep them subtle and secondary to functionality

## 📝 Next Steps

1. Install dependencies: `npm install`
2. Run dev server: `npm run dev`
3. Replace placeholder components with your map editor and visualizations
4. Add data persistence (local storage, API, etc.)
5. Connect to actual MATSim simulation backend

## 🤝 Contributing

When adding new components:
1. Follow the existing naming conventions
2. Create separate CSS files for each component
3. Use CSS custom properties from `globals.css`
4. Add Framer Motion for interactions
5. Test responsive behavior

---

Built with ❤️ using React, Vite, and Framer Motion
