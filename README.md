# Ore Whisperer Saga

A sophisticated incremental mining game with deep progression systems, featuring crafting, automation, transmutation, and social features.

## 🎮 Game Features

- **Mining System** - 100+ ores across 8 rarity tiers with auto-mining upgrades
- **Foundry** - 20-tier progression with smelting and refining mechanics  
- **Crafting System** - Complex recipe trees for components, electronics, and machines
- **Machine Automation** - Automated crafting with multiple machine types
- **Refinery** - Passive ore processing with heat mechanics and deep upgrade trees
- **Transmutation** - Blood magic system with mutation mechanics and risk/reward
- **Garden System** - Greenhouse-based plant growing with passive income
- **Marketplace** - Player-to-player trading with supply/demand mechanics
- **Social Features** - Real-time chat, clans, leaderboards
- **Progression Systems** - Achievements, rebirth, and unlockable content

## 🚀 Quick Start

### Prerequisites
- **Node.js** 18.0 or higher
- **npm** or **yarn** package manager

### Installation

```bash
# Clone the repository
git clone https://github.com/ThatsALotOfBees/ore-whisperer-saga.git
cd ore-whisperer-saga

# Install dependencies
npm install

# Set up Supabase environment variables
cp .env.example .env
# Edit .env with your Supabase configuration
```

### Environment Setup

Create a `.env` file in the root directory:

```env
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

Get your credentials from [Supabase Dashboard](https://supabase.com/dashboard).

### Development

```bash
# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

The development server will start at `http://localhost:8080`

## 🏗️ Architecture

### Technology Stack
- **Frontend**: React 18 + TypeScript + Vite
- **Backend**: Supabase (PostgreSQL + Auth + Realtime)
- **UI**: TailwindCSS + shadcn/ui components
- **State Management**: React Context + useReducer pattern
- **Animations**: Framer Motion
- **3D Effects**: Three.js

### Project Structure
```
src/
├── components/game/     # Game UI components
├── data/              # Game data definitions
├── hooks/             # Custom React hooks
├── integrations/supabase/  # Database integration
├── lib/               # Utility functions
└── pages/             # Main application pages
```

## 🎯 Key Features

### Clickable Navigation System
- **Upgrade Requirements**: Click any craftable upgrade requirement to jump to its recipe
- **Crafting Ingredients**: Click ingredients in recipes to navigate to their sub-recipes  
- **Recursive Chains**: Follow complex crafting trees seamlessly
- **Visual Indicators**: 🔗 icons show clickable items

### Game Systems
- **Mining**: Manual and auto-mining with upgrade paths
- **Foundry**: Multi-tier smelting with queue system
- **Refinery**: Passive processing with heat mechanics and idle bonuses
- **Transmutation**: Blood magic with mutation tiers and failure outcomes
- **Garden**: Plant growing with greenhouse upgrades
- **Marketplace**: Player trading with real-time updates
- **Clans**: Cooperative gameplay with donation systems

## 🛠️ Development

### Code Style
- **TypeScript** for type safety
- **TailwindCSS** for styling
- **shadcn/ui** component library
- **Framer Motion** for animations
- **Custom hooks** for game state management

### Testing
```bash
# Run unit tests
npm run test

# Run tests in watch mode
npm run test:watch

# Run E2E tests
npm run test:e2e
```

### Linting
```bash
# Run ESLint
npm run lint
```

## 📦 Deployment

### Web Version
```bash
# Build optimized production bundle
npm run build

# Preview locally
npm run preview
```

The build outputs to `dist/` directory and is ready for deployment to any static hosting service.

### Desktop Application (EXE)
```bash
# Install additional dependencies for desktop build
npm install

# Build desktop application
npm run electron:build

# Create installer packages
npm run electron:pack

# Distribute installer from dist-electron/ directory
```

#### Environment Variables for Production
- `VITE_SUPABASE_URL` - Your Supabase project URL
- `VITE_SUPABASE_ANON_KEY` - Your Supabase anonymous key

#### Desktop Installation
1. Download the latest release from [GitHub Releases](https://github.com/ThatsALotOfBees/ore-whisperer-saga/releases)
2. Run the installer (Windows: `.exe`, macOS: `.dmg`, Linux: `.AppImage`)
3. Launch "Ore Whisperer Saga" from your applications menu

#### Development Mode (Desktop)
```bash
# Run desktop app in development mode
npm run electron:dev
```

## 🎮 Game Controls

### Keyboard Shortcuts
- **Space**: Mine ore / Confirm actions
- **Enter**: Start crafting / Confirm upgrades
- **Escape**: Cancel actions / Close dialogs
- **Tab**: Navigate between tabs
- **Click**: Interact with all game elements

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Development Guidelines
- Follow the existing code style and patterns
- Use TypeScript for all new code
- Test your changes thoroughly
- Update documentation as needed

## 📄 License

This project is open source and available under the [MIT License](LICENSE).

## 🙏‍♂️ Support

If you encounter any issues or have questions:
- Open an issue on [GitHub](https://github.com/ThatsALotOfBees/ore-whisperer-saga/issues)
- Join our [Discord community](https://discord.gg/ore-whisperer-saga)

## 🎯 Game Progression Tips

### Early Game
- Focus on mining common ores to build currency
- Upgrade drill speed and ore scanner early
- Unlock foundry tiers to access better smelting

### Mid Game  
- Invest in machine automation for passive income
- Explore transmutation for high-value mutated ores
- Build greenhouses for passive currency generation

### Late Game
- Focus on refinery upgrades for efficient ore processing
- Pursue rebirth for permanent bonuses and new content
- Master the marketplace for optimal trading strategies

---

**Ore Whisperer Saga** - *Where every ore tells a story* ⛏️✨
