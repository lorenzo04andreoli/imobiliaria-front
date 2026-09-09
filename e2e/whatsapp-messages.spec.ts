import { test, expect } from '@playwright/test';

test('mensagens identificam o imóvel mesmo com título genérico', async ({ page }) => {
  const property = { id: 37, titulo: 'CASA À VENDA', tipo: 'CASA', bairro: '29 de Julho',
    cidade: 'Paranaguá', preco: 450000, quartos: 2, banheiros: 1, vagas: 1, area: 90,
    descricao: 'Casa à venda.', imagens: [] };
  await page.route('**/api/imoveis?*', route => route.fulfill({ json: { content: [property] } }));
  await page.route('**/api/imoveis/37', route => route.fulfill({ json: property }));
  await page.goto('/');
  const homeLink = new URL((await page.locator('.property-card__actions .button--whatsapp').getAttribute('href'))!);
  const message = homeLink.searchParams.get('text')!;
  expect(message).toContain('Casa em 29 de Julho, Paranaguá');
  expect(message).toContain('Código do imóvel: 37');
  expect(message).toContain('https://elianecarneiroimoveis.com.br/imoveis/37');
  expect(message).not.toContain('CASA À VENDA');
  const contact = new URL((await page.locator('.conversion-band a').getAttribute('href'))!);
  expect(contact.origin).toBe('https://wa.me');
  expect(contact.searchParams.get('text')).toContain('agendar uma visita');
  await page.goto('/imoveis/37');
  await expect(page.locator('.contact-card .button--whatsapp')).toHaveAttribute('href', homeLink.href);
});
