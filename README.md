# Imobiliaria Front

Frontend Angular do site da Eliane Corretora de Imóveis.

## Produção atual

- Site: https://elianecarneiroimoveis.com.br
- Painel administrativo: https://elianecarneiroimoveis.com.br/admin/login

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

## Painel no celular

O cadastro e a edição são divididos em Dados, Fotos e Publicação. A lista de
imóveis mostra capa, preço e situação, com edição em destaque. Alterações de
situação e remoções de fotos pedem confirmação.

Na etapa Fotos, é possível adicionar várias imagens, ampliar a prévia,
escolher a capa diretamente e alterar a ordem pelos botões de seta. Não é
necessário arrastar. São aceitos JPG, PNG e WebP de até 5 MB por arquivo.

O formulário avisa antes de descartar alterações. Os envios são sequenciais
e preservam os uploads confirmados quando uma tentativa falha; alterações
não salvas não são armazenadas após fechar ou recarregar a página.

### Testes de navegação mobile

Com Google Chrome instalado:

```bash
npm run test:mobile
```

O Playwright inicia o frontend na porta 4201 e simula a API, sem acessar
credenciais ou modificar imóveis de produção. Os testes cobrem telas de
320 px, 390 px e desktop, validação, fotos, recuperação de uploads, login
e proteção de alterações. Capturas e traces ficam em `test-results/`.
A imagem em `e2e/house.jpg` é uma foto pública do próprio catálogo usada
somente como fixture visual; os dados e as credenciais dos testes são fictícios.

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

- `https://elianecarneiroimoveis.com.br/api/...` para o backend
- `https://elianecarneiroimoveis.com.br/uploads/...` para os arquivos enviados

Depois de subir os containers no servidor, teste:

```text
https://elianecarneiroimoveis.com.br
https://elianecarneiroimoveis.com.br/admin/login
https://elianecarneiroimoveis.com.br/api/imoveis
```

O www redireciona para o domínio principal. O acesso HTTPS pelo IP
`54.94.105.56` continua disponível. Não é necessário trocar `apiUrl: '/api'`.
Backups de banco e fotos e a renovação HTTPS são administrados pelo backend;
consulte também o `ops/README.md` daquele repositório.

## Rotas principais

- `/` - catálogo público de imóveis
- `/imoveis/:id` - detalhe público do imóvel
- `/admin/login` - login administrativo
- `/admin/imoveis` - painel de imóveis
- `/admin/imoveis/novo` - cadastro de imóvel
- `/admin/imoveis/:id/editar` - edição de imóvel
