import { test, expect } from '@playwright/test';

/**
 * /admin must not be reachable by unauthorized (unauthenticated) users.
 * In this SPA the ProtectedRoute is the access gate — an unauthenticated
 * visitor is redirected to /auth (the client-side equivalent of a 401/403),
 * never reaching the admin dashboard. The server still enforces access via
 * RLS + has_role, so even a forced render would expose no privileged data.
 */
test('/admin redirects unauthorized users away from the dashboard', async ({ page }) => {
  await page.goto('/admin', { waitUntil: 'networkidle' });
  // Redirected to the auth page; the admin dashboard never renders.
  await expect(page).toHaveURL(/\/auth/);
  await expect(page.getByTestId('admin-access-denied')).toHaveCount(0);
});

/**
 * /health must expose a stable, machine-readable JSON schema for uptime
 * monitoring: a status, version fields, a timestamp and per-check states.
 */
test('/health returns service status, versions and a stable JSON schema', async ({ page }) => {
  await page.goto('/health', { waitUntil: 'networkidle' });

  const pre = page.getByTestId('health-json');
  await expect(pre).toBeVisible();

  const raw = (await pre.innerText()).trim();
  expect(raw.length, 'health payload should not be blank').toBeGreaterThan(0);

  const report = JSON.parse(raw);

  // Top-level schema
  expect(report).toHaveProperty('status');
  expect(['ok', 'degraded']).toContain(report.status);
  expect(typeof report.appVersion).toBe('string');
  expect(typeof report.swVersion).toBe('string');
  expect(typeof report.buildMarker).toBe('string');
  expect(typeof report.timestamp).toBe('string');
  expect(Number.isNaN(Date.parse(report.timestamp))).toBe(false);

  // checks sub-schema
  expect(report).toHaveProperty('checks');
  expect(['up', 'down', 'checking']).toContain(report.checks.backend);
  expect(['active', 'inactive', 'unsupported']).toContain(report.checks.serviceWorker);
});