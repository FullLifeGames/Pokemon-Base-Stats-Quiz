import { expect, test, type BrowserContext, type Page } from '@playwright/test'

// Run multiplayer tests serially – concurrent PeerJS connections to the shared
// signalling server cause flaky peer-open / join failures.
test.describe.configure({ mode: 'serial' })

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

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

/** Create a host page at the VS lobby, set name, choose quiz mode, and create room. */
async function setupHostRoom(
  browser: import('@playwright/test').Browser,
  options: {
    quizMode?: 'Base Stats' | 'Learnset' | 'Damage' | 'Weight' | 'Height'
    rounds?: number
    hostName?: string
  } = {}
): Promise<{ hostContext: BrowserContext; host: Page; roomCode: string }> {
  const { quizMode = 'Weight', rounds = 1, hostName = 'HostPlayer' } = options

  const hostContext = await browser.newContext()
  await configureContext(hostContext)
  const host = await hostContext.newPage()

  await host.goto('/#/vs')
  await expect(host.getByRole('heading', { name: 'VS Mode' })).toBeVisible()

  // Set name
  await host.getByPlaceholder('Enter your name...').fill(hostName)

  // Select quiz mode
  if (quizMode !== 'Base Stats') {
    await host.getByRole('button', { name: quizMode }).click()
  }

  // Set rounds to minimum for fast tests
  const roundsInput = host.locator('label:has-text("Number of Rounds")').locator('..').locator('input')
  await roundsInput.fill(String(rounds))

  // Create room
  await host.getByRole('button', { name: 'Create Room' }).last().click()

  const roomCode = await getRoomCode(host)
  expect(roomCode).toMatch(/^[A-Z0-9]{6}$/)

  return { hostContext, host, roomCode }
}

/** Join a room with a guest player. */
async function joinRoom(
  browser: import('@playwright/test').Browser,
  roomCode: string,
  options: { guestName?: string; asSpectator?: boolean } = {}
): Promise<{ guestContext: BrowserContext; guest: Page }> {
  const { guestName = 'GuestPlayer', asSpectator = false } = options

  const guestContext = await browser.newContext()
  await configureContext(guestContext)
  const guest = await guestContext.newPage()

  await guest.goto('/#/vs')
  await guest.getByRole('button', { name: 'Join Room' }).click()
  await guest.getByPlaceholder('Enter your name...').fill(guestName)
  await guest.getByPlaceholder('Enter 6-letter code').fill(roomCode)

  if (asSpectator) {
    await guest.getByRole('button', { name: 'Join as Spectator' }).click()
  } else {
    await guest.getByRole('button', { name: 'Join as Player' }).click()
  }

  return { guestContext, guest }
}

/** Start match from the host side, wait for countdown on both pages. */
async function startMatch(host: Page, guest: Page) {
  await expect(host.getByRole('button', { name: 'Start Match' })).toBeEnabled({ timeout: 30_000 })
  await host.getByRole('button', { name: 'Start Match' }).click()

  await expect(host.getByText('Get ready!')).toBeVisible()
  await expect(guest.getByText('Get ready!')).toBeVisible()
}

// ---------------------------------------------------------------------------
// VS Mode – Lobby & Room Management
// ---------------------------------------------------------------------------

test.describe('Multiplayer – Lobby', () => {
  test('host can create a room and see room code', async ({ browser }) => {
    const { hostContext, host, roomCode } = await setupHostRoom(browser)

    expect(roomCode.length).toBe(6)
    await expect(host.getByText(/Waiting for players/i)).toBeVisible()

    await hostContext.close()
  })

  test('guest can join a room and both see the lobby', async ({ browser }) => {
    const { hostContext, host, roomCode } = await setupHostRoom(browser)
    const { guestContext, guest } = await joinRoom(browser, roomCode)

    // Host should see 2 players now, start match button should be enabled
    await expect(host.getByRole('button', { name: 'Start Match' })).toBeEnabled({ timeout: 15_000 })

    // Guest should see the settings summary
    await expect(guest.getByText(/Settings/i)).toBeVisible({ timeout: 10_000 })

    await hostContext.close()
    await guestContext.close()
  })

  test('host can change settings and they are reflected', async ({ browser }) => {
    const hostContext = await browser.newContext()
    await configureContext(hostContext)
    const host = await hostContext.newPage()

    await host.goto('/#/vs')
    await host.getByPlaceholder('Enter your name...').fill('HostPlayer')

    // Switch to Learnset mode
    await host.getByRole('button', { name: 'Learnset' }).click()

    // Verify time limit updated to 45 (learnset default)
    const timeLimitInput = host.locator('label:has-text("Time Limit")').locator('..').locator('input')
    await expect(timeLimitInput).toHaveValue('45')

    // Switch back to Base Stats
    await host.getByRole('button', { name: 'Base Stats' }).click()
    await expect(timeLimitInput).toHaveValue('30')

    await hostContext.close()
  })

  test('host leaving cancels the room', async ({ browser }) => {
    const { hostContext, host } = await setupHostRoom(browser)

    // Host clicks Back to Menu
    await host.getByRole('button', { name: /Back to Menu/i }).click()

    // Should navigate back to home/vs idle
    await expect(host).toHaveURL(/\/#\/$/)

    await hostContext.close()
  })
})

// ---------------------------------------------------------------------------
// VS Mode – Weight Quiz (simplest mode for E2E, button-based input)
// ---------------------------------------------------------------------------

test.describe('Multiplayer – Weight Quiz', () => {
  test('host and guest can play a 1-round weight match', async ({ browser }) => {
    const { hostContext, host, roomCode } = await setupHostRoom(browser, {
      quizMode: 'Weight',
      rounds: 1,
    })
    const { guestContext, guest } = await joinRoom(browser, roomCode)

    await startMatch(host, guest)

    // Wait for game content to load (Pokémon sprite + weight options)
    await expect(host.locator('img').first()).toBeVisible({ timeout: 30_000 })
    await expect(guest.locator('img').first()).toBeVisible({ timeout: 30_000 })

    // Both players submit a weight answer
    await host.locator('button', { hasText: /kg/ }).first().click()
    await guest.locator('button', { hasText: /kg/ }).first().click()

    // Round result should show correct answer
    await expect(host.getByText(/Correct answer/i)).toBeVisible({ timeout: 30_000 })
    await expect(guest.getByText(/Correct answer/i)).toBeVisible({ timeout: 30_000 })

    // After 1 round, match should end
    await expect(host.getByText(/You Win|You Lost|Match Over/i)).toBeVisible({ timeout: 60_000 })
    await expect(guest.getByText(/You Win|You Lost|Match Over/i)).toBeVisible({ timeout: 60_000 })

    // Leaderboard should show both player names
    await expect(host.getByText('HostPlayer').first()).toBeVisible()
    await expect(host.getByText('GuestPlayer').first()).toBeVisible()

    await hostContext.close()
    await guestContext.close()
  })
})

// ---------------------------------------------------------------------------
// VS Mode – Height Quiz
// ---------------------------------------------------------------------------

test.describe('Multiplayer – Height Quiz', () => {
  test('host and guest can play a 1-round height match', async ({ browser }) => {
    const { hostContext, host, roomCode } = await setupHostRoom(browser, {
      quizMode: 'Height',
      rounds: 1,
    })
    const { guestContext, guest } = await joinRoom(browser, roomCode)

    await startMatch(host, guest)

    await expect(host.locator('img').first()).toBeVisible({ timeout: 30_000 })
    await expect(guest.locator('img').first()).toBeVisible({ timeout: 30_000 })

    await host.locator('button', { hasText: / m$/ }).first().click()
    await guest.locator('button', { hasText: / m$/ }).first().click()

    await expect(host.getByText(/Correct answer/i)).toBeVisible({ timeout: 30_000 })
    await expect(guest.getByText(/Correct answer/i)).toBeVisible({ timeout: 30_000 })

    await expect(host.getByText(/You Win|You Lost|Match Over/i)).toBeVisible({ timeout: 30_000 })

    await hostContext.close()
    await guestContext.close()
  })
})

// ---------------------------------------------------------------------------
// VS Mode – Base Stat Quiz
// ---------------------------------------------------------------------------

test.describe('Multiplayer – Base Stat Quiz', () => {
  test('host and guest can play a 1-round base stat match', async ({ browser }) => {
    const { hostContext, host, roomCode } = await setupHostRoom(browser, {
      quizMode: 'Base Stats',
      rounds: 1,
    })
    const { guestContext, guest } = await joinRoom(browser, roomCode)

    await startMatch(host, guest)

    // Wait for stat display to load
    await expect(host.getByText('HP')).toBeVisible({ timeout: 30_000 })
    await expect(guest.getByText('HP')).toBeVisible({ timeout: 30_000 })

    // Both players submit via the combobox pokemon selector
    const hostCombobox = host.getByRole('combobox')
    await hostCombobox.click()
    await host.getByPlaceholder('Search Pokémon...').fill('Charizard')
    await host.getByText(/^Charizard$/i).first().click()

    const guestCombobox = guest.getByRole('combobox')
    await guestCombobox.click()
    await guest.getByPlaceholder('Search Pokémon...').fill('Charizard')
    await guest.getByText(/^Charizard$/i).first().click()

    // Round result
    await expect(host.getByText(/Correct answer/i)).toBeVisible({ timeout: 30_000 })
    await expect(guest.getByText(/Correct answer/i)).toBeVisible({ timeout: 30_000 })

    // Match end
    await expect(host.getByText(/You Win|You Lost|Match Over/i)).toBeVisible({ timeout: 30_000 })

    await hostContext.close()
    await guestContext.close()
  })
})

// ---------------------------------------------------------------------------
// VS Mode – Learnset Quiz
// ---------------------------------------------------------------------------

test.describe('Multiplayer – Learnset Quiz', () => {
  test('host and guest can play a 1-round learnset match', async ({ browser }) => {
    const { hostContext, host, roomCode } = await setupHostRoom(browser, {
      quizMode: 'Learnset',
      rounds: 1,
    })
    const { guestContext, guest } = await joinRoom(browser, roomCode)

    await startMatch(host, guest)

    // Wait for learnset table/moves to appear
    await expect(host.locator('table, [class*="grid"]').first()).toBeVisible({ timeout: 30_000 })
    await expect(guest.locator('table, [class*="grid"]').first()).toBeVisible({ timeout: 30_000 })

    // Submit a guess on both sides
    const hostCombobox = host.getByRole('combobox')
    await hostCombobox.click()
    await host.getByPlaceholder('Search Pokémon...').fill('Charizard')
    await host.getByText(/^Charizard$/i).first().click()

    const guestCombobox = guest.getByRole('combobox')
    await guestCombobox.click()
    await guest.getByPlaceholder('Search Pokémon...').fill('Charizard')
    await guest.getByText(/^Charizard$/i).first().click()

    // Round result
    await expect(host.getByText(/Correct answer/i)).toBeVisible({ timeout: 30_000 })
    await expect(guest.getByText(/Correct answer/i)).toBeVisible({ timeout: 30_000 })

    // Match end
    await expect(host.getByText(/You Win|You Lost|Match Over/i)).toBeVisible({ timeout: 30_000 })

    await hostContext.close()
    await guestContext.close()
  })
})

// ---------------------------------------------------------------------------
// VS Mode – Damage Quiz
// ---------------------------------------------------------------------------

test.describe('Multiplayer – Damage Quiz', () => {
  test('host and guest can play a 1-round damage match', async ({ browser }) => {
    const { hostContext, host, roomCode } = await setupHostRoom(browser, {
      quizMode: 'Damage',
      rounds: 1,
    })
    const { guestContext, guest } = await joinRoom(browser, roomCode)

    await startMatch(host, guest)

    // Wait for damage scenario to load (sprites)
    await expect(host.locator('img').first()).toBeVisible({ timeout: 30_000 })
    await expect(guest.locator('img').first()).toBeVisible({ timeout: 30_000 })

    // Both players submit via the Submit button (slider defaults to 50%)
    await host.getByRole('button', { name: 'Submit' }).click()
    await guest.getByRole('button', { name: 'Submit' }).click()

    // Round result with correct answer display
    await expect(host.getByText(/Correct answer/i)).toBeVisible({ timeout: 30_000 })
    await expect(guest.getByText(/Correct answer/i)).toBeVisible({ timeout: 30_000 })

    // Match end
    await expect(host.getByText(/You Win|You Lost|Match Over/i)).toBeVisible({ timeout: 30_000 })

    await hostContext.close()
    await guestContext.close()
  })
})

// ---------------------------------------------------------------------------
// VS Mode – Spectator
// ---------------------------------------------------------------------------

test.describe('Multiplayer – Spectator', () => {
  test('spectator can watch a match', async ({ browser }) => {
    const { hostContext, host, roomCode } = await setupHostRoom(browser, {
      quizMode: 'Weight',
      rounds: 1,
    })
    const { guestContext, guest } = await joinRoom(browser, roomCode)
    const { guestContext: specContext, guest: spectator } = await joinRoom(browser, roomCode, {
      guestName: 'WatcherPlayer',
      asSpectator: true,
    })

    await startMatch(host, guest)

    // Spectator should see the game updating (spectator state syncs slightly later)
    await expect(spectator.locator('img').first()).toBeVisible({ timeout: 60_000 })

    // Both players answer
    await host.locator('button', { hasText: /kg/ }).first().click()
    await guest.locator('button', { hasText: /kg/ }).first().click()

    // Spectator should see match end
    await expect(spectator.getByText(/Match Over/i)).toBeVisible({ timeout: 30_000 })

    await hostContext.close()
    await guestContext.close()
    await specContext.close()
  })
})

// ---------------------------------------------------------------------------
// VS Mode – Rematch (Play Again)
// ---------------------------------------------------------------------------

test.describe('Multiplayer – Rematch', () => {
  test('host can restart the game after match ends', async ({ browser }) => {
    const { hostContext, host, roomCode } = await setupHostRoom(browser, {
      quizMode: 'Weight',
      rounds: 1,
    })
    const { guestContext, guest } = await joinRoom(browser, roomCode)

    await startMatch(host, guest)

    await expect(host.locator('img').first()).toBeVisible({ timeout: 30_000 })
    await expect(guest.locator('img').first()).toBeVisible({ timeout: 30_000 })

    await host.locator('button', { hasText: /kg/ }).first().click()
    await guest.locator('button', { hasText: /kg/ }).first().click()

    // Wait for match end
    await expect(host.getByText(/You Win|You Lost|Match Over/i)).toBeVisible({ timeout: 30_000 })

    // Host clicks Play Again
    await host.getByRole('button', { name: /Play Again/i }).click()

    // Should see countdown again
    await expect(host.getByText('Get ready!')).toBeVisible({ timeout: 15_000 })
    await expect(guest.getByText('Get ready!')).toBeVisible({ timeout: 15_000 })

    await hostContext.close()
    await guestContext.close()
  })
})

// ---------------------------------------------------------------------------
// VS Mode – Language & Theme Controls
// ---------------------------------------------------------------------------

test.describe('Multiplayer – VS Controls', () => {
  test('language toggle is visible and switches to German', async ({ browser }) => {
    const hostContext = await browser.newContext()
    await configureContext(hostContext)
    const host = await hostContext.newPage()

    await host.goto('/#/vs')
    await expect(host.getByRole('heading', { name: 'VS Mode' })).toBeVisible()

    // The globe button should be visible
    const controls = host.locator('[data-testid="vs-controls"]')
    await expect(controls).toBeVisible()

    // Click the globe button to open language dropdown
    await controls.locator('button').first().click()

    // Switch to Deutsch
    await host.getByText('Deutsch').click()

    // The VS Mode heading should now be in German
    await expect(host.getByRole('heading', { name: 'VS-Modus' })).toBeVisible()

    // Switch back to English
    await controls.locator('button').first().click()
    await host.getByRole('menuitem', { name: 'English' }).click()
    await expect(host.getByRole('heading', { name: 'VS Mode' })).toBeVisible()

    await hostContext.close()
  })

  test('dark/light mode toggle is visible and switches theme', async ({ browser }) => {
    const hostContext = await browser.newContext()
    await configureContext(hostContext)
    const host = await hostContext.newPage()

    await host.goto('/#/vs')
    await expect(host.getByRole('heading', { name: 'VS Mode' })).toBeVisible()

    const controls = host.locator('[data-testid="vs-controls"]')
    await expect(controls).toBeVisible()

    // The theme toggle is the second button in the controls
    const themeButton = controls.getByRole('button').nth(1)
    await expect(themeButton).toBeVisible()

    // Click to open the theme dropdown
    await themeButton.click()

    // Light option should be visible
    await expect(host.getByText('Light')).toBeVisible()
    await host.getByText('Light').click()

    // The html element should now have "light" class
    await expect(host.locator('html')).toHaveClass(/light/)

    // Switch to Dark
    await themeButton.click()
    await host.getByText('Dark').click()
    await expect(host.locator('html')).toHaveClass(/dark/)

    await hostContext.close()
  })
})

// ---------------------------------------------------------------------------
// VS Mode – Host Forfeit
// ---------------------------------------------------------------------------

test.describe('Multiplayer – Host Forfeit', () => {
  test('host forfeiting during a match notifies guest with match-end', async ({ browser }) => {
    const { hostContext, host, roomCode } = await setupHostRoom(browser, {
      quizMode: 'Weight',
      rounds: 3,
    })
    const { guestContext, guest } = await joinRoom(browser, roomCode)

    await startMatch(host, guest)

    // Wait for game content to load
    await expect(host.locator('img').first()).toBeVisible({ timeout: 30_000 })
    await expect(guest.locator('img').first()).toBeVisible({ timeout: 30_000 })

    // Host clicks quit
    await host.getByRole('button', { name: /Quit/i }).click()

    // Forfeit confirmation dialog appears
    await expect(host.getByText(/Quit Game\?/i)).toBeVisible()
    await host.getByRole('button', { name: /Quit & Forfeit/i }).click()

    // Host should be navigated back to home
    await expect(host).toHaveURL(/\/#\/$/)

    // Guest should see match-end result (they win by forfeit)
    await expect(guest.getByText(/You Win|Match Over/i)).toBeVisible({ timeout: 30_000 })

    await hostContext.close()
    await guestContext.close()
  })
})
