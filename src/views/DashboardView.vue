<script setup lang="ts">
/**
 * Vista Dashboard: muestra las métricas de campañas del usuario.
 * Maneja los tres estados de toda pantalla con datos: cargando, error, y listo.
 * La lógica de datos vive en la capa API; esta vista orquesta y presenta.
 */
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { getInsights, type Campaign } from '@/api/campaigns'
import { analyzeCampaigns } from '@/api/campaigns'
import { marked } from 'marked'

const auth = useAuthStore()
const router = useRouter()

// --- Estado de la vista ---
  //1st Wave fo Design const
const campaigns = ref<Campaign[]>([])   // los datos
const accountName = ref('')             // nombre de la cuenta, para el encabezado
const loading = ref(true)               // ¿estamos cargando?
const errorMessage = ref('')            // mensaje si algo falla
const datePreset = ref('maximum')       // periodo; 'maximum' porque sabemos que trae datos
  //2nd Wave fo Design const
const analysisHtml = ref('')        // el análisis ya convertido a HTML
const analyzing = ref(false)        // ¿Claude está procesando?
const analysisError = ref('')       // error propio del análisis

  //2nd Wave fo Design functions

/**
 * Pide el análisis a Claude y lo convierte de Markdown a HTML para mostrarlo.
 */
async function runAnalysis() {
  analyzing.value = true
  analysisError.value = ''
  analysisHtml.value = ''
  try {
    const data = await analyzeCampaigns(datePreset.value)
    analysisHtml.value = await marked(data.analysis)
  } catch {
    analysisError.value = 'No se pudo generar el análisis. Intenta de nuevo.'
  } finally {
    analyzing.value = false
  }
}
// 1st Wave of Design functions
/**
 * Pide los insights al backend y actualiza el estado según el resultado.
 */
async function loadInsights() {
  loading.value = true
  errorMessage.value = ''
  try {
    const data = await getInsights(datePreset.value)
    campaigns.value = data.campaigns
    accountName.value = data.account_name || data.account_id
  } catch (err: any) {
    // Distinguimos el caso "no tienes cuenta conectada" (404) de otros errores,
    // para dar un mensaje útil en vez de uno genérico.
    if (err.response?.status === 404) {
      errorMessage.value = 'No tienes una cuenta de Meta conectada.'
    } else {
      errorMessage.value = 'No se pudieron cargar las campañas. Intenta de nuevo.'
    }
  } finally {
    loading.value = false
  }
}

// onMounted: se ejecuta cuando la vista aparece en pantalla. Es el momento
// natural para cargar los datos iniciales.
onMounted(loadInsights)

function handleLogout() {
  auth.logout()
  router.push('/login')
}

// Formatea un número como moneda (para la columna de gasto).
function formatCurrency(value: number): string {
  return new Intl.NumberFormat('es', { style: 'currency', currency: 'USD' }).format(value)
}

// Formatea porcentajes (para CTR).
function formatPercent(value: number): string {
  return `${value.toFixed(2)}%`


}



</script>

<template>
  <div class="dashboard">
    <!-- Encabezado con título y logout -->
    <header class="dashboard-header">
      <div>
        <h1>Campañas</h1>
        <p v-if="accountName" class="account-name">{{ accountName }}</p>
      </div>
      <Button label="Cerrar sesión" severity="secondary" @click="handleLogout" />
    </header>

    <!-- ESTADO 1: cargando -->
    <div v-if="loading" class="state-center">
      <ProgressSpinner />
      <p>Cargando campañas...</p>
    </div>

    <!-- ESTADO 2: error -->
    <Message v-else-if="errorMessage" severity="error" :closable="false">
      {{ errorMessage }}
    </Message>

    <!-- ESTADO 3: datos listos -->
    <DataTable
      v-else
      :value="campaigns"
      stripedRows
      responsiveLayout="scroll"
    >
      <!-- Cada Column define qué campo muestra y cómo. 'sortable' permite ordenar. -->
      <Column field="campaign_name" header="Campaña" sortable />

      <!-- Columnas con formato personalizado usan #body para dar formato al valor. -->
      <Column field="spend" header="Gasto" sortable>
        <template #body="{ data }">{{ formatCurrency(data.spend) }}</template>
      </Column>

      <Column field="impressions" header="Impresiones" sortable>
        <template #body="{ data }">{{ data.impressions.toLocaleString() }}</template>
      </Column>

      <Column field="clicks" header="Clics" sortable>
        <template #body="{ data }">{{ data.clicks.toLocaleString() }}</template>
      </Column>

      <Column field="reach" header="Alcance" sortable>
        <template #body="{ data }">{{ data.reach.toLocaleString() }}</template>
      </Column>

      <Column field="ctr" header="CTR" sortable>
        <template #body="{ data }">{{ formatPercent(data.ctr) }}</template>
      </Column>

      <Column field="cpc" header="CPC" sortable>
        <template #body="{ data }">{{ formatCurrency(data.cpc) }}</template>
      </Column>
    </DataTable>
<!-- Sección de análisis con IA. Solo visible cuando ya hay campañas cargadas. -->
    <div v-if="!loading && !errorMessage && campaigns.length > 0" class="analysis-section">
      <Button
        label="Analizar con IA"
        icon="pi pi-sparkles"
        :loading="analyzing"
        @click="runAnalysis"
      />

      <!-- Error propio del análisis -->
      <Message v-if="analysisError" severity="error" :closable="false" class="analysis-msg">
        {{ analysisError }}
      </Message>

      <!-- El resultado del análisis, renderizado como HTML formateado.
           v-html inserta el HTML que generó marked. Es seguro aquí porque el
           contenido viene de nuestro backend/Claude, no de entrada de usuarios. -->
      <Panel v-if="analysisHtml" header="Análisis de tus campañas" class="analysis-panel">
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
/* Damos aire al contenido del análisis para que se lea cómodo.
   Como viene de v-html, estos estilos aplican a sus elementos internos. */
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