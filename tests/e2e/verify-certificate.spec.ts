import { test, expect } from '@playwright/test';

/**
 * Reproduces the "blank screen after multiple loads with SW installed" bug.
 * Loads /verify/:id three times in the same context (so the SW from
 * the first navigation is still installed for the next loads) and
 * asserts that meaningful UI is rendered every time.
 */
test('VerifyCertificate never shows a blank screen with SW installed', async ({ page }) => {
  const id = '00000000-0000-0000-0000-000000000000';
  const url = `/verify/${id}`;

  for (let i = 0; i < 3; i++) {
    await page.goto(url, { waitUntil: 'networkidle' });
    // Either the heading renders OR the rate-limit/invalid card renders.
    // What matters: the document body has visible text (not blank).
    const bodyText = (await page.locator('body').innerText()).trim();
    expect(bodyText.length, `iteration ${i} body should not be blank`).toBeGreaterThan(0);
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
  }
});

test('Diagnostics page exposes SW_VERSION and cache list', async ({ page }) => {
  await page.goto('/diagnostics');
  await expect(page.getByTestId('sw-version')).toBeVisible();
  await expect(page.getByTestId('cache-list')).toBeVisible();
});