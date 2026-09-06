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

Em produção, o frontend usa `apiUrl: '/api'`. O `nginx.conf` já encaminha:

- `/api` para `http://api-prod:8080/api`
- `/uploads` para `http://api-prod:8080/uploads`

Por isso, ao usar Docker Compose, o serviço do backend deve estar na mesma rede do frontend com o nome `api-prod`.

## Deploy no Lightsail

O deploy de produção deve ser executado a partir do repositório do backend.
Siga o `DEPLOY_HTTPS_IP.md` de lá, usando os três arquivos Compose:

```bash
sudo docker compose -p imobiliaria --env-file .env.prod -f docker-compose.prod.yml -f docker-compose.ip.yml -f docker-compose.ip-https.yml up -d --no-build
```

As imagens devem estar previamente construídas e carregadas. A stack sobe:

- MySQL
- API Spring Boot
- Frontend Angular com Nginx
- Proxy Nginx com HTTPS

No servidor, deixe os dois repositórios no mesmo diretório base:

```text
/opt/imobiliaria/imobiliaria-api
/opt/imobiliaria/imobiliaria-front
```

O frontend de produção usa:

```ts
apiUrl: '/api'
```

Isso significa que o navegador acessa sempre o mesmo domínio do site. O Nginx entrega o Angular e encaminha as chamadas da API:

- `https://seudominio.com/api/...` para o backend
- `https://seudominio.com/uploads/...` para os arquivos enviados

Depois de subir os containers no servidor, teste:

```text
https://seudominio.com
https://seudominio.com/admin/login
https://seudominio.com/api/imoveis
```

Enquanto não houver domínio, use o IP fixo com certificado HTTPS:

```text
https://54.94.105.56
https://54.94.105.56/admin/login
```

## Rotas principais

- `/` - landing page pública
- `/imoveis/:id` - detalhe público do imóvel
- `/admin/login` - login administrativo
- `/admin/imoveis` - painel de imóveis
- `/admin/imoveis/novo` - cadastro de imóvel
- `/admin/imoveis/:id/editar` - edição de imóvel
