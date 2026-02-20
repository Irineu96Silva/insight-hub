# 🧠 InsightHub - Arquitetura Completa do Projeto

## Documento de Arquitetura para Desenvolvimento com IA

---

## 1. Visão Geral

**InsightHub** é um painel administrativo inteligente que consome endpoints de APIs de múltiplos sistemas (SaaS) da empresa, extrai dados, e utiliza IA (Llama via Ollama) para gerar insights automáticos sobre os dados coletados.

### Stack Definida

| Camada | Tecnologia |
|--------|-----------|
| Frontend | **Quasar Framework (Vue 3 + Vite)** |
| Backend | **NestJS (Node.js + TypeScript)** |
| Banco de Dados | **PostgreSQL** |
| IA/LLM | **Llama 3.1 via Ollama** |
| Containerização | **Docker Compose** (API + DB + Front) |
| LLM Runtime | **Ollama nativo no Windows (dev) / Servidor dedicado (prod)** |

### Princípio de Deploy

```
DEV:  Ollama nativo Windows + Docker Compose (API + DB + Front)
PROD: Ollama em servidor dedicado + Docker Compose (API + DB + Front) em servidor de aplicação
MIGRAÇÃO: Apenas alterar variáveis no .env
```

---

## 2. Estrutura de Pastas do Monorepo

```
insighthub/
├── docker-compose.yml
├── docker-compose.prod.yml
├── .env.example
├── .env
├── .gitignore
├── README.md
│
├── backend/
│   ├── Dockerfile
│   ├── package.json
│   ├── tsconfig.json
│   ├── tsconfig.build.json
│   ├── nest-cli.json
│   ├── .eslintrc.js
│   ├── .prettierrc
│   │
│   └── src/
│       ├── main.ts
│       ├── app.module.ts
│       │
│       ├── config/
│       │   ├── config.module.ts
│       │   ├── database.config.ts
│       │   ├── ollama.config.ts
│       │   └── app.config.ts
│       │
│       ├── common/
│       │   ├── decorators/
│       │   │   └── roles.decorator.ts
│       │   ├── guards/
│       │   │   ├── auth.guard.ts
│       │   │   └── roles.guard.ts
│       │   ├── interceptors/
│       │   │   └── transform.interceptor.ts
│       │   ├── filters/
│       │   │   └── http-exception.filter.ts
│       │   ├── dto/
│       │   │   └── pagination.dto.ts
│       │   └── interfaces/
│       │       └── api-response.interface.ts
│       │
│       ├── modules/
│       │   ├── auth/
│       │   │   ├── auth.module.ts
│       │   │   ├── auth.controller.ts
│       │   │   ├── auth.service.ts
│       │   │   ├── strategies/
│       │   │   │   └── jwt.strategy.ts
│       │   │   └── dto/
│       │   │       ├── login.dto.ts
│       │   │       └── register.dto.ts
│       │   │
│       │   ├── users/
│       │   │   ├── users.module.ts
│       │   │   ├── users.controller.ts
│       │   │   ├── users.service.ts
│       │   │   ├── entities/
│       │   │   │   └── user.entity.ts
│       │   │   └── dto/
│       │   │       ├── create-user.dto.ts
│       │   │       └── update-user.dto.ts
│       │   │
│       │   ├── systems/
│       │   │   ├── systems.module.ts
│       │   │   ├── systems.controller.ts
│       │   │   ├── systems.service.ts
│       │   │   ├── entities/
│       │   │   │   └── system.entity.ts
│       │   │   └── dto/
│       │   │       ├── create-system.dto.ts
│       │   │       └── update-system.dto.ts
│       │   │
│       │   ├── endpoints/
│       │   │   ├── endpoints.module.ts
│       │   │   ├── endpoints.controller.ts
│       │   │   ├── endpoints.service.ts
│       │   │   ├── entities/
│       │   │   │   └── endpoint.entity.ts
│       │   │   └── dto/
│       │   │       ├── create-endpoint.dto.ts
│       │   │       └── update-endpoint.dto.ts
│       │   │
│       │   ├── data-collector/
│       │   │   ├── data-collector.module.ts
│       │   │   ├── data-collector.service.ts
│       │   │   ├── data-collector.scheduler.ts
│       │   │   ├── entities/
│       │   │   │   └── collected-data.entity.ts
│       │   │   └── interfaces/
│       │   │       └── collector.interface.ts
│       │   │
│       │   ├── ai-engine/
│       │   │   ├── ai-engine.module.ts
│       │   │   ├── ai-engine.controller.ts
│       │   │   ├── ai-engine.service.ts
│       │   │   ├── ollama.client.ts
│       │   │   ├── prompt-builder.service.ts
│       │   │   ├── entities/
│       │   │   │   └── insight.entity.ts
│       │   │   ├── dto/
│       │   │   │   ├── generate-insight.dto.ts
│       │   │   │   └── insight-response.dto.ts
│       │   │   ├── prompts/
│       │   │   │   ├── system-prompt.ts
│       │   │   │   ├── analysis-prompt.ts
│       │   │   │   ├── comparison-prompt.ts
│       │   │   │   └── forecast-prompt.ts
│       │   │   └── interfaces/
│       │   │       └── ollama-response.interface.ts
│       │   │
│       │   └── dashboard/
│       │       ├── dashboard.module.ts
│       │       ├── dashboard.controller.ts
│       │       └── dashboard.service.ts
│       │
│       └── database/
│           ├── migrations/
│           │   ├── 001-create-users.ts
│           │   ├── 002-create-systems.ts
│           │   ├── 003-create-endpoints.ts
│           │   ├── 004-create-collected-data.ts
│           │   └── 005-create-insights.ts
│           └── seeds/
│               ├── admin-user.seed.ts
│               └── crmmenu-system.seed.ts
│
├── frontend/
│   ├── Dockerfile
│   ├── package.json
│   ├── quasar.config.js
│   ├── tsconfig.json
│   ├── .eslintrc.js
│   │
│   └── src/
│       ├── App.vue
│       ├── index.template.html
│       │
│       ├── css/
│       │   ├── app.scss
│       │   └── quasar.variables.scss
│       │
│       ├── boot/
│       │   ├── axios.ts
│       │   ├── auth.ts
│       │   └── notify-defaults.ts
│       │
│       ├── router/
│       │   ├── index.ts
│       │   └── routes.ts
│       │
│       ├── stores/
│       │   ├── index.ts
│       │   ├── auth.store.ts
│       │   ├── systems.store.ts
│       │   ├── endpoints.store.ts
│       │   ├── insights.store.ts
│       │   └── dashboard.store.ts
│       │
│       ├── services/
│       │   ├── api.service.ts
│       │   ├── auth.service.ts
│       │   ├── systems.service.ts
│       │   ├── endpoints.service.ts
│       │   ├── insights.service.ts
│       │   └── dashboard.service.ts
│       │
│       ├── layouts/
│       │   ├── MainLayout.vue
│       │   └── AuthLayout.vue
│       │
│       ├── pages/
│       │   ├── LoginPage.vue
│       │   ├── DashboardPage.vue
│       │   ├── SystemsPage.vue
│       │   ├── SystemDetailPage.vue
│       │   ├── EndpointsPage.vue
│       │   ├── InsightsPage.vue
│       │   ├── InsightDetailPage.vue
│       │   ├── ChatInsightPage.vue
│       │   └── SettingsPage.vue
│       │
│       ├── components/
│       │   ├── dashboard/
│       │   │   ├── StatsCard.vue
│       │   │   ├── InsightCard.vue
│       │   │   ├── DataChart.vue
│       │   │   ├── SystemStatusCard.vue
│       │   │   └── RecentInsightsList.vue
│       │   ├── systems/
│       │   │   ├── SystemForm.vue
│       │   │   ├── SystemCard.vue
│       │   │   └── EndpointForm.vue
│       │   ├── insights/
│       │   │   ├── InsightViewer.vue
│       │   │   ├── InsightTimeline.vue
│       │   │   └── ChatInterface.vue
│       │   └── shared/
│       │       ├── ConfirmDialog.vue
│       │       ├── LoadingOverlay.vue
│       │       └── EmptyState.vue
│       │
│       └── composables/
│           ├── useAuth.ts
│           ├── useInsights.ts
│           └── useEndpointData.ts
│
└── docs/
    ├── API.md
    ├── DEPLOY.md
    └── PROMPTS.md
```

---

## 3. Configuração Docker

### 3.1 docker-compose.yml (Desenvolvimento)

```yaml
version: '3.8'

services:
  # ============================================
  # PostgreSQL Database
  # ============================================
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

  # ============================================
  # NestJS Backend API
  # ============================================
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
      PORT: 3000
    ports:
      - "${API_PORT:-3000}:3000"
    volumes:
      - ./backend/src:/app/src
    depends_on:
      db:
        condition: service_healthy
    extra_hosts:
      - "host.docker.internal:host-gateway"

  # ============================================
  # Quasar Frontend
  # ============================================
  frontend:
    build:
      context: ./frontend
      dockerfile: Dockerfile
    container_name: insighthub-frontend
    restart: unless-stopped
    environment:
      API_URL: ${API_URL:-http://localhost:3000}
    ports:
      - "${FRONTEND_PORT:-8080}:8080"
    volumes:
      - ./frontend/src:/app/src
    depends_on:
      - api

volumes:
  pgdata:
```

### 3.2 docker-compose.prod.yml (Produção - Override)

```yaml
version: '3.8'

services:
  api:
    environment:
      NODE_ENV: production
      # Em produção, OLLAMA_BASE_URL aponta para o servidor dedicado de IA
      OLLAMA_BASE_URL: ${OLLAMA_BASE_URL:-http://ai-server.internal:11434}
    volumes: []  # Remove bind mounts em produção
    deploy:
      resources:
        limits:
          memory: 1G

  frontend:
    environment:
      API_URL: ${API_URL:-https://insighthub.suaempresa.com.br/api}
    volumes: []

  db:
    environment:
      POSTGRES_PASSWORD: ${DB_PASSWORD}  # Obrigatório em prod
    volumes:
      - pgdata:/var/lib/postgresql/data
      - ./backups:/backups  # Pasta para backups
```

---

## 4. Variáveis de Ambiente

### .env.example

```bash
# ============================================
# 🔧 INSIGHTHUB - CONFIGURAÇÃO DE AMBIENTE
# ============================================
# Copie este arquivo para .env e ajuste os valores
# Para migrar para produção, basta alterar as variáveis abaixo

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
# DEV (Windows local): http://host.docker.internal:11434
# PROD (Servidor dedicado): http://192.168.1.100:11434 ou http://ai-server.internal:11434
OLLAMA_BASE_URL=http://host.docker.internal:11434
OLLAMA_MODEL=llama3.1
OLLAMA_TIMEOUT=120000
OLLAMA_MAX_TOKENS=4096
OLLAMA_TEMPERATURE=0.3

# ---- Portas ----
API_PORT=3000
FRONTEND_PORT=8080

# ---- URLs Públicas ----
API_URL=http://localhost:3000
FRONTEND_URL=http://localhost:8080

# ---- Coleta de Dados ----
DATA_COLLECTOR_CRON=0 */6 * * *
DATA_COLLECTOR_TIMEOUT=30000
```

---

## 5. Modelagem do Banco de Dados (PostgreSQL)

### Diagrama ER

```
┌──────────────┐     ┌──────────────────┐     ┌──────────────────────┐
│    users     │     │     systems      │     │      endpoints       │
├──────────────┤     ├──────────────────┤     ├──────────────────────┤
│ id (PK)      │     │ id (PK)          │     │ id (PK)              │
│ name         │     │ name             │     │ system_id (FK)       │
│ email        │     │ slug             │     │ name                 │
│ password     │     │ description      │     │ description          │
│ role         │     │ base_url         │     │ url_template         │
│ is_active    │     │ auth_type        │     │ method               │
│ created_at   │     │ auth_config      │     │ params_schema        │
│ updated_at   │     │ is_active        │     │ response_mapping     │
└──────────────┘     │ created_at       │     │ schedule_cron        │
                     │ updated_at       │     │ is_active            │
                     └──────────────────┘     │ last_collected_at    │
                                              │ created_at           │
                                              │ updated_at           │
                                              └──────────────────────┘
                                                        │
                     ┌──────────────────┐               │
                     │    insights      │     ┌─────────┴────────────┐
                     ├──────────────────┤     │   collected_data     │
                     │ id (PK)          │     ├──────────────────────┤
                     │ system_id (FK)   │     │ id (PK)              │
                     │ endpoint_id (FK) │     │ endpoint_id (FK)     │
                     │ type             │     │ raw_data (JSONB)     │
                     │ title            │     │ processed_data(JSONB)│
                     │ content          │     │ params_used (JSONB)  │
                     │ severity         │     │ status               │
                     │ data_snapshot    │     │ error_message        │
                     │ prompt_used      │     │ collected_at         │
                     │ model_used       │     │ created_at           │
                     │ created_at       │     └──────────────────────┘
                     │ updated_at       │
                     └──────────────────┘
```

### 5.1 Entidades TypeORM

#### users

```typescript
// backend/src/modules/users/entities/user.entity.ts
import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

export enum UserRole {
  ADMIN = 'admin',
  DEV = 'dev',
  VIEWER = 'viewer',
}

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ length: 100 })
  name: string;

  @Column({ unique: true, length: 150 })
  email: string;

  @Column()
  password: string; // bcrypt hash

  @Column({ type: 'enum', enum: UserRole, default: UserRole.VIEWER })
  role: UserRole;

  @Column({ default: true })
  is_active: boolean;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
```

#### systems

```typescript
// backend/src/modules/systems/entities/system.entity.ts
import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, OneToMany } from 'typeorm';
import { Endpoint } from '../../endpoints/entities/endpoint.entity';

export enum AuthType {
  NONE = 'none',
  API_KEY = 'api_key',
  BEARER = 'bearer',
  BASIC = 'basic',
}

@Entity('systems')
export class System {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ length: 100 })
  name: string; // Ex: "CRMMenu"

  @Column({ unique: true, length: 50 })
  slug: string; // Ex: "crmmenu"

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ length: 500, nullable: true })
  base_url: string; // Ex: "https://crediativos.mensageiro.gx360.com.br"

  @Column({ type: 'enum', enum: AuthType, default: AuthType.NONE })
  auth_type: AuthType;

  @Column({ type: 'jsonb', nullable: true })
  auth_config: Record<string, any>;
  // Ex: { "header": "Authorization", "prefix": "Bearer", "token": "xxx" }

  @Column({ default: true })
  is_active: boolean;

  @OneToMany(() => Endpoint, (endpoint) => endpoint.system)
  endpoints: Endpoint[];

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
```

#### endpoints

```typescript
// backend/src/modules/endpoints/entities/endpoint.entity.ts
import {
  Entity, PrimaryGeneratedColumn, Column, CreateDateColumn,
  UpdateDateColumn, ManyToOne, OneToMany, JoinColumn
} from 'typeorm';
import { System } from '../../systems/entities/system.entity';
import { CollectedData } from '../../data-collector/entities/collected-data.entity';

@Entity('endpoints')
export class Endpoint {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  system_id: string;

  @ManyToOne(() => System, (system) => system.endpoints)
  @JoinColumn({ name: 'system_id' })
  system: System;

  @Column({ length: 100 })
  name: string; // Ex: "Cartões Ativos"

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ length: 500 })
  url_template: string;
  // Ex: "/ords/gx360_prd/mensageiro/cartoes-ativos/:mes/:ano"
  // Parâmetros dinâmicos são representados por :param

  @Column({ length: 10, default: 'GET' })
  method: string;

  @Column({ type: 'jsonb', nullable: true })
  params_schema: Record<string, any>;
  // Define os parâmetros dinâmicos e seus tipos
  // Ex: { "mes": { "type": "number", "description": "Mês (1-12)" },
  //       "ano": { "type": "number", "description": "Ano (ex: 2024)" } }

  @Column({ type: 'jsonb', nullable: true })
  response_mapping: Record<string, any>;
  // Mapeamento de campos da resposta para nomes amigáveis
  // Ex: { "data_field": "items", "label_field": "unidade", "value_field": "total" }

  @Column({ length: 50, nullable: true })
  schedule_cron: string; // Ex: "0 */6 * * *" (a cada 6 horas)

  @Column({ default: true })
  is_active: boolean;

  @Column({ type: 'timestamp', nullable: true })
  last_collected_at: Date;

  @OneToMany(() => CollectedData, (data) => data.endpoint)
  collected_data: CollectedData[];

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
```

#### collected_data

```typescript
// backend/src/modules/data-collector/entities/collected-data.entity.ts
import {
  Entity, PrimaryGeneratedColumn, Column, CreateDateColumn,
  ManyToOne, JoinColumn, Index
} from 'typeorm';
import { Endpoint } from '../../endpoints/entities/endpoint.entity';

export enum CollectionStatus {
  SUCCESS = 'success',
  ERROR = 'error',
  TIMEOUT = 'timeout',
}

@Entity('collected_data')
@Index(['endpoint_id', 'collected_at'])
export class CollectedData {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  endpoint_id: string;

  @ManyToOne(() => Endpoint, (endpoint) => endpoint.collected_data)
  @JoinColumn({ name: 'endpoint_id' })
  endpoint: Endpoint;

  @Column({ type: 'jsonb' })
  raw_data: Record<string, any>; // Resposta bruta da API

  @Column({ type: 'jsonb', nullable: true })
  processed_data: Record<string, any>; // Dados normalizados pós-mapeamento

  @Column({ type: 'jsonb', nullable: true })
  params_used: Record<string, any>; // Ex: { "mes": 1, "ano": 2024 }

  @Column({ type: 'enum', enum: CollectionStatus })
  status: CollectionStatus;

  @Column({ type: 'text', nullable: true })
  error_message: string;

  @Column({ type: 'timestamp' })
  collected_at: Date;

  @CreateDateColumn()
  created_at: Date;
}
```

#### insights

```typescript
// backend/src/modules/ai-engine/entities/insight.entity.ts
import {
  Entity, PrimaryGeneratedColumn, Column, CreateDateColumn,
  UpdateDateColumn, ManyToOne, JoinColumn
} from 'typeorm';
import { System } from '../../systems/entities/system.entity';
import { Endpoint } from '../../endpoints/entities/endpoint.entity';

export enum InsightType {
  ANALYSIS = 'analysis',       // Análise geral dos dados
  COMPARISON = 'comparison',   // Comparativo entre unidades/períodos
  ANOMALY = 'anomaly',        // Detecção de anomalias
  FORECAST = 'forecast',      // Previsões/tendências
  CUSTOM = 'custom',          // Pergunta livre do usuário
}

export enum InsightSeverity {
  INFO = 'info',
  WARNING = 'warning',
  CRITICAL = 'critical',
  SUCCESS = 'success',
}

@Entity('insights')
export class Insight {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ nullable: true })
  system_id: string;

  @ManyToOne(() => System, { nullable: true })
  @JoinColumn({ name: 'system_id' })
  system: System;

  @Column({ nullable: true })
  endpoint_id: string;

  @ManyToOne(() => Endpoint, { nullable: true })
  @JoinColumn({ name: 'endpoint_id' })
  endpoint: Endpoint;

  @Column({ type: 'enum', enum: InsightType })
  type: InsightType;

  @Column({ length: 300 })
  title: string;

  @Column({ type: 'text' })
  content: string; // Resposta formatada da IA (Markdown)

  @Column({ type: 'enum', enum: InsightSeverity, default: InsightSeverity.INFO })
  severity: InsightSeverity;

  @Column({ type: 'jsonb', nullable: true })
  data_snapshot: Record<string, any>; // Snapshot dos dados usados na análise

  @Column({ type: 'text', nullable: true })
  prompt_used: string; // Prompt enviado ao Ollama

  @Column({ length: 50 })
  model_used: string; // Ex: "llama3.1"

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
```

---

## 6. Módulo AI Engine - Integração com Ollama

### 6.1 Cliente Ollama

```typescript
// backend/src/modules/ai-engine/ollama.client.ts
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios, { AxiosInstance } from 'axios';

export interface OllamaGenerateRequest {
  model: string;
  prompt: string;
  system?: string;
  stream?: boolean;
  options?: {
    temperature?: number;
    num_predict?: number;
    top_p?: number;
  };
}

export interface OllamaGenerateResponse {
  model: string;
  response: string;
  done: boolean;
  total_duration?: number;
  eval_count?: number;
}

@Injectable()
export class OllamaClient {
  private readonly logger = new Logger(OllamaClient.name);
  private readonly client: AxiosInstance;
  private readonly model: string;

  constructor(private configService: ConfigService) {
    const baseURL = this.configService.get<string>('OLLAMA_BASE_URL');
    const timeout = this.configService.get<number>('OLLAMA_TIMEOUT', 120000);

    this.model = this.configService.get<string>('OLLAMA_MODEL', 'llama3.1');

    this.client = axios.create({
      baseURL,
      timeout,
      headers: { 'Content-Type': 'application/json' },
    });

    this.logger.log(`Ollama client configurado: ${baseURL} | Model: ${this.model}`);
  }

  async generate(prompt: string, systemPrompt?: string): Promise<string> {
    try {
      const payload: OllamaGenerateRequest = {
        model: this.model,
        prompt,
        system: systemPrompt,
        stream: false,
        options: {
          temperature: this.configService.get<number>('OLLAMA_TEMPERATURE', 0.3),
          num_predict: this.configService.get<number>('OLLAMA_MAX_TOKENS', 4096),
        },
      };

      this.logger.debug(`Enviando prompt para Ollama (${this.model})...`);

      const { data } = await this.client.post<OllamaGenerateResponse>(
        '/api/generate',
        payload,
      );

      this.logger.debug(`Resposta recebida em ${data.total_duration}ns`);

      return data.response;
    } catch (error) {
      this.logger.error(`Erro ao chamar Ollama: ${error.message}`);
      throw new Error(`Falha na comunicação com Ollama: ${error.message}`);
    }
  }

  async isHealthy(): Promise<boolean> {
    try {
      await this.client.get('/');
      return true;
    } catch {
      return false;
    }
  }

  async listModels(): Promise<string[]> {
    const { data } = await this.client.get('/api/tags');
    return data.models?.map((m: any) => m.name) || [];
  }
}
```

### 6.2 Construtor de Prompts

```typescript
// backend/src/modules/ai-engine/prompt-builder.service.ts
import { Injectable } from '@nestjs/common';
import { InsightType } from './entities/insight.entity';

@Injectable()
export class PromptBuilderService {

  private readonly systemPrompt = `
Você é um analista de dados especializado em business intelligence.
Seu papel é analisar dados de sistemas empresariais e gerar insights acionáveis.

REGRAS:
- Responda SEMPRE em português brasileiro
- Use formatação Markdown para organizar a resposta
- Inclua métricas numéricas sempre que possível
- Destaque anomalias, tendências e oportunidades
- Sugira ações concretas baseadas nos dados
- Se os dados forem insuficientes, diga claramente
- Classifique a severidade: INFO, WARNING, CRITICAL ou SUCCESS
- Retorne a severidade na primeira linha: [SEVERITY:INFO]
  `.trim();

  buildPrompt(type: InsightType, data: any, context?: string): {
    system: string;
    prompt: string;
  } {
    const promptMap: Record<InsightType, (data: any, ctx?: string) => string> = {
      [InsightType.ANALYSIS]: this.buildAnalysisPrompt,
      [InsightType.COMPARISON]: this.buildComparisonPrompt,
      [InsightType.ANOMALY]: this.buildAnomalyPrompt,
      [InsightType.FORECAST]: this.buildForecastPrompt,
      [InsightType.CUSTOM]: this.buildCustomPrompt,
    };

    return {
      system: this.systemPrompt,
      prompt: promptMap[type](data, context),
    };
  }

  private buildAnalysisPrompt = (data: any, context?: string): string => `
Analise os seguintes dados do sistema "${data.systemName}" - Endpoint "${data.endpointName}":

DADOS COLETADOS:
\`\`\`json
${JSON.stringify(data.collectedData, null, 2)}
\`\`\`

PERÍODO: ${data.period || 'Não especificado'}
CONTEXTO: ${context || 'Análise geral'}

Por favor:
1. Resuma os dados principais (números totais, médias)
2. Identifique padrões e tendências
3. Destaque as unidades/itens com melhor e pior desempenho
4. Sugira 3 ações concretas baseadas nos dados
5. Classifique a severidade geral da situação
  `.trim();

  private buildComparisonPrompt = (data: any, context?: string): string => `
Compare os seguintes conjuntos de dados do sistema "${data.systemName}":

DADOS PERÍODO 1 (${data.period1}):
\`\`\`json
${JSON.stringify(data.data1, null, 2)}
\`\`\`

DADOS PERÍODO 2 (${data.period2}):
\`\`\`json
${JSON.stringify(data.data2, null, 2)}
\`\`\`

Por favor:
1. Compare os totais entre os períodos (crescimento/queda em %)
2. Identifique quais unidades cresceram e quais caíram
3. Destaque mudanças significativas
4. Explique possíveis causas para as variações
5. Sugira ações baseadas na comparação
  `.trim();

  private buildAnomalyPrompt = (data: any, context?: string): string => `
Analise os dados abaixo e identifique ANOMALIAS e OUTLIERS:

SISTEMA: ${data.systemName}
ENDPOINT: ${data.endpointName}
DADOS:
\`\`\`json
${JSON.stringify(data.collectedData, null, 2)}
\`\`\`

Procure por:
1. Valores muito acima ou abaixo da média
2. Unidades com comportamento irregular
3. Padrões quebrados ou inesperados
4. Possíveis erros de dados
5. Alertas que precisam de atenção imediata
  `.trim();

  private buildForecastPrompt = (data: any, context?: string): string => `
Com base nos dados históricos abaixo, faça previsões e projeções:

SISTEMA: ${data.systemName}
DADOS HISTÓRICOS:
\`\`\`json
${JSON.stringify(data.historicalData, null, 2)}
\`\`\`

Por favor:
1. Identifique a tendência geral (crescimento, estagnação, queda)
2. Projete os valores para o próximo período
3. Identifique sazonalidades se houver
4. Destaque riscos e oportunidades futuras
5. Sugira metas realistas baseadas na tendência
  `.trim();

  private buildCustomPrompt = (data: any, context?: string): string => `
SISTEMA: ${data.systemName}
DADOS DISPONÍVEIS:
\`\`\`json
${JSON.stringify(data.collectedData, null, 2)}
\`\`\`

PERGUNTA DO USUÁRIO: ${context}

Responda a pergunta do usuário com base nos dados fornecidos.
Seja específico, use números e seja objetivo.
  `.trim();
}
```

### 6.3 Serviço Principal de IA

```typescript
// backend/src/modules/ai-engine/ai-engine.service.ts
import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { OllamaClient } from './ollama.client';
import { PromptBuilderService } from './prompt-builder.service';
import { Insight, InsightType, InsightSeverity } from './entities/insight.entity';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class AiEngineService {
  private readonly logger = new Logger(AiEngineService.name);

  constructor(
    @InjectRepository(Insight)
    private insightRepo: Repository<Insight>,
    private ollamaClient: OllamaClient,
    private promptBuilder: PromptBuilderService,
    private configService: ConfigService,
  ) {}

  async generateInsight(
    type: InsightType,
    data: any,
    context?: string,
  ): Promise<Insight> {
    // 1. Montar o prompt
    const { system, prompt } = this.promptBuilder.buildPrompt(type, data, context);

    // 2. Chamar o Ollama
    const response = await this.ollamaClient.generate(prompt, system);

    // 3. Extrair severidade da resposta
    const severity = this.extractSeverity(response);

    // 4. Gerar título automático
    const title = this.generateTitle(type, data);

    // 5. Salvar insight no banco
    const insight = this.insightRepo.create({
      system_id: data.systemId,
      endpoint_id: data.endpointId,
      type,
      title,
      content: this.cleanResponse(response),
      severity,
      data_snapshot: data.collectedData || data,
      prompt_used: prompt,
      model_used: this.configService.get('OLLAMA_MODEL', 'llama3.1'),
    });

    return this.insightRepo.save(insight);
  }

  async chat(systemId: string, question: string, dataContext: any): Promise<string> {
    const { system, prompt } = this.promptBuilder.buildPrompt(
      InsightType.CUSTOM,
      { ...dataContext, systemId },
      question,
    );

    return this.ollamaClient.generate(prompt, system);
  }

  async getHealthStatus() {
    const healthy = await this.ollamaClient.isHealthy();
    const models = healthy ? await this.ollamaClient.listModels() : [];
    return {
      ollama_connected: healthy,
      ollama_url: this.configService.get('OLLAMA_BASE_URL'),
      available_models: models,
      current_model: this.configService.get('OLLAMA_MODEL'),
    };
  }

  private extractSeverity(response: string): InsightSeverity {
    const match = response.match(/\[SEVERITY:(\w+)\]/);
    if (match) {
      const sev = match[1].toUpperCase();
      if (Object.values(InsightSeverity).includes(sev as InsightSeverity)) {
        return sev as InsightSeverity;
      }
    }
    return InsightSeverity.INFO;
  }

  private cleanResponse(response: string): string {
    return response.replace(/\[SEVERITY:\w+\]\n?/, '').trim();
  }

  private generateTitle(type: InsightType, data: any): string {
    const titles: Record<InsightType, string> = {
      [InsightType.ANALYSIS]: `Análise - ${data.endpointName} (${data.period || 'atual'})`,
      [InsightType.COMPARISON]: `Comparativo - ${data.period1} vs ${data.period2}`,
      [InsightType.ANOMALY]: `Anomalias Detectadas - ${data.endpointName}`,
      [InsightType.FORECAST]: `Previsão - ${data.endpointName}`,
      [InsightType.CUSTOM]: `Consulta - ${data.systemName}`,
    };
    return titles[type] || 'Insight';
  }
}
```

---

## 7. Módulo Data Collector

### 7.1 Serviço de Coleta

```typescript
// backend/src/modules/data-collector/data-collector.service.ts
import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Cron } from '@nestjs/schedule';
import axios from 'axios';
import { Endpoint } from '../endpoints/entities/endpoint.entity';
import { System, AuthType } from '../systems/entities/system.entity';
import { CollectedData, CollectionStatus } from './entities/collected-data.entity';

@Injectable()
export class DataCollectorService {
  private readonly logger = new Logger(DataCollectorService.name);

  constructor(
    @InjectRepository(Endpoint)
    private endpointRepo: Repository<Endpoint>,
    @InjectRepository(CollectedData)
    private collectedDataRepo: Repository<CollectedData>,
    @InjectRepository(System)
    private systemRepo: Repository<System>,
  ) {}

  /**
   * Coleta dados de um endpoint específico com parâmetros
   */
  async collectFromEndpoint(
    endpointId: string,
    params: Record<string, any>,
  ): Promise<CollectedData> {
    const endpoint = await this.endpointRepo.findOne({
      where: { id: endpointId },
      relations: ['system'],
    });

    if (!endpoint) throw new Error(`Endpoint ${endpointId} não encontrado`);

    try {
      // Montar URL substituindo parâmetros dinâmicos
      const url = this.buildUrl(endpoint, params);
      const headers = this.buildAuthHeaders(endpoint.system);

      this.logger.log(`Coletando: ${endpoint.name} -> ${url}`);

      const { data } = await axios({
        method: endpoint.method,
        url,
        headers,
        timeout: 30000,
      });

      // Salvar dados coletados
      const collected = this.collectedDataRepo.create({
        endpoint_id: endpointId,
        raw_data: data,
        processed_data: this.processData(data, endpoint.response_mapping),
        params_used: params,
        status: CollectionStatus.SUCCESS,
        collected_at: new Date(),
      });

      // Atualizar timestamp de última coleta
      await this.endpointRepo.update(endpointId, { last_collected_at: new Date() });

      return this.collectedDataRepo.save(collected);
    } catch (error) {
      const collected = this.collectedDataRepo.create({
        endpoint_id: endpointId,
        raw_data: {},
        params_used: params,
        status: CollectionStatus.ERROR,
        error_message: error.message,
        collected_at: new Date(),
      });

      return this.collectedDataRepo.save(collected);
    }
  }

  /**
   * Coleta todos os endpoints ativos (scheduled)
   */
  async collectAll(mes?: number, ano?: number): Promise<CollectedData[]> {
    const now = new Date();
    const targetMes = mes || now.getMonth() + 1;
    const targetAno = ano || now.getFullYear();

    const endpoints = await this.endpointRepo.find({
      where: { is_active: true },
      relations: ['system'],
    });

    const results: CollectedData[] = [];

    for (const endpoint of endpoints) {
      try {
        const params = this.resolveDefaultParams(endpoint, targetMes, targetAno);
        const result = await this.collectFromEndpoint(endpoint.id, params);
        results.push(result);
      } catch (error) {
        this.logger.error(`Erro ao coletar ${endpoint.name}: ${error.message}`);
      }
    }

    return results;
  }

  private buildUrl(endpoint: Endpoint, params: Record<string, any>): string {
    const baseUrl = endpoint.system.base_url || '';
    let path = endpoint.url_template;

    // Substituir :param pelos valores
    Object.entries(params).forEach(([key, value]) => {
      path = path.replace(`:${key}`, String(value));
    });

    return `${baseUrl}${path}`;
  }

  private buildAuthHeaders(system: System): Record<string, string> {
    const headers: Record<string, string> = {};

    if (system.auth_type === AuthType.BEARER && system.auth_config?.token) {
      headers['Authorization'] = `Bearer ${system.auth_config.token}`;
    } else if (system.auth_type === AuthType.API_KEY && system.auth_config) {
      const { header, value } = system.auth_config;
      headers[header] = value;
    }

    return headers;
  }

  private processData(
    rawData: any,
    mapping?: Record<string, any>,
  ): Record<string, any> | null {
    if (!mapping) return null;

    try {
      const dataField = mapping.data_field;
      const items = dataField ? rawData[dataField] : rawData;

      if (Array.isArray(items)) {
        return {
          total_items: items.length,
          items: items.map((item: any) => ({
            label: mapping.label_field ? item[mapping.label_field] : null,
            value: mapping.value_field ? item[mapping.value_field] : null,
            ...item,
          })),
          summary: {
            total: items.reduce((sum: number, item: any) =>
              sum + (Number(item[mapping.value_field]) || 0), 0
            ),
          },
        };
      }

      return rawData;
    } catch {
      return null;
    }
  }

  private resolveDefaultParams(
    endpoint: Endpoint,
    mes: number,
    ano: number,
  ): Record<string, any> {
    const params: Record<string, any> = {};

    if (endpoint.url_template.includes(':mes')) params.mes = mes;
    if (endpoint.url_template.includes(':ano')) params.ano = ano;

    return params;
  }
}
```

---

## 8. Rotas da API (Backend)

```
# ============================================
# AUTENTICAÇÃO
# ============================================
POST   /api/auth/login              # Login
POST   /api/auth/register           # Registro (apenas admin)

# ============================================
# SISTEMAS
# ============================================
GET    /api/systems                  # Listar todos os sistemas
POST   /api/systems                  # Cadastrar novo sistema
GET    /api/systems/:id              # Detalhes de um sistema
PUT    /api/systems/:id              # Atualizar sistema
DELETE /api/systems/:id              # Remover sistema

# ============================================
# ENDPOINTS
# ============================================
GET    /api/endpoints                # Listar todos os endpoints
GET    /api/endpoints/system/:id     # Endpoints de um sistema
POST   /api/endpoints                # Cadastrar novo endpoint
PUT    /api/endpoints/:id            # Atualizar endpoint
DELETE /api/endpoints/:id            # Remover endpoint
POST   /api/endpoints/:id/test       # Testar endpoint (faz uma chamada)

# ============================================
# COLETA DE DADOS
# ============================================
POST   /api/collector/collect/:endpointId     # Coletar dados de um endpoint
POST   /api/collector/collect-all             # Coletar todos os endpoints
GET    /api/collector/data/:endpointId        # Dados coletados de um endpoint
GET    /api/collector/history/:endpointId     # Histórico de coletas

# ============================================
# AI / INSIGHTS
# ============================================
POST   /api/insights/generate        # Gerar insight (type, endpointId, params)
POST   /api/insights/compare         # Comparar períodos
POST   /api/insights/chat            # Chat livre com os dados
GET    /api/insights                  # Listar insights gerados
GET    /api/insights/:id             # Detalhe de um insight
GET    /api/insights/system/:id      # Insights de um sistema
DELETE /api/insights/:id             # Remover insight

# ============================================
# DASHBOARD
# ============================================
GET    /api/dashboard/summary        # Resumo geral (cards, totais)
GET    /api/dashboard/health         # Status Ollama + endpoints
GET    /api/dashboard/recent         # Últimos insights gerados
```

---

## 9. Telas do Frontend (Quasar)

### 9.1 Mapa de Telas

```
/login                    → LoginPage.vue (autenticação)
/                         → DashboardPage.vue (painel principal)
/systems                  → SystemsPage.vue (lista de sistemas)
/systems/:id              → SystemDetailPage.vue (detalhes + endpoints)
/endpoints                → EndpointsPage.vue (gerenciar endpoints)
/insights                 → InsightsPage.vue (lista de insights)
/insights/:id             → InsightDetailPage.vue (detalhe do insight)
/chat                     → ChatInsightPage.vue (chat com IA sobre dados)
/settings                 → SettingsPage.vue (configurações, status Ollama)
```

### 9.2 Descrição das Telas

#### DashboardPage (Tela Principal)

```
┌─────────────────────────────────────────────────────────────┐
│  🧠 InsightHub                          [User] [Settings]   │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐      │
│  │ Sistemas │ │Endpoints │ │ Insights │ │ Ollama   │      │
│  │    3     │ │    12    │ │   47     │ │  ● Online│      │
│  └──────────┘ └──────────┘ └──────────┘ └──────────┘      │
│                                                             │
│  ┌─────────────────────────────┐ ┌─────────────────────┐   │
│  │  📊 Últimos Dados Coletados │ │ 🔍 Insights Recentes│   │
│  │  ┌─ CRMMenu               │ │ ┌─ ⚠️ Queda de 23% │   │
│  │  │  Cartões Ativos: 1.234 │ │ │  nos cartões...   │   │
│  │  │  Resgatados: 567       │ │ ├─ ✅ Unidade X     │   │
│  │  │  Pontos: 89.012        │ │ │  cresceu 45%...   │   │
│  │  └────────────────────────│ │ └────────────────── │   │
│  └─────────────────────────────┘ └─────────────────────┘   │
│                                                             │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  💬 Perguntar à IA sobre os dados                    │   │
│  │  ┌────────────────────────────────────────────────┐  │   │
│  │  │ "Qual unidade teve melhor desempenho em jan?"  │  │   │
│  │  └────────────────────────────────────────────────┘  │   │
│  │  [Analisar] [Comparar Períodos] [Detectar Anomalias] │   │
│  └──────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

#### SystemDetailPage

```
┌─────────────────────────────────────────────────────────────┐
│  ← Sistemas / CRMMenu                                       │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  Nome: CRMMenu                                              │
│  Base URL: https://crediativos.mensageiro.gx360.com.br     │
│  Auth: Nenhuma                Status: ● Ativo               │
│                                                             │
│  ── Endpoints Cadastrados ──────────────────────────────    │
│                                                             │
│  ┌────────────────────────────────────────────────────┐    │
│  │ 📍 Cartões Ativos                                  │    │
│  │ GET /ords/gx360_prd/mensageiro/cartoes-ativos/:mes/:ano│
│  │ Última coleta: 14/02/2026 10:00                    │    │
│  │ [Coletar Agora] [Gerar Insight] [Editar] [Testar]  │    │
│  └────────────────────────────────────────────────────┘    │
│                                                             │
│  ┌────────────────────────────────────────────────────┐    │
│  │ 📍 Cartões Resgatados                              │    │
│  │ GET /ords/gx360_prd/mensageiro/cartoes_resgatados/:mes/:ano│
│  │ [Coletar Agora] [Gerar Insight] [Editar] [Testar]  │    │
│  └────────────────────────────────────────────────────┘    │
│                                                             │
│  [+ Adicionar Endpoint]                                     │
└─────────────────────────────────────────────────────────────┘
```

#### ChatInsightPage

```
┌─────────────────────────────────────────────────────────────┐
│  💬 Chat com IA - Insights ao Vivo                          │
├─────────────────────────────────────────────────────────────┤
│  Sistema: [CRMMenu ▾]   Período: [02/2026 ▾]              │
│                                                             │
│  ┌──────────────────────────────────────────────────────┐   │
│  │ 🤖 Olá! Tenho acesso aos dados do CRMMenu de        │   │
│  │    fevereiro/2026. O que gostaria de saber?          │   │
│  │                                                      │   │
│  │ 👤 Qual unidade resgatou mais cartões este mês?      │   │
│  │                                                      │   │
│  │ 🤖 Com base nos dados coletados, a unidade           │   │
│  │    "Shopping Centro" liderou com 234 cartões          │   │
│  │    resgatados, representando 28% do total...         │   │
│  │                                                      │   │
│  │ 👤 Compare com janeiro                               │   │
│  │                                                      │   │
│  │ 🤖 Comparando janeiro vs fevereiro:                  │   │
│  │    📈 Crescimento geral de 12%                       │   │
│  │    ⚠️ Unidade "Av. Paulista" caiu 31%...             │   │
│  └──────────────────────────────────────────────────────┘   │
│                                                             │
│  ┌────────────────────────────────────────────┐ [Enviar]    │
│  │ Digite sua pergunta sobre os dados...      │             │
│  └────────────────────────────────────────────┘             │
└─────────────────────────────────────────────────────────────┘
```

---

## 10. Seed Inicial - CRMMenu

```typescript
// backend/src/database/seeds/crmmenu-system.seed.ts
// Este seed cadastra o sistema CRMMenu e seus 3 endpoints iniciais

export const crmmenuSeed = {
  system: {
    name: 'CRMMenu',
    slug: 'crmmenu',
    description: 'Sistema de CRM para gestão de cartões fidelidade, pontos e resgates',
    base_url: 'https://crediativos.mensageiro.gx360.com.br',
    auth_type: 'none',
    auth_config: null,
    is_active: true,
  },
  endpoints: [
    {
      name: 'Cartões Ativos',
      description: 'Retorna a quantidade de cartões ativos por unidade no mês/ano especificado',
      url_template: '/ords/gx360_prd/mensageiro/cartoes-ativos/:mes/:ano',
      method: 'GET',
      params_schema: {
        mes: { type: 'number', description: 'Mês (1-12)', required: true },
        ano: { type: 'number', description: 'Ano (ex: 2026)', required: true },
      },
      response_mapping: null, // Ajustar após ver o formato real da resposta
      schedule_cron: '0 */6 * * *',
      is_active: true,
    },
    {
      name: 'Cartões Resgatados',
      description: 'Retorna a quantidade de cartões resgatados por unidade no mês/ano especificado',
      url_template: '/ords/gx360_prd/mensageiro/cartoes_resgatados/:mes/:ano',
      method: 'GET',
      params_schema: {
        mes: { type: 'number', description: 'Mês (1-12)', required: true },
        ano: { type: 'number', description: 'Ano (ex: 2026)', required: true },
      },
      response_mapping: null,
      schedule_cron: '0 */6 * * *',
      is_active: true,
    },
    {
      name: 'Pontos Distribuídos',
      description: 'Retorna a quantidade de pontos distribuídos por dia/unidade no mês/ano especificado',
      url_template: '/ords/gx360_prd/mensageiro/pontos-dia/:mes/:ano',
      method: 'GET',
      params_schema: {
        mes: { type: 'number', description: 'Mês (1-12)', required: true },
        ano: { type: 'number', description: 'Ano (ex: 2026)', required: true },
      },
      response_mapping: null,
      schedule_cron: '0 */6 * * *',
      is_active: true,
    },
  ],
};
```

---

## 11. Dockerfiles

### 11.1 Backend Dockerfile

```dockerfile
# backend/Dockerfile
FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .

RUN npm run build

EXPOSE 3000

# Dev: usa hot-reload | Prod: usa build compilado
CMD ["sh", "-c", "if [ \"$NODE_ENV\" = 'production' ]; then node dist/main.js; else npm run start:dev; fi"]
```

### 11.2 Frontend Dockerfile

```dockerfile
# frontend/Dockerfile
FROM node:20-alpine

WORKDIR /app

RUN npm install -g @quasar/cli

COPY package*.json ./
RUN npm ci

COPY . .

EXPOSE 8080

CMD ["sh", "-c", "if [ \"$NODE_ENV\" = 'production' ]; then quasar build && npx serve dist/spa -l 8080; else quasar dev; fi"]
```

---

## 12. Dependências (package.json)

### 12.1 Backend

```json
{
  "name": "insighthub-api",
  "version": "1.0.0",
  "dependencies": {
    "@nestjs/common": "^10.0.0",
    "@nestjs/core": "^10.0.0",
    "@nestjs/config": "^3.0.0",
    "@nestjs/typeorm": "^10.0.0",
    "@nestjs/jwt": "^10.0.0",
    "@nestjs/passport": "^10.0.0",
    "@nestjs/schedule": "^4.0.0",
    "@nestjs/swagger": "^7.0.0",
    "typeorm": "^0.3.0",
    "pg": "^8.11.0",
    "passport": "^0.7.0",
    "passport-jwt": "^4.0.0",
    "bcrypt": "^5.1.0",
    "axios": "^1.6.0",
    "class-validator": "^0.14.0",
    "class-transformer": "^0.5.0",
    "rxjs": "^7.8.0"
  },
  "devDependencies": {
    "@nestjs/cli": "^10.0.0",
    "@nestjs/schematics": "^10.0.0",
    "@types/node": "^20.0.0",
    "typescript": "^5.3.0",
    "ts-node": "^10.9.0"
  }
}
```

### 12.2 Frontend

```json
{
  "name": "insighthub-frontend",
  "version": "1.0.0",
  "dependencies": {
    "vue": "^3.4.0",
    "quasar": "^2.14.0",
    "vue-router": "^4.2.0",
    "pinia": "^2.1.0",
    "axios": "^1.6.0",
    "@quasar/extras": "^1.16.0"
  },
  "devDependencies": {
    "@quasar/app-vite": "^1.8.0",
    "typescript": "^5.3.0",
    "eslint": "^8.50.0",
    "sass": "^1.69.0"
  }
}
```

---

## 13. Fluxo de Funcionamento

```
┌─────────────────────────────────────────────────────────────────┐
│                     FLUXO PRINCIPAL                              │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  1. CADASTRO                                                    │
│     Admin cadastra Sistema → Cadastra Endpoints                 │
│                                                                 │
│  2. COLETA (manual ou agendada via cron)                        │
│     DataCollector → chama endpoint → salva raw_data no DB       │
│                                                                 │
│  3. ANÁLISE                                                     │
│     Usuário clica "Gerar Insight" ou faz pergunta no chat       │
│     │                                                           │
│     ├─→ PromptBuilder monta o prompt com os dados coletados     │
│     ├─→ OllamaClient envia para Llama                          │
│     ├─→ Resposta é parseada (severidade, conteúdo)              │
│     └─→ Insight é salvo no banco com snapshot dos dados         │
│                                                                 │
│  4. VISUALIZAÇÃO                                                │
│     Dashboard mostra cards, gráficos e insights recentes        │
│     Chat permite perguntas livres sobre qualquer dado           │
│                                                                 │
│  ┌──────────┐    ┌──────────┐    ┌──────────┐    ┌──────────┐ │
│  │ Quasar   │───▶│  NestJS  │───▶│PostgreSQL│    │  Ollama  │ │
│  │ Frontend │◀───│  Backend │◀───│   DB     │    │  (Llama) │ │
│  └──────────┘    └────┬─────┘    └──────────┘    └────▲─────┘ │
│                       │                               │       │
│                       │     ┌─────────────────┐       │       │
│                       ├────▶│ APIs Externas    │       │       │
│                       │     │ (CRMMenu, etc)   │       │       │
│                       │     └─────────────────┘       │       │
│                       └───────────────────────────────┘       │
│                         Envia dados + prompt para IA          │
└─────────────────────────────────────────────────────────────────┘
```

---

## 14. Comandos para Iniciar o Projeto

```bash
# 1. Clonar/criar o projeto
mkdir insighthub && cd insighthub

# 2. Instalar Ollama no Windows (se ainda não tiver)
# Baixar em: https://ollama.ai/download
# Após instalar, baixar o modelo:
ollama pull llama3.1

# 3. Copiar e configurar ambiente
cp .env.example .env

# 4. Subir containers (DB + API + Front)
docker-compose up -d

# 5. Rodar migrations
docker exec insighthub-api npm run migration:run

# 6. Rodar seeds (criar admin + CRMMenu)
docker exec insighthub-api npm run seed:run

# 7. Acessar
# Frontend: http://localhost:8080
# API:      http://localhost:3000
# Swagger:  http://localhost:3000/api/docs

# ============================================
# MIGRAÇÃO PARA PRODUÇÃO
# ============================================
# 1. Alterar .env:
#    OLLAMA_BASE_URL=http://seu-servidor-ia:11434
#    DB_PASSWORD=senha-segura-de-producao
#    JWT_SECRET=string-longa-e-aleatoria
#    NODE_ENV=production
#    API_URL=https://insighthub.suaempresa.com.br/api
#
# 2. Subir com override de produção:
#    docker-compose -f docker-compose.yml -f docker-compose.prod.yml up -d
```

---

## 15. Escalabilidade - Adicionando Novos Sistemas

Para adicionar um novo sistema (ex: ERP, financeiro, etc):

1. **Cadastrar via painel** → Sistemas → Novo Sistema
2. **Informar base_url** e tipo de autenticação
3. **Cadastrar endpoints** com URL template e parâmetros
4. **Testar** com o botão "Testar Endpoint"
5. **A IA já funciona** — basta coletar dados e pedir insights

Não precisa alterar código. O sistema é genérico por design.

---

## 16. Modelo de IA Recomendado

| Ambiente | Modelo | RAM Necessária | Observação |
|----------|--------|---------------|------------|
| Dev (local) | `llama3.1:8b` | 8GB+ | Rápido, bom para testes |
| Prod (servidor) | `llama3.1:70b` | 48GB+ | Melhor qualidade de insights |
| Alternativa leve | `llama3.2:3b` | 4GB+ | Ultra rápido, insights básicos |

---

*Documento gerado para uso como contexto em ferramentas de desenvolvimento assistido por IA.*
*Versão: 1.0 | Data: 14/02/2026*
