# Pokémon Quiz Hub

A fully-featured interactive quiz application with **three different quiz modes** to test your Pokémon knowledge: Base Stats, Learnset, and Damage Calculation. Built with modern web technologies and comprehensive testing capabilities.

## 🎮 Features

### Game Modes

#### Solo Quiz Modes
Choose from three different quiz types:

**1. Base Stats Quiz**
- **Base Stats Recognition**: Displays HP, Attack, Defense, Special Attack, Special Defense, and Speed stats
- **Smart Selection**: Accepts any Pokémon with matching stats (not just the exact name)
- **Real-Time Scoring**: Track correct and incorrect answers with live counters
- **Progress Animation**: Smooth loading animation between questions with auto-advance
- **Timer**: Tracks quiz duration during guessing and pauses during results
- **Hint System**: Request up to 2 hints (types and abilities) when enabled in settings

**2. Learnset Quiz**
- **Move Recognition**: Displays all learnable moves grouped by type
- **Generation-Aware**: Shows moves available in the selected generation
- **Base Forms Only**: Uses species without alternate forms (no Pikachu-Alola, Charizard-Mega, etc.)
- **Smart Filtering**: Automatically retries if a Pokémon has no learnable moves
- **Hint System**: Request hints showing types and abilities

**3. Damage Calc Quiz**
- **Damage Scenarios**: Shows attacker vs defender matchups with moves
- **Slider Interface**: Interactive 0-200% slider for damage guesses
- **Tolerance Scoring**: ±5% tolerance for correct answers
- **Multi-Generation Support**: Works with competitive sets from Gen 1-9
- **Smart Filtering**: Respects all settings (generation, fully evolved, mega filter)
- **Curated Sets**: Filters out CAP Pokémon and non-standard metagames (Balanced Hackmons, Almost Any Ability)
- **Dynamic Loading**: Lazy-loads generation-specific setdex data (code-split per generation)
- **Detailed Display**: Shows abilities, items, natures, EVs, and Tera types for each scenario

#### VS Mode (Multiplayer)
- **Peer-to-Peer Multiplayer**: Real-time competitive gameplay via WebRTC (PeerJS)
- **Room-Based Matchmaking**: Create or join rooms with 6-character codes
- **N-Player Support**: Unlimited players can compete simultaneously (not just 1v1)
- **Multiple Roles**: Play as Host, Player, or Spectator
- **Three Quiz Modes**: Choose between Base Stats, Learnset, or Damage Calc
- **Time-Based Scoring**: Earn 100-1000 points per correct answer based on speed
  - Instant answers: 1000 points
  - Linear decay to 100 points at time limit
  - Incorrect answers: 0 points
  - Damage mode: ±5% tolerance
- **Dual Game Modes**:
  - **Rounds Mode**: Play a fixed number of rounds (default: 10)
  - **Target Score Mode**: First to reach target score wins (default: 5000)
- **Live Status Indicators**: See how many players have answered each round
- **Per-Player Round Results**: Everyone gets points based on their speed and correctness
- **Leaderboard**: Real-time score tracking sorted by total points
- **Host-Only Restart**: Only the host can restart matches after completion
- **Answer Locking**: First submission is final (prevents timing manipulation)
- **Session Persistence**: Automatically reconnect if disconnected
- **Spectator Mode**: Watch matches in real-time without participating (unlimited)
- **Forfeit Option**: Gracefully exit matches (game ends if less than 2 players remain)

### Customization & Settings
- **Quiz Mode Selection**: Choose between Base Stats, Learnset, or Damage Calc
- **Generation Filters**: Set minimum and maximum Pokémon generations (1-9)
- **Evolution Stage Filter**: Option to show only fully evolved Pokémon
- **Mega Evolution Filter**: Include or exclude Mega Evolutions
- **Win Condition**: Configure custom win scores (default: 10 correct for solo)
- **VS Mode Settings** (Host only):
  - **Quiz Mode**: Select Base Stats, Learnset, or Damage Calc
  - **Game Mode**: Choose between Rounds or Target Score
  - **Total Rounds**: Set number of rounds for Rounds mode (1-50, default: 10)
  - **Target Score**: Set winning score for Target Score mode (1000-50000, default: 5000)
  - **Time Limit**: Required per-round timer (10-300 seconds, default: 30)
- **Hint Toggle**: Enable/disable hint system in solo mode (Base Stats & Learnset)
- **Dynamic Configuration**: Adjust quiz parameters on-the-fly (host only in VS Mode)
- **Settings Reactivity**: All quiz modes respond instantly to settings changes

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
- **300+ Unit Tests**: Comprehensive test coverage with Vitest
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
- **@pkmn/data** (v0.10.6) - Learnset data for move information
- **@smogon/calc** (0.10.0) - Damage calculation engine
- **@pkmn/img** (v0.10.6) - Pokémon sprites and icons
- **PokéAPI v2** - German Pokémon localization
- **vue-i18n** (v11.2.8) - Internationalization
- **Smogon Setdex** - Competitive Pokémon sets for Gen 1-9 (4798 Pokémon total)

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
│   ├── BaseStatQuiz.vue        # Base stats quiz mode
│   ├── LearnsetQuiz.vue        # Learnset quiz mode
│   ├── DamageQuiz.vue          # Damage calc quiz mode
│   ├── VsMode.vue              # VS Mode coordinator
│   ├── VsLobby.vue             # Multiplayer lobby
│   ├── VsGame.vue              # Multiplayer game screen
│   ├── VsResults.vue           # Match results screen
│   ├── StatDisplay.vue         # Base stats visualization
│   ├── LearnsetDisplay.vue     # Learnset moves display
│   ├── DamageScenarioDisplay.vue # Damage scenario display
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
│   ├── useLearnsetData.ts      # Learnset data fetching
│   ├── useDamageCalc.ts        # Damage calculation logic
│   ├── useVsGame.ts            # VS Mode game logic
│   └── usePeerConnection.ts    # WebRTC connection management
├── types/
│   ├── settings.ts             # Quiz settings interface
│   └── vsMode.ts               # VS Mode type definitions
├── lib/
│   ├── utils.ts                # Utility functions
│   ├── pokemonNameHelper.ts    # Pokémon name localization
│   └── setdex-gen*.json        # Competitive sets for Gen 1-9 (9 files)
├── i18n/
│   └── locales/
│       ├── en.json             # English translations
│       └── de.json             # German translations
├── App.vue                      # Root component
└── main.ts                      # Entry point

scripts/
├── generatePokemonNames.js     # PokéAPI name generation script
└── generateSetdex.js           # Smogon setdex generation script

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

# Generate competitive setdex data (optional, already in repo)
pnpm run generate:setdex
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

**Test Coverage**: 300+ unit tests covering all components, composables, and logic
- BaseStatQuiz: 7 tests
- VsMode: 13 tests (updated for N-player)
- VsGame: 20 tests (updated for N-player)
- VsLobby: 18 tests (updated for N-player)
- VsResults: 13 tests (updated for N-player)
- useQuizLogic composable: 35 tests (shared quiz logic)
- useVsGame composable: 17 tests (rewritten for N-player)
- usePeerConnection composable: 11 tests (updated for 'player' role)
- StatDisplay: 21 tests
- PokemonSelector: 23 tests
- HintDisplay: 24 tests
- GenerationSelect: 7 tests
- PlayerCard: 9 tests (updated for N-player compact cards)
- SpritesRenderer: 2 tests
- IconRenderer: 2 tests
- ModeToggle: 2 tests
- App: 4 tests
- AppSidebar: 2 tests
- And more...

For detailed testing information, see [TESTING.md](./TESTING.md)

## 📖 Usage

### Solo Mode

1. **Select Quiz Mode**:
   - **Base Stats**: Identify Pokémon from their stats
   - **Learnset**: Identify Pokémon from their learnable moves
   - **Damage Calc**: Guess damage percentage from battle scenarios

2. **Configure Settings** (Left Sidebar):
   - Set generation range (minimum & maximum)
   - Toggle fully evolved Pokémon only
   - Toggle Mega Evolution inclusion
   - Set win score goal
   - Enable/disable hints (Base Stats & Learnset modes)

3. **Play the Quiz**:
   - **Base Stats**: View stats, request hints, select Pokémon
   - **Learnset**: View moves by type, request hints, select Pokémon
   - **Damage Calc**: View battle scenario, use slider (0-200%), submit guess
   - Watch score update and timer count

4. **Win the Quiz**:
   - Reach the configured win score
   - View congratulations dialog with final stats and time
   - Reset to play again

### VS Mode (Multiplayer)

#### Creating a Room
1. **Select VS Mode** from the mode selection screen
2. **Click "Create Room"** to generate a 6-character room code
3. **Configure Settings** (Host only):
   - Choose quiz mode (Base Stats, Learnset, or Damage Calc)
   - Set generation range
   - Toggle fully evolved Pokémon only
   - Toggle Mega Evolution inclusion
   - Choose game mode (Rounds or Target Score)
   - Set total rounds (for Rounds mode, 1-50)
   - Set target score (for Target Score mode, 1000-50000)
   - Set time limit per round (10-300 seconds, required)
4. **Share Room Code** with other players
5. **Wait for Players** to join (minimum 2 players required)
6. **Spectators** can join to watch (unlimited)
7. **Click "Start Match"** when ready (requires 2+ players)

#### Joining a Room
1. **Select VS Mode** from the mode selection screen
2. **Click "Join Room"** tab
3. **Enter Room Code** (6 characters)
4. **Choose Role**:
   - **Join as Player**: Compete in the match (unlimited players)
   - **Join as Spectator**: Watch the match (unlimited spectators)
5. **Wait for Host** to start the match (minimum 2 players required)

#### Playing VS Mode
1. **Countdown**: 3-2-1 countdown before each round
2. **View Challenge**: All players see the same challenge simultaneously
   - **Base Stats**: View Pokémon stats
   - **Learnset**: View learnable moves
   - **Damage Calc**: View battle scenario with slider
3. **Submit Answer**: 
   - **Base Stats & Learnset**: Select Pokémon from list
   - **Damage Calc**: Adjust slider (0-200%), submit guess
   - Locked after first submission
4. **Time-Based Scoring**: 
   - Correct answers: 1000 points (instant) → 100 points (at deadline)
   - Damage mode: ±5% tolerance
   - Incorrect answers: 0 points
   - All players can score, not just first to answer
5. **Round Results**: See all players' scores for that round
   - Top scorer gets a crown indicator
   - Individual round scores displayed (+X points)
6. **Next Round**: Automatic advance after 3 seconds
7. **Match End**: 
   - **Rounds Mode**: After completing all rounds
   - **Target Score Mode**: When any player reaches target score
8. **Leaderboard**: Final standings sorted by total score
9. **Play Again**: Host can restart the game (non-hosts wait)

#### VS Mode Features
- **N-Player Scaling**: UI adapts for 2-10+ players with compact player cards
- **Live Player Status**: See how many players have answered each round
- **Fair Timing**: All timestamps recorded by host to prevent clock manipulation
- **Answer Locking**: Cannot change answer after submission (prevents gaming the system)
- **Session Recovery**: Automatically reconnect if disconnected
- **Forfeit**: Gracefully exit with confirmation (game ends if less than 2 players remain)
- **Spectator View**: Watch matches without participating
- **Real-time Sync**: All players see the same state via host's clock
- **Host Controls**: Only host can adjust settings and restart matches
- **Dynamic Player List**: Join/leave during lobby, frozen during gameplay

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

### Three Quiz Modes

**Base Stats Quiz**
- Identify Pokémon from HP, Attack, Defense, Special Attack, Special Defense, and Speed
- Smart selection accepts any Pokémon with matching stats
- Hints reveal types and abilities

**Learnset Quiz**
- Identify Pokémon from their learnable moves
- Moves grouped by type and sorted alphabetically
- Generation-aware (shows only moves available in selected generation)
- Base forms only (no alternate forms like Pikachu-Alola)
- Auto-retries if Pokémon has no moves in selected generation

**Damage Calc Quiz**
- Guess damage percentage from competitive battle scenarios
- Interactive slider interface (0-200% with 1% increments)
- Shows detailed matchup: attacker, defender, move, abilities, items, natures, EVs
- ±5% tolerance for correct answers
- Uses real competitive sets from Smogon for Gen 1-9
- Filters out CAP Pokémon and non-standard metagames
- Dynamic loading with code-splitting per generation (saves bandwidth)
- Respects all settings (generation range, fully evolved, mega filter)

### Smart Selection System
The Base Stats quiz doesn't require exact Pokémon names. If a Pokémon has identical base stats to the displayed stats, it's considered correct. This allows for legitimate alternatives.

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
- Damage scenarios are limited to 1-200% damage range (filtered by generator)
- Learnset quiz uses base forms only (no alternate forms)
- Some older generation Pokémon may have limited competitive sets available
- VS Mode requires all players to have stable internet connections
- VS Mode uses a free PeerJS server which may have occasional downtime
- Room codes expire when all players disconnect
- VS Mode time limit is mandatory (minimum 10 seconds) to ensure fair scoring
- Host disconnection ends the match (all state managed by host)

## 📦 Dependencies

See `package.json` for complete dependency list. Key packages:
- `vue` (3.5.24) - Framework
- `tailwindcss` (4.1.18) - Styling
- `vue-i18n` (11.2.8) - Localization
- `@pkmn/dex` (0.10.6) - Pokémon data
- `@pkmn/data` (0.10.6) - Learnset data
- `@smogon/calc` (0.10.0) - Damage calculation
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
- Comprehensive unit testing (300+ tests)
- Performance optimization (infinite scrolling, lazy loading)
- Advanced randomization algorithms with history tracking
- Responsive design with mobile-first approach
- Auto-import configuration for development efficiency
- Scalable N-player architecture with time-based scoring

The codebase serves as a reference for combining AI assistance with best practices in web development. All features were implemented iteratively with quality assurance and comprehensive testing. The VS Mode showcases advanced real-time multiplayer capabilities entirely in the browser without requiring a backend server, now supporting unlimited players with fair time-based scoring. Recent major enhancements include:

- **Three Quiz Modes**: Base Stats (original), Learnset (move recognition), and Damage Calc (battle scenario prediction)
- **Advanced Damage Calculations**: Integration with @smogon/calc for realistic competitive battle damage using 4798 Pokémon across Gen 1-9
- **Dynamic Data Loading**: Lazy-loading with code-splitting per generation (saves ~3.6MB total, loads only needed gen)
- **Smart Filtering**: CAP Pokémon exclusion, non-standard metagame filtering, empty learnset handling
- **Interactive Slider UI**: Smooth 0-200% damage input with cursor feedback and prominent value display
- **Code Quality**: Refactored components to maximize reusability with useQuizLogic composable
- **Settings Reactivity**: All quiz modes respond instantly to configuration changes
- **Form Filtering**: Learnset quiz uses base forms only (prevents confusion with alternate forms)
