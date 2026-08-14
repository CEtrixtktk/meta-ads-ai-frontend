<script setup lang="ts">
/**
 * Vista Dashboard: muestra las métricas de campañas del usuario.
 * Maneja los tres estados de toda pantalla con datos: cargando, error, y listo.
 * La lógica de datos vive en la capa API; esta vista orquesta y presenta.
 *
 * Nota sobre el idioma: los textos de la interfaz están en inglés porque el mercado
 * objetivo del producto es angloparlante, y el análisis generado también lo está.
 * Mantener un solo idioma de cara al usuario evita una experiencia inconsistente.
 */
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { getInsights, analyzeCampaigns, type Campaign } from '@/api/campaigns'
import { marked } from 'marked'

const auth = useAuthStore()
const router = useRouter()

// --- Estado de las métricas ---
const campaigns = ref<Campaign[]>([])   // los datos de las campañas
const accountName = ref('')             // nombre de la cuenta, para el encabezado
const loading = ref(true)               // ¿se están cargando las métricas?
const errorMessage = ref('')            // mensaje si la carga falla
const datePreset = ref('maximum')       // ventana temporal consultada

// --- Estado del análisis con IA ---
// Se mantiene separado del estado de las métricas a propósito: la generación del
// análisis tarda bastante más que la consulta de datos, así que la tabla se muestra
// de inmediato mientras el análisis se genera en segundo plano.
const analysisHtml = ref('')            // el análisis ya convertido de Markdown a HTML
const analyzing = ref(false)            // ¿el modelo está procesando?
const analysisError = ref('')           // error propio del análisis

/**
 * Solicita el análisis al backend y lo convierte de Markdown a HTML para mostrarlo.
 */
async function runAnalysis() {
  analyzing.value = true
  analysisError.value = ''
  analysisHtml.value = ''
  try {
    const data = await analyzeCampaigns(datePreset.value)
    analysisHtml.value = await marked(data.analysis)
  } catch {
    analysisError.value = 'Could not generate the analysis. Please try again.'
  } finally {
    analyzing.value = false
  }
}

/**
 * Solicita las métricas al backend y actualiza el estado según el resultado.
 */
async function loadInsights() {
  loading.value = true
  errorMessage.value = ''
  try {
    const data = await getInsights(datePreset.value)
    campaigns.value = data.campaigns
    accountName.value = data.account_name || data.account_id
  } catch (err: any) {
    // Se distingue el caso "no hay cuenta conectada" (404) de otros errores,
    // para dar un mensaje accionable en lugar de uno genérico.
    if (err.response?.status === 404) {
      errorMessage.value = 'No Meta ad account connected.'
    } else {
      errorMessage.value = 'Could not load campaigns. Please try again.'
    }
  } finally {
    loading.value = false
  }
}

// onMounted se ejecuta cuando la vista aparece en pantalla: es el momento natural
// para cargar los datos iniciales.
onMounted(loadInsights)

function handleLogout() {
  auth.logout()
  router.push('/login')
}

/**
 * Formatea un número como moneda estadounidense.
 * Se usa el locale 'en-US' para que el formato coincida con el idioma de la interfaz.
 */
function formatCurrency(value: number): string {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(value)
}

/** Formatea un valor como porcentaje con dos decimales. */
function formatPercent(value: number): string {
  return `${value.toFixed(2)}%`
}

/** Formatea un número entero con separadores de miles. */
function formatNumber(value: number): string {
  return value.toLocaleString('en-US')
}
</script>

<template>
  <div class="dashboard">
    <!-- Encabezado con título de la cuenta y cierre de sesión -->
    <header class="dashboard-header">
      <div>
        <h1>Campaigns</h1>
        
      </div>
      <Button label="Sign out" severity="secondary" @click="handleLogout" />
    </header>

    <!-- ESTADO 1: cargando -->
    <div v-if="loading" class="state-center">
      <ProgressSpinner />
      <p>Loading campaigns...</p>
    </div>

    <!-- ESTADO 2: error -->
    <Message v-else-if="errorMessage" severity="error" :closable="false">
      {{ errorMessage }}
    </Message>

    <!-- ESTADO 3: datos disponibles -->
    <DataTable
      v-else
      :value="campaigns"
      stripedRows
      responsiveLayout="scroll"
    >
      <!-- Cada Column define qué campo muestra y cómo. 'sortable' habilita el orden. -->
      <Column field="campaign_name" header="Campaign" sortable />

      <!-- Las columnas con formato personalizado usan #body para transformar el valor. -->
      <Column field="spend" header="Spend" sortable>
        <template #body="{ data }">{{ formatCurrency(data.spend) }}</template>
      </Column>

      <Column field="impressions" header="Impressions" sortable>
        <template #body="{ data }">{{ formatNumber(data.impressions) }}</template>
      </Column>

      <Column field="clicks" header="Clicks" sortable>
        <template #body="{ data }">{{ formatNumber(data.clicks) }}</template>
      </Column>

      <Column field="reach" header="Reach" sortable>
        <template #body="{ data }">{{ formatNumber(data.reach) }}</template>
      </Column>

      <Column field="ctr" header="CTR" sortable>
        <template #body="{ data }">{{ formatPercent(data.ctr) }}</template>
      </Column>

      <Column field="cpc" header="CPC" sortable>
        <template #body="{ data }">{{ formatCurrency(data.cpc) }}</template>
      </Column>
    </DataTable>

    <!-- Sección de análisis con IA. Solo visible cuando hay campañas cargadas:
         sin datos no hay nada que analizar. -->
    <div v-if="!loading && !errorMessage && campaigns.length > 0" class="analysis-section">
      <Button
        label="Analyze with AI"
        icon="pi pi-sparkles"
        :loading="analyzing"
        @click="runAnalysis"
      />

      <!-- Error propio del análisis, independiente del de las métricas -->
      <Message v-if="analysisError" severity="error" :closable="false" class="analysis-msg">
        {{ analysisError }}
      </Message>

      <!-- Resultado del análisis, renderizado como HTML formateado.
           v-html inserta el HTML generado por marked. Es aceptable aquí porque el
           contenido proviene del propio backend, no de entrada de usuarios. -->
      <Panel v-if="analysisHtml" header="Campaign Analysis" class="analysis-panel">
        <div class="analysis-content" v-html="analysisHtml"></div>
      </Panel>
    </div>
  </div>
</template>

<style scoped>
.dashboard {
  padding: 2rem;
  max-width: 1200px;
  margin: 0 auto;
}
.dashboard-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
}
.account-name {
  color: var(--p-text-muted-color);
  margin: 0.25rem 0 0;
}
.state-center {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
  padding: 4rem;
}
.analysis-section {
  margin-top: 2rem;
}
.analysis-msg {
  margin-top: 1rem;
}
.analysis-panel {
  margin-top: 1.5rem;
}
/* Espaciado del contenido del análisis para que resulte cómodo de leer.
   Al venir de v-html, se requiere :deep() para alcanzar sus elementos internos. */
.analysis-content {
  line-height: 1.7;
}
.analysis-content :deep(h1),
.analysis-content :deep(h2) {
  margin-top: 1.5rem;
  margin-bottom: 0.5rem;
}
.analysis-content :deep(ul) {
  padding-left: 1.5rem;
}
</style>