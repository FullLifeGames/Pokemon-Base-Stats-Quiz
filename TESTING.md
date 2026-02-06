# Pokémon Quiz - Testing Guide

This project uses **Vitest** for unit testing Vue components.

## Setup

Testing dependencies have been installed:
- `vitest` - Fast unit test framework
- `@vue/test-utils` - Official Vue component testing library
- `@vitest/ui` - Visual UI for test results
- `happy-dom` - Lightweight DOM implementation for testing
- `@testing-library/vue` - Testing utilities for Vue

## Running Tests

### Run tests once
```bash
pnpm test --run
```

### Run tests in watch mode (re-runs on file changes)
```bash
pnpm test
```

### Run tests with UI dashboard
```bash
pnpm test:ui
```

### Run tests with coverage report
```bash
pnpm test:coverage
```

## Test Files

Test files are located in `src/components/__tests__/` and follow the naming convention `*.test.ts`.

Currently tested components:
- **GenerationSelect.test.ts** - Tests for the generation dropdown component (7 tests)
- **ModeToggle.test.ts** - Tests for dark/light mode toggle (2 tests)
- **BaseStatQuiz.test.ts** - Tests for the main quiz component (7 tests)
- **AppSidebar.test.ts** - Tests for settings structure (2 tests)
- **App.test.ts** - Tests for root component (4 tests)

**Total: 22 passing tests**

## Test Coverage

The tests cover:
- Component rendering
- Props and bindings
- Event emission
- Settings management
- Timer functionality
- Stats display
- Multi-language support (i18n setup)

## Configuration Files

- **vitest.config.ts** - Vitest configuration
  - Uses `happy-dom` environment (lightweight DOM)
  - Path alias configured for `@` imports
  - Coverage reporting enabled

- **vitest.setup.ts** - Global test setup
  - i18n mock with translations
  - Window.matchMedia mock for responsive design testing

## Writing New Tests

When adding new tests:

1. Create a file in `src/components/__tests__/ComponentName.test.ts`
2. Import test utilities:
   ```typescript
   import { describe, it, expect } from 'vitest'
   import { mount } from '@vue/test-utils'
   import YourComponent from '@/components/YourComponent.vue'
   ```

3. Structure your test:
   ```typescript
   describe('YourComponent.vue', () => {
     it('should do something', () => {
       const wrapper = mount(YourComponent, {
         props: { /* your props */ },
         global: {
           stubs: { /* stub child components */ }
         }
       })
       expect(wrapper.exists()).toBe(true)
     })
   })
   ```

## Components NOT Tested

UI components from shadcn-vue (in `src/components/ui/`) are not tested as they are pre-built library components with their own test suites.

## CI/CD Integration

To add tests to your CI/CD pipeline, add this script to your `.github/workflows/ci.yml`:
```yaml
- name: Run Tests
  run: pnpm test --run
```

## Troubleshooting

### Common Issues

1. **i18n errors** - The setup file includes i18n mock. If you add new keys, update `vitest.setup.ts`
2. **Component stubs** - When testing components with complex children, stub them with `{ componentName: true }`
3. **Async tests** - Always use `await` for async operations and use `async` in your test function

## Resources

- [Vitest Documentation](https://vitest.dev/)
- [Vue Test Utils Guide](https://test-utils.vuejs.org/)
- [Testing Library Best Practices](https://testing-library.com/docs/vue-testing-library/intro/)
