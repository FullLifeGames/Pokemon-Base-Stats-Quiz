# Pokémon Quiz - Testing Guide

This document provides comprehensive information about testing in the Pokémon Quiz Hub project. The project uses **Vitest** with **Vue Test Utils** for unit testing all components and composables.

## 📊 Test Coverage Overview

**Total: 306 tests across 20 test files** - All passing ✅

### Component Tests (17 test files, 261 tests)
- **BaseStatQuiz.test.ts** - Base stats quiz component (7 tests)
- **LearnsetQuiz.test.ts** - Learnset quiz component (TBD)
- **DamageQuiz.test.ts** - Damage calculation quiz (TBD)
- **SoloQuiz.test.ts** - Solo quiz container with routing (10 tests)
- **VsMode.test.ts** - VS Mode coordinator (22 tests)
- **VsLobby.test.ts** - Multiplayer lobby (25 tests)
- **VsGame.test.ts** - Multiplayer game screen (26 tests)
- **VsResults.test.ts** - Match results screen (21 tests)
- **StatDisplay.test.ts** - Base stats visualization (21 tests)
- **PokemonSelector.test.ts** - Pokémon picker with infinite scroll (23 tests)
- **HintDisplay.test.ts** - Hint display component (24 tests)
- **PlayerCard.test.ts** - VS Mode player card (17 tests)
- **GenerationSelect.test.ts** - Generation dropdown (7 tests)
- **SpritesRenderer.test.ts** - Pokémon sprite rendering (2 tests)
- **IconRenderer.test.ts** - Pokémon icon rendering (2 tests)
- **ModeToggle.test.ts** - Dark/light mode toggle (2 tests)
- **ModeSelection.test.ts** - Quiz mode selection (12 tests)
- **AppSidebar.test.ts** - Settings sidebar (2 tests)
- **App.test.ts** - Root application component (4 tests)

### Composable Tests (3 test files, 45 tests)
- **useQuizLogic.test.ts** - Shared quiz logic including randomization, filtering, stat matching (35 tests)
- **useVsGame.test.ts** - VS Mode game state management (30 tests)
- **usePeerConnection.test.ts** - WebRTC connection management (14 tests)

## 🚀 Running Tests

### Quick Commands

```bash
# Run all tests once (CI mode)
pnpm test --run

# Run tests in watch mode (re-runs on file changes)
pnpm test

# Open interactive test UI dashboard
pnpm test:ui

# Generate coverage report
pnpm test:coverage
```

### Watch Mode Features
- Automatically re-runs tests when files change
- Press `a` to run all tests
- Press `f` to run only failed tests
- Press `p` to filter by test file name
- Press `t` to filter by test name pattern
- Press `q` to quit

### Coverage Reports
Coverage reports are generated in the `coverage/` directory and include:
- HTML reports (open `coverage/index.html` in browser)
- JSON summary for CI integration
- Line, branch, function, and statement coverage metrics

## 📁 Test Structure

```
src/
├── components/
│   ├── __tests__/           # Component unit tests
│   │   ├── App.test.ts
│   │   ├── AppSidebar.test.ts
│   │   ├── BaseStatQuiz.test.ts
│   │   ├── DamageQuiz.test.ts (TBD)
│   │   ├── GenerationSelect.test.ts
│   │   ├── HintDisplay.test.ts
│   │   ├── IconRenderer.test.ts
│   │   ├── LearnsetQuiz.test.ts (TBD)
│   │   ├── ModeSelection.test.ts
│   │   ├── ModeToggle.test.ts
│   │   ├── PlayerCard.test.ts
│   │   ├── PokemonSelector.test.ts
│   │   ├── SoloQuiz.test.ts
│   │   ├── SpritesRenderer.test.ts
│   │   ├── StatDisplay.test.ts
│   │   ├── VsGame.test.ts
│   │   ├── VsLobby.test.ts
│   │   ├── VsMode.test.ts
│   │   └── VsResults.test.ts
├── composables/
│   ├── __tests__/           # Composable unit tests
│   │   ├── usePeerConnection.test.ts
│   │   ├── useQuizLogic.test.ts
│   │   └── useVsGame.test.ts
vitest.config.ts             # Vitest configuration
vitest.setup.ts              # Global test setup
```

## ⚙️ Configuration

### vitest.config.ts
```typescript
import { defineConfig, mergeConfig } from 'vitest/config'
import viteConfig from './vite.config'

export default mergeConfig(
  viteConfig,
  defineConfig({
    test: {
      globals: true,
      environment: 'happy-dom',
      setupFiles: ['./vitest.setup.ts'],
      coverage: {
        provider: 'v8',
        reporter: ['text', 'json', 'html'],
        exclude: [
          'node_modules/',
          'src/components/ui/**', // shadcn-vue components
          '*.config.*',
          '**/dist/**',
        ],
      },
    },
  }),
)
```

### vitest.setup.ts
Global setup includes:
- **i18n mock** - Provides translation functions for all tests
- **window.matchMedia mock** - Required for responsive design testing
- **Auto-imports** - Vue Composition API functions available without imports

## ✍️ Writing Tests

### Basic Component Test Template

```typescript
import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import YourComponent from '@/components/YourComponent.vue'

describe('YourComponent.vue', () => {
  describe('Rendering', () => {
    it('renders correctly', () => {
      const wrapper = mount(YourComponent, {
        props: {
          // your props
        },
      })
      expect(wrapper.exists()).toBe(true)
    })
  })

  describe('Props', () => {
    it('accepts and displays props', () => {
      const wrapper = mount(YourComponent, {
        props: { message: 'Hello' },
      })
      expect(wrapper.text()).toContain('Hello')
    })
  })

  describe('Events', () => {
    it('emits events on interaction', async () => {
      const wrapper = mount(YourComponent)
      await wrapper.find('button').trigger('click')
      expect(wrapper.emitted('click')).toBeTruthy()
    })
  })
})
```

### Testing Composables

```typescript
import { describe, it, expect } from 'vitest'
import { useYourComposable } from '@/composables/useYourComposable'

describe('useYourComposable', () => {
  it('returns expected values', () => {
    const { value, method } = useYourComposable()
    expect(value.value).toBe(expectedValue)
  })

  it('reacts to changes', () => {
    const { state, updateState } = useYourComposable()
    updateState('new value')
    expect(state.value).toBe('new value')
  })
})
```

### Mocking Strategies

#### Stub Child Components
```typescript
const wrapper = mount(ParentComponent, {
  global: {
    stubs: {
      ChildComponent: true, // Simple stub
      ComplexChild: {
        template: '<div>Mocked Child</div>',
      },
    },
  },
})
```

#### Mock Vue Router
```typescript
import { vi } from 'vitest'

vi.mock('vue-router', () => ({
  useRoute: () => ({
    meta: { quizMode: 'base-stat', vgc: false },
  }),
  useRouter: () => ({
    push: vi.fn(),
  }),
}))
```

#### Mock Composables
```typescript
vi.mock('@/composables/usePeerConnection', () => ({
  usePeerConnection: () => ({
    isHosting: ref(false),
    connections: ref([]),
    sendToAll: vi.fn(),
  }),
}))
```

#### Mock External Libraries
```typescript
vi.mock('@pkmn/dex', () => ({
  Dex: {
    forGen: () => ({
      species: mockSpeciesData,
    }),
  },
}))
```

## 🧪 Testing Best Practices

### 1. Test Organization
- Group related tests using `describe` blocks
- Use descriptive test names: `it('should render error message when validation fails')`
- Follow Arrange-Act-Assert pattern

### 2. Test Independence
- Each test should be independent and not rely on others
- Use `beforeEach` for common setup
- Clean up after tests when necessary

### 3. Async Testing
```typescript
it('handles async operations', async () => {
  const wrapper = mount(Component)
  await wrapper.find('button').trigger('click')
  await wrapper.vm.$nextTick()
  expect(wrapper.text()).toContain('Updated')
})
```

### 4. Testing User Interactions
```typescript
it('responds to user input', async () => {
  const wrapper = mount(Component)
  const input = wrapper.find('input')
  await input.setValue('test value')
  await input.trigger('blur')
  expect(wrapper.emitted('update:modelValue')).toBeTruthy()
})
```

### 5. Snapshot Testing (Use Sparingly)
```typescript
it('matches snapshot', () => {
  const wrapper = mount(Component, { props })
  expect(wrapper.html()).toMatchSnapshot()
})
```

## 🔍 Test Coverage Details

### High Coverage Areas
- ✅ Quiz logic (randomization, filtering, matching)
- ✅ VS Mode (multiplayer game state, player management)
- ✅ Component rendering and props
- ✅ Event emission and handling
- ✅ Settings management and reactivity
- ✅ Peer-to-peer connection management

### Areas Needing Tests
- ⚠️ DamageQuiz.vue component
- ⚠️ LearnsetQuiz.vue component
- ⚠️ DamageScenarioDisplay.vue component
- ⚠️ LearnsetDisplay.vue component
- ⚠️ useDamageCalc.ts composable
- ⚠️ useLearnsetData.ts composable

## 🐛 Common Testing Issues

### Issue: i18n Translation Errors
**Problem**: Tests fail with missing translation keys
```
[intlify] Not found 'key.name' key in 'en' locale messages
```
**Solution**: Add keys to `vitest.setup.ts`:
```typescript
createI18n({
  legacy: false,
  locale: 'en',
  messages: {
    en: {
      'key.name': 'Translation',
    },
  },
})
```

### Issue: Router Injection Not Found
**Problem**: Component uses `useRoute()` but router is not provided
```
TypeError: Cannot read properties of undefined (reading 'meta')
```
**Solution**: Mock vue-router in test file:
```typescript
vi.mock('vue-router', () => ({
  useRoute: () => ({ meta: {} }),
}))
```

### Issue: Window.matchMedia Errors
**Problem**: Tests fail with matchMedia undefined
```
TypeError: window.matchMedia is not a function
```
**Solution**: Already handled in `vitest.setup.ts`, ensure setup file is loaded

### Issue: Async Component Updates
**Problem**: Assertions fail because component hasn't updated yet
**Solution**: Use `await wrapper.vm.$nextTick()` or `await flushPromises()`

### Issue: Flaky Tests
**Problem**: Tests pass/fail randomly (especially randomization tests)
**Solution**: Use appropriate tolerance for probabilistic tests:
```typescript
// Instead of exact assertions
expect(immediateRepeatCount).toBeLessThan(5) // Allow statistical variance
```

## 🔄 CI/CD Integration

### GitHub Actions Example
```yaml
name: Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: pnpm/action-setup@v2
        with:
          version: 10.28.2
      - uses: actions/setup-node@v3
        with:
          node-version: 20
          cache: 'pnpm'
      - run: pnpm install
      - run: pnpm test --run
      - name: Upload coverage
        uses: codecov/codecov-action@v3
        with:
          files: ./coverage/coverage-final.json
```

## 📚 Testing Resources

### Documentation
- [Vitest Documentation](https://vitest.dev/) - Test framework
- [Vue Test Utils](https://test-utils.vuejs.org/) - Vue component testing
- [Happy DOM](https://github.com/capricorn86/happy-dom) - DOM implementation
- [Testing Library](https://testing-library.com/docs/vue-testing-library/intro/) - Testing best practices

### Useful Commands
```bash
# Run specific test file
pnpm test BaseStatQuiz.test.ts

# Run tests matching pattern
pnpm test --grep "renders correctly"

# Update snapshots
pnpm test -u

# Run with verbose output
pnpm test --reporter=verbose

# Run with specific timeout
pnpm test --test-timeout=10000
```

## 🎯 Testing Checklist for New Features

When adding a new feature, ensure:
- [ ] Component renders without errors
- [ ] Props are validated and used correctly
- [ ] Events are emitted at appropriate times
- [ ] User interactions work as expected
- [ ] Edge cases are handled (empty states, errors)
- [ ] Async operations are properly awaited
- [ ] i18n keys are defined in test setup
- [ ] Child components are appropriately stubbed
- [ ] Tests are independent and don't affect each other
- [ ] Test names clearly describe what's being tested

## 📈 Future Testing Goals

- Increase coverage to 90%+ for all composables
- Add E2E tests with Playwright
- Add visual regression testing
- Implement performance testing for large datasets
- Add accessibility testing with axe-core
- Create integration tests for complete user flows

---

**Last Updated**: Current test count reflects all implemented tests as of the latest commit. Run `pnpm test --run` to verify all tests pass.
