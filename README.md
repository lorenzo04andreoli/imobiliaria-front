# Imobiliaria Front

Frontend Angular do site da Eliane Corretora de Imóveis.

## Requisitos

- Node.js 22 ou superior
- npm

## Rodar localmente

Instale as dependências:

```bash
npm install
```

Inicie o servidor local:

```bash
npm start
```

A aplicação fica disponível em:

```text
http://localhost:4200
```

Por padrão, o ambiente local consome a API em:

```text
http://localhost:8080/api
```

## Build

```bash
npm run build
```

Os arquivos finais são gerados em:

```text
dist/imobiliaria-front/browser
```

## Testes

```bash
npm test -- --watch=false --browsers=ChromeHeadless
```

## Produção com Docker

Gerar a imagem:

```bash
docker build -t imobiliaria-front:latest .
```

Rodar o container:

```bash
docker run --rm -p 8081:80 imobiliaria-front:latest
```

Em produção, o frontend usa `apiUrl: '/api'`. O `nginx.conf` já encaminha:

- `/api` para `http://api-prod:8080/api`
- `/uploads` para `http://api-prod:8080/uploads`

Por isso, ao usar Docker Compose, o serviço do backend deve estar na mesma rede do frontend com o nome `api-prod`.

## Rotas principais

- `/` - landing page pública
- `/imoveis/:id` - detalhe público do imóvel
- `/admin/login` - login administrativo
- `/admin/imoveis` - painel de imóveis
- `/admin/imoveis/novo` - cadastro de imóvel
- `/admin/imoveis/:id/editar` - edição de imóvel
