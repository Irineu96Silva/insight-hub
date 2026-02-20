<template>
  <q-page class="q-pa-md insight-detail-page">
    <div
      v-if="loading"
      class="row justify-center q-pa-xl"
    >
      <q-spinner-orbit
        color="cyan"
        size="4em"
      />
    </div>

    <div
      v-else-if="!insight"
      class="column items-center justify-center q-pa-xl text-center"
    >
      <q-icon
        name="error_outline"
        size="4em"
        color="grey-7"
      />
      <h3 class="text-h5 text-grey-5 q-mt-md">
        Insight não encontrado
      </h3>
      <q-btn
        label="Voltar"
        color="cyan"
        flat
        class="q-mt-md"
        @click="router.back()"
      />
    </div>

    <div
      v-else
      class="column q-gutter-md"
    >
      <!-- Header -->
      <div class="row items-center justify-between">
        <q-btn
          flat
          round
          icon="arrow_back"
          color="white"
          @click="router.back()"
        />
        <div class="row q-gutter-sm">
          <q-btn 
            v-if="!insight.is_read"
            icon="mark_email_read" 
            label="Marcar como lido" 
            color="cyan" 
            outline 
            @click="markAsRead" 
          />
          <q-btn 
            icon="delete" 
            label="Excluir" 
            color="negative" 
            flat 
            @click="confirmDelete" 
          />
        </div>
      </div>

      <!-- Main Content -->
      <q-card class="futuristic-card q-pa-lg">
        <div class="row items-start q-col-gutter-lg">
          <!-- Icon Column -->
          <div class="col-auto">
            <div
              class="insight-icon-large"
              :class="`insight-icon--${insight.severity}`"
            >
              <q-icon
                :name="getInsightIcon(insight.type)"
                size="48px"
              />
            </div>
          </div>
            
          <!-- Content Column -->
          <div class="col">
            <div class="row items-center q-gutter-sm q-mb-md">
              <q-badge
                :color="getSeverityColor(insight.severity)"
                class="q-py-xs q-px-sm text-subtitle2"
              >
                {{ insight.severity.toUpperCase() }}
              </q-badge>
              <q-badge
                color="grey-8"
                class="q-py-xs q-px-sm text-subtitle2"
              >
                {{ insight.type.toUpperCase() }}
              </q-badge>
              <div class="text-grey-5 q-ml-sm row items-center">
                <q-icon
                  name="schedule"
                  size="xs"
                  class="q-mr-xs"
                />
                {{ new Date(insight.created_at).toLocaleString() }}
              </div>
            </div>

            <h1 class="text-h4 text-white orbitron-font q-mt-none q-mb-md">
              {{ insight.title }}
            </h1>
               
            <div
              class="text-body1 text-grey-4 text-justify q-mb-xl"
              style="line-height: 1.6;"
            >
              {{ insight.content }}
            </div>

            <!-- Related Meta -->
            <div class="bg-dark-layer q-pa-md rounded-borders">
              <div class="text-subtitle2 text-cyan q-mb-sm">
                Contexto do Sistema
              </div>
              <div class="row q-gutter-md text-grey-4">
                <div>
                  <span class="text-grey-6">System ID:</span> {{ insight.system_id || 'N/A' }}
                </div>
                <div>
                  <span class="text-grey-6">Endpoint ID:</span> {{ insight.endpoint_id || 'N/A' }}
                </div>
              </div>
            </div>
          </div>
        </div>
      </q-card>

      <!-- AI Actions / Suggestions (Placeholder) -->
      <q-card class="futuristic-card q-pa-md bg-gradient-ai">
        <div class="row items-center">
          <q-icon
            name="auto_awesome"
            size="md"
            color="white"
            class="q-mr-md"
          />
          <div class="col">
            <div class="text-h6 text-white">
              Ação Sugerida pela IA
            </div>
            <div class="text-body2 text-white">
              Com base neste insight, recomenda-se iniciar uma análise aprofundada nos logs do servidor.
            </div>
          </div>
          <div class="col-auto">
            <q-btn
              color="white"
              text-color="purple"
              label="Analisar no Chat"
              @click="goToChat"
            />
          </div>
        </div>
      </q-card>
    </div>
  </q-page>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useQuasar } from 'quasar';
import { insightsService } from 'src/services/insights.service';
import type { Insight } from 'src/types';

const route = useRoute();
const router = useRouter();
const $q = useQuasar();

const loading = ref(true);
const insight = ref<Insight | null>(null);

async function loadInsight() {
  const id = route.params.id as string;
  try {
     const data = await insightsService.findOne(id);
     if (data) {
        insight.value = data || null;
        if (!data.is_read) {
           await insightsService.markAsRead(id);
           data.is_read = true;
        }
     }
  } catch (error) {
     console.error(error);
  } finally {
     loading.value = false;
  }
}

async function markAsRead() {
   if (insight.value) {
      await insightsService.markAsRead(insight.value.id);
      insight.value.is_read = true;
      $q.notify({ type: 'positive', message: 'Marcado como lido' });
   }
}

function confirmDelete() {
   $q.dialog({
      title: 'Excluir Insight',
      message: 'Tem certeza que deseja remover este insight?',
      cancel: true,
      persistent: true
   }).onOk(async () => {
      if (insight.value) {
         await insightsService.dismiss(insight.value.id);
         $q.notify({ type: 'info', message: 'Insight excluído' });
         router.push('/insights');
      }
   });
}

function goToChat() {
   router.push('/chat');
}

function getInsightIcon(type: string) {
  const icons: Record<string, string> = {
    performance: 'speed',
    security: 'security',
    optimization: 'build',
    info: 'info',
    generated: 'auto_awesome',
    default: 'lightbulb'
  };
  return icons[type] || icons.default;
}

function getSeverityColor(severity: string) {
   const colors: Record<string, string> = {
    critical: 'negative',
    warning: 'warning',
    info: 'info',
    success: 'positive'
  };
  return colors[severity] || 'grey';
}

onMounted(() => {
   loadInsight();
});
</script>

<style lang="scss" scoped>
.orbitron-font {
  font-family: 'Orbitron', sans-serif;
  letter-spacing: 1px;
}

.futuristic-card {
  background: rgba(15, 15, 30, 0.6);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.05);
  border-radius: 16px;
}

.insight-icon-large {
   width: 80px;
   height: 80px;
   border-radius: 20px;
   display: flex;
   align-items: center;
   justify-content: center;
   background: rgba(255,255,255,0.05);
   border: 1px solid rgba(255,255,255,0.1);
   
   &.insight-icon--critical { color: var(--q-negative); background: rgba(244, 63, 94, 0.1); border-color: rgba(244, 63, 94, 0.3); }
   &.insight-icon--warning { color: var(--q-warning); background: rgba(251, 191, 36, 0.1); border-color: rgba(251, 191, 36, 0.3); }
   &.insight-icon--info { color: var(--q-info); background: rgba(59, 130, 246, 0.1); border-color: rgba(59, 130, 246, 0.3); }
}

.bg-dark-layer {
   background: rgba(0,0,0,0.3);
}

.bg-gradient-ai {
   background: linear-gradient(135deg, #a855f7 0%, #ec4899 100%);
   border: none;
}
</style>
