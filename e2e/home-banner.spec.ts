import { expect, test } from '@playwright/test';
import path from 'node:path';

test('banner com foto, filtros abaixo e busca funcional', async ({
  page,
}, testInfo) => {
  const queries: URL[] = [];
  await page.route('**/api/imoveis?*', async (route) => {
    queries.push(new URL(route.request().url()));
    await route.fulfill({
      json: {
        content: [
          {
            id: 1,
            titulo: 'Casa com quintal',
            bairro: 'Centro',
            cidade: 'Paranaguá',
            preco: 420000,
            tipo: 'CASA',
            quartos: 3,
            banheiros: 2,
            vagas: 1,
            imagens: [
              { id: 1, url: '/uploads/test.jpg', capa: true, ordem: 0 },
            ],
          },
        ],
      },
    });
  });
  await page.route('**/uploads/test.jpg', (route) =>
    route.fulfill({
      path: path.resolve('e2e/house.jpg'),
      contentType: 'image/jpeg',
    }),
  );
  await page.goto('/');
  const banner = page.locator('.hero');
  const image = banner.locator('.hero__image');
  const filters = page.getByRole('form', { name: 'Buscar imóveis' });
  await expect(image).toBeVisible();
  await image.evaluate((img: HTMLImageElement) => img.decode());
  await expect
    .poll(() => image.evaluate((img: HTMLImageElement) => img.naturalWidth))
    .toBe(1080);
  await expect(image).toHaveAttribute('src', '/paranagua-aerea.jpeg');
  await expect(banner.getByRole('heading', { level: 1 })).toHaveText('Imóveis em Paranaguá');
  expect(await banner.evaluate((element) => getComputedStyle(element, '::before').backgroundImage)).toContain('linear-gradient');
  await expect(
    page.getByRole('heading', { name: 'Casa com quintal' }),
  ).toBeVisible();
  const bannerBox = (await banner.boundingBox())!;
  const filtersBox = (await filters.boundingBox())!;
  const cardBox = (await page.locator('.property-card').first().boundingBox())!;
  expect(filtersBox.y).toBeGreaterThan(bannerBox.y);
  expect(filtersBox.y + filtersBox.height).toBeLessThanOrEqual(bannerBox.y + bannerBox.height);
  expect(cardBox.y).toBeGreaterThanOrEqual(filtersBox.y + filtersBox.height);
  expect(bannerBox.height).toBeGreaterThanOrEqual(page.viewportSize()!.height - 24);
  expect(await image.evaluate((img) => getComputedStyle(img).objectFit)).toBe(
    'cover',
  );
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  await page.screenshot({
    path: testInfo.outputPath('inicio.png'),
    fullPage: true,
  });
  await filters.getByLabel('Buscar', { exact: true }).fill('quintal');
  await filters.getByRole('combobox', { name: 'Tipo', exact: true }).selectOption('CASA');
  await expect(filters.getByText('Comprar', { exact: true })).toHaveCount(0);
  await expect(filters.getByLabel('Valor mínimo')).toBeVisible();
  await expect(filters.getByLabel('Valor máximo')).toBeVisible();
  await filters.getByLabel('Valor mínimo').fill('100000');
  await filters.getByLabel('Valor máximo').fill('500000');
  await filters.getByRole('button', { name: 'Buscar', exact: true }).click();
  await expect
    .poll(() => queries.at(-1)?.searchParams.get('q'))
    .toBe('quintal');
  expect(queries.at(-1)?.searchParams.get('tipo')).toBe('CASA');
  expect(queries.at(-1)?.searchParams.get('precoMin')).toBe('100000');
  expect(queries.at(-1)?.searchParams.get('precoMax')).toBe('500000');
  await filters.getByRole('button', { name: 'Limpar' }).click();
  await expect.poll(() => queries.at(-1)?.searchParams.has('q')).toBe(false);
  await expect(filters.getByLabel('Buscar', { exact: true })).toHaveValue('');
  await expect(filters.getByRole('combobox', { name: 'Tipo', exact: true })).toHaveValue('');
});

test('logo e menu do cabeçalho sem sobrepor a busca', async ({ page }, testInfo) => {
  await page.route('**/api/imoveis?*', (route) => route.fulfill({ json: { content: [] } }));
  await page.goto('/');
  await expect(page.locator('.site-brand img')).toHaveAttribute('src', '/eliane-carneiro-banner.png');
  await expect(page.locator('.site-header')).toHaveCSS('background-color', 'rgba(0, 0, 0, 0)');
  const menu = page.locator('.menu-toggle');
  const nav = page.getByRole('navigation', { name: 'Navegação principal' });
  if (page.viewportSize()!.width <= 620) {
    await expect(nav).not.toBeVisible();
    await menu.click();
    await expect(nav).toBeVisible();
    await expect(menu).toHaveAttribute('aria-expanded', 'true');
    await page.screenshot({ path: testInfo.outputPath('menu.png') });
    await page.keyboard.press('Escape');
    await expect(nav).not.toBeVisible();
    await menu.click();
    await nav.getByRole('link', { name: 'Imóveis', exact: true }).click();
    await expect(nav).not.toBeVisible();
    await expect(page).toHaveURL(/#imoveis$/);
  } else {
    await expect(nav).toBeVisible();
  }
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
});

test('banner permanece nos estados vazio e erro', async ({ page }) => {
  await page.route('**/api/imoveis?*', (route) =>
    route.fulfill({ json: { content: [] } }),
  );
  await page.goto('/');
  await expect(page.getByText('Nenhum imóvel encontrado')).toBeVisible();
  await expect(page.locator('.hero__image')).toBeVisible();
  await page.route('**/api/imoveis?*', (route) =>
    route.fulfill({ status: 500, json: {} }),
  );
  await page.getByRole('button', { name: 'Buscar', exact: true }).click();
  await expect(
    page.getByText('Não foi possível carregar os imóveis'),
  ).toBeVisible();
  await expect(page.locator('.hero__image')).toBeVisible();
});
