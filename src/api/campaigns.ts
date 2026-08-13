/**
 * Funciones que llaman a los endpoints de campañas del backend.
 * Aíslan las URLs y definen la forma de los datos (tipos), para que las vistas
 * trabajen con datos tipados sin saber de HTTP.
 */
import client from './client'

// --- Tipos: describen la forma EXACTA de los datos que devuelve el backend ---
// TypeScript usará esto para avisarte si accedes a un campo que no existe.

// Una campaña individual con sus métricas (coincide con el serializer de Django).
export interface Campaign {
  campaign_name: string
  spend: number
  impressions: number
  clicks: number
  reach: number
  ctr: number
  cpc: number
  date_start?: string
  date_stop?: string
}

// La respuesta completa del endpoint de insights.
export interface InsightsResponse {
  account_id: string
  account_name: string
  date_preset: string
  campaigns: Campaign[]
}

// Respuesta del endpoint de análisis con Claude.
export interface AnalysisResponse {
  account_id: string
  account_name: string
  date_preset: string
  campaigns_analyzed: number
  analysis: string   // el texto en Markdown que genera Claude
}

/**
 * Obtiene las métricas de campañas del usuario autenticado.
 * @param datePreset ventana temporal (ej. 'last_30d', 'maximum').
 */
export async function getInsights(datePreset = 'last_30d'): Promise<InsightsResponse> {
  const { data } = await client.get<InsightsResponse>('/meta/insights/', {
    // Los params se añaden como ?date_preset=... en la URL.
    params: { date_preset: datePreset },
  })
  return data
  
}
/**
 * Pide a Claude el análisis de las campañas del usuario para un periodo.
 * Es POST porque dispara una operación costosa (la generación del LLM).
 */
export async function analyzeCampaigns(datePreset = 'last_30d'): Promise<AnalysisResponse> {
  const { data } = await client.post<AnalysisResponse>('/ai/analyze/', {
    date_preset: datePreset,
  })
  return data
}