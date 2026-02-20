# 🚀 InsightHub - Plano de Desenvolvimento por Sprints

## Visão Geral das Sprints

| Sprint | Nome | Objetivo | Duração Estimada |
|--------|------|----------|-----------------|
| 0 | Setup & Infraestrutura | Docker, configs, estrutura base | 1 dia |
| 1 | Backend Core | NestJS + TypeORM + Auth + Migrations | 2 dias |
| 2 | Módulo Systems & Endpoints | CRUD de sistemas e endpoints | 1-2 dias |
| 3 | Data Collector | Coleta de dados dos endpoints externos | 1-2 dias |
| 4 | AI Engine | Integração Ollama + geração de insights | 2 dias |
| 5 | Frontend Base | Quasar setup + layout + auth + rotas | 1-2 dias |
| 6 | Frontend - Dashboard & Systems | Painel principal + gestão de sistemas | 2 dias |
| 7 | Frontend - Insights & Chat | Visualização de insights + chat com IA | 2 dias |
| 8 | Integração Final | Testes E2E, seed CRMMenu, polish | 1-2 dias |

**Total estimado: 12-15 dias de desenvolvimento**

---
---

# ============================================================
# SPRINT 0 — SETUP & INFRAESTRUTURA
# ============================================================

## Objetivo
Criar a estrutura completa do monorepo, Docker Compose, arquivos de configuração e garantir que o ambiente sobe corretamente com `docker-compose up`.

## Contexto da Stack
- **Monorepo** com 2 projetos: `backend/` (NestJS) e `frontend/` (Quasar/Vue 3)
- **Docker Compose** containeriza: PostgreSQL 16 + NestJS API + Quasar Frontend
- **Ollama** roda nativo no Windows do dev (não é container)
- **Ambiente configurável via `.env`** — a mesma estrutura funciona em dev e prod

## Tarefas

### T0.1 — Criar estrutura raiz do monorepo

```
insighthub/
├── docker-compose.yml
├── docker-compose.prod.yml
├── .env.example
├── .env
├── .gitignore
├── README.md
├── backend/
└── frontend/
```

### T0.2 — Criar `.env.example`

```bash
# ============================================
# INSIGHTHUB - CONFIGURAÇÃO DE AMBIENTE
# ============================================

# ---- Ambiente ----
NODE_ENV=development

# ---- Banco de Dados ----
DB_HOST=db
DB_PORT=5432
DB_NAME=insighthub
DB_USER=insighthub
DB_PASSWORD=insighthub_dev_2024

# ---- Autenticação ----
JWT_SECRET=dev-secret-change-in-production-use-long-random-string
JWT_EXPIRATION=24h

# ---- Ollama / IA ----
# DEV (Windows local):      http://host.docker.internal:11434
# PROD (Servidor dedicado): http://192.168.1.100:11434
OLLAMA_BASE_URL=http://host.docker.internal:11434
OLLAMA_MODEL=llama3.1
OLLAMA_TIMEOUT=120000
OLLAMA_MAX_TOKENS=4096
OLLAMA_TEMPERATURE=0.3

# ---- Portas ----
API_PORT=3000
FRONTEND_PORT=8080

# ---- URLs ----
API_URL=http://localhost:3000
FRONTEND_URL=http://localhost:8080

# ---- Coleta de Dados ----
DATA_COLLECTOR_CRON=0 */6 * * *
DATA_COLLECTOR_TIMEOUT=30000
```

### T0.3 — Criar `docker-compose.yml`

```yaml
version: '3.8'

services:
  db:
    image: postgres:16-alpine
    container_name: insighthub-db
    restart: unless-stopped
    environment:
      POSTGRES_DB: ${DB_NAME:-insighthub}
      POSTGRES_USER: ${DB_USER:-insighthub}
      POSTGRES_PASSWORD: ${DB_PASSWORD:-insighthub_dev_2024}
    ports:
      - "${DB_PORT:-5432}:5432"
    volumes:
      - pgdata:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U ${DB_USER:-insighthub}"]
      interval: 10s
      timeout: 5s
      retries: 5

  api:
    build:
      context: ./backend
      dockerfile: Dockerfile
    container_name: insighthub-api
    restart: unless-stopped
    environment:
      NODE_ENV: ${NODE_ENV:-development}
      DB_HOST: db
      DB_PORT: 5432
      DB_NAME: ${DB_NAME:-insighthub}
      DB_USER: ${DB_USER:-insighthub}
      DB_PASSWORD: ${DB_PASSWORD:-insighthub_dev_2024}
      JWT_SECRET: ${JWT_SECRET:-dev-secret-change-in-production}
      JWT_EXPIRATION: ${JWT_EXPIRATION:-24h}
      OLLAMA_BASE_URL: ${OLLAMA_BASE_URL:-http://host.docker.internal:11434}
      OLLAMA_MODEL: ${OLLAMA_MODEL:-llama3.1}
      OLLAMA_TIMEOUT: ${OLLAMA_TIMEOUT:-120000}
      OLLAMA_MAX_TOKENS: ${OLLAMA_MAX_TOKENS:-4096}
      OLLAMA_TEMPERATURE: ${OLLAMA_TEMPERATURE:-0.3}
      PORT: 3000
    ports:
      - "${API_PORT:-3000}:3000"
    volumes:
      - ./backend:/app
      - /app/node_modules
    depends_on:
      db:
        condition: service_healthy
    extra_hosts:
      - "host.docker.internal:host-gateway"

  frontend:
    build:
      context: ./frontend
      dockerfile: Dockerfile
    container_name: insighthub-frontend
    restart: unless-stopped
    environment:
      VITE_API_URL: ${API_URL:-http://localhost:3000}
    ports:
      - "${FRONTEND_PORT:-8080}:8080"
    volumes:
      - ./frontend:/app
      - /app/node_modules
    depends_on:
      - api

volumes:
  pgdata:
```

### T0.4 — Criar `docker-compose.prod.yml`

```yaml
version: '3.8'

services:
  api:
    environment:
      NODE_ENV: production
      OLLAMA_BASE_URL: ${OLLAMA_BASE_URL}
    volumes: []
    deploy:
      resources:
        limits:
          memory: 1G

  frontend:
    environment:
      VITE_API_URL: ${API_URL}
    volumes: []

  db:
    environment:
      POSTGRES_PASSWORD: ${DB_PASSWORD}
    volumes:
      - pgdata:/var/lib/postgresql/data
      - ./backups:/backups
```

### T0.5 — Inicializar projeto NestJS em `backend/`

Criar projeto NestJS com TypeScript:
- `nest new backend --package-manager npm`
- Instalar dependências: `@nestjs/config`, `@nestjs/typeorm`, `typeorm`, `pg`, `@nestjs/jwt`, `@nestjs/passport`, `passport`, `passport-jwt`, `bcrypt`, `axios`, `class-validator`, `class-transformer`, `@nestjs/schedule`, `@nestjs/swagger`, `swagger-ui-express`
- Configurar `tsconfig.json` com `strict: true`, `esModuleInterop: true`
- Criar `backend/Dockerfile`:

```dockerfile
FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build
EXPOSE 3000
CMD ["sh", "-c", "if [ \"$NODE_ENV\" = 'production' ]; then node dist/main.js; else npm run start:dev; fi"]
```

### T0.6 — Inicializar projeto Quasar em `frontend/`

Criar projeto Quasar com Vue 3 + TypeScript + Vite + Pinia:
- `npm init quasar` → selecionar Vue 3, TypeScript, Vite, Pinia, Sass (SCSS)
- Instalar: `axios`
- Criar `frontend/Dockerfile`:

```dockerfile
FROM node:20-alpine
WORKDIR /app
RUN npm install -g @quasar/cli
COPY package*.json ./
RUN npm ci
COPY . .
EXPOSE 8080
CMD ["sh", "-c", "if [ \"$NODE_ENV\" = 'production' ]; then quasar build && npx serve dist/spa -l 8080; else quasar dev --hostname 0.0.0.0; fi"]
```

### T0.7 — Criar `.gitignore`

```
node_modules/
dist/
.env
*.log
.DS_Store
pgdata/
```

## Critério de Aceite
- `docker-compose up -d` sobe os 3 containers sem erro
- `http://localhost:3000` retorna resposta do NestJS (Hello World)
- `http://localhost:8080` carrega página do Quasar
- PostgreSQL aceita conexão na porta 5432
- Variáveis do `.env` são lidas corretamente pelos containers

---
---

# ============================================================
# SPRINT 1 — BACKEND CORE (NestJS + TypeORM + Auth)
# ============================================================

## Objetivo
Configurar o NestJS com TypeORM, criar todas as entidades do banco, migrations, e o módulo de autenticação JWT completo.

## Pré-requisitos
- Sprint 0 concluída (Docker + estrutura rodando)

## Contexto Técnico
- NestJS com TypeORM + PostgreSQL
- Autenticação via JWT (passport-jwt)
- 3 roles: `admin`, `dev`, `viewer`
- Todas as rotas (exceto login) protegidas por JWT Guard
- Swagger habilitado em `/api/docs`

## Tarefas

### T1.1 — Configurar AppModule com ConfigModule e TypeORM

Criar `src/app.module.ts` importando:
- `ConfigModule.forRoot({ isGlobal: true })` — lê variáveis de ambiente
- `TypeOrmModule.forRootAsync()` — configuração do banco via env vars:
  - host: `DB_HOST`, port: `DB_PORT`, database: `DB_NAME`, username: `DB_USER`, password: `DB_PASSWORD`
  - `autoLoadEntities: true`
  - `synchronize: false` (usar migrations)
- `ScheduleModule.forRoot()` — para cron jobs futuros
- Configurar Swagger no `main.ts` em `/api/docs`
- Configurar CORS permitindo `FRONTEND_URL`
- Prefixo global de rotas: `/api`
- Validation pipe global com `class-validator`

### T1.2 — Criar todas as entidades TypeORM

Criar 5 entidades com os campos exatos abaixo. Cada entidade fica em seu respectivo módulo (serão criados nas sprints seguintes, mas as entidades já devem existir para as migrations).

**User** (`src/modules/users/entities/user.entity.ts`):
- `id`: UUID, PK, auto-generated
- `name`: string(100)
- `email`: string(150), unique
- `password`: string (bcrypt hash)
- `role`: enum `admin | dev | viewer`, default `viewer`
- `is_active`: boolean, default true
- `created_at`: timestamp, auto
- `updated_at`: timestamp, auto

**System** (`src/modules/systems/entities/system.entity.ts`):
- `id`: UUID, PK
- `name`: string(100)
- `slug`: string(50), unique
- `description`: text, nullable
- `base_url`: string(500), nullable
- `auth_type`: enum `none | api_key | bearer | basic`, default `none`
- `auth_config`: jsonb, nullable — formato: `{ "header": "Authorization", "prefix": "Bearer", "token": "xxx" }`
- `is_active`: boolean, default true
- `endpoints`: OneToMany → Endpoint
- `created_at`, `updated_at`: timestamps

**Endpoint** (`src/modules/endpoints/entities/endpoint.entity.ts`):
- `id`: UUID, PK
- `system_id`: UUID, FK → System
- `system`: ManyToOne → System
- `name`: string(100)
- `description`: text, nullable
- `url_template`: string(500) — ex: `/ords/gx360_prd/mensageiro/cartoes-ativos/:mes/:ano`
- `method`: string(10), default `GET`
- `params_schema`: jsonb, nullable — ex: `{ "mes": { "type": "number" }, "ano": { "type": "number" } }`
- `response_mapping`: jsonb, nullable
- `schedule_cron`: string(50), nullable
- `is_active`: boolean, default true
- `last_collected_at`: timestamp, nullable
- `collected_data`: OneToMany → CollectedData
- `created_at`, `updated_at`: timestamps

**CollectedData** (`src/modules/data-collector/entities/collected-data.entity.ts`):
- `id`: UUID, PK
- `endpoint_id`: UUID, FK → Endpoint
- `endpoint`: ManyToOne → Endpoint
- `raw_data`: jsonb — resposta bruta da API externa
- `processed_data`: jsonb, nullable — dados normalizados
- `params_used`: jsonb, nullable — ex: `{ "mes": 2, "ano": 2026 }`
- `status`: enum `success | error | timeout`
- `error_message`: text, nullable
- `collected_at`: timestamp
- `created_at`: timestamp
- Index composto em `[endpoint_id, collected_at]`

**Insight** (`src/modules/ai-engine/entities/insight.entity.ts`):
- `id`: UUID, PK
- `system_id`: UUID, FK → System, nullable
- `endpoint_id`: UUID, FK → Endpoint, nullable
- `type`: enum `analysis | comparison | anomaly | forecast | custom`
- `title`: string(300)
- `content`: text — resposta em Markdown da IA
- `severity`: enum `info | warning | critical | success`, default `info`
- `data_snapshot`: jsonb, nullable — snapshot dos dados usados
- `prompt_used`: text, nullable
- `model_used`: string(50)
- `created_at`, `updated_at`: timestamps

### T1.3 — Criar Migrations

Gerar migrations TypeORM para criar todas as tabelas na ordem correta:
1. `create-users`
2. `create-systems`
3. `create-endpoints` (FK → systems)
4. `create-collected-data` (FK → endpoints)
5. `create-insights` (FK → systems, endpoints)

Configurar scripts no `package.json`:
```json
"migration:generate": "typeorm migration:generate -d src/config/data-source.ts",
"migration:run": "typeorm migration:run -d src/config/data-source.ts",
"migration:revert": "typeorm migration:revert -d src/config/data-source.ts"
```

Criar `src/config/data-source.ts` como DataSource standalone para CLI do TypeORM.

### T1.4 — Módulo de Autenticação (Auth)

Criar `src/modules/auth/` com:

**auth.module.ts**: importa UsersModule, JwtModule, PassportModule

**auth.service.ts**:
- `register(dto)`: cria user com bcrypt hash (10 rounds), retorna user sem password
- `login(dto)`: valida email + password, retorna `{ access_token, user }`
- `validateUser(email, password)`: busca user, compara bcrypt

**auth.controller.ts**:
- `POST /api/auth/login` — body: `{ email, password }` → retorna JWT + dados do user
- `POST /api/auth/register` — protegido, apenas role `admin` pode criar users

**jwt.strategy.ts**: extrai JWT do header Authorization Bearer, valida, retorna user

**DTOs**:
- `LoginDto`: email (IsEmail), password (IsString, MinLength 6)
- `RegisterDto`: name (IsString), email (IsEmail), password (MinLength 6), role (IsEnum, optional)

### T1.5 — Guards e Decorators

**auth.guard.ts**: `JwtAuthGuard` extends `AuthGuard('jwt')` — aplica em todas as rotas exceto login

**roles.guard.ts**: `RolesGuard` — verifica se `request.user.role` está nos roles permitidos

**roles.decorator.ts**: `@Roles('admin', 'dev')` — decorator para definir roles permitidos por rota

**transform.interceptor.ts**: interceptor global que wrapa respostas em:
```json
{
  "success": true,
  "data": { ... },
  "timestamp": "2026-02-14T10:00:00Z"
}
```

**http-exception.filter.ts**: filter global que wrapa erros em:
```json
{
  "success": false,
  "error": "mensagem do erro",
  "statusCode": 400,
  "timestamp": "2026-02-14T10:00:00Z"
}
```

### T1.6 — Módulo Users (CRUD básico)

Criar `src/modules/users/` com:

**users.service.ts**:
- `findAll()`: lista users (sem campo password)
- `findOne(id)`: busca por id
- `findByEmail(email)`: busca por email (usado pelo auth)
- `create(dto)`: cria user
- `update(id, dto)`: atualiza user
- `remove(id)`: soft delete (is_active = false)

**users.controller.ts** (todas protegidas, role admin):
- `GET /api/users` — lista todos
- `GET /api/users/:id` — busca por id
- `PUT /api/users/:id` — atualiza
- `DELETE /api/users/:id` — desativa

### T1.7 — Seed do Admin

Criar `src/database/seeds/admin-user.seed.ts`:
- Cria user admin padrão se não existir:
  - name: `Admin`
  - email: `admin@insighthub.com`
  - password: `admin123` (bcrypt)
  - role: `admin`

Criar script `npm run seed:run` que executa os seeds.

## Critério de Aceite
- `npm run migration:run` cria todas as tabelas no PostgreSQL
- `POST /api/auth/login` com `admin@insighthub.com` / `admin123` retorna JWT válido
- Rotas protegidas retornam 401 sem token
- `GET /api/users` com token admin retorna lista de users
- Swagger em `/api/docs` lista todas as rotas
- Respostas seguem formato padronizado `{ success, data, timestamp }`

---
---

# ============================================================
# SPRINT 2 — MÓDULO SYSTEMS & ENDPOINTS (CRUD)
# ============================================================

## Objetivo
Criar os CRUDs completos de Systems e Endpoints, permitindo cadastrar, editar e listar sistemas e seus endpoints via API.

## Pré-requisitos
- Sprint 1 concluída (Auth + Entidades + Migrations)

## Tarefas

### T2.1 — Módulo Systems

Criar `src/modules/systems/` com:

**systems.service.ts**:
- `findAll()`: lista todos os sistemas ativos com contagem de endpoints
- `findOne(id)`: busca sistema por id com seus endpoints carregados (relations: ['endpoints'])
- `findBySlug(slug)`: busca por slug
- `create(dto)`: cria sistema, gera slug automaticamente a partir do name (lowercase, hifens, sem acentos)
- `update(id, dto)`: atualiza sistema
- `remove(id)`: soft delete (is_active = false)
- `getStats(id)`: retorna estatísticas do sistema (total endpoints, total coletas, último insight)

**systems.controller.ts** (protegido JWT, roles admin/dev):
- `GET /api/systems` — lista todos os sistemas
- `POST /api/systems` — cadastra novo sistema
- `GET /api/systems/:id` — detalhes com endpoints
- `PUT /api/systems/:id` — atualiza
- `DELETE /api/systems/:id` — desativa
- `GET /api/systems/:id/stats` — estatísticas

**DTOs**:
- `CreateSystemDto`:
  - `name`: IsString, IsNotEmpty, MaxLength(100)
  - `description`: IsString, IsOptional
  - `base_url`: IsUrl, IsOptional
  - `auth_type`: IsEnum(AuthType), IsOptional, default `none`
  - `auth_config`: IsObject, IsOptional
- `UpdateSystemDto`: PartialType(CreateSystemDto)

### T2.2 — Módulo Endpoints

Criar `src/modules/endpoints/` com:

**endpoints.service.ts**:
- `findAll()`: lista todos com nome do sistema
- `findBySystem(systemId)`: lista endpoints de um sistema
- `findOne(id)`: busca com sistema carregado
- `create(dto)`: cria endpoint vinculado ao sistema
- `update(id, dto)`: atualiza
- `remove(id)`: soft delete (is_active = false)
- `testEndpoint(id, params)`: faz uma chamada real ao endpoint externo e retorna a resposta (sem salvar no banco). Usar para validar se o endpoint funciona.
  - Montar URL substituindo `:param` pelos valores de `params`
  - Aplicar auth headers do sistema pai
  - Retornar: `{ status, data, response_time_ms }`

**endpoints.controller.ts** (protegido JWT, roles admin/dev):
- `GET /api/endpoints` — lista todos
- `GET /api/endpoints/system/:systemId` — lista por sistema
- `POST /api/endpoints` — cadastra novo
- `PUT /api/endpoints/:id` — atualiza
- `DELETE /api/endpoints/:id` — desativa
- `POST /api/endpoints/:id/test` — testa o endpoint com parâmetros enviados no body

**DTOs**:
- `CreateEndpointDto`:
  - `system_id`: IsUUID
  - `name`: IsString, MaxLength(100)
  - `description`: IsString, IsOptional
  - `url_template`: IsString, MaxLength(500) — ex: `/ords/gx360_prd/mensageiro/cartoes-ativos/:mes/:ano`
  - `method`: IsString, IsOptional, default `GET`
  - `params_schema`: IsObject, IsOptional
  - `response_mapping`: IsObject, IsOptional
  - `schedule_cron`: IsString, IsOptional
- `UpdateEndpointDto`: PartialType(CreateEndpointDto)
- `TestEndpointDto`:
  - `params`: IsObject — ex: `{ "mes": 2, "ano": 2026 }`

### T2.3 — Seed do CRMMenu

Criar `src/database/seeds/crmmenu-system.seed.ts` que cadastra:

**Sistema**:
- name: `CRMMenu`
- slug: `crmmenu`
- description: `Sistema de CRM para gestão de cartões fidelidade, pontos e resgates`
- base_url: `https://crediativos.mensageiro.gx360.com.br`
- auth_type: `none`

**3 Endpoints**:

1. Cartões Ativos:
   - name: `Cartões Ativos`
   - url_template: `/ords/gx360_prd/mensageiro/cartoes-ativos/:mes/:ano`
   - method: `GET`
   - params_schema: `{ "mes": { "type": "number", "description": "Mês (1-12)" }, "ano": { "type": "number", "description": "Ano" } }`

2. Cartões Resgatados:
   - name: `Cartões Resgatados`
   - url_template: `/ords/gx360_prd/mensageiro/cartoes_resgatados/:mes/:ano`
   - method: `GET`
   - params_schema: (mesmo formato)

3. Pontos Distribuídos:
   - name: `Pontos Distribuídos`
   - url_template: `/ords/gx360_prd/mensageiro/pontos-dia/:mes/:ano`
   - method: `GET`
   - params_schema: (mesmo formato)

Incluir este seed no `npm run seed:run` (após o seed de admin).

## Critério de Aceite
- `POST /api/systems` cria sistema e retorna com slug gerado
- `GET /api/systems/:id` retorna sistema com seus endpoints
- `POST /api/endpoints` cria endpoint vinculado ao sistema
- `POST /api/endpoints/:id/test` com `{ "params": { "mes": 2, "ano": 2026 } }` chama a API externa e retorna dados reais
- Seed cria CRMMenu com 3 endpoints
- Swagger documenta todos os DTOs e rotas

---
---

# ============================================================
# SPRINT 3 — DATA COLLECTOR (Coleta de Dados)
# ============================================================

## Objetivo
Criar o serviço que coleta dados dos endpoints externos, salva no banco (collected_data), e pode ser executado manualmente ou via cron job.

## Pré-requisitos
- Sprint 2 concluída (Systems + Endpoints + Seed CRMMenu)

## Tarefas

### T3.1 — Módulo Data Collector

Criar `src/modules/data-collector/` com:

**data-collector.module.ts**: importa TypeOrmModule com entidades Endpoint, CollectedData, System

**data-collector.service.ts**:

- `collectFromEndpoint(endpointId: string, params: Record<string, any>)`:
  1. Busca endpoint com relation system
  2. Monta URL completa: `system.base_url + endpoint.url_template` substituindo cada `:param` pelo valor correspondente em `params`
  3. Monta headers de auth baseado em `system.auth_type` e `system.auth_config`
  4. Faz chamada HTTP (axios) com method do endpoint e timeout de 30s
  5. Em caso de SUCESSO:
     - Salva `CollectedData` com status `success`, `raw_data` = resposta, `processed_data` = resultado do `processData()`, `params_used` = params
     - Atualiza `endpoint.last_collected_at`
  6. Em caso de ERRO:
     - Salva `CollectedData` com status `error`, `error_message` = mensagem do erro
  7. Retorna o `CollectedData` salvo

- `collectAll(mes?: number, ano?: number)`:
  1. Busca todos endpoints com `is_active: true` e relations system
  2. Para cada endpoint, resolve os params default (mes/ano do momento atual se não informados)
  3. Chama `collectFromEndpoint()` para cada um
  4. Retorna array de `CollectedData[]`

- `getCollectedData(endpointId: string, options?: { limit?, offset?, startDate?, endDate? })`:
  1. Busca collected_data do endpoint com filtros
  2. Ordena por `collected_at DESC`
  3. Retorna paginado

- `getLatestData(endpointId: string)`:
  1. Retorna o último `CollectedData` com status `success` do endpoint

- `getLatestDataBySystem(systemId: string)`:
  1. Busca todos endpoints do sistema
  2. Para cada um, busca o último collected_data com sucesso
  3. Retorna mapa: `{ [endpointName]: latestData }`

- Método privado `processData(rawData, responseMapping)`:
  1. Se não há mapping, retorna null
  2. Se mapping tem `data_field`, extrai `rawData[data_field]`
  3. Se resultado é array, gera: `{ total_items, items (com label/value mapeados), summary: { total } }`

- Método privado `buildUrl(endpoint, params)`: concatena base_url + url_template substituindo `:key`

- Método privado `buildAuthHeaders(system)`: retorna headers baseado no auth_type

### T3.2 — Scheduler (Cron Jobs)

Criar `data-collector.scheduler.ts`:

- Usar `@nestjs/schedule` com `@Cron()`
- Ler cron expression da env `DATA_COLLECTOR_CRON` (default: `0 */6 * * *` = a cada 6h)
- No handler: chamar `dataCollectorService.collectAll()` com mês/ano atual
- Logar início e fim da coleta com contagem de sucessos e erros

### T3.3 — Controller de Coleta

Criar `data-collector.controller.ts` (protegido JWT, roles admin/dev):

- `POST /api/collector/collect/:endpointId` — body: `{ "params": { "mes": 2, "ano": 2026 } }` → coleta um endpoint específico
- `POST /api/collector/collect-all` — body opcional: `{ "mes": 2, "ano": 2026 }` → coleta todos endpoints ativos
- `GET /api/collector/data/:endpointId` — query: `?limit=10&offset=0` → lista dados coletados de um endpoint
- `GET /api/collector/data/:endpointId/latest` — retorna último dado coletado com sucesso
- `GET /api/collector/system/:systemId/latest` — retorna últimos dados de todos endpoints do sistema

## Critério de Aceite
- `POST /api/collector/collect/:endpointId` com params `{ "mes": 2, "ano": 2026 }` chama a API do CRMMenu e salva resposta no banco
- `POST /api/collector/collect-all` coleta os 3 endpoints do CRMMenu
- `GET /api/collector/data/:endpointId` retorna histórico de coletas
- `GET /api/collector/system/:systemId/latest` retorna os dados mais recentes de cada endpoint
- Scheduler executa automaticamente no cron configurado
- Erros de coleta são salvos com status `error` e mensagem

---
---

# ============================================================
# SPRINT 4 — AI ENGINE (Integração Ollama + Insights)
# ============================================================

## Objetivo
Criar o módulo de IA que se comunica com o Ollama (Llama), monta prompts contextualizados com os dados coletados, e gera insights salvos no banco.

## Pré-requisitos
- Sprint 3 concluída (Data Collector funcional com dados no banco)
- Ollama rodando localmente no Windows com modelo `llama3.1` instalado (`ollama pull llama3.1`)

## Tarefas

### T4.1 — Cliente Ollama

Criar `src/modules/ai-engine/ollama.client.ts`:

Classe `OllamaClient` (@Injectable):

- Construtor: cria instância axios com:
  - `baseURL`: env `OLLAMA_BASE_URL` (dev: `http://host.docker.internal:11434`)
  - `timeout`: env `OLLAMA_TIMEOUT` (default: 120000ms)
  - Propriedade `model`: env `OLLAMA_MODEL` (default: `llama3.1`)

- `generate(prompt: string, systemPrompt?: string): Promise<string>`:
  - POST para `/api/generate` com body:
    ```json
    {
      "model": "llama3.1",
      "prompt": "...",
      "system": "...",
      "stream": false,
      "options": {
        "temperature": 0.3,
        "num_predict": 4096
      }
    }
    ```
  - Retorna `response.data.response` (string)
  - Em caso de erro, lança exceção com mensagem clara

- `isHealthy(): Promise<boolean>`:
  - GET para `/` — retorna true se 200, false se erro

- `listModels(): Promise<string[]>`:
  - GET para `/api/tags` — retorna lista de nomes dos modelos

### T4.2 — Construtor de Prompts

Criar `src/modules/ai-engine/prompt-builder.service.ts`:

Classe `PromptBuilderService` (@Injectable):

**System Prompt** (usado em todas as chamadas):
```
Você é um analista de dados especializado em business intelligence.
Seu papel é analisar dados de sistemas empresariais e gerar insights acionáveis.

REGRAS:
- Responda SEMPRE em português brasileiro
- Use formatação Markdown para organizar a resposta
- Inclua métricas numéricas sempre que possível
- Destaque anomalias, tendências e oportunidades
- Sugira ações concretas baseadas nos dados
- Se os dados forem insuficientes, diga claramente
- Classifique a severidade na PRIMEIRA LINHA: [SEVERITY:INFO] ou [SEVERITY:WARNING] ou [SEVERITY:CRITICAL] ou [SEVERITY:SUCCESS]
```

**Método `buildPrompt(type, data, context?)`** — retorna `{ system: string, prompt: string }`:

Baseado no `type`, usar template diferente:

- **ANALYSIS**: "Analise os seguintes dados do sistema X, endpoint Y: {dados json}. Período: Z. Resuma dados principais, identifique padrões, destaque melhor/pior desempenho, sugira 3 ações."

- **COMPARISON**: "Compare os dados do período 1 vs período 2: {dados1 json} vs {dados2 json}. Compare totais (% crescimento/queda), identifique quais unidades cresceram/caíram, destaque mudanças significativas."

- **ANOMALY**: "Analise os dados e identifique ANOMALIAS e OUTLIERS: {dados json}. Procure valores fora da média, comportamento irregular, padrões quebrados, possíveis erros."

- **FORECAST**: "Com base nos dados históricos: {dados json}. Identifique tendência geral, projete próximo período, identifique sazonalidades, destaque riscos e oportunidades."

- **CUSTOM**: "Dados disponíveis: {dados json}. Pergunta do usuário: {context}. Responda com base nos dados."

Cada template deve incluir os dados coletados formatados como JSON dentro do prompt.

### T4.3 — Serviço Principal AI Engine

Criar `src/modules/ai-engine/ai-engine.service.ts`:

Classe `AiEngineService` (@Injectable):

- Injeta: `InsightRepository`, `OllamaClient`, `PromptBuilderService`, `DataCollectorService`, `ConfigService`

- `generateInsight(dto: GenerateInsightDto): Promise<Insight>`:
  1. Buscar dados coletados mais recentes do endpoint/sistema via DataCollectorService
  2. Montar dados de contexto: `{ systemName, endpointName, collectedData, period, systemId, endpointId }`
  3. Chamar `promptBuilder.buildPrompt(type, data, context)`
  4. Chamar `ollamaClient.generate(prompt, systemPrompt)`
  5. Extrair severidade da resposta (regex `[SEVERITY:XXX]`)
  6. Limpar response (remover tag de severidade)
  7. Gerar título automático baseado no type + nomes
  8. Salvar Insight no banco com: type, title, content, severity, data_snapshot, prompt_used, model_used
  9. Retornar insight salvo

- `compare(dto: CompareInsightDto): Promise<Insight>`:
  1. Coletar dados do período 1 (endpointId + params periodo1)
  2. Coletar dados do período 2 (endpointId + params periodo2)
  3. Montar data com ambos períodos
  4. Gerar insight com type `COMPARISON`

- `chat(dto: ChatDto): Promise<{ response: string }>`:
  1. Buscar últimos dados coletados do sistema
  2. Montar contexto com todos os dados disponíveis
  3. Chamar Ollama com type CUSTOM e pergunta do usuário como context
  4. Retornar resposta sem salvar no banco (é transiente)

- `findAll(options?: { systemId?, type?, limit?, offset? }): Promise<Insight[]>`:
  - Lista insights com filtros e paginação, ordenados por `created_at DESC`

- `findOne(id): Promise<Insight>`

- `findBySystem(systemId): Promise<Insight[]>`

- `remove(id): Promise<void>`

- `getHealthStatus()`:
  - Retorna: `{ ollama_connected, ollama_url, available_models, current_model }`

### T4.4 — Controller AI Engine

Criar `ai-engine.controller.ts` (protegido JWT, roles admin/dev):

- `POST /api/insights/generate` — body:
  ```json
  {
    "type": "analysis",
    "endpoint_id": "uuid",
    "params": { "mes": 2, "ano": 2026 },
    "context": "opcional"
  }
  ```
  → gera e retorna insight

- `POST /api/insights/compare` — body:
  ```json
  {
    "endpoint_id": "uuid",
    "period1": { "mes": 1, "ano": 2026 },
    "period2": { "mes": 2, "ano": 2026 }
  }
  ```
  → gera insight comparativo

- `POST /api/insights/chat` — body:
  ```json
  {
    "system_id": "uuid",
    "question": "Qual unidade teve melhor desempenho?"
  }
  ```
  → retorna resposta da IA em tempo real

- `GET /api/insights` — query: `?system_id=&type=&limit=10&offset=0` → lista insights
- `GET /api/insights/:id` → detalhe
- `GET /api/insights/system/:systemId` → insights de um sistema
- `DELETE /api/insights/:id` → remove

### T4.5 — DTOs do AI Engine

- `GenerateInsightDto`: type (IsEnum), endpoint_id (IsUUID), params (IsObject, optional), context (IsString, optional)
- `CompareInsightDto`: endpoint_id (IsUUID), period1 (IsObject), period2 (IsObject)
- `ChatDto`: system_id (IsUUID), question (IsString, MinLength 3)

### T4.6 — Dashboard Service

Criar `src/modules/dashboard/`:

**dashboard.service.ts**:
- `getSummary()`: retorna `{ total_systems, total_endpoints, total_insights, total_collections, ollama_status }`
- `getRecentInsights(limit: 5)`: últimos insights gerados
- `getHealth()`: status do Ollama + status dos endpoints (último sucesso/erro de cada)

**dashboard.controller.ts** (protegido JWT):
- `GET /api/dashboard/summary`
- `GET /api/dashboard/recent`
- `GET /api/dashboard/health`

## Critério de Aceite
- `GET /api/dashboard/health` mostra `ollama_connected: true` quando Ollama está rodando
- `POST /api/insights/generate` com type `analysis` e endpoint do CRMMenu gera insight em Markdown salvo no banco
- `POST /api/insights/compare` compara dois meses e retorna análise comparativa
- `POST /api/insights/chat` responde pergunta livre sobre os dados
- `GET /api/insights` lista todos os insights gerados
- Resposta da IA vem em português, formatada em Markdown, com severidade classificada

---
---

# ============================================================
# SPRINT 5 — FRONTEND BASE (Quasar + Auth + Layout)
# ============================================================

## Objetivo
Configurar o frontend Quasar com sistema de autenticação, layout principal com menu lateral, roteamento protegido e serviço de comunicação com a API.

## Pré-requisitos
- Sprint 4 concluída (API completa e funcional)

## Tarefas

### T5.1 — Boot Axios

Criar `src/boot/axios.ts`:
- Criar instância axios com `baseURL` lido de `import.meta.env.VITE_API_URL` (env `VITE_API_URL`)
- Interceptor de request: adiciona header `Authorization: Bearer {token}` se token existe no localStorage
- Interceptor de response: se receber 401, limpa token e redireciona para `/login`
- Exportar instância como `api`

Registrar boot no `quasar.config.js`.

### T5.2 — Store de Autenticação (Pinia)

Criar `src/stores/auth.store.ts`:

State:
- `user`: objeto do usuário logado ou null
- `token`: string JWT ou null
- `isAuthenticated`: computed, true se token existe

Actions:
- `login(email, password)`: POST `/api/auth/login`, salva token e user no state e localStorage
- `logout()`: limpa state e localStorage, redireciona para `/login`
- `checkAuth()`: verifica se há token no localStorage, se sim seta no state
- `getToken()`: retorna token atual

### T5.3 — Roteamento

Criar `src/router/routes.ts`:

```
/login          → LoginPage.vue        (layout: AuthLayout, público)
/               → DashboardPage.vue    (layout: MainLayout, protegido)
/systems        → SystemsPage.vue      (protegido)
/systems/:id    → SystemDetailPage.vue (protegido)
/endpoints      → EndpointsPage.vue    (protegido)
/insights       → InsightsPage.vue     (protegido)
/insights/:id   → InsightDetailPage.vue(protegido)
/chat           → ChatInsightPage.vue  (protegido)
/settings       → SettingsPage.vue     (protegido, admin/dev)
```

Configurar navigation guard em `src/router/index.ts`:
- Antes de cada rota: se rota requer auth e não há token → redireciona `/login`
- Se está logado e vai pra `/login` → redireciona `/`

### T5.4 — AuthLayout

Criar `src/layouts/AuthLayout.vue`:
- Layout simples centralizado para tela de login
- Background com cor/gradiente da marca
- Card centralizado vertical e horizontalmente
- Logo "🧠 InsightHub" no topo

### T5.5 — MainLayout

Criar `src/layouts/MainLayout.vue`:
- **QLayout** com header + drawer lateral + page container
- **Header**: logo "🧠 InsightHub" à esquerda, nome do usuário + botão logout à direita
- **Drawer lateral** com menu de navegação usando QList/QItem:
  - 📊 Dashboard → `/`
  - 🖥️ Sistemas → `/systems`
  - 🔗 Endpoints → `/endpoints`
  - 🧠 Insights → `/insights`
  - 💬 Chat IA → `/chat`
  - ⚙️ Configurações → `/settings`
- **QPageContainer** para renderizar as páginas filhas
- Drawer responsivo: fixo em desktop, toggle em mobile
- Estilo dark/profissional

### T5.6 — LoginPage

Criar `src/pages/LoginPage.vue`:
- Card com logo, título "InsightHub"
- Campo email (QInput, type email)
- Campo senha (QInput, type password, toggle visibilidade)
- Botão "Entrar" (QBtn, loading state)
- Validação com Quasar rules
- Ao submeter: chama `authStore.login()`, se sucesso redireciona para `/`
- Se erro: mostra Notify com mensagem

### T5.7 — Services Base

Criar os services que encapsulam chamadas à API:

`src/services/api.service.ts` — exporta instância base do axios

`src/services/auth.service.ts`:
- `login(email, password)`
- `register(data)`

`src/services/systems.service.ts`:
- `getAll()`, `getById(id)`, `create(data)`, `update(id, data)`, `remove(id)`, `getStats(id)`

`src/services/endpoints.service.ts`:
- `getAll()`, `getBySystem(systemId)`, `create(data)`, `update(id, data)`, `remove(id)`, `test(id, params)`

`src/services/insights.service.ts`:
- `generate(data)`, `compare(data)`, `chat(data)`, `getAll(filters)`, `getById(id)`, `getBySystem(systemId)`, `remove(id)`

`src/services/dashboard.service.ts`:
- `getSummary()`, `getRecent()`, `getHealth()`

### T5.8 — Stores Pinia

Criar stores para cada domínio:

`src/stores/systems.store.ts`: state (systems, currentSystem, loading), actions (fetchAll, fetchOne, create, update, remove)

`src/stores/endpoints.store.ts`: state (endpoints, loading), actions (fetchBySystem, create, update, remove, test)

`src/stores/insights.store.ts`: state (insights, currentInsight, loading), actions (fetchAll, generate, compare, chat, remove)

`src/stores/dashboard.store.ts`: state (summary, recentInsights, health, loading), actions (fetchSummary, fetchRecent, fetchHealth)

## Critério de Aceite
- Tela de login funcional — autentica com admin@insighthub.com / admin123
- Após login, redireciona para Dashboard com layout completo (header + menu lateral)
- Menu lateral navega entre as páginas (podem estar vazias por enquanto)
- Token é persistido — refresh da página mantém logado
- Rota protegida redireciona para login se não autenticado
- Logout limpa sessão e volta para login

---
---

# ============================================================
# SPRINT 6 — FRONTEND: DASHBOARD & GESTÃO DE SISTEMAS
# ============================================================

## Objetivo
Construir a página principal (Dashboard) com cards de resumo, status e insights recentes, e as telas de gestão de sistemas e endpoints.

## Pré-requisitos
- Sprint 5 concluída (layout, auth, stores, services)

## Tarefas

### T6.1 — DashboardPage

Criar `src/pages/DashboardPage.vue`:

**Seção 1 — Cards de resumo** (linha de 4 cards usando QCard):
- Total Sistemas (ícone 🖥️, valor numérico, cor primary)
- Total Endpoints (ícone 🔗, valor numérico, cor secondary)
- Total Insights (ícone 🧠, valor numérico, cor accent)
- Status Ollama (ícone ⚡, "Online"/"Offline", cor verde/vermelha)

Dados vindos de `GET /api/dashboard/summary`.

**Seção 2 — Duas colunas**:
- Coluna esquerda: "Últimos Dados Coletados" — lista com nome do sistema, nome do endpoint, último valor, data da coleta
- Coluna direita: "Insights Recentes" — lista com severity badge (cor), título, preview do conteúdo (truncado), data. Clicável → navega para `/insights/:id`

Dados vindos de `GET /api/dashboard/recent`.

**Seção 3 — Ação rápida**:
- Input de pergunta: "💬 Perguntar à IA sobre os dados..."
- 3 botões de ação rápida: [Analisar] [Comparar Períodos] [Detectar Anomalias]
- Ao clicar em qualquer botão ou enviar pergunta → navega para `/chat` com query params

Componentes a criar:
- `src/components/dashboard/StatsCard.vue` — card reutilizável com ícone, label, valor, cor
- `src/components/dashboard/RecentInsightsList.vue` — lista de insights com severity badge
- `src/components/dashboard/SystemStatusCard.vue` — card com dados do endpoint

### T6.2 — SystemsPage

Criar `src/pages/SystemsPage.vue`:

- Header da página: "Sistemas" + botão "+ Novo Sistema"
- Grid de cards (QCard) — um card por sistema:
  - Nome do sistema, descrição (truncada), base_url
  - Badge de status (Ativo/Inativo)
  - Contagem de endpoints
  - Botões: [Ver Detalhes] [Editar] [Excluir]
- Botão "+ Novo Sistema" abre QDialog com formulário (SystemForm)
- Loading state com QSkeleton
- Empty state: "Nenhum sistema cadastrado. Adicione seu primeiro sistema."

### T6.3 — SystemForm (Componente)

Criar `src/components/systems/SystemForm.vue`:

QDialog com formulário:
- Nome (QInput, obrigatório)
- Descrição (QInput, textarea)
- Base URL (QInput, placeholder "https://api.exemplo.com")
- Tipo de Auth (QSelect: Nenhuma, API Key, Bearer Token, Basic Auth)
- Campos condicionais baseados no tipo de auth:
  - API Key: header name + value
  - Bearer: token
  - Basic: username + password
- Botões [Cancelar] [Salvar]
- Modo edição (recebe prop `system` para preencher campos)

### T6.4 — SystemDetailPage

Criar `src/pages/SystemDetailPage.vue`:

- Breadcrumb: Sistemas / NomeDoSistema
- Card com info do sistema: nome, base_url, auth_type, status, datas
- Botões [Editar] [Desativar]
- Seção "Endpoints" — lista de endpoints do sistema (QList):
  - Cada item: nome, url_template, method badge (GET/POST), última coleta
  - Botões por item: [Coletar Agora] [Gerar Insight] [Testar] [Editar] [Excluir]
  - [Coletar Agora]: abre mini dialog pedindo mes/ano, chama collector
  - [Gerar Insight]: navega para chat com system/endpoint pré-selecionados
  - [Testar]: abre dialog com inputs de params, chama test endpoint, mostra resposta JSON
- Botão "+ Adicionar Endpoint" abre EndpointForm

### T6.5 — EndpointForm (Componente)

Criar `src/components/systems/EndpointForm.vue`:

QDialog com formulário:
- Nome (QInput, obrigatório)
- Descrição (QInput)
- URL Template (QInput, placeholder "/api/dados/:mes/:ano")
- Dica abaixo do campo: "Use :param para parâmetros dinâmicos"
- Método (QSelect: GET, POST, PUT)
- Schema de Parâmetros (QInput JSON ou builder dinâmico)
- Cron de Agendamento (QInput, placeholder "0 */6 * * *", com dica)
- Botões [Cancelar] [Salvar]

### T6.6 — EndpointsPage

Criar `src/pages/EndpointsPage.vue`:

- Header: "Endpoints" + filtro por sistema (QSelect)
- Tabela (QTable) com colunas: Sistema, Nome, URL, Método, Última Coleta, Status, Ações
- Ações por linha: [Testar] [Coletar] [Insight] [Editar] [Excluir]
- Paginação
- Busca/filtro

## Critério de Aceite
- Dashboard carrega e exibe cards com dados reais da API
- Insights recentes são clicáveis e navegam para detalhe
- CRUD de sistemas funciona: criar, editar, listar, desativar
- CRUD de endpoints funciona: criar, editar, listar, vincular ao sistema
- Botão "Testar" chama o endpoint real e mostra resposta JSON
- Botão "Coletar Agora" coleta dados e mostra confirmação
- Formulários têm validação e feedback visual

---
---

# ============================================================
# SPRINT 7 — FRONTEND: INSIGHTS & CHAT COM IA
# ============================================================

## Objetivo
Construir as telas de listagem de insights, detalhe de insight, e o chat interativo com a IA onde o usuário faz perguntas sobre os dados coletados.

## Pré-requisitos
- Sprint 6 concluída (Dashboard, Systems, Endpoints funcionais)

## Tarefas

### T7.1 — InsightsPage

Criar `src/pages/InsightsPage.vue`:

- Header: "Insights" com filtros:
  - QSelect: filtro por sistema
  - QSelect: filtro por tipo (Análise, Comparação, Anomalia, Previsão, Custom)
  - QSelect: filtro por severidade (Info, Warning, Critical, Success)
- Lista de insights (QCard ou QList):
  - Cada item mostra:
    - **Severity badge** (QBadge com cor): info=blue, warning=orange, critical=red, success=green
    - **Título** do insight
    - **Tipo** (QChip: Análise, Comparação, etc.)
    - **Sistema** associado (QChip)
    - **Data** de criação (formato relativo: "há 2 horas")
    - **Preview** do conteúdo (primeiros 150 caracteres)
  - Click no card → navega para `/insights/:id`
- Paginação
- Loading com QSkeleton
- Empty state: "Nenhum insight gerado ainda. Use o Chat ou gere insights a partir dos endpoints."
- Botão flutuante: "💬 Novo Insight via Chat" → navega `/chat`

### T7.2 — InsightDetailPage

Criar `src/pages/InsightDetailPage.vue`:

- Breadcrumb: Insights / Título do Insight
- Card principal:
  - **Header**: título, severity badge, tipo chip, data
  - **Corpo**: conteúdo renderizado como Markdown (usar lib `marked` ou `vue-markdown` ou QMarkupTable)
    - Instalar: `marked` + `dompurify` para segurança
    - Renderizar HTML do markdown com v-html
  - **Footer**: modelo usado (llama3.1), sistema, endpoint
- Card secundário "Dados Utilizados":
  - Exibir `data_snapshot` formatado como JSON tree (QTree ou <pre> com syntax highlight)
  - Toggle para expandir/colapsar
- Card "Prompt Enviado":
  - Exibir `prompt_used` em bloco de código
  - Toggle para expandir/colapsar (colapsado por padrão)
- Ações:
  - [Regenerar] — chama novamente a IA com os mesmos dados
  - [Excluir] — confirma e remove
  - [Voltar] — volta para lista

### T7.3 — ChatInsightPage (Principal)

Criar `src/pages/ChatInsightPage.vue`:

Esta é a tela mais importante do sistema. É um chat interativo onde o usuário conversa com a IA sobre os dados coletados.

**Layout da tela**:
```
┌─────────────────────────────────────────────────────┐
│  Barra de Contexto                                   │
│  Sistema: [QSelect]  Período: [Mês/Ano QDate]       │
├─────────────────────────────────────────────────────┤
│                                                     │
│  Área de mensagens (scroll)                          │
│                                                     │
│  🤖 Mensagem da IA...                               │
│  👤 Mensagem do usuário...                           │
│  🤖 Resposta da IA (Markdown renderizado)...         │
│                                                     │
├─────────────────────────────────────────────────────┤
│  Ações rápidas:                                      │
│  [Analisar Dados] [Comparar] [Anomalias] [Previsão] │
├─────────────────────────────────────────────────────┤
│  [Input de mensagem.....................] [Enviar]    │
└─────────────────────────────────────────────────────┘
```

**Funcionalidade**:

- **Barra de contexto** (topo):
  - QSelect de sistema (carrega do store)
  - QInput ou QDate de mês/ano para selecionar período
  - Ao mudar sistema/período: mostra mensagem "Contexto atualizado para CRMMenu - Fev/2026"

- **Área de mensagens**:
  - Array reativo de mensagens: `{ role: 'user' | 'assistant', content: string, timestamp: Date }`
  - Mensagens do user: alinhadas à direita, background primário
  - Mensagens da IA: alinhadas à esquerda, background cinza, conteúdo renderizado como Markdown
  - Auto-scroll para última mensagem
  - Indicador de "digitando..." enquanto IA processa (QSpinner)

- **Ações rápidas** (chips/botões acima do input):
  - "📊 Analisar Dados" → envia automaticamente "Faça uma análise completa dos dados atuais"
  - "📈 Comparar Períodos" → abre mini dialog pedindo 2 períodos, depois chama compare
  - "⚠️ Detectar Anomalias" → envia "Identifique anomalias e outliers nos dados"
  - "🔮 Previsão" → envia "Faça uma previsão para o próximo período baseado nos dados"

- **Input de mensagem**:
  - QInput com placeholder "Pergunte algo sobre os dados..."
  - Botão enviar (QBtn com ícone)
  - Enter para enviar, Shift+Enter para nova linha
  - Desabilitado enquanto IA processa

- **Fluxo de envio**:
  1. Usuário digita pergunta e envia
  2. Adiciona mensagem do user ao array
  3. Mostra indicador "digitando..."
  4. Chama `POST /api/insights/chat` com `{ system_id, question }`
  5. Recebe resposta, adiciona como mensagem assistant
  6. Remove indicador

- **Ações rápidas com tipo específico**:
  - Analisar → `POST /api/insights/generate` com type `analysis`
  - Comparar → `POST /api/insights/compare`
  - Anomalias → `POST /api/insights/generate` com type `anomaly`
  - Previsão → `POST /api/insights/generate` com type `forecast`
  - Essas ações geram insights salvos no banco E mostram no chat

### T7.4 — ChatInterface (Componente)

Criar `src/components/insights/ChatInterface.vue`:

Componente reutilizável de chat que recebe:
- Props: `systemId`, `initialMessages?`
- Emits: `@messageSent`, `@insightGenerated`

Encapsula toda a lógica de chat descrita acima para poder ser reutilizado no Dashboard também.

### T7.5 — Componentes de Suporte

`src/components/insights/InsightViewer.vue`:
- Recebe prop `insight` (objeto)
- Renderiza conteúdo Markdown com severity badge
- Usado tanto na InsightDetailPage quanto em cards

`src/components/insights/InsightTimeline.vue`:
- Recebe prop `insights[]`
- Mostra timeline vertical (QTimeline) com insights ordenados por data
- Cada item mostra severity, título, preview, data

`src/components/shared/ConfirmDialog.vue`:
- Dialog de confirmação reutilizável
- Props: title, message, confirmLabel, cancelLabel

`src/components/shared/LoadingOverlay.vue`:
- Overlay com QSpinner para loading de operações longas (IA gerando insight)
- Mensagem customizável: "Gerando insight com IA..."

`src/components/shared/EmptyState.vue`:
- Componente para estados vazios
- Props: icon, title, description, actionLabel, actionTo

## Critério de Aceite
- InsightsPage lista insights com filtros por sistema, tipo e severidade
- InsightDetailPage renderiza Markdown corretamente e mostra dados usados
- Chat funciona: enviar pergunta → receber resposta da IA em Markdown
- Ações rápidas (Analisar, Comparar, Anomalias, Previsão) funcionam e geram insights
- Indicador de loading aparece enquanto IA processa
- Mensagens do chat têm scroll automático
- Comparação pede 2 períodos e mostra resultado

---
---

# ============================================================
# SPRINT 8 — INTEGRAÇÃO FINAL, SETTINGS & POLISH
# ============================================================

## Objetivo
Criar tela de configurações, testes end-to-end do fluxo completo, ajustes de UX e preparação para deploy.

## Pré-requisitos
- Todas as sprints anteriores concluídas

## Tarefas

### T8.1 — SettingsPage

Criar `src/pages/SettingsPage.vue`:

Seções (usando QTabs ou QExpansionItems):

**Seção "Status da IA"**:
- Status do Ollama: Online/Offline com indicador visual
- URL do Ollama configurada
- Modelo atual
- Lista de modelos disponíveis no Ollama
- Botão [Testar Conexão] — chama health check
- Se offline: mensagem de ajuda "Verifique se o Ollama está rodando. Execute: ollama serve"

**Seção "Meu Perfil"** (role viewer+):
- Editar nome
- Alterar senha
- Botão [Salvar]

**Seção "Usuários"** (role admin):
- Tabela de usuários (QTable): nome, email, role, status
- Botão [+ Novo Usuário]
- Editar role
- Ativar/Desativar usuário

**Seção "Coleta Automática"** (role admin/dev):
- Cron expression atual
- Próxima execução prevista
- Histórico das últimas 10 execuções automáticas
- Botão [Executar Agora] — dispara coleta manual de todos endpoints

### T8.2 — Melhorias de UX

- **Notificações (QNotify)**: configurar globalmente:
  - Sucesso: verde, ícone check, posição top
  - Erro: vermelho, ícone warning, posição top
  - Usar em todas as operações: salvar, excluir, coletar, gerar insight

- **Loading States**: toda operação async deve ter loading state:
  - Botões: usar prop `loading` do QBtn
  - Tabelas: usar QSkeleton
  - Páginas: usar QInnerLoading ou LoadingOverlay

- **Confirmações**: toda ação destrutiva (excluir, desativar) usa ConfirmDialog

- **Responsividade**:
  - Dashboard cards: 4 colunas em desktop, 2 em tablet, 1 em mobile
  - Tabelas: modo card em mobile (QTable dense/grid)
  - Chat: tela cheia em mobile
  - Drawer: overlay em mobile, fixo em desktop

- **Tema escuro**: adicionar toggle de dark mode no header (Quasar Dark plugin)

### T8.3 — Tratamento de Erros Global

No frontend:
- Interceptor axios: tratar erros de rede, timeout, 500
- Se Ollama está offline e usuário tenta gerar insight: mensagem amigável "O serviço de IA está indisponível no momento. Verifique as configurações."
- Se endpoint externo falha na coleta: mostrar mensagem com detalhes do erro

No backend:
- HttpExceptionFilter captura todas as exceções
- Logar erros no console com timestamp e stack trace
- Retornar mensagens amigáveis ao frontend (nunca expor stack traces)

### T8.4 — Teste do Fluxo Completo (Checklist Manual)

Execute na ordem e valide cada passo:

1. `docker-compose up -d` — sobe 3 containers
2. Confirmar Ollama rodando: `ollama list` no Windows
3. Acessar `http://localhost:8080` — tela de login
4. Login com admin@insighthub.com / admin123 → Dashboard
5. Dashboard mostra cards de resumo (possivelmente zerados)
6. Navegar para Sistemas → CRMMenu já cadastrado (seed)
7. Clicar em CRMMenu → ver 3 endpoints
8. Clicar em [Testar] no endpoint "Cartões Ativos" com mes=2, ano=2026 → ver JSON da resposta
9. Clicar em [Coletar Agora] no endpoint "Cartões Ativos" → sucesso
10. Repetir coleta para os 3 endpoints
11. Navegar para Chat → selecionar CRMMenu → perguntar "Faça uma análise dos cartões ativos"
12. Aguardar resposta da IA em Markdown
13. Clicar em [Comparar Períodos] → selecionar Jan/2026 vs Fev/2026 → ver comparativo
14. Navegar para Insights → ver insights gerados listados
15. Clicar em um insight → ver detalhes com Markdown renderizado
16. Navegar para Settings → ver Ollama Online
17. Dashboard agora mostra números atualizados

### T8.5 — Documentação

Criar/atualizar:

**README.md** (raiz):
- Descrição do projeto
- Stack
- Como rodar em desenvolvimento (passo a passo)
- Como fazer deploy em produção
- Variáveis de ambiente explicadas

**docs/API.md**:
- Lista de todas as rotas com method, path, body, response
- Exemplos de request/response

**docs/DEPLOY.md**:
- Guia de deploy em produção
- Configuração do servidor de IA (Ollama)
- Configuração do Docker Compose em prod
- Checklist de segurança (.env, JWT_SECRET, DB_PASSWORD)

**docs/PROMPTS.md**:
- Documentação dos prompts usados pela IA
- Como customizar prompts para novos sistemas
- Dicas para melhorar qualidade dos insights

### T8.6 — Preparação para Produção

Verificar:
- [ ] `docker-compose.prod.yml` funciona com `docker-compose -f docker-compose.yml -f docker-compose.prod.yml up -d`
- [ ] Frontend buildado em modo produção (quasar build)
- [ ] Backend compilado (npm run build → dist/)
- [ ] `.env.example` documentado
- [ ] `.gitignore` inclui `.env`, `node_modules`, `pgdata`, `dist`
- [ ] Todas as senhas padrão sinalizadas para troca em produção
- [ ] CORS configurado para domínio de produção

## Critério de Aceite
- Fluxo completo (T8.4) funciona do login até visualização de insight
- Settings mostra status correto do Ollama
- Erros são tratados com mensagens amigáveis
- Aplicação é responsiva em desktop e mobile
- Documentação está completa e atualizada
- Build de produção funciona com docker-compose.prod.yml

---
---

# ============================================================
# RESUMO — ORDEM DE EXECUÇÃO
# ============================================================

```
SPRINT 0 → Setup (Docker, configs, estrutura)
    ↓
SPRINT 1 → Backend Core (NestJS, TypeORM, Auth, Migrations)
    ↓
SPRINT 2 → CRUD Systems & Endpoints + Seed CRMMenu
    ↓
SPRINT 3 → Data Collector (coleta dados das APIs externas)
    ↓
SPRINT 4 → AI Engine (Ollama + prompts + insights)
    ↓
SPRINT 5 → Frontend Base (Quasar, auth, layout, rotas, services)
    ↓
SPRINT 6 → Frontend Dashboard + Gestão de Sistemas
    ↓
SPRINT 7 → Frontend Insights + Chat com IA
    ↓
SPRINT 8 → Integração, Settings, Polish, Deploy
```

Cada sprint é auto-suficiente como prompt. Copie a sprint inteira e cole na IA de desenvolvimento junto com o documento de arquitetura (ARQUITETURA-INSIGHTHUB.md) para contexto completo.

---

*InsightHub Sprint Plan v1.0 — Fevereiro 2026*
