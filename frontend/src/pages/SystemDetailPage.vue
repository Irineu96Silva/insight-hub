<template>
  <q-page class="q-pa-md system-detail-page">
    <!-- Loading -->
    <div
      v-if="loading"
      class="flex flex-center q-pa-xl"
    >
      <q-spinner-orbit
        color="cyan"
        size="60px"
      />
    </div>

    <div
      v-else-if="system"
      class="column q-gutter-md"
    >
      <!-- Header -->
      <div class="row items-center justify-between">
        <div class="row items-center q-gutter-md">
          <q-btn
            flat
            round
            icon="arrow_back"
            @click="router.push('/systems')"
          />
          <div>
            <h1 class="text-h4 q-my-none orbitron-font">
              {{ system.name }}
            </h1>
            <div class="text-caption text-grey-6">
              {{ system.base_url || 'Sem URL configurada' }}
            </div>
          </div>
          <q-chip
            :color="system.is_active ? 'positive' : 'negative'"
            text-color="white"
            dense
          >
            {{ system.is_active ? 'Ativo' : 'Inativo' }}
          </q-chip>
          <q-badge
            v-if="system.environment"
            :color="getEnvColor(system.environment)"
            outline
          >
            {{ system.environment }}
          </q-badge>
          <q-badge
            v-if="system.criticality"
            :color="getCritColor(system.criticality)"
          >
            {{ getCritLabel(system.criticality) }}
          </q-badge>
        </div>
      </div>

      <!-- Tabs -->
      <q-card class="glass-card">
        <q-tabs
          v-model="tab"
          dense
          active-color="cyan"
          indicator-color="cyan"
          align="left"
          narrow-indicator
        >
          <q-tab
            name="overview"
            icon="info"
            label="Visão Geral"
          />
          <q-tab
            name="endpoints"
            icon="api"
            :label="`Endpoints (${endpoints.length})`"
          />
          <q-tab
            name="files"
            icon="folder"
            label="Arquivos"
          />
          <q-tab
            name="collected"
            icon="storage"
            :label="`Dados (${collectedData.length})`"
          />
          <q-tab
            name="config"
            icon="settings"
            label="Configuração"
          />
        </q-tabs>

        <q-separator />

        <q-tab-panels
          v-model="tab"
          animated
          class="bg-transparent"
        >
          <!-- TAB: Visão Geral -->
          <q-tab-panel name="overview">
            <div class="row q-col-gutter-md">
              <!-- Info -->
              <div class="col-12 col-md-6">
                <div class="text-h6 q-mb-md">
                  Informações do Sistema
                </div>
                <q-list separator>
                  <q-item v-if="system.company_name">
                    <q-item-section>
                      <q-item-label caption>
                        Empresa
                      </q-item-label>
                      <q-item-label>{{ system.company_name }}</q-item-label>
                    </q-item-section>
                  </q-item>
                  <q-item v-if="system.contact_name">
                    <q-item-section>
                      <q-item-label caption>
                        Responsável
                      </q-item-label>
                      <q-item-label>{{ system.contact_name }} — {{ system.contact_email }}</q-item-label>
                    </q-item-section>
                  </q-item>
                  <q-item v-if="system.ip_address">
                    <q-item-section>
                      <q-item-label caption>
                        IP / Porta
                      </q-item-label>
                      <q-item-label>{{ system.ip_address }}{{ system.port ? ':' + system.port : '' }}</q-item-label>
                    </q-item-section>
                  </q-item>
                  <q-item>
                    <q-item-section>
                      <q-item-label caption>
                        Criado em
                      </q-item-label>
                      <q-item-label>{{ new Date(system.created_at).toLocaleString() }}</q-item-label>
                    </q-item-section>
                  </q-item>
                  <q-item v-if="system.description">
                    <q-item-section>
                      <q-item-label caption>
                        Descrição
                      </q-item-label>
                      <q-item-label>{{ system.description }}</q-item-label>
                    </q-item-section>
                  </q-item>
                </q-list>
              </div>

              <!-- Stats -->
              <div class="col-12 col-md-6">
                <div class="text-h6 q-mb-md">
                  Estatísticas Rápidas
                </div>
                <div class="row q-gutter-sm">
                  <q-card class="stat-card col-grow q-pa-md text-center">
                    <div class="text-h4 text-cyan">
                      {{ endpoints.length }}
                    </div>
                    <div class="text-caption">
                      Endpoints
                    </div>
                  </q-card>
                  <q-card class="stat-card col-grow q-pa-md text-center">
                    <div
                      class="text-h4"
                      style="color: #a855f7;"
                    >
                      {{ system.sla_uptime || '—' }}%
                    </div>
                    <div class="text-caption">
                      SLA Uptime
                    </div>
                  </q-card>
                </div>
              </div>
            </div>
          </q-tab-panel>

          <!-- TAB: Endpoints -->
          <q-tab-panel name="endpoints">
            <div class="row items-center justify-between q-mb-md">
              <div class="text-h6">
                Endpoints do Sistema
              </div>
              <q-btn
                color="cyan"
                icon="add"
                label="Novo Endpoint"
                unelevated
                @click="openEndpointDialog()"
              />
            </div>

            <!-- Endpoints List -->
            <div
              v-if="endpoints.length > 0"
              class="column q-gutter-sm"
            >
              <q-card
                v-for="ep in endpoints"
                :key="ep.id"
                class="endpoint-item q-pa-md"
              >
                <div class="row items-center q-gutter-md no-wrap">
                  <q-badge
                    :color="getMethodColor(ep.method)"
                    class="method-badge text-weight-bold"
                  >
                    {{ ep.method || 'GET' }}
                  </q-badge>

                  <div class="col">
                    <div class="text-subtitle1 text-weight-medium">
                      {{ ep.name }}
                    </div>
                    <div class="text-caption text-grey-6">
                      {{ ep.url_template }}
                    </div>
                  </div>

                  <div class="row q-gutter-xs">
                    <q-btn
                      flat
                      round
                      dense
                      icon="download"
                      color="cyan"
                      size="sm"
                      @click="openCollectDialog(ep)"
                    >
                      <q-tooltip>Coletar Dados</q-tooltip>
                    </q-btn>
                    <q-btn
                      flat
                      round
                      dense
                      icon="edit"
                      color="cyan"
                      size="sm"
                      @click="openEndpointDialog(ep)"
                    >
                      <q-tooltip>Editar</q-tooltip>
                    </q-btn>
                    <q-btn
                      flat
                      round
                      dense
                      icon="delete"
                      color="negative"
                      size="sm"
                      @click="deleteEndpoint(ep)"
                    >
                      <q-tooltip>Excluir</q-tooltip>
                    </q-btn>
                  </div>
                </div>
              </q-card>
            </div>

            <div
              v-else
              class="text-center q-pa-xl"
            >
              <q-icon
                name="api"
                size="48px"
                color="grey-6"
                class="q-mb-md"
              />
              <div class="text-h6 text-grey-5 q-mb-xs">
                Nenhum endpoint configurado
              </div>
              <div class="text-caption text-grey-6 q-mb-md">
                Adicione os endpoints que a IA vai usar para coletar dados deste sistema.
              </div>
              <q-btn
                color="cyan"
                icon="add"
                label="Adicionar Endpoint"
                unelevated
                @click="openEndpointDialog()"
              />
            </div>
          </q-tab-panel>

          <!-- TAB: Arquivos (Arquivos Complementares / Knowledge Base) -->
          <q-tab-panel name="files">
            <div class="row items-center justify-between q-mb-md">
              <div class="text-h6 text-cyan">
                📂 Base de Conhecimento (CSVs, Docs)
              </div>
            </div>

            <div class="row q-col-gutter-md">
              <!-- Upload Form -->
              <div class="col-12 col-md-4">
                <q-card
                  class="q-pa-md upload-card"
                  flat
                >
                  <div class="text-subtitle2 text-grey-4 q-mb-sm">
                    Enviar Novo Arquivo
                  </div>
                  <q-file
                    v-model="fileConfig.file"
                    outlined
                    dense
                    dark
                    color="cyan"
                    label="Selecionar Arquivo"
                    class="q-mb-md"
                    clearable
                  >
                    <template #prepend>
                      <q-icon
                        name="attach_file"
                        color="cyan"
                      />
                    </template>
                  </q-file>
                  <q-input
                    v-model="fileConfig.description"
                    outlined
                    dense
                    dark
                    color="cyan"
                    label="Descrição (Opcional)"
                    type="textarea"
                    rows="2"
                    class="q-mb-md"
                  />
                  <q-btn
                    label="Enviar"
                    color="cyan"
                    text-color="dark"
                    unelevated
                    class="full-width"
                    :loading="uploading"
                    :disable="!fileConfig.file"
                    @click="handleFileUpload"
                  />
                </q-card>
              </div>

              <!-- Files List -->
              <div class="col-12 col-md-8">
                <div
                  v-if="files.length > 0"
                  class="column q-gutter-sm"
                >
                  <q-card
                    v-for="file in files"
                    :key="file.id"
                    flat
                    class="q-pa-sm file-item"
                  >
                    <q-item dark>
                      <q-item-section avatar>
                        <q-icon
                          name="description"
                          color="cyan"
                          size="md"
                        />
                      </q-item-section>
                      <q-item-section>
                        <q-item-label class="text-weight-bold text-white">
                          {{ file.original_name }}
                        </q-item-label>
                        <q-item-label
                          v-if="file.description"
                          caption
                          class="text-grey-5"
                        >
                          {{ file.description }}
                        </q-item-label>
                        <q-item-label
                          caption
                          class="text-grey-6"
                        >
                          {{ (file.size ? (file.size / 1024).toFixed(1) + ' KB' : '—') }} • {{ new Date(file.uploaded_at).toLocaleString() }}
                        </q-item-label>
                      </q-item-section>
                      <q-item-section side>
                        <div class="row q-gutter-xs">
                          <q-btn
                            flat
                            round
                            dense
                            icon="download"
                            color="cyan"
                            type="a"
                            :href="systemsService.getDownloadUrl(file.id)"
                            target="_blank"
                          >
                            <q-tooltip>Baixar</q-tooltip>
                          </q-btn>
                          <q-btn
                            flat
                            round
                            dense
                            icon="delete"
                            color="negative"
                            @click="removeFile(file)"
                          >
                            <q-tooltip>Excluir</q-tooltip>
                          </q-btn>
                        </div>
                      </q-item-section>
                    </q-item>
                  </q-card>
                </div>
                <div
                  v-else
                  class="text-center q-pa-xl text-grey-6"
                >
                  <q-icon
                    name="folder_open"
                    size="48px"
                    color="grey-7"
                    class="q-mb-sm"
                  />
                  <div>Nenhum arquivo enviado ainda.</div>
                </div>
              </div>
            </div>
          </q-tab-panel>

          <!-- TAB: Dados Coletados -->
          <q-tab-panel name="collected">
            <div class="row items-center justify-between q-mb-md">
              <div class="text-h6 text-cyan">
                📈 Dados Coletados
              </div>
              <div class="row q-gutter-sm">
                <q-btn
                  label="Coletar Todos"
                  icon="cloud_download"
                  color="cyan"
                  text-color="dark"
                  unelevated
                  size="sm"
                  :loading="collectingAll"
                  @click="collectAllEndpoints"
                />
                <q-btn
                  flat
                  icon="refresh"
                  color="cyan"
                  size="sm"
                  @click="loadCollectedData"
                >
                  <q-tooltip>Atualizar lista</q-tooltip>
                </q-btn>
              </div>
            </div>

            <div
              v-if="loadingCollected"
              class="text-center q-pa-xl"
            >
              <q-spinner-dots
                color="cyan"
                size="40px"
              />
              <div class="text-grey-5 q-mt-sm">
                Carregando dados...
              </div>
            </div>

            <div
              v-else-if="collectedData.length > 0"
              class="column q-gutter-sm"
            >
              <q-card
                v-for="item in collectedData"
                :key="item.id"
                flat
                class="collected-item"
              >
                <q-item dark>
                  <q-item-section avatar>
                    <q-icon
                      :name="item.csv_raw ? 'table_chart' : 'data_object'"
                      :color="item.csv_raw ? 'positive' : 'info'"
                      size="md"
                    />
                  </q-item-section>
                  <q-item-section>
                    <q-item-label class="text-weight-bold text-white">
                      {{ item.endpoint?.name || 'Endpoint' }}
                    </q-item-label>
                    <q-item-label
                      caption
                      class="text-grey-5"
                    >
                      <q-badge
                        :color="item.csv_raw ? 'positive' : 'info'"
                        dense
                        class="q-mr-xs"
                      >
                        {{ item.csv_raw ? 'CSV' : 'JSON' }}
                      </q-badge>
                      <span v-if="item.params_used">
                        Params: {{ JSON.stringify(item.params_used) }}
                      </span>
                    </q-item-label>
                    <q-item-label
                      caption
                      class="text-grey-6"
                    >
                      {{ formatDataSize(item) }} • {{ new Date(item.collected_at).toLocaleString() }}
                    </q-item-label>
                  </q-item-section>
                  <q-item-section side>
                    <div class="row q-gutter-xs">
                      <q-btn
                        flat
                        round
                        dense
                        icon="visibility"
                        color="cyan"
                        @click="previewData(item)"
                      >
                        <q-tooltip>Visualizar</q-tooltip>
                      </q-btn>
                      <q-btn
                        flat
                        round
                        dense
                        icon="download"
                        color="positive"
                        @click="downloadCollected(item, 'csv')"
                      >
                        <q-tooltip>Baixar CSV</q-tooltip>
                      </q-btn>
                      <q-btn
                        flat
                        round
                        dense
                        icon="data_object"
                        color="info"
                        @click="downloadCollected(item, 'json')"
                      >
                        <q-tooltip>Baixar JSON</q-tooltip>
                      </q-btn>
                    </div>
                  </q-item-section>
                </q-item>
              </q-card>
            </div>

            <div
              v-else
              class="text-center q-pa-xl text-grey-6"
            >
              <q-icon
                name="cloud_off"
                size="48px"
                color="grey-7"
                class="q-mb-sm"
              />
              <div>Nenhum dado coletado ainda.</div>
              <div class="text-caption q-mt-xs">
                Use o botão "Coletar Todos" ou colete individualmente em cada endpoint.
              </div>
            </div>
          </q-tab-panel>

          <!-- TAB: Configuração -->
          <q-tab-panel name="config">
            <!-- Informações Básicas -->
            <div class="text-h6 q-mb-md text-cyan">
              📋 Informações Básicas
            </div>
            <q-list
              separator
              bordered
              class="rounded-borders q-mb-lg"
            >
              <q-item>
                <q-item-section>
                  <q-item-label caption>
                    Nome do Sistema
                  </q-item-label>
                  <q-item-label>{{ system.name }}</q-item-label>
                </q-item-section>
              </q-item>
              <q-item>
                <q-item-section>
                  <q-item-label caption>
                    URL Base
                  </q-item-label>
                  <q-item-label>{{ system.base_url || '—' }}</q-item-label>
                </q-item-section>
              </q-item>
              <q-item>
                <q-item-section>
                  <q-item-label caption>
                    Descrição
                  </q-item-label>
                  <q-item-label>{{ system.description || '—' }}</q-item-label>
                </q-item-section>
              </q-item>
              <q-item>
                <q-item-section>
                  <q-item-label caption>
                    Status
                  </q-item-label>
                  <q-item-label>
                    <q-chip
                      :color="system.is_active ? 'positive' : 'negative'"
                      text-color="white"
                      dense
                      size="sm"
                    >
                      {{ system.is_active ? 'Ativo' : 'Inativo' }}
                    </q-chip>
                  </q-item-label>
                </q-item-section>
              </q-item>
              <q-item>
                <q-item-section>
                  <q-item-label caption>
                    Criado em
                  </q-item-label>
                  <q-item-label>{{ new Date(system.created_at).toLocaleString('pt-BR') }}</q-item-label>
                </q-item-section>
              </q-item>
            </q-list>

            <!-- Dados da Empresa -->
            <div class="text-h6 q-mb-md text-cyan">
              🏢 Empresa / Cliente
            </div>
            <q-list
              separator
              bordered
              class="rounded-borders q-mb-lg"
            >
              <q-item>
                <q-item-section>
                  <q-item-label caption>
                    Razão Social
                  </q-item-label>
                  <q-item-label>{{ system.company_name || '—' }}</q-item-label>
                </q-item-section>
              </q-item>
              <q-item>
                <q-item-section>
                  <q-item-label caption>
                    CNPJ
                  </q-item-label>
                  <q-item-label>{{ system.cnpj || '—' }}</q-item-label>
                </q-item-section>
              </q-item>
              <q-item>
                <q-item-section>
                  <q-item-label caption>
                    Responsável Técnico
                  </q-item-label>
                  <q-item-label>{{ system.contact_name || '—' }}</q-item-label>
                </q-item-section>
              </q-item>
              <q-item>
                <q-item-section>
                  <q-item-label caption>
                    Email do Responsável
                  </q-item-label>
                  <q-item-label>{{ system.contact_email || '—' }}</q-item-label>
                </q-item-section>
              </q-item>
              <q-item>
                <q-item-section>
                  <q-item-label caption>
                    Telefone
                  </q-item-label>
                  <q-item-label>{{ system.contact_phone || '—' }}</q-item-label>
                </q-item-section>
              </q-item>
            </q-list>

            <!-- Infraestrutura -->
            <div class="text-h6 q-mb-md text-cyan">
              ☁️ Infraestrutura
            </div>
            <q-list
              separator
              bordered
              class="rounded-borders q-mb-lg"
            >
              <q-item>
                <q-item-section>
                  <q-item-label caption>
                    IP do Servidor
                  </q-item-label>
                  <q-item-label>{{ system.ip_address || '—' }}</q-item-label>
                </q-item-section>
              </q-item>
              <q-item>
                <q-item-section>
                  <q-item-label caption>
                    Porta
                  </q-item-label>
                  <q-item-label>{{ system.port || '—' }}</q-item-label>
                </q-item-section>
              </q-item>
              <q-item>
                <q-item-section>
                  <q-item-label caption>
                    URL de Health Check
                  </q-item-label>
                  <q-item-label>{{ system.health_check_url || '—' }}</q-item-label>
                </q-item-section>
              </q-item>
              <q-item>
                <q-item-section>
                  <q-item-label caption>
                    Ambiente
                  </q-item-label>
                  <q-item-label>
                    <q-badge
                      v-if="system.environment"
                      :color="getEnvColor(system.environment)"
                      outline
                    >
                      {{ system.environment }}
                    </q-badge>
                    <span v-else>—</span>
                  </q-item-label>
                </q-item-section>
              </q-item>
              <q-item>
                <q-item-section>
                  <q-item-label caption>
                    Criticalidade
                  </q-item-label>
                  <q-item-label>
                    <q-badge
                      v-if="system.criticality"
                      :color="getCritColor(system.criticality)"
                    >
                      {{ getCritLabel(system.criticality) }}
                    </q-badge>
                    <span v-else>—</span>
                  </q-item-label>
                </q-item-section>
              </q-item>
            </q-list>

            <!-- Autenticação -->
            <div class="text-h6 q-mb-md text-cyan">
              🔒 Autenticação da API
            </div>
            <q-list
              separator
              bordered
              class="rounded-borders q-mb-lg"
            >
              <q-item>
                <q-item-section>
                  <q-item-label caption>
                    Tipo de Autenticação
                  </q-item-label>
                  <q-item-label>
                    <q-chip
                      dense
                      outline
                      color="cyan"
                      size="sm"
                    >
                      {{ system.auth_type || 'Nenhuma' }}
                    </q-chip>
                  </q-item-label>
                </q-item-section>
              </q-item>
              <q-item v-if="system.auth_type === 'bearer' && system.auth_config?.token">
                <q-item-section>
                  <q-item-label caption>
                    Token Bearer
                  </q-item-label>
                  <q-item-label
                    class="text-caption"
                    style="word-break: break-all;"
                  >
                    {{ maskToken(system.auth_config.token) }}
                  </q-item-label>
                </q-item-section>
              </q-item>
              <q-item v-if="system.auth_type === 'api_key' && system.auth_config">
                <q-item-section>
                  <q-item-label caption>
                    Header / Chave
                  </q-item-label>
                  <q-item-label>{{ system.auth_config.header || '—' }}: {{ maskToken(system.auth_config.value || '') }}</q-item-label>
                </q-item-section>
              </q-item>
            </q-list>

            <!-- SLA & Regras -->
            <div class="text-h6 q-mb-md text-cyan">
              📊 SLA & Regras de Negócio
            </div>
            <q-list
              separator
              bordered
              class="rounded-borders q-mb-lg"
            >
              <q-item>
                <q-item-section>
                  <q-item-label caption>
                    Uptime SLA
                  </q-item-label>
                  <q-item-label>{{ system.sla_uptime ? system.sla_uptime + '%' : '—' }}</q-item-label>
                </q-item-section>
              </q-item>
              <q-item>
                <q-item-section>
                  <q-item-label caption>
                    Tempo de Resposta Máximo
                  </q-item-label>
                  <q-item-label>{{ system.sla_response_time_ms ? system.sla_response_time_ms + 'ms' : '—' }}</q-item-label>
                </q-item-section>
              </q-item>
              <q-item>
                <q-item-section>
                  <q-item-label caption>
                    Horário Comercial
                  </q-item-label>
                  <q-item-label>{{ system.business_hours || '—' }}</q-item-label>
                </q-item-section>
              </q-item>
              <q-item>
                <q-item-section>
                  <q-item-label caption>
                    Tags
                  </q-item-label>
                  <q-item-label>
                    <div
                      v-if="system.tags?.length"
                      class="row q-gutter-xs"
                    >
                      <q-chip
                        v-for="tag in system.tags"
                        :key="tag"
                        dense
                        outline
                        color="cyan"
                        size="sm"
                      >
                        {{ tag }}
                      </q-chip>
                    </div>
                    <span v-else>—</span>
                  </q-item-label>
                </q-item-section>
              </q-item>
              <q-item>
                <q-item-section>
                  <q-item-label caption>
                    Observações
                  </q-item-label>
                  <q-item-label>{{ system.notes || '—' }}</q-item-label>
                </q-item-section>
              </q-item>
            </q-list>
          </q-tab-panel>
        </q-tab-panels>
      </q-card>
    </div>

    <!-- Endpoint Create/Edit Dialog -->
    <q-dialog
      v-model="epDialogOpen"
      persistent
    >
      <q-card
        class="q-pa-none"
        style="width: 100%; max-width: 650px;"
      >
        <q-card-section class="q-pb-none">
          <div class="text-h6">
            {{ isEditingEp ? 'Editar Endpoint' : 'Novo Endpoint' }}
          </div>
        </q-card-section>

        <q-card-section
          style="max-height: 60vh"
          class="scroll"
        >
          <q-form
            ref="endpointFormRef"
            class="column q-gutter-md"
            @submit="saveEndpoint"
          >
            <q-input
              v-model="epForm.name"
              label="Nome do Endpoint *"
              outlined
              dense
              :rules="[v => !!v || 'Nome é obrigatório']"
            />

            <q-input
              v-model="epForm.url_template"
              label="URL Template *"
              outlined
              dense
              hint="Ex: /api/vendas?data_ini={data_ini}&data_fim={data_fim}"
              :rules="[v => !!v || 'URL é obrigatória']"
            />

            <q-select
              v-model="epForm.method"
              :options="['GET', 'POST']"
              label="Método HTTP"
              outlined
              dense
            />

            <q-select
              v-model="epForm.response_type"
              :options="responseTypeOptions"
              label="Tipo de Resposta"
              outlined
              dense
              emit-value
              map-options
            />

            <div class="text-subtitle2 q-mt-md">
              Parâmetros
            </div>
            <div
              v-for="(param, idx) in epForm.params"
              :key="idx"
              class="row q-gutter-sm items-center"
            >
              <q-input
                v-model="param.key"
                label="Chave"
                outlined
                dense
                class="col"
              />
              <q-input
                v-model="param.default_value"
                label="Valor padrão"
                outlined
                dense
                class="col"
              />
              <q-btn
                flat
                round
                dense
                icon="remove_circle"
                color="negative"
                @click="epForm.params.splice(idx, 1)"
              />
            </div>
            <div class="row q-gutter-sm items-center q-mt-md">
              <q-btn
                flat
                icon="add"
                label="Adicionar Parâmetro"
                color="cyan"
                size="sm"
                @click="epForm.params.push({ key: '', default_value: '' })"
              />
            </div>
          </q-form>
        </q-card-section>

        <q-separator />

        <q-card-actions
          align="right"
          class="q-pa-md"
        >
          <q-btn
            v-close-popup
            flat
            label="Cancelar"
          />
          <q-btn
            label="Salvar"
            color="cyan"
            unelevated
            :loading="savingEp"
            @click="submitEndpointForm"
          />
        </q-card-actions>
      </q-card>
    </q-dialog>

    <!-- ═══════ DIALOG: COLETAR DADOS COM PARÂMETROS ═══════ -->
    <q-dialog
      v-model="collectDialogOpen"
      persistent
    >
      <q-card
        class="glass-card"
        style="width: 100%; max-width: 600px;"
      >
        <q-card-section class="row items-center q-pb-none">
          <div class="text-h6 text-cyan">
            <q-icon
              name="cloud_download"
              class="q-mr-sm"
            />
            Coletar Dados
          </div>
          <q-space />
          <q-btn
            v-close-popup
            icon="close"
            flat
            round
            dense
          />
        </q-card-section>

        <q-card-section v-if="collectingEp">
          <div class="text-subtitle1 text-weight-medium q-mb-xs">
            {{ collectingEp.name }}
          </div>
          <div class="text-caption text-grey-5 q-mb-md" style="word-break: break-all;">
            <q-badge
              :color="getMethodColor(collectingEp.method)"
              class="q-mr-xs"
              dense
            >
              {{ collectingEp.method || 'GET' }}
            </q-badge>
            {{ collectingEp.url_template }}
          </div>

          <q-separator class="q-mb-md" />

          <div
            v-if="collectParams.length > 0"
            class="column q-gutter-sm"
          >
            <div class="text-subtitle2 text-grey-4 q-mb-xs">
              📝 Preencha os parâmetros para a coleta:
            </div>
            <q-input
              v-for="param in collectParams"
              :key="param.key"
              v-model="param.value"
              :label="param.key"
              :hint="param.hint"
              outlined
              dense
              dark
              color="cyan"
              class="q-mb-xs"
            >
              <template #prepend>
                <q-icon
                  name="tune"
                  color="cyan"
                  size="xs"
                />
              </template>
            </q-input>
          </div>

          <div
            v-else
            class="text-grey-5 text-center q-pa-md"
          >
            <q-icon
              name="check_circle"
              color="positive"
              size="sm"
              class="q-mr-xs"
            />
            Este endpoint não requer parâmetros.
          </div>
        </q-card-section>

        <q-separator />

        <q-card-actions
          align="right"
          class="q-pa-md"
        >
          <q-btn
            v-close-popup
            flat
            label="Cancelar"
          />
          <q-btn
            label="Coletar"
            icon="cloud_download"
            color="cyan"
            text-color="dark"
            unelevated
            :loading="collecting"
            @click="executeCollection"
          />
        </q-card-actions>
      </q-card>
    </q-dialog>
  </q-page>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useQuasar } from 'quasar';
import { systemsService } from 'src/services/systems.service';
import { endpointsService } from 'src/services/endpoints.service';
import type { System, Endpoint, SystemFile, CollectedData } from 'src/types';

const $q = useQuasar();
const route = useRoute();
const router = useRouter();
const system = ref<System | null>(null);

const endpoints = ref<Endpoint[]>([]);
const files = ref<SystemFile[]>([]);
const loading = ref(true);
const tab = ref((route.query.tab as string) || 'overview');

// Endpoint form state
const epDialogOpen = ref(false);
const isEditingEp = ref(false);
const editingEpId = ref<string | null>(null);
const savingEp = ref(false);
const endpointFormRef = ref<any>(null); // Reference to QForm

const epForm = ref({
  name: '',
  url_template: '',
  method: 'GET',
  response_type: 'json',
  params: [] as { key: string; default_value: string }[],
});

// Collect Dialog State
const collectDialogOpen = ref(false);
const collectingEp = ref<Endpoint | null>(null);
const collectParams = ref<{ key: string; value: string; hint: string }[]>([]);
const collecting = ref(false);

const responseTypeOptions = [
  { label: 'JSON', value: 'json' },
  { label: 'CSV', value: 'csv' },
  { label: 'XML', value: 'xml' },
];

// File Upload State
const uploading = ref(false);
const fileConfig = ref({
  file: null as File | null,
  description: ''
});

// Collected Data State
const collectedData = ref<CollectedData[]>([]);
const loadingCollected = ref(false);
const collectingAll = ref(false);

// ══════════════ LOAD ══════════════

async function loadSystem() {
  const id = route.params.id as string;
  try {
    system.value = await systemsService.findOne(id);
    await Promise.all([loadEndpoints(), loadFiles(), loadCollectedData()]);
  } catch (error) {
    console.error(error);
    $q.notify({ type: 'negative', message: 'Erro ao carregar sistema' });
  } finally {
    loading.value = false;
  }
}

async function loadEndpoints() {
  const id = route.params.id as string;
  try {
    endpoints.value = await endpointsService.getBySystem(id);
  } catch (e) {
    console.error(e);
  }
  }


async function loadFiles() {
  const id = route.params.id as string;
  try {
    files.value = await systemsService.getFiles(id);
  } catch (e) {
    console.error('Erro ao carregar arquivos', e);
  }
}

async function handleFileUpload() {
  const id = route.params.id as string;
  if (!fileConfig.value.file) return;
  
  uploading.value = true;
  try {
    await systemsService.uploadFile(id, fileConfig.value.file, fileConfig.value.description);
    $q.notify({ type: 'positive', message: 'Arquivo enviado com sucesso!' });
    fileConfig.value.file = null;
    fileConfig.value.description = '';
    await loadFiles();
  } catch (e: any) {
    console.error(e);
    $q.notify({ type: 'negative', message: 'Erro ao enviar arquivo' });
  } finally {
    uploading.value = false;
  }
}

function removeFile(file: SystemFile) {
  $q.dialog({
    title: 'Excluir Arquivo',
    message: `Deseja excluir "${file.original_name}"?`,
    cancel: true,
    persistent: true
  }).onOk(async () => {
    try {
      await systemsService.deleteFile(file.id);
      $q.notify({ type: 'positive', message: 'Arquivo removido' });
      await loadFiles();
    } catch {
      $q.notify({ type: 'negative', message: 'Erro ao remover arquivo' });
    }
  });
}

// ══════════════ ENDPOINT CRUD ══════════════

function openEndpointDialog(ep?: Endpoint) {
  if (ep) {
    isEditingEp.value = true;
    editingEpId.value = ep.id;
    epForm.value.name = ep.name;
    epForm.value.url_template = ep.url_template || '';
    epForm.value.method = ep.method || 'GET';
    epForm.value.response_type = ep.response_type || 'json';
    epForm.value.params = ep.params_schema
      ? Object.entries(ep.params_schema).map(([key, val]) => ({
          key,
          default_value: String((val as any)?.default || ''),
        }))
      : [];
  } else {
    isEditingEp.value = false;
    editingEpId.value = null;
    epForm.value = {
      name: '',
      url_template: '',
      method: 'GET',
      response_type: 'json',
      params: [],
    };
  }
  epDialogOpen.value = true;
}

async function saveEndpoint() {
  savingEp.value = true;
  try {
    const paramsObj: Record<string, any> = {};
    epForm.value.params.forEach(p => {
      if (p.key) {
        paramsObj[p.key] = { type: 'string', default: p.default_value || '' };
      }
    });

    const payload: any = {
      name: epForm.value.name,
      url_template: epForm.value.url_template,
      method: epForm.value.method,
      response_type: epForm.value.response_type,
      params_schema: paramsObj,
      system_id: route.params.id,
    };

    if (isEditingEp.value && editingEpId.value) {
      await endpointsService.update(editingEpId.value, payload);
      $q.notify({ type: 'positive', message: 'Endpoint atualizado!' });
    } else {
      await endpointsService.create(payload);
      $q.notify({ type: 'positive', message: 'Endpoint criado!' });
    }
    epDialogOpen.value = false;
    await loadEndpoints();
  } catch (e: any) {
    console.error(e);
    $q.notify({ type: 'negative', message: e.response?.data?.message || 'Erro ao salvar endpoint' });
  } finally {
    savingEp.value = false;
  }
}

function submitEndpointForm() {
  endpointFormRef.value?.submit();
}

function deleteEndpoint(ep: Endpoint) {
  $q.dialog({
    title: 'Excluir Endpoint',
    message: `Deseja excluir "${ep.name}"? Esta ação não pode ser desfeita.`,
    cancel: true,
    persistent: true,
  }).onOk(async () => {
    try {
      await endpointsService.delete(ep.id);
      $q.notify({ type: 'positive', message: 'Endpoint removido' });
      await loadEndpoints();
    } catch (e) {
      console.error(e);
      $q.notify({ type: 'negative', message: 'Erro ao remover endpoint' });
    }
  });
}

function openCollectDialog(ep: Endpoint) {
  collectingEp.value = ep;
  collectParams.value = [];

  // Extrair parâmetros da url_template (ex: :mes, :ano, :unidade)
  const urlParams = (ep.url_template || '').match(/:([a-zA-Z_]+)/g) || [];
  const paramKeys = new Set(urlParams.map(p => p.replace(':', '')));

  // Também incluir parâmetros do params_schema
  if (ep.params_schema) {
    Object.keys(ep.params_schema).forEach(k => paramKeys.add(k));
  }

  // Montar a lista de parâmetros com valores default
  for (const key of paramKeys) {
    const schemaEntry = ep.params_schema?.[key] as any;
    const defaultVal = schemaEntry?.default || '';
    let hint = '';

    // Sugerir valores inteligentes baseado no nome do parâmetro
    if (key.toLowerCase() === 'mes' || key.toLowerCase() === 'month') {
      hint = `Mês (1-12). Atual: ${new Date().getMonth() + 1}`;
    } else if (key.toLowerCase() === 'ano' || key.toLowerCase() === 'year') {
      hint = `Ano. Atual: ${new Date().getFullYear()}`;
    } else if (key.toLowerCase() === 'unidade' || key.toLowerCase() === 'unit') {
      hint = 'ID ou código da unidade';
    } else if (key.toLowerCase() === 'dia' || key.toLowerCase() === 'day') {
      hint = `Dia (1-31). Atual: ${new Date().getDate()}`;
    }

    collectParams.value.push({
      key,
      value: defaultVal ? String(defaultVal) : '',
      hint,
    });
  }

  collectDialogOpen.value = true;
}

async function executeCollection() {
  if (!collectingEp.value) return;

  collecting.value = true;
  try {
    const params: Record<string, any> = {};
    collectParams.value.forEach(p => {
      if (p.value !== '') {
        // Tentar converter para número se for numérico
        const num = Number(p.value);
        params[p.key] = !isNaN(num) && p.value.trim() !== '' ? num : p.value;
      }
    });

    await endpointsService.collect(collectingEp.value.id, params);
    $q.notify({ type: 'positive', message: '✅ Dados coletados com sucesso!' });
    collectDialogOpen.value = false;

    // Recarregar dados coletados se estiver na aba de dados
    await loadCollectedData();
  } catch (e: any) {
    console.error(e);
    $q.notify({
      type: 'negative',
      message: e.response?.data?.message || 'Erro ao coletar dados',
      caption: 'Verifique os parâmetros e tente novamente',
    });
  } finally {
    collecting.value = false;
  }
}

// ══════════════ HELPERS ══════════════

function getMethodColor(m?: string) {
  const colors: Record<string, string> = { GET: 'positive', POST: 'warning', PUT: 'info', DELETE: 'negative' };
  return colors[m || 'GET'] || 'grey';
}

function getEnvColor(e: string) {
  const m: Record<string, string> = { production: 'positive', staging: 'warning', development: 'info' };
  return m[e] || 'grey';
}

function getCritColor(c: string) {
  const m: Record<string, string> = { low: 'info', medium: 'warning', high: 'deep-orange', critical: 'negative' };
  return m[c] || 'grey';
}

function getCritLabel(c: string) {
  const m: Record<string, string> = { low: 'Baixa', medium: 'Média', high: 'Alta', critical: 'Crítica' };
  return m[c] || c;
}

function maskToken(token: string) {
  if (!token || token.length < 10) return '••••••••';
  return token.slice(0, 6) + '••••••••' + token.slice(-4);
}

// ══════════════ COLLECTED DATA ══════════════

async function loadCollectedData() {
  const id = route.params.id as string;
  loadingCollected.value = true;
  try {
    collectedData.value = await endpointsService.getCollectedBySystem(id);
  } catch (e) {
    console.error('Erro ao carregar dados coletados', e);
  } finally {
    loadingCollected.value = false;
  }
}

async function collectAllEndpoints() {
  if (endpoints.value.length === 0) {
    $q.notify({ type: 'warning', message: 'Nenhum endpoint configurado para coletar' });
    return;
  }

  collectingAll.value = true;
  let successCount = 0;
  let errorCount = 0;

  for (const ep of endpoints.value) {
    try {
      const defaultParams: Record<string, any> = {};
      if (ep.params_schema) {
        Object.entries(ep.params_schema).forEach(([key, val]) => {
          defaultParams[key] = (val as any)?.default || '';
        });
      }
      await endpointsService.collect(ep.id, defaultParams);
      successCount++;
    } catch {
      errorCount++;
    }
  }

  collectingAll.value = false;
  await loadCollectedData();

  if (errorCount === 0) {
    $q.notify({ type: 'positive', message: `✅ ${successCount} coleta(s) realizada(s) com sucesso!` });
  } else {
    $q.notify({ type: 'warning', message: `${successCount} coleta(s) OK, ${errorCount} com erro` });
  }
}

function formatDataSize(item: CollectedData): string {
  if (item.csv_raw) {
    const lines = item.csv_raw.split('\n').length;
    return `${lines} linhas`;
  }
  if (item.raw_data) {
    if (Array.isArray(item.raw_data)) return `${item.raw_data.length} registros`;
    const size = JSON.stringify(item.raw_data).length;
    return size > 1024 ? `${(size / 1024).toFixed(1)} KB` : `${size} bytes`;
  }
  return '—';
}

function downloadCollected(item: CollectedData, format: 'csv' | 'json') {
  const url = format === 'csv'
    ? endpointsService.getDownloadCsvUrl(item.id)
    : endpointsService.getDownloadJsonUrl(item.id);

  const token = localStorage.getItem('token');
  fetch(url, {
    headers: { Authorization: `Bearer ${token}` },
  })
    .then(res => {
      if (!res.ok) throw new Error('Download falhou');
      return res.blob();
    })
    .then(blob => {
      const blobUrl = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = blobUrl;
      a.download = `coleta_${item.endpoint?.name || 'dados'}_${new Date(item.collected_at).toISOString().split('T')[0]}.${format}`;
      a.click();
      window.URL.revokeObjectURL(blobUrl);
      $q.notify({ type: 'positive', message: `✅ Download ${format.toUpperCase()} iniciado!` });
    })
    .catch(err => {
      console.error(err);
      $q.notify({ type: 'negative', message: 'Erro ao baixar dados' });
    });
}

function previewData(item: CollectedData) {
  const content = item.csv_raw
    ? item.csv_raw.split('\n').slice(0, 20).join('\n')
    : JSON.stringify(item.raw_data, null, 2).substring(0, 3000);

  $q.dialog({
    title: `📊 ${item.endpoint?.name || 'Dados'} — Prévia`,
    message: `<pre style="max-height:60vh;overflow:auto;font-size:0.8rem;white-space:pre-wrap;word-break:break-all;background:rgba(0,0,0,0.3);padding:12px;border-radius:8px;">${content}</pre>`,
    html: true,
    style: 'min-width: 600px; max-width: 90vw;',
    ok: 'Fechar',
  });
}

// ══════════════ LIFECYCLE ══════════════

onMounted(() => {
  loadSystem();
});
</script>

<style lang="scss" scoped>
.system-detail-page {
  max-width: 1200px;
  margin: 0 auto;
}

.orbitron-font {
  font-family: 'Orbitron', sans-serif;
  letter-spacing: 0.5px;
}

.stat-card {
  background: var(--badge-bg);
  border: 1px solid var(--border-color);
  border-radius: 12px;
}

.endpoint-item {
  border: 1px solid var(--border-color);
  border-radius: 12px;
  transition: all 0.2s ease;

  &:hover {
    border-color: var(--border-glow);
  }
}

.method-badge {
  min-width: 50px;
  text-align: center;
  font-size: 0.75rem;
  padding: 4px 10px;
}

.upload-card {
  background: rgba(0, 245, 255, 0.04);
  border: 1px dashed rgba(0, 245, 255, 0.25);
  border-radius: 12px;
  transition: all 0.3s ease;

  &:hover {
    border-color: rgba(0, 245, 255, 0.4);
    background: rgba(0, 245, 255, 0.06);
  }
}

.file-item {
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.06);
  border-radius: 10px;
  transition: all 0.2s ease;

  &:hover {
    background: rgba(255, 255, 255, 0.06);
    border-color: rgba(0, 245, 255, 0.15);
  }
}

.collected-item {
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.06);
  border-radius: 10px;
  transition: all 0.2s ease;

  &:hover {
    background: rgba(0, 245, 255, 0.04);
    border-color: rgba(0, 245, 255, 0.2);
    transform: translateX(4px);
  }
}

// ═══════════════ RESPONSIVIDADE MOBILE ═══════════════
@media (max-width: 599px) {
  .system-detail-page {
    padding: 8px !important;
  }

  // Header: stack vertically
  .system-detail-page > .column > .row:first-child {
    flex-direction: column;
    gap: 8px;
    align-items: flex-start !important;
  }

  .system-detail-page .text-h4 {
    font-size: 1.2rem !important;
  }

  // Tabs: scrollable
  .glass-card :deep(.q-tabs) {
    .q-tab {
      padding: 0 8px;
      min-height: 36px;
    }

    .q-tab__label {
      font-size: 0.75rem;
    }
  }

  // Stat cards inside overview
  .stat-card {
    padding: 12px !important;
  }

  // Endpoint items
  .endpoint-item {
    padding: 8px !important;
  }
}
</style>
