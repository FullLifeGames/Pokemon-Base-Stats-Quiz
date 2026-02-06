# Pokémon Base Stats Quiz

A fully-featured interactive quiz application that challenges users to identify Pokémon based on their base statistics. Built with modern web technologies and comprehensive testing capabilities.

## 🎮 Features

### Core Gameplay
- **Base Stats Recognition**: Displays HP, Attack, Defense, Special Attack, Special Defense, and Speed stats
- **Smart Selection**: Accepts any Pokémon with matching stats (not just the exact name)
- **Real-Time Scoring**: Track correct and incorrect answers with live counters
- **Progress Animation**: Smooth loading animation between questions with auto-advance
- **Timer**: Tracks quiz duration during guessing and pauses during results

### Customization & Settings
- **Generation Filters**: Set minimum and maximum Pokémon generations (1-9)
- **Evolution Stage Filter**: Option to show only fully evolved Pokémon
- **Win Condition**: Configure custom win scores (default: 10 correct answers)
- **Dynamic Difficulty**: Adjust quiz parameters on-the-fly

### Internationalization
- **English & German Support**: Full i18n implementation with vue-i18n
- **Locale Persistence**: Remembers user's language preference
- **Translated Pokémon Names**: 1350+ German Pokémon names from PokéAPI

### User Interface
- **Dark/Light Mode**: Toggle theme with animated transitions
- **Responsive Design**: Works seamlessly on mobile, tablet, and desktop
- **Modern Components**: Built with shadcn-vue for polished UI
- **Congratulations Dialog**: Celebrates quiz completion with final stats

### Testing & Quality
- **22 Unit Tests**: Comprehensive test coverage with Vitest
- **Type Safety**: Full TypeScript support throughout
- **CI-Ready**: Tests can be integrated into GitHub Actions

## 🛠️ Tech Stack

### Frontend Framework
- **Vue 3** - Progressive JavaScript framework
- **TypeScript** - Type-safe development
- **Vite** - Lightning-fast build tool

### Data & Localization
- **@pkmn/dex** (v0.10.6) - Pokémon stats and species data
- **PokéAPI v2** - German Pokémon localization
- **vue-i18n** (v11.2.8) - Internationalization

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
│   ├── __tests__/              # Unit tests (22 tests)
│   ├── BaseStatQuiz.vue        # Main quiz component
│   ├── AppSidebar.vue          # Settings sidebar
│   ├── GenerationSelect.vue    # Reusable generation dropdown
│   ├── ModeToggle.vue          # Dark/light mode toggle
│   └── ui/                     # shadcn-vue components
├── types/
│   └── settings.ts             # Quiz settings interface
├── lib/
│   ├── utils.ts               # Utility functions
│   └── pokemonNameHelper.ts   # Pokémon name localization
├── i18n/
│   └── locales/
│       ├── en.json            # English translations
│       └── de.json            # German translations
├── App.vue                     # Root component
└── main.ts                     # Entry point

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
git clone <repository-url>
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

**Test Coverage**: 22 unit tests covering all custom components
- GenerationSelect: 7 tests
- BaseStatQuiz: 7 tests
- ModeToggle: 2 tests
- App: 4 tests
- AppSidebar: 2 tests

For detailed testing information, see [TESTING.md](./TESTING.md)

## 📖 Usage

1. **Configure Settings** (Left Sidebar):
   - Set generation range (minimum & maximum)
   - Toggle fully evolved Pokémon only
   - Set win score goal

2. **Play the Quiz**:
   - View displayed base stats
   - Search and select the Pokémon
   - Watch score update and timer count

3. **Win the Quiz**:
   - Reach the configured win score
   - View congratulations dialog with final stats and time
   - Reset to play again

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

## 📦 Dependencies

See `package.json` for complete dependency list. Key packages:
- `vue` (3.5.24) - Framework
- `tailwindcss` (4.1.18) - Styling
- `vue-i18n` (11.2.8) - Localization
- `@pkmn/dex` (0.10.6) - Data
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

The codebase serves as a reference for combining AI assistance with best practices in web development. All features were implemented iteratively with quality assurance and comprehensive testing.
