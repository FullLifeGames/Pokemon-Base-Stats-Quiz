import { expect, test, type Page } from '@playwright/test'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

async function setEnglishLocale(page: Page) {
  await page.addInitScript(() => {
    localStorage.setItem('locale', 'en')
  })
}

async function answerPokemonSelector(page: Page, pokemonName: string) {
  await page.getByRole('combobox').click()
  await page.getByPlaceholder('Search Pokémon...').fill(pokemonName)
  await page.getByText(new RegExp(`^${pokemonName}$`, 'i')).first().click()
}

// ---------------------------------------------------------------------------
// Base Stat Quiz
// ---------------------------------------------------------------------------

test.describe('Solo – Base Stat Quiz', () => {
  test.beforeEach(async ({ page }) => {
    await setEnglishLocale(page)
  })

  test('loads the quiz with a stat table, timer, and score counters', async ({ page }) => {
    await page.goto('/#/solo/base-stats')
    await expect(page.getByRole('heading', { name: 'Pokémon Quiz Hub' })).toBeVisible()
    // Stat table should render (HP, Atk, Def, SpA, SpD, Spe labels)
    await expect(page.getByText('HP').first()).toBeVisible()
    await expect(page.getByText('Atk').first()).toBeVisible()
    // Score counters present
    await expect(page.getByText(/Correct: 0/)).toBeVisible()
    await expect(page.getByText(/Incorrect: 0/)).toBeVisible()
    // Timer is running (00:0x)
    await expect(page.getByText(/\d{2}:\d{2}/)).toBeVisible()
  })

  test('submitting a guess shows correct/incorrect result and advances', async ({ page }) => {
    await page.goto('/#/solo/base-stats')

    await answerPokemonSelector(page, 'Charizard')

    // A result banner should appear
    await expect(page.getByText(/✓ Correct!|✗ Incorrect!/)).toBeVisible()
    // A sprite image should render
    await expect(page.locator('img').first()).toBeVisible()
  })

  test('reset quiz button resets score to 0/0', async ({ page }) => {
    await page.goto('/#/solo/base-stats')

    // Answer a question first
    await answerPokemonSelector(page, 'Charizard')
    await expect(page.getByText(/✓ Correct!|✗ Incorrect!/)).toBeVisible()

    // Click reset
    await page.getByRole('button', { name: 'Reset Quiz' }).click()

    // Score should be back to 0/0
    await expect(page.getByText(/Correct: 0/)).toBeVisible()
    await expect(page.getByText(/Incorrect: 0/)).toBeVisible()
  })

  test('hints can be requested', async ({ page }) => {
    await page.goto('/#/solo/base-stats')

    // Request first hint (types)
    const hintBtn = page.getByRole('button', { name: /hint/i })
    if (await hintBtn.isVisible()) {
      await hintBtn.click()
      // After hint is revealed, a hint display area should appear with type info
      await expect(page.getByText(/Type|types/i)).toBeVisible()
    }
  })
})

// ---------------------------------------------------------------------------
// Learnset Quiz
// ---------------------------------------------------------------------------

test.describe('Solo – Learnset Quiz', () => {
  test.beforeEach(async ({ page }) => {
    await setEnglishLocale(page)
  })

  test('loads the learnset quiz with move list', async ({ page }) => {
    await page.goto('/#/solo/learnset')
    await expect(page.getByRole('heading', { name: 'Learnset Quiz' })).toBeVisible()
    // Wait for the loading spinner to disappear and moves to render
    await expect(page.locator('.animate-spin')).toBeHidden({ timeout: 30_000 })
    // Some move name text should be present in the move list
    await expect(page.locator('table, [class*="grid"]').first()).toBeVisible({ timeout: 15_000 })
  })

  test('submitting a guess shows correct/incorrect result', async ({ page }) => {
    await page.goto('/#/solo/learnset')
    await expect(page.locator('.animate-spin')).toBeHidden({ timeout: 30_000 })

    await answerPokemonSelector(page, 'Charizard')

    await expect(page.getByText(/✓ Correct!|✗ Incorrect!/)).toBeVisible()
    await expect(page.locator('img').first()).toBeVisible()
  })

  test('score increments after answering', async ({ page }) => {
    await page.goto('/#/solo/learnset')
    await expect(page.locator('.animate-spin')).toBeHidden({ timeout: 30_000 })

    // Initial state
    await expect(page.getByText(/Correct: 0/)).toBeVisible()

    await answerPokemonSelector(page, 'Charizard')

    // One of the counters should have incremented
    await expect(page.getByText(/Correct: 1|Incorrect: 1/)).toBeVisible()
  })
})

// ---------------------------------------------------------------------------
// Damage Quiz (Singles)
// ---------------------------------------------------------------------------

test.describe('Solo – Damage Quiz (Singles)', () => {
  test.beforeEach(async ({ page }) => {
    await setEnglishLocale(page)
  })

  test('loads damage quiz with scenario display and slider', async ({ page }) => {
    await page.goto('/#/solo/damage')
    await expect(page.getByRole('heading', { name: 'Singles Damage Quiz' })).toBeVisible()
    // Sprites should render for attacker/defender
    await expect(page.locator('img').first()).toBeVisible({ timeout: 30_000 })
    // Slider should be present
    await expect(page.getByText(/How much % damage/)).toBeVisible()
    // Submit button
    await expect(page.getByRole('button', { name: 'Submit' })).toBeVisible()
  })

  test('submitting a damage guess shows the actual range', async ({ page }) => {
    await page.goto('/#/solo/damage')
    await expect(page.locator('img').first()).toBeVisible({ timeout: 30_000 })

    await page.getByRole('button', { name: 'Submit' }).click()

    // Result should show the actual damage range
    await expect(page.getByText(/actual range was/i)).toBeVisible()
  })

  test('score is tracked after submitting', async ({ page }) => {
    await page.goto('/#/solo/damage')
    await expect(page.locator('img').first()).toBeVisible({ timeout: 30_000 })
    await expect(page.getByText(/Correct: 0/)).toBeVisible()

    await page.getByRole('button', { name: 'Submit' }).click()

    await expect(page.getByText(/Correct: 1|Incorrect: 1/)).toBeVisible()
  })
})

// ---------------------------------------------------------------------------
// Damage Quiz (VGC)
// ---------------------------------------------------------------------------

test.describe('Solo – Damage Quiz (VGC)', () => {
  test.beforeEach(async ({ page }) => {
    await setEnglishLocale(page)
  })

  test('loads with VGC title and Lv. 50', async ({ page }) => {
    await page.goto('/#/solo/damage/vgc')
    await expect(page.getByRole('heading', { name: 'VGC Damage Quiz' })).toBeVisible()
    await expect(page.getByText('Lv. 50').first()).toBeVisible()
    await expect(page.locator('img').first()).toBeVisible({ timeout: 30_000 })
  })

  test('submitting a VGC damage guess shows the actual range', async ({ page }) => {
    await page.goto('/#/solo/damage/vgc')
    await expect(page.locator('img').first()).toBeVisible({ timeout: 30_000 })

    await page.getByRole('button', { name: 'Submit' }).click()

    await expect(page.getByText(/actual range was/i)).toBeVisible()
  })
})

// ---------------------------------------------------------------------------
// Weight Quiz
// ---------------------------------------------------------------------------

test.describe('Solo – Weight Quiz', () => {
  test.beforeEach(async ({ page }) => {
    await setEnglishLocale(page)
  })

  test('loads weight quiz with Pokémon sprite and option grid', async ({ page }) => {
    await page.goto('/#/solo/weight')
    await expect(page.getByRole('heading', { name: 'Weight Quiz' })).toBeVisible()
    await expect(page.locator('img').first()).toBeVisible()
    // Options should contain "kg"
    await expect(page.locator('button', { hasText: /kg/ }).first()).toBeVisible()
  })

  test('selecting a weight option shows correct/incorrect result', async ({ page }) => {
    await page.goto('/#/solo/weight')
    await expect(page.locator('img').first()).toBeVisible()

    await page.locator('button', { hasText: /kg/ }).first().click()

    await expect(page.getByText(/actual value is/i)).toBeVisible()
  })

  test('score tracks correctly', async ({ page }) => {
    await page.goto('/#/solo/weight')
    await expect(page.locator('img').first()).toBeVisible()
    await expect(page.getByText(/Correct: 0/)).toBeVisible()

    await page.locator('button', { hasText: /kg/ }).first().click()

    await expect(page.getByText(/Correct: 1|Incorrect: 1/)).toBeVisible()
  })
})

// ---------------------------------------------------------------------------
// Height Quiz
// ---------------------------------------------------------------------------

test.describe('Solo – Height Quiz', () => {
  test.beforeEach(async ({ page }) => {
    await setEnglishLocale(page)
  })

  test('loads height quiz with Pokémon sprite and option grid', async ({ page }) => {
    await page.goto('/#/solo/height')
    await expect(page.getByRole('heading', { name: 'Height Quiz' })).toBeVisible()
    await expect(page.locator('img').first()).toBeVisible()
    // Options should contain "m"
    await expect(page.locator('button', { hasText: / m$/ }).first()).toBeVisible()
  })

  test('selecting a height option shows correct/incorrect result', async ({ page }) => {
    await page.goto('/#/solo/height')
    await expect(page.locator('img').first()).toBeVisible()

    await page.locator('button', { hasText: / m$/ }).first().click()

    await expect(page.getByText(/actual value is/i)).toBeVisible()
  })

  test('score tracks correctly', async ({ page }) => {
    await page.goto('/#/solo/height')
    await expect(page.locator('img').first()).toBeVisible()
    await expect(page.getByText(/Correct: 0/)).toBeVisible()

    await page.locator('button', { hasText: / m$/ }).first().click()

    await expect(page.getByText(/Correct: 1|Incorrect: 1/)).toBeVisible()
  })
})

// ---------------------------------------------------------------------------
// Navigation & Mode Selection
// ---------------------------------------------------------------------------

test.describe('Navigation', () => {
  test.beforeEach(async ({ page }) => {
    await setEnglishLocale(page)
  })

  test('home page shows Solo and VS mode cards', async ({ page }) => {
    await page.goto('/')
    await expect(page.getByRole('heading', { name: /Pokémon Quiz/i })).toBeVisible()
    await expect(page.getByText('Solo')).toBeVisible()
    await expect(page.getByText('VS')).toBeVisible()
  })

  test('clicking Solo card navigates to base-stat quiz', async ({ page }) => {
    await page.goto('/')
    await page.getByText('Solo').click()
    await expect(page).toHaveURL(/\/#\/solo\/base-stats/)
    await expect(page.getByRole('heading', { name: 'Pokémon Quiz Hub' })).toBeVisible()
  })

  test('clicking VS card navigates to VS Mode', async ({ page }) => {
    await page.goto('/')
    await page.getByText('VS').click()
    await expect(page).toHaveURL(/\/#\/vs/)
    await expect(page.getByRole('heading', { name: 'VS Mode' })).toBeVisible()
  })

  test('language toggle switches between English and German', async ({ page }) => {
    await page.goto('/')
    await expect(page.getByText('English')).toBeVisible()
    await page.getByText('English').click()
    await page.getByText('Deutsch').click()
    // After switching, the title should be in German
    await expect(page.getByRole('heading', { name: /Pokémon-Quiz-Hub/i })).toBeVisible()
  })
})
