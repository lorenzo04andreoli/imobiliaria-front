import { expect, test } from '@playwright/test';

// Opt-in, read-only production check. Never capture credentials or auth traces.
test.use({ trace: 'off', video: 'off', screenshot: 'off' });
test('painel publicado: login e fotos sem alterações', async ({ page }, testInfo) => {
  test.skip(!process.env['PANEL_SMOKE_EMAIL'] || !process.env['PANEL_SMOKE_PASSWORD']);
  await page.goto('https://elianecarneiroimoveis.com.br/admin/login');
  await page.getByLabel('E-mail', { exact: true }).fill(process.env['PANEL_SMOKE_EMAIL']!);
  await page.getByLabel('Senha', { exact: true }).fill(process.env['PANEL_SMOKE_PASSWORD']!);
  await page.getByRole('button', { name: 'Entrar', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Meus imóveis' })).toBeVisible();
  await expect(page.getByRole('article').first()).toBeVisible();
  await page.screenshot({ path: testInfo.outputPath('painel-publicado.png'), fullPage: true });
  await page.getByRole('link', { name: 'Editar imóvel', exact: true }).first().click();
  await expect(page.getByRole('heading', { name: 'Editar imóvel' })).toBeVisible();
  await page.getByRole('button', { name: '2 Fotos', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Adicionar fotos', exact: true })).toBeVisible();
  await expect(page.getByRole('article').first().locator('img')).toBeVisible();
  await expect.poll(() => page.locator('article img').evaluateAll((images) => images.every((image) => (image as HTMLImageElement).naturalWidth > 0))).toBe(true);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  await page.screenshot({ path: testInfo.outputPath('fotos-publicadas.png'), fullPage: true });
  await page.getByRole('link', { name: 'Meus imóveis', exact: true }).click();
  await page.getByRole('button', { name: 'Sair do painel', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Entrar no painel' })).toBeVisible();
});
