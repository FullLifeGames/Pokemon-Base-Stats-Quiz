import { expect, test, type BrowserContext, type Page } from '@playwright/test'

async function configureContext(context: BrowserContext) {
  await context.addInitScript(() => {
    localStorage.setItem('locale', 'en')
    sessionStorage.clear()
    localStorage.removeItem('pokemon-quiz-vs-session')
  })
}

async function getRoomCode(page: Page): Promise<string> {
  const roomCodeElement = page.locator('div.font-mono.font-bold').first()
  await expect(roomCodeElement).toBeVisible()
  const code = (await roomCodeElement.innerText()).replace(/\s+/g, '')
  return code
}

test.describe('Multiplayer flow', () => {
  test('host and player can create/join room, start match, submit answers, and render sprites', async ({ browser }) => {
    const hostContext = await browser.newContext()
    const guestContext = await browser.newContext()

    await configureContext(hostContext)
    await configureContext(guestContext)

    const host = await hostContext.newPage()
    const guest = await guestContext.newPage()

    await host.goto('/#/vs')
    await expect(host.getByRole('heading', { name: 'VS Mode' })).toBeVisible()

    await host.getByPlaceholder('Enter your name...').fill('HostPlayer')
    await host.getByRole('button', { name: 'Weight' }).click()

    const roundsInput = host.locator('label:has-text("Number of Rounds")').locator('..').locator('input')
    await roundsInput.fill('1')

    await host.getByRole('button', { name: 'Create Room' }).last().click()

    const roomCode = await getRoomCode(host)
    expect(roomCode).toMatch(/^[A-Z0-9]{6}$/)

    await guest.goto('/#/vs')
    await guest.getByRole('button', { name: 'Join Room' }).click()
    await guest.getByPlaceholder('Enter your name...').fill('GuestPlayer')
    await guest.getByPlaceholder('Enter 6-letter code').fill(roomCode)
    await guest.getByRole('button', { name: 'Join as Player' }).click()

    await expect(host.getByRole('button', { name: 'Start Match' })).toBeEnabled()
    await host.getByRole('button', { name: 'Start Match' }).click()

    await expect(host.getByText('Get ready!')).toBeVisible()
    await expect(guest.getByText('Get ready!')).toBeVisible()

    await expect(host.locator('img').first()).toBeVisible({ timeout: 30_000 })
    await expect(guest.locator('img').first()).toBeVisible({ timeout: 30_000 })

    await host.locator('button', { hasText: /kg/ }).first().click()
    await guest.locator('button', { hasText: /kg/ }).first().click()

    await expect(host.getByText(/Correct answer|Both players answered/i)).toBeVisible({ timeout: 30_000 })
    await expect(guest.getByText(/Correct answer|Both players answered/i)).toBeVisible({ timeout: 30_000 })

    await hostContext.close()
    await guestContext.close()
  })
})
