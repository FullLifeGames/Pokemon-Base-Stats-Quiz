# Pokémon Base Stats Quiz

A fully-featured interactive quiz application that challenges users to identify Pokémon based on their base statistics. Built with modern web technologies and comprehensive testing capabilities.

## 🎮 Features

### Game Modes

#### Solo Quiz Mode
- **Base Stats Recognition**: Displays HP, Attack, Defense, Special Attack, Special Defense, and Speed stats
- **Smart Selection**: Accepts any Pokémon with matching stats (not just the exact name)
- **Real-Time Scoring**: Track correct and incorrect answers with live counters
- **Progress Animation**: Smooth loading animation between questions with auto-advance
- **Timer**: Tracks quiz duration during guessing and pauses during results
- **Hint System**: Request up to 2 hints (types and abilities) when enabled in settings

#### VS Mode (Multiplayer)
- **Peer-to-Peer Multiplayer**: Real-time competitive gameplay via WebRTC (PeerJS)
- **Room-Based Matchmaking**: Create or join rooms with 6-character codes
- **Multiple Roles**: Play as Host, Guest, or Spectator
- **Head-to-Head Competition**: Race to identify Pokémon faster than your opponent
- **Speed Bonus**: Correct answers within 5 seconds earn bonus points
- **Auto Hints**: Hints automatically revealed after 15 and 30 seconds
- **Live Status Indicators**: See when your opponent has answered
- **Round Results**: Detailed feedback showing both players' answers and timing
- **Match Scoring**: First to reach the configured score wins
- **Rematch System**: Request and accept rematches after a match ends
- **Session Persistence**: Automatically reconnect if disconnected
- **Spectator Mode**: Watch matches in real-time without participating
- **Forfeit Option**: Gracefully exit matches with confirmation dialog

### Customization & Settings
- **Generation Filters**: Set minimum and maximum Pokémon generations (1-9)
- **Evolution Stage Filter**: Option to show only fully evolved Pokémon
- **Win Condition**: Configure custom win scores (default: 10 correct for solo, 5 for VS)
- **Time Limits**: Set round time limits for VS Mode (optional)
- **Hint Toggle**: Enable/disable hint system in solo mode
- **Dynamic Configuration**: Adjust quiz parameters on-the-fly (host only in VS Mode)

### Internationalization
- **English & German Support**: Full i18n implementation with vue-i18n
- **Locale Persistence**: Remembers user's language preference
- **Translated Pokémon Names**: 1350+ German Pokémon names from PokéAPI

### User Interface
- **Dark/Light Mode**: Toggle theme with animated transitions
- **Responsive Design**: Works seamlessly on mobile, tablet, and desktop
- **Modern Components**: Built with shadcn-vue for polished UI
- **Congratulations Dialog**: Celebrates quiz completion with final stats
- **Infinite Scrolling**: Pokémon selector loads more options as you scroll
- **Visual Feedback**: Pokémon icons displayed in selector buttons and lists
- **Smart Sprites**: Auto-scaling Pokémon sprites that maintain aspect ratio
- **Mobile-Optimized**: Bottom sheet on mobile, popover on desktop with dynamic width matching

### Testing & Quality
- **310+ Unit Tests**: Comprehensive test coverage with Vitest
- **Type Safety**: Full TypeScript support throughout
- **CI-Ready**: Tests can be integrated into GitHub Actions
- **Component Testing**: Dedicated tests for all UI components including shared components
- **Auto-Import Support**: Vitest configured for Vue Composition API auto-imports

## 🛠️ Tech Stack

### Frontend Framework
- **Vue 3** - Progressive JavaScript framework
- **TypeScript** - Type-safe development
- **Vite** - Lightning-fast build tool

### Data & Localization
- **@pkmn/dex** (v0.10.6) - Pokémon stats and species data
- **@pkmn/img** (v0.10.6) - Pokémon sprites and icons
- **PokéAPI v2** - German Pokémon localization
- **vue-i18n** (v11.2.8) - Internationalization

### Multiplayer & Networking
- **PeerJS** (v1.5.4) - WebRTC peer-to-peer connections
- **Real-time Communication** - Direct browser-to-browser gameplay
- **Session Management** - Automatic reconnection and state recovery

### UI & Styling
- **Tailwind CSS** (v4.1.18) - Utility-first CSS framework
- **shadcn-vue** - High-quality Vue component library
- **Lucide Vue** - Beautiful icon library
- **Dark mode support** via @vueuse/core

### Testing
- **Vitest** (v4.0.18) - Unit testing framework
- **@vue/test-utils** (v2.4.6) - Vue component testing
- **happy-dom** - Lightweight DOM environment

## 📋 Project Structure

```
src/
├── components/
│   ├── __tests__/              # Unit tests (310+ tests)
│   ├── BaseStatQuiz.vue        # Solo quiz mode component
│   ├── VsMode.vue              # VS Mode coordinator
│   ├── VsLobby.vue             # Multiplayer lobby
│   ├── VsGame.vue              # Multiplayer game screen
│   ├── VsResults.vue           # Match results screen
│   ├── StatDisplay.vue         # Shared stat visualization
│   ├── PokemonSelector.vue     # Shared Pokemon picker with infinite scroll
│   ├── HintDisplay.vue         # Shared hint display
│   ├── AppSidebar.vue          # Settings sidebar
│   ├── GenerationSelect.vue    # Reusable generation dropdown
│   ├── PlayerCard.vue          # VS Mode player info card
│   ├── renderer/               # Pokémon visual components
│   │   ├── SpritesRenderer.vue # Pokémon sprite display
│   │   └── IconRenderer.vue    # Pokémon icon display
│   ├── ModeToggle.vue          # Dark/light mode toggle
│   └── ui/                     # shadcn-vue components
├── composables/
│   ├── __tests__/              # Composable tests
│   ├── useQuizLogic.ts         # Shared quiz logic (randomization, stats, matching)
│   ├── useVsGame.ts            # VS Mode game logic
│   └── usePeerConnection.ts    # WebRTC connection management
├── types/
│   ├── settings.ts             # Quiz settings interface
│   └── vsMode.ts               # VS Mode type definitions
├── lib/
│   ├── utils.ts                # Utility functions
│   └── pokemonNameHelper.ts    # Pokémon name localization
├── i18n/
│   └── locales/
│       ├── en.json             # English translations
│       └── de.json             # German translations
├── App.vue                      # Root component
└── main.ts                      # Entry point

scripts/
└── generatePokemonNames.js     # PokéAPI name generation script

public/
└── pokemonNames.json           # 1350+ German Pokémon names
```

## 🚀 Getting Started

### Prerequisites
- Node.js 16+
- pnpm 10.28.2+

### Installation

```bash
# Clone repository
git clone https://github.com/FullLifeGames/Pokemon-Base-Stats-Quiz.git
cd pokemon-quiz

# Install dependencies
pnpm install

# Generate German Pokémon names (optional, already in repo)
pnpm run generate:names
```

### Development

```bash
# Start dev server (localhost:5173)
pnpm run dev
```

### Building

```bash
# Production build
pnpm run build

# Preview production build
pnpm run preview
```

## 🧪 Testing

Run the test suite with comprehensive unit tests:

```bash
# Run tests once
pnpm test --run

# Run tests in watch mode
pnpm test

# Open interactive test UI
pnpm test:ui

# Generate coverage report
pnpm test:coverage
```

**Test Coverage**: 310+ unit tests covering all components, composables, and logic
- BaseStatQuiz: 7 tests
- VsMode: 24 tests
- VsGame: 26 tests
- VsLobby: 25 tests
- VsResults: 28 tests
- useQuizLogic composable: 35 tests (shared quiz logic)
- useVsGame composable: 29 tests
- usePeerConnection composable: 14 tests
- StatDisplay: 21 tests
- PokemonSelector: 23 tests
- HintDisplay: 24 tests
- GenerationSelect: 7 tests
- PlayerCard: 8 tests
- SpritesRenderer: 2 tests
- IconRenderer: 2 tests
- ModeToggle: 2 tests
- App: 4 tests
- AppSidebar: 2 tests
- And more...

For detailed testing information, see [TESTING.md](./TESTING.md)

## 📖 Usage

### Solo Mode

1. **Configure Settings** (Left Sidebar):
   - Set generation range (minimum & maximum)
   - Toggle fully evolved Pokémon only
   - Set win score goal
   - Enable/disable hints

2. **Play the Quiz**:
   - View displayed base stats
   - Request hints if enabled (types, then abilities)
   - Search and select the Pokémon
   - Watch score update and timer count

3. **Win the Quiz**:
   - Reach the configured win score
   - View congratulations dialog with final stats and time
   - Reset to play again

### VS Mode (Multiplayer)

#### Creating a Room
1. **Select VS Mode** from the mode selection screen
2. **Click "Create Room"** to generate a 6-character room code
3. **Configure Settings** (Host only):
   - Set generation range
   - Toggle fully evolved Pokémon only
   - Set max score (default: 5)
   - Set time limit per round (optional)
4. **Share Room Code** with your opponent
5. **Wait for Opponent** or spectators to join
6. **Click "Start Match"** when ready

#### Joining a Room
1. **Select VS Mode** from the mode selection screen
2. **Click "Join Room"** tab
3. **Enter Room Code** (6 characters)
4. **Choose Role**:
   - **Join as Player**: Compete in the match (2 players max)
   - **Join as Spectator**: Watch the match (unlimited spectators)
5. **Wait for Host** to start the match

#### Playing VS Mode
1. **Countdown**: 3-2-1 countdown before each round
2. **View Stats**: Both players see the same Pokémon stats
3. **Race to Answer**: First correct answer wins the round
4. **Speed Bonus**: Answer within 5 seconds for bonus point
5. **Auto Hints**: 
   - Types revealed after 15 seconds
   - Abilities revealed after 30 seconds
6. **Round Results**: See both players' answers and timing
7. **Next Round**: Automatic advance after 3 seconds
8. **Match End**: First to max score wins
9. **Rematch**: Request rematch or return to lobby

#### VS Mode Features
- **Live Opponent Status**: See when opponent has answered
- **Session Recovery**: Automatically reconnect if disconnected
- **Forfeit**: Gracefully exit with confirmation (opponent wins)
- **Spectator View**: Watch matches without participating
- **Real-time Sync**: All players see the same state

## 🌍 Internationalization

The app supports English and German with full translations for:
- UI labels and buttons
- Stat descriptions and explanations
- Pokémon names (1350+ entries)
- Messages and dialogs

Switch languages via the language selector in the sidebar.

## 🎨 Customization

### Quiz Settings
Edit `src/types/settings.ts` to modify default settings:
- Change default generation
- Adjust initial win score
- Set evolution filter defaults

### Styling
- Tailwind CSS configuration: `tailwind.config.js`
- Custom colors and themes in CSS variables
- Responsive breakpoints: mobile, tablet, desktop

### Pokémon Data
The app uses @pkmn/dex for all Pokémon data. To update:
1. Update package version: `pnpm add @pkmn/dex@latest`
2. Regenerate German names if needed: `pnpm run generate:names`

## 🔍 Key Features Explained

### Smart Selection System
The quiz doesn't require exact Pokémon names. If a Pokémon has identical base stats to the displayed stats, it's considered correct. This allows for legitimate alternatives.

### Advanced Randomization
- **Recent History Tracking**: Prevents the same Pokémon from appearing within the last 10 rounds
- **Stat-Based Grouping**: Pokémon with identical stats are grouped and weighted equally to ensure fair distribution
- **Smart Deduplication**: Avoids repetitive selections while maintaining variety

### Infinite Scroll Selection
- **Performance Optimized**: Initially loads 30 Pokémon, loads 30 more as you scroll
- **Search Integration**: Filters update instantly while maintaining scroll performance
- **Mobile & Desktop**: Consistent experience across all devices with adaptive UI

### Visual Feedback
- **Pokémon Sprites**: Full-size sprites displayed in result messages and VS mode
- **Pokémon Icons**: Compact icons in selector buttons and dropdown lists
- **Auto-Scaling**: Sprites and icons automatically scale to fit their containers
- **Responsive Sizing**: Adapts to screen size with Tailwind responsive classes

### German Localization
German Pokémon names are fetched from PokéAPI and cached in `pokemonNames.json`. The localization handles special forms like "Deoxys-Attack" properly.

### Auto-Advance Mechanism
After selection, the quiz displays results for 500ms then automatically loads the next Pokémon. Timer pauses during this transition.

### Score-Based Win Condition
Customize the difficulty by setting how many correct answers are needed to complete the quiz. Celebrating wins with a congratulations dialog.

## 🐛 Known Limitations

- Pokémon with identical base stats will both be accepted as correct (by design)
- Generation 9 (Paldea) is the maximum supported generation
- Some Pokémon forms may not have German names (falls back to English)
- VS Mode requires both players to have stable internet connections
- VS Mode uses a free PeerJS server which may have occasional downtime
- Room codes expire when all players disconnect

## 📦 Dependencies

See `package.json` for complete dependency list. Key packages:
- `vue` (3.5.24) - Framework
- `tailwindcss` (4.1.18) - Styling
- `vue-i18n` (11.2.8) - Localization
- `@pkmn/dex` (0.10.6) - Data
- `peerjs` (1.5.4) - WebRTC multiplayer
- `vite` (7.2.5 via rolldown) - Build tool
- `vitest` (4.0.18) - Testing

## 📄 License

This project is licensed under the **MIT License**. See the [LICENSE](./LICENSE) file for details.

You are free to use, modify, and distribute this project for personal or commercial purposes, provided you include the original copyright notice and license.

---

## 🤖 Project Note

This project was developed as an **experiment with AI-assisted coding** using GitHub Copilot and **exploration of the shadcn-vue component library**. It demonstrates:

- Rapid prototyping with AI code generation
- Building production-ready Vue 3 applications
- Integrating modern UI component libraries
- Test-driven development practices
- Multi-language support implementation
- Advanced state management patterns
- Real-time multiplayer with WebRTC/PeerJS
- Peer-to-peer networking without backend servers
- Component reusability and DRY principles
- Comprehensive unit testing (310+ tests)
- Performance optimization (infinite scrolling, lazy loading)
- Advanced randomization algorithms with history tracking
- Responsive design with mobile-first approach
- Auto-import configuration for development efficiency

The codebase serves as a reference for combining AI assistance with best practices in web development. All features were implemented iteratively with quality assurance and comprehensive testing. The VS Mode showcases advanced real-time multiplayer capabilities entirely in the browser without requiring a backend server. Recent enhancements focus on UX improvements including visual feedback with Pokémon sprites/icons, infinite scrolling for better performance, and advanced randomization to prevent repetitive gameplay.
