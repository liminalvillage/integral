# INTEGRAL Frontend

A production-ready SvelteKit frontend for the INTEGRAL cooperative economic platform. Features a dark, modern, elegant design with comprehensive UI components and full documentation.

## Features

- **Dark Theme**: Modern, elegant dark UI with custom color palette and animations
- **5 Subsystem Interfaces**: Complete interfaces for CDS, OAD, ITC, COS, and FRS
- **Interactive Charts**: Line, donut, and bar charts using Chart.js
- **Onboarding Flow**: Guided tour for new users
- **Toast Notifications**: Real-time feedback system
- **Form Validation**: Comprehensive form handling with validation
- **Documentation**: Built-in docs with formulas and API reference
- **Federation Management**: Connect and manage Nostr relay nodes
- **Responsive Design**: Works on desktop, tablet, and mobile
- **Accessibility**: ARIA labels, keyboard navigation, screen reader support

## Tech Stack

- **SvelteKit** - Full-stack framework
- **TypeScript** - Type safety
- **Tailwind CSS** - Utility-first styling
- **Chart.js** - Data visualization
- **Lucide Icons** - Icon system
- **Nostr Tools** - Federation protocol

## Quick Start

### Prerequisites

- Node.js 18+
- npm or pnpm

### Installation

```bash
# Navigate to frontend directory
cd frontend

# Install dependencies
npm install

# Start development server
npm run dev
```

The app will be available at `http://localhost:5173`

### Build for Production

```bash
# Build the app
npm run build

# Preview the production build
npm run preview
```

## Project Structure

```
frontend/
├── src/
│   ├── lib/
│   │   ├── api/           # API client
│   │   ├── components/
│   │   │   ├── ui/        # Reusable UI components
│   │   │   ├── layout/    # Layout components
│   │   │   ├── charts/    # Chart components
│   │   │   ├── forms/     # Form components
│   │   │   └── onboarding/# Onboarding flow
│   │   ├── stores/        # Svelte stores
│   │   ├── types.ts       # TypeScript definitions
│   │   └── utils/         # Utility functions
│   └── routes/
│       ├── +layout.svelte # Root layout
│       ├── +page.svelte   # Dashboard
│       ├── cds/           # Decision System
│       ├── oad/           # Design System
│       ├── itc/           # Time Credits
│       ├── cos/           # Production System
│       ├── frs/           # Feedback System
│       ├── federation/    # Node Management
│       ├── settings/      # User Settings
│       └── docs/          # Documentation
├── tailwind.config.js     # Theme configuration
└── package.json
```

## UI Components

### Core Components

| Component | Description |
|-----------|-------------|
| `Card` | Container with border and padding |
| `Button` | Primary, secondary, ghost variants |
| `Badge` | Status indicators and labels |
| `Input` | Text input with validation |
| `Modal` | Dialog overlay |
| `Tabs` | Tab navigation |
| `ProgressBar` | Progress indicator |
| `StatCard` | Statistics display |

### Feedback Components

| Component | Description |
|-----------|-------------|
| `Toast` | Notification popups |
| `Alert` | Inline messages |
| `Tooltip` | Hover information |
| `Spinner` | Loading indicator |
| `Skeleton` | Content placeholder |

### Form Components

| Component | Description |
|-----------|-------------|
| `FormField` | Label + input wrapper |
| `Select` | Dropdown selection |
| `Textarea` | Multi-line input |
| `Checkbox` | Toggle selection |
| `RadioGroup` | Single selection |

## Stores

The app uses Svelte stores for state management:

```typescript
import { nodeStatus, dashboardStats, findings } from '$lib/stores';
import { toasts } from '$lib/stores/toast';

// Read store values
$nodeStatus?.isRunning

// Update stores
dashboardStats.set({ ... });

// Show notifications
toasts.success('Title', 'Message');
toasts.error('Error', 'Something went wrong');
```

## Theme Customization

The theme is defined in `tailwind.config.js`:

```javascript
colors: {
  surface: {
    950: '#0a0a12',  // Darkest background
    900: '#12121c',
    800: '#1a1a28',
    700: '#252535',
    600: '#2f2f42',
    500: '#3d3d54',
    400: '#5c5c78',
    300: '#8888a4',
    200: '#b4b4c8',
    100: '#e0e0ec',
  },
  primary: {
    500: '#8b5cf6',  // Main purple
    400: '#a78bfa',
    600: '#7c3aed',
  },
  // ... more colors
}
```

## API Integration

The API client is configured in `src/lib/api/client.ts`:

```typescript
import { api } from '$lib/api/client';

// Example: Fetch issues
const issues = await api.cds.getIssues();

// Example: Create a labor event
await api.itc.logLabor({
  memberId: 'member123',
  hours: 4,
  category: 'development',
  description: 'Feature implementation'
});
```

## Environment Variables

Create a `.env` file:

```env
PUBLIC_API_URL=http://localhost:3000/api/v1
PUBLIC_NOSTR_RELAYS=wss://relay.example.com
```

## Development

### Adding a New Page

1. Create a new directory in `src/routes/`
2. Add `+page.svelte` with your component
3. Add navigation link in `Sidebar.svelte`

### Adding a New Component

1. Create component in `src/lib/components/ui/`
2. Export from `index.ts`
3. Import where needed

### Code Style

- Use TypeScript for type safety
- Follow Svelte component conventions
- Use Tailwind utility classes
- Prefer composition over inheritance

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server |
| `npm run build` | Build for production |
| `npm run preview` | Preview production build |
| `npm run check` | Type check with svelte-check |
| `npm run lint` | Lint with ESLint |
| `npm run format` | Format with Prettier |

## Browser Support

- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

## License

MIT License - see LICENSE file for details.
