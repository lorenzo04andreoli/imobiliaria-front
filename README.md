# Imobiliaria Front

Frontend Angular do site da Eliane Corretora de Imóveis.

## Produção atual

- Site: https://54.94.105.56
- Painel administrativo: https://54.94.105.56/admin/login

Hospedado no AWS Lightsail, em São Paulo, com HTTPS e renovação automática
do certificado no servidor. O painel não exige túnel SSH. As credenciais
são mantidas fora do repositório; tentativas excessivas de login retornam 429.

## Requisitos

- Node.js 22 ou superior
- npm

## Rodar localmente

Instale as dependências:

```bash
npm ci
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

Inicie também o backend conforme o README do repositório `imobiliaria-api`.
As configurações de API e marca ficam em `src/environments/environment.ts`
para desenvolvimento e `environment.prod.ts` para produção.

## Build

```bash
npm run build
```

Os arquivos finais são gerados em:

```text
dist/imobiliaria-front/browser
```

## Testes

É necessário ter Chrome ou Chromium instalado e disponível ao Karma.

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
Siga o [DEPLOY_HTTPS_IP.md do backend](https://github.com/lorenzo04andreoli/imobiliaria-api/blob/main/DEPLOY_HTTPS_IP.md), usando os três arquivos Compose:

```bash
sudo docker compose -p imobiliaria --env-file .env.prod -f docker-compose.prod.yml -f docker-compose.ip.yml -f docker-compose.ip-https.yml up -d --no-build
```

As imagens devem estar previamente construídas e carregadas. Atualizar o Git
não atualiza a imagem em execução: após mudanças no código, faça o build e
transfira/carregue a nova imagem antes desse comando. A stack sobe:

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

Isso significa que o navegador acessa sempre a mesma origem do site. O Nginx entrega o Angular e encaminha as chamadas da API:

- `https://54.94.105.56/api/...` para o backend
- `https://54.94.105.56/uploads/...` para os arquivos enviados

Depois de subir os containers no servidor, teste:

```text
https://54.94.105.56
https://54.94.105.56/admin/login
https://54.94.105.56/api/imoveis
```

Um domínio poderá ser adicionado depois, configurando DNS, certificado e
CORS no backend. Não é necessário trocar `apiUrl: '/api'` no frontend.
Backups de banco e fotos e a renovação HTTPS são administrados pelo backend;
consulte também o `ops/README.md` daquele repositório.

## Rotas principais

- `/` - catálogo público de imóveis
- `/imoveis/:id` - detalhe público do imóvel
- `/admin/login` - login administrativo
- `/admin/imoveis` - painel de imóveis
- `/admin/imoveis/novo` - cadastro de imóvel
- `/admin/imoveis/:id/editar` - edição de imóvel
