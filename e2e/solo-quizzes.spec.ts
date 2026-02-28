import { expect, test, type Page } from '@playwright/test'

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

test.describe('Solo quiz gameplay', () => {
  test.beforeEach(async ({ page }) => {
    await setEnglishLocale(page)
  })

  test('plays all solo quiz modes and verifies sprites/images render', async ({ page }) => {
    await page.goto('/#/solo/base-stats')
    await expect(page.getByRole('heading', { name: 'Pokémon Quiz Hub' })).toBeVisible()
    await answerPokemonSelector(page, 'Charizard')
    await expect(page.locator('img').first()).toBeVisible()
    await expect(page.getByText(/Correct!|Incorrect!/)).toBeVisible()

    await page.goto('/#/solo/learnset')
    await expect(page.getByRole('heading', { name: 'Learnset Quiz' })).toBeVisible()
    await answerPokemonSelector(page, 'Charizard')
    await expect(page.locator('img').first()).toBeVisible()
    await expect(page.getByText(/Correct!|Incorrect!/)).toBeVisible()

    await page.goto('/#/solo/damage')
    await expect(page.getByRole('heading', { name: 'Singles Damage Quiz' })).toBeVisible()
    await expect(page.locator('img').first()).toBeVisible()
    await page.getByRole('button', { name: 'Submit' }).click()
    await expect(page.getByText(/actual range was/i)).toBeVisible()

    await page.goto('/#/solo/weight')
    await expect(page.getByRole('heading', { name: 'Weight Quiz' })).toBeVisible()
    await expect(page.locator('img').first()).toBeVisible()
    await page.locator('button', { hasText: /kg/ }).first().click()
    await expect(page.getByText(/actual value is/i)).toBeVisible()

    await page.goto('/#/solo/height')
    await expect(page.getByRole('heading', { name: 'Height Quiz' })).toBeVisible()
    await expect(page.locator('img').first()).toBeVisible()
    await page.locator('button', { hasText: / m$/ }).first().click()
    await expect(page.getByText(/actual value is/i)).toBeVisible()
  })

  test('supports alternate solo configuration route (VGC damage)', async ({ page }) => {
    await page.goto('/#/solo/damage/vgc')
    await expect(page.getByRole('heading', { name: 'VGC Damage Quiz' })).toBeVisible()
    await expect(page.getByText('Lv. 50').first()).toBeVisible()
    await expect(page.locator('img').first()).toBeVisible()
  })
})
