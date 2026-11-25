import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

// Runs against the built image in the pipeline's throwaway stack (and the deployer runs the checks from avk.yaml after a switch).

test('home page loads', async ({ page }) => {
  const response = await page.goto('/');
  expect(response?.status()).toBe(200);
  await expect(page).not.toHaveTitle('');
});

test('liveness and readiness answer 200', async ({ request }) => {
  expect((await request.get('/healthz')).status()).toBe(200);
  expect((await request.get('/readyz')).status()).toBe(200);
});

test('security headers are set and a request id comes back', async ({ request }) => {
  const res = await request.get('/', { headers: { 'X-Request-Id': 'e2e-request-0001' } });
  const h = res.headers();
  expect(h['x-content-type-options']).toBe('nosniff');
  expect(h['x-frame-options']).toBe('DENY');
  expect(h['content-security-policy']).toContain("default-src 'self'");
  expect(h['content-security-policy']).toContain("frame-ancestors 'none'");
  expect(h['x-request-id']).toBe('e2e-request-0001');
  expect(h['server'] ?? '').not.toMatch(/\d/);                  // no version number in the Server header
});

test('an unsafe request id is replaced, not echoed', async ({ request }) => {
  const res = await request.get('/', { headers: { 'X-Request-Id': 'bad id with spaces' } });
  expect(res.headers()['x-request-id']).toMatch(/^[0-9a-f]{32}$/);
});

test('unknown paths give the 404 page without leaking internals', async ({ request }) => {
  const res = await request.get('/definitely-not-here');
  expect(res.status()).toBe(404);
  expect(await res.text()).not.toMatch(/nginx\/\d|Exception/);
});

// Accessibility gate (axe-core, WCAG 2.1 A and AA): any serious or critical violation fails the run.
test('home page accessibility', async ({ page }, testInfo) => {
  await page.goto('/');
  const results = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa']).analyze();
  await testInfo.attach('axe-violations', { body: JSON.stringify(results.violations, null, 2), contentType: 'application/json' });
  const blocking = results.violations.filter(v => v.impact === 'serious' || v.impact === 'critical');
  expect(blocking.map(v => `${v.id} (${v.impact}): ${v.nodes.length} element(s)`)).toEqual([]);
});
