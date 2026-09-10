import { expect, test } from '@playwright/test';
import path from 'node:path';

function luminance(color: string) {
  const values = color.match(/\d+/g)!.slice(0, 3).map(Number).map((value) => {
    const channel = value / 255;
    return channel <= 0.04045 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4;
  });
  return values[0] * 0.2126 + values[1] * 0.7152 + values[2] * 0.0722;
}

test('paleta pública consistente e botões legíveis', async ({ page }, testInfo) => {
  const property = { id: 1, titulo: 'Casa com quintal', descricao: 'Casa em Paranaguá.',
    bairro: 'Centro', cidade: 'Paranaguá', preco: 420000, tipo: 'CASA', quartos: 3,
    banheiros: 2, vagas: 1, area: 120, imagens: [{ id: 1, url: '/uploads/test.jpg', capa: true, ordem: 0 }] };
  await page.route('**/api/imoveis?*', (route) => route.fulfill({ json: { content: [property] } }));
  await page.route('**/api/imoveis/1', (route) => route.fulfill({ json: property }));
  await page.route('**/uploads/test.jpg', (route) => route.fulfill({ path: path.resolve('e2e/house.jpg'), contentType: 'image/jpeg' }));
  for (const url of ['/', '/imoveis/1']) {
    await page.goto(url);
    await expect(page.locator('link[rel="icon"]')).toHaveAttribute('href', '/eliane-carneiro-banner.png?v=3');
    await expect(page.getByRole('heading', { name: 'Casa com quintal' })).toBeVisible();
    await expect(page.locator('.site-brand img')).toHaveAttribute('src', '/eliane-carneiro-banner.png');
    await expect(page.locator('.site-brand small')).toHaveText('CRECI-F 57833');
    const logoBox = (await page.locator('.site-brand img').boundingBox())!;
    const creciBox = (await page.locator('.site-brand small').boundingBox())!;
    expect(creciBox.y).toBeGreaterThanOrEqual(logoBox.y + logoBox.height);
    await expect(page.locator('.site-header')).toHaveCSS('background-color', url === '/' ? 'rgba(0, 0, 0, 0)' : 'rgb(17, 17, 17)');
    if (page.viewportSize()!.width <= 620) {
      const menu = page.locator('.menu-toggle');
      const nav = page.getByRole('navigation', { name: 'Navegação principal' });
      await expect(nav).toBeHidden();
      await menu.click();
      await expect(menu).toHaveAccessibleName('Fechar menu');
      await expect(nav).toBeVisible();
      await page.screenshot({ path: testInfo.outputPath(url === '/' ? 'menu-inicio.png' : 'menu-detalhes.png') });
      await page.keyboard.press('Escape');
      await expect(nav).toBeHidden();
      await expect(menu).toBeFocused();
      await menu.click();
      await menu.click();
      await expect(nav).toBeHidden();
    }
    await expect(page.locator('.site-footer')).toHaveCSS('background-color', 'rgb(23, 23, 23)');
    await expect(page.locator('.site-footer__brand strong')).toHaveCSS('color', 'rgb(255, 255, 255)');
    await expect(page.locator('.site-footer__brand strong')).toHaveText('Eliane Carneiro');
    const footerTextSize = await page.locator('.site-footer__brand span').evaluate(el => getComputedStyle(el).fontSize);
    await expect(page.locator('.site-footer__brand strong')).toHaveCSS('font-size', footerTextSize);
    for (const button of await page.locator('.button--primary, .button--whatsapp').all()) {
      const colors = await button.evaluate((element) => ({ text: getComputedStyle(element).color, background: getComputedStyle(element).backgroundColor }));
      const light = Math.max(luminance(colors.text), luminance(colors.background));
      const dark = Math.min(luminance(colors.text), luminance(colors.background));
      expect((light + 0.05) / (dark + 0.05)).toBeGreaterThanOrEqual(4.5);
    }
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    if (url !== '/') {
      const mobile = page.viewportSize()!.width <= 620;
      const cta = page.locator(mobile ? '.whatsapp-dock a' : '.contact-card .button--whatsapp');
      await expect(cta).toBeVisible();
      await expect(cta).toContainText('Conversar no WhatsApp');
      await expect(cta.locator('fa-icon svg[data-icon="whatsapp"]')).toBeVisible();
      const destination = new URL((await cta.getAttribute('href'))!);
      expect(destination.origin).toBe('https://wa.me');
      expect(destination.pathname).toMatch(/^\/[0-9]+$/);
      expect(destination.searchParams.get('text')).toContain('Casa em Centro, Paranaguá');
      expect(destination.searchParams.get('text')).toContain('Código do imóvel: 1');
      expect(destination.searchParams.get('text')).toContain('https://elianecarneiroimoveis.com.br/imoveis/1');
      await expect(cta).toHaveAttribute('target', '_blank');
      if (mobile) {
        await page.locator('.gallery__main').click();
        await expect(page.locator('.whatsapp-dock')).toHaveCount(0);
        await page.locator('.lightbox__close').click();
        await expect(cta).toBeVisible();
      }
    }
    await page.screenshot({ path: testInfo.outputPath(url === '/' ? 'inicio.png' : 'detalhes.png'), fullPage: true });
  }
  await page.goto('/admin/login');
  expect(await page.locator('body').evaluate((element) => getComputedStyle(element).getPropertyValue('--color-accent').trim())).toBe('#cf2027');
  await expect(page.locator('.auth-panel')).toHaveCSS('background-color', 'rgb(255, 255, 255)');
  await expect(page.getByRole('button', { name: 'Entrar', exact: true })).toHaveCSS('background-color', 'rgb(207, 32, 39)');
  await page.screenshot({ path: testInfo.outputPath('login.png'), fullPage: true });
});
