import { expect, Page, test } from '@playwright/test';
import path from 'node:path';

const imagePath = path.resolve('e2e/house.jpg');

test('modal: foco, Escape, fundo e confirmação', async ({ page }, testInfo) => {
  const writes = await setup(page);
  await page.getByText('Alterar situação', { exact: true }).click();
  await page.getByRole('button', { name: 'Ocultar do site', exact: true }).click();
  const dialog = page.getByRole('dialog', { name: 'Ocultar por enquanto' });
  await expect(dialog).toBeVisible();
  await expect(dialog.getByRole('button', { name: 'Manter no site' })).toBeFocused();
  await noOverflow(page);
  await page.screenshot({ path: testInfo.outputPath('confirmacao.png') });
  await page.keyboard.press('Escape');
  await expect(dialog).not.toBeVisible();
  expect(writes).toHaveLength(0);
  await expect(page.getByRole('button', { name: 'Ocultar do site', exact: true })).toBeFocused();
  await page.getByRole('button', { name: 'Ocultar do site', exact: true }).click();
  await expect(dialog).toBeVisible();
  await page.mouse.click(2, 2);
  await expect(dialog).not.toBeVisible();
  expect(writes).toHaveLength(0);
  await page.getByRole('button', { name: 'Ocultar do site', exact: true }).click();
  await dialog.getByRole('button', { name: 'Ocultar imóvel', exact: true }).click();
  await expect(page.getByText('Situação do imóvel atualizada.', { exact: true })).toBeVisible();
  expect(writes.filter((write) => write.path.endsWith('/inativar'))).toHaveLength(1);
});

test('modal de saída e sessão preservada ao cancelar logout', async ({ page }) => {
  await setup(page);
  await page.getByRole('link', { name: 'Cadastrar imóvel' }).click();
  await page.locator('[formControlName="titulo"]').fill('Edição pendente');
  await page.getByRole('button', { name: 'Sair do painel' }).click();
  const dialog = page.getByRole('dialog', { name: 'Sua edição ainda não foi salva' });
  await dialog.getByRole('button', { name: 'Continuar editando' }).click();
  expect(await page.evaluate(() => !!localStorage.getItem('imobiliaria_admin_session'))).toBe(true);
  await page.getByRole('link', { name: 'Meus imóveis', exact: true }).click();
  await dialog.getByRole('button', { name: 'Sair sem salvar' }).click();
  await expect(page.getByRole('heading', { name: 'Meus imóveis' })).toBeVisible();
  await expect(dialog).not.toBeVisible();
});
const property = {
  id: 1,
  titulo: 'Casa com quintal em Paranaguá',
  descricao: 'Casa com jardim e três quartos.',
  preco: 420000,
  tipo: 'CASA',
  cidade: 'Paranaguá',
  bairro: 'Centro',
  endereco: '',
  quartos: 3,
  banheiros: 2,
  vagas: 1,
  area: 120,
  status: 'PUBLICADO',
  imagens: [1, 2, 3].map((id) => ({
    id,
    url: `/uploads/test-${id}.jpg`,
    ordem: id - 1,
    capa: id === 1,
  })),
};

async function setup(page: Page) {
  const writes: { method: string; path: string; data: any }[] = [];
  let images = structuredClone(property.imagens);
  await page.route('**/uploads/test-*.jpg', (route) =>
    route.fulfill({ path: imagePath, contentType: 'image/jpeg' }),
  );
  await page.route('**/api/**', async (route) => {
    const request = route.request();
    const url = new URL(request.url());
    const method = request.method();
    const json = (data: unknown, status = 200) =>
      route.fulfill({ json: data, status });
    if (method === 'OPTIONS')
      return route.fulfill({
        status: 204,
        headers: {
          'access-control-allow-origin': '*',
          'access-control-allow-headers': '*',
          'access-control-allow-methods': '*',
        },
      });
    if (url.pathname.endsWith('/auth/login'))
      return json({ token: 'test-only-token', email: 'teste@example.com' });
    if (method !== 'GET')
      writes.push({
        method,
        path: url.pathname,
        data: request.headers()['content-type']?.includes('json')
          ? request.postDataJSON()
          : null,
      });
    if (url.pathname.endsWith('/imagens/ordem')) {
      images = request
        .postDataJSON()
        .imagemIds.map((id: number, ordem: number) => ({
          ...images.find((image) => image.id === id),
          ordem,
        }));
      return json(images);
    }
    if (url.pathname.endsWith('/capa')) return json(images[0]);
    if (method === 'DELETE') {
      images = images.filter((image) => !url.pathname.endsWith('/' + image.id));
      return route.fulfill({ status: 204 });
    }
    if (/\/imagens\/upload$/.test(url.pathname)) {
      const image = {
        id: images.length + 10,
        url: '/uploads/test-1.jpg',
        ordem: images.length,
        capa: false,
      };
      images.push(image);
      return json(image);
    }
    if (/\/admin\/imoveis\/\d+$/.test(url.pathname))
      return json({ ...property, imagens: images });
    if (url.pathname.endsWith('/admin/imoveis') && method === 'POST')
      return json({
        ...property,
        ...request.postDataJSON(),
        id: 1,
        imagens: [],
      });
    if (url.pathname.endsWith('/admin/imoveis'))
      return json({
        content: [{ ...property, imagens: images }],
        page: 0,
        size: 20,
        totalElements: 1,
        totalPages: 1,
        first: true,
        last: true,
      });
    return json(property);
  });
  await page.goto('/admin/login');
  await page.getByLabel('E-mail', { exact: true }).fill('teste@example.com');
  await page.getByLabel('Senha', { exact: true }).fill('test-only-password');
  await page.getByRole('button', { name: 'Entrar', exact: true }).click();
  await expect(
    page.getByRole('heading', { name: 'Meus imóveis' }),
  ).toBeVisible();
  return writes;
}

async function noOverflow(page: Page) {
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBe(true);
  const smallInputs = await page
    .locator('input:visible, select:visible, textarea:visible')
    .evaluateAll(
      (elements) =>
        elements.filter(
          (element) => parseFloat(getComputedStyle(element).fontSize) < 16,
        ).length,
    );
  expect(smallInputs).toBe(0);
}

test('lista mobile, capa por toque, ordem e persistência', async ({
  page,
}, testInfo) => {
  const writes = await setup(page);
  await noOverflow(page);
  await page.screenshot({
    path: testInfo.outputPath('lista.png'),
    fullPage: true,
  });
  await page.getByRole('link', { name: 'Editar imóvel', exact: true }).click();
  await page.getByRole('button', { name: '2 Fotos', exact: true }).click();
  const secondPhoto = page.getByRole('article', {
    name: 'Foto 2',
    exact: true,
  });
  await secondPhoto.getByRole('button', { name: 'Usar como capa' }).click();
  await expect(
    page.getByRole('article', { name: 'Foto 1', exact: true }).locator('img'),
  ).toHaveAttribute('src', /test-2/);
  await page
    .getByRole('button', { name: 'Mover foto 3 para antes', exact: true })
    .click();
  await page
    .getByRole('button', { name: 'Ampliar foto 1', exact: true })
    .click();
  await expect(
    page.getByRole('dialog', { name: 'Foto ampliada' }),
  ).toBeVisible();
  await page.getByRole('button', { name: 'Fechar foto', exact: true }).click();
  await noOverflow(page);
  await page.screenshot({
    path: testInfo.outputPath('fotos.png'),
    fullPage: true,
  });
  await page.getByRole('button', { name: '3 Publicação', exact: true }).click();
  await page
    .getByRole('button', { name: 'Salvar imóvel', exact: true })
    .click();
  await expect(
    page.getByText('Imóvel salvo com sucesso.', { exact: true }),
  ).toBeVisible();
  expect(
    writes.find((write) => write.path.endsWith('/ordem'))?.data.imagemIds,
  ).toEqual([2, 3, 1]);
  expect(writes.some((write) => write.path.endsWith('/2/capa'))).toBe(true);
});

test('validação e proteção ao sair sem salvar', async ({ page }, testInfo) => {
  await setup(page);
  await page.getByRole('link', { name: 'Cadastrar imóvel' }).click();
  await page.getByRole('button', { name: '3 Publicação', exact: true }).click();
  await page
    .getByRole('button', { name: 'Salvar imóvel', exact: true })
    .click();
  await expect(page.getByText('Informe o título do imóvel.')).toBeVisible();
  await expect(page.locator('[formControlName="titulo"]')).toBeFocused();
  await page.locator('[formControlName="titulo"]').fill('Casa em edição');
  await page.getByRole('link', { name: 'Meus imóveis', exact: true }).click();
  await page.getByRole('button', { name: 'Continuar editando', exact: true }).click();
  await expect(
    page.getByRole('heading', { name: 'Novo imóvel' }),
  ).toBeVisible();
  await noOverflow(page);
  await page.screenshot({
    path: testInfo.outputPath('dados.png'),
    fullPage: true,
  });
});

test('remoção confirmada e seleção de arquivos', async ({ page }) => {
  const writes = await setup(page);
  await page.getByRole('link', { name: 'Editar imóvel', exact: true }).click();
  await page.getByRole('button', { name: '2 Fotos', exact: true }).click();
  await page
    .getByRole('button', { name: 'Remover foto 1', exact: true })
    .click();
  await page.getByRole('button', { name: 'Manter foto', exact: true }).click();
  await expect(page.getByRole('article')).toHaveCount(3);
  await page
    .getByRole('button', { name: 'Remover foto 1', exact: true })
    .click();
  await page.getByRole('dialog', { name: 'Remover esta foto' }).getByRole('button', { name: 'Remover foto', exact: true }).click();
  await expect(page.getByRole('article')).toHaveCount(2);
  expect(writes).toHaveLength(0);
  await page
    .locator('input[type=file]')
    .setInputFiles([
      {
        name: 'arquivo.txt',
        mimeType: 'text/plain',
        buffer: Buffer.from('invalid'),
      },
    ]);
  await expect(page.getByRole('alert')).toContainText(
    'Algumas fotos não foram adicionadas',
  );
  await page.locator('input[type=file]').setInputFiles([imagePath, imagePath]);
  await expect(page.getByRole('article')).toHaveCount(4);
  await page.getByRole('button', { name: '3 Publicação', exact: true }).click();
  await page
    .getByRole('button', { name: 'Salvar imóvel', exact: true })
    .click();
  await expect(
    page.getByRole('heading', { name: 'Meus imóveis' }),
  ).toBeVisible();
  expect(writes.filter((write) => write.method === 'DELETE')).toHaveLength(1);
  expect(writes.filter((write) => write.path.endsWith('/upload'))).toHaveLength(
    2,
  );
});

test('falha no carregamento não mostra formulário vazio', async ({ page }) => {
  await setup(page);
  await page.route('**/api/admin/imoveis/1', (route) =>
    route.fulfill({ status: 500, json: {} }),
  );
  await page.getByRole('link', { name: 'Editar imóvel', exact: true }).click();
  await expect(page.getByRole('alert')).toContainText('Não foi possível abrir');
  await expect(page.locator('form')).toHaveCount(0);
});

test('senha pode ser conferida sem perder o preenchimento', async ({
  page,
}) => {
  await page.goto('/admin/login');
  await page.getByLabel('Senha', { exact: true }).fill('test-only-password');
  await page
    .getByRole('button', { name: 'Mostrar senha', exact: true })
    .click();
  await expect(page.getByLabel('Senha', { exact: true })).toHaveAttribute(
    'type',
    'text',
  );
  await page
    .getByRole('button', { name: 'Ocultar senha', exact: true })
    .click();
  await expect(page.getByLabel('Senha', { exact: true })).toHaveValue(
    'test-only-password',
  );
  await noOverflow(page);
});

test('retoma envio interrompido sem repetir imóvel ou foto já enviada', async ({
  page,
}) => {
  const writes = await setup(page);
  let attempts = 0;
  await page.route('**/api/admin/imoveis/1/imagens/upload', async (route) => {
    attempts++;
    if (attempts === 2) return route.fulfill({ status: 500, json: {} });
    return route.fallback();
  });
  await page.getByRole('link', { name: 'Cadastrar imóvel' }).click();
  await page.locator('[formControlName="titulo"]').fill('Casa nova');
  await page.locator('[formControlName="descricao"]').fill('Casa com jardim');
  await page.locator('[formControlName="bairro"]').fill('Centro');
  await page.getByRole('button', { name: '2 Fotos', exact: true }).click();
  await page.locator('input[type=file]').setInputFiles([imagePath, imagePath]);
  await page.getByRole('button', { name: '3 Publicação', exact: true }).click();
  await page
    .getByRole('button', { name: 'Salvar imóvel', exact: true })
    .click();
  await expect(page.getByRole('alert')).toContainText(
    'Não foi possível concluir',
  );
  await page
    .getByRole('button', { name: 'Salvar imóvel', exact: true })
    .click();
  await expect(
    page.getByText('Imóvel salvo com sucesso.', { exact: true }),
  ).toBeVisible();
  expect(attempts).toBe(3);
  expect(
    writes.filter(
      (write) =>
        write.method === 'POST' && write.path.endsWith('/admin/imoveis'),
    ),
  ).toHaveLength(1);
  expect(writes.filter((write) => write.path.endsWith('/upload'))).toHaveLength(
    2,
  );
});
